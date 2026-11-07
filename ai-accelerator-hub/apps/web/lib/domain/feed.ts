/**
 * Community feed (§16): tenant-scoped posts, comments, reactions, reports, blocks.
 * Private by default: authors are display names only; blocks filter both directions;
 * reports go to moderators (community:moderate); authors and reporters are notified.
 */
import { prisma } from '@/lib/prisma';
import type { Ctx } from '@/lib/server/context';
import { hasPerm } from '@/lib/server/context';
import { badRequest, conflict, forbidden, notFound } from '@/lib/server/errors';
import { audit, notify } from '@/lib/server/audit';
import { safePublicUrl } from './journey';
import { assertChildAllowed, childStatus } from './childSafety';

/** Under-18s may not share contact details in community text (child safety policy §3). */
const CONTACT = /[\w.+-]+@[\w-]+\.[\w.]+|(?:\+?\d[\s-]?){10,}/;
async function childText(ctx: Ctx, text: string) {
  await assertChildAllowed(ctx.tenantId, ctx.userId, 'community_post');
  if ((await childStatus(ctx.tenantId, ctx.userId)).minor && CONTACT.test(text)) throw badRequest('For your safety, do not share emails or phone numbers in the community.');
}

const KINDS = ['post', 'win', 'question'] as const;
const REACTS = ['like', 'celebrate'] as const;

async function blockedIds(tenantId: string, userId: string): Promise<Set<string>> {
  const rows = await prisma.block.findMany({ where: { tenantId, OR: [{ blockerId: userId }, { blockedId: userId }] } });
  const s = new Set<string>();
  for (const r of rows) { s.add(r.blockerId === userId ? r.blockedId : r.blockerId); }
  return s;
}

async function visiblePostOrThrow(tenantId: string, postId: string, opts: { allowHidden?: boolean } = {}) {
  const post = await prisma.post.findFirst({ where: { id: postId, tenantId }, include: { author: { select: { id: true, name: true } } } });
  if (!post) throw notFound('Post not found.');
  if (post.state !== 'visible' && !opts.allowHidden) throw notFound('Post not found.');
  return post;
}

export async function createPost(ctx: Ctx, input: { kind: string; body: string; levelCode?: string; linkUrl?: string }) {
  if (!hasPerm(ctx, 'community:post') && !hasPerm(ctx, 'learn:self')) throw forbidden();
  if (!KINDS.includes(input.kind as (typeof KINDS)[number])) throw badRequest('Kind is post, win or question.');
  const body = input.body.trim();
  if (body.length < 1 || body.length > 2000) throw badRequest('Posts are 1 to 2000 characters.');
  await childText(ctx, body);
  let link: string | null = null;
  if (input.linkUrl) { link = safePublicUrl(input.linkUrl); if (!link) throw badRequest('Links must be public https URLs (SSRF-blocked).'); }
  const post = await prisma.post.create({ data: { tenantId: ctx.tenantId, authorId: ctx.userId, kind: input.kind, body, levelCode: input.levelCode?.trim().slice(0, 20) || null, linkUrl: link } });
  await audit(prisma, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'feed.posted', resourceType: 'Post', resourceId: post.id });
  return { id: post.id };
}

export async function listFeed(ctx: Ctx, take = 20, cursor?: string) {
  if (!hasPerm(ctx, 'community:post') && !hasPerm(ctx, 'learn:self')) throw forbidden();
  const hidden = await blockedIds(ctx.tenantId, ctx.userId);
  const rows = await prisma.post.findMany({
    where: { tenantId: ctx.tenantId, state: 'visible', ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}) },
    orderBy: { createdAt: 'desc' }, take: take + 1,
    include: { author: { select: { id: true, name: true } }, _count: { select: { comments: { where: { state: 'visible' } }, reacts: true } }, reacts: { where: { userId: ctx.userId }, select: { kind: true } } },
  });
  const items = rows.filter(p => !hidden.has(p.authorId)).slice(0, take).map(p => ({
    id: p.id, kind: p.kind, body: p.body, levelCode: p.levelCode, linkUrl: p.linkUrl,
    author: p.author.name || 'Learner', mine: p.authorId === ctx.userId, createdAt: p.createdAt,
    comments: p._count.comments, likes: 0, celebrates: 0, myReacts: p.reacts.map(r => r.kind),
  }));
  // Reaction counts need a second pass (count by kind); keep it to one extra query per page.
  if (items.length) {
    const counts = await prisma.reaction.groupBy({ by: ['postId', 'kind'], where: { postId: { in: items.map(i => i.id) } }, _count: true });
    for (const i of items) {
      i.likes = counts.find(c => c.postId === i.id && c.kind === 'like')?._count ?? 0;
      i.celebrates = counts.find(c => c.postId === i.id && c.kind === 'celebrate')?._count ?? 0;
    }
  }
  return { items, nextCursor: rows.length > take ? rows[take - 1].createdAt.toISOString() : null };
}

export async function createComment(ctx: Ctx, postId: string, body: string) {
  if (!hasPerm(ctx, 'community:post') && !hasPerm(ctx, 'learn:self')) throw forbidden();
  const post = await visiblePostOrThrow(ctx.tenantId, postId);
  const hidden = await blockedIds(ctx.tenantId, ctx.userId);
  if (hidden.has(post.authorId)) throw forbidden('You cannot reply here.');
  const clean = body.trim();
  if (clean.length < 1 || clean.length > 1000) throw badRequest('Comments are 1 to 1000 characters.');
  await childText(ctx, clean);
  const c = await prisma.comment.create({ data: { tenantId: ctx.tenantId, postId, authorId: ctx.userId, body: clean } });
  await audit(prisma, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'feed.commented', resourceType: 'Comment', resourceId: c.id, after: { postId } });
  if (post.authorId !== ctx.userId) await notify(prisma, ctx.tenantId, post.authorId, 'feed_reply', { title: 'New reply to your post', body: clean.slice(0, 140), href: '/feed', tone: 'info' });
  return { id: c.id };
}

export async function listComments(ctx: Ctx, postId: string) {
  await visiblePostOrThrow(ctx.tenantId, postId, { allowHidden: hasPerm(ctx, 'community:moderate') }); // throws if the post isn't visible to this person
  const hidden = await blockedIds(ctx.tenantId, ctx.userId);
  const rows = await prisma.comment.findMany({ where: { postId, tenantId: ctx.tenantId, state: 'visible' }, orderBy: { createdAt: 'asc' }, include: { author: { select: { id: true, name: true } } } });
  return rows.filter(c => !hidden.has(c.authorId)).map(c => ({ id: c.id, body: c.body, author: c.author.name || 'Learner', mine: c.authorId === ctx.userId, createdAt: c.createdAt }));
}

export async function toggleReaction(ctx: Ctx, postId: string, kind: string) {
  if (!REACTS.includes(kind as (typeof REACTS)[number])) throw badRequest('Reaction is like or celebrate.');
  await assertChildAllowed(ctx.tenantId, ctx.userId, 'community_react');
  await visiblePostOrThrow(ctx.tenantId, postId);
  const existing = await prisma.reaction.findFirst({ where: { postId, userId: ctx.userId, kind } });
  if (existing) { await prisma.reaction.delete({ where: { id: existing.id } }); return { reacted: false as const }; }
  await prisma.reaction.create({ data: { postId, userId: ctx.userId, kind } });
  return { reacted: true as const };
}

export async function reportContent(ctx: Ctx, input: { targetType: string; targetId: string; reason: string }) {
  if (!hasPerm(ctx, 'community:post') && !hasPerm(ctx, 'learn:self')) throw forbidden();
  if (!['post', 'comment'].includes(input.targetType)) throw badRequest('Target is a post or a comment.');
  const reason = input.reason.trim();
  if (reason.length < 10) throw badRequest('Say what is wrong (at least 10 characters).');
  const target = input.targetType === 'post'
    ? await prisma.post.findFirst({ where: { id: input.targetId, tenantId: ctx.tenantId } })
    : await prisma.comment.findFirst({ where: { id: input.targetId, tenantId: ctx.tenantId } });
  if (!target) throw notFound('Content not found.');
  if (target.authorId === ctx.userId) throw badRequest('Use edit or delete for your own content — reports are for others.');
  const dup = await prisma.report.findFirst({ where: { tenantId: ctx.tenantId, targetType: input.targetType, targetId: input.targetId, reporterId: ctx.userId, state: 'open' } });
  if (dup) throw conflict('You already reported this. Moderators will review it.');
  const r = await prisma.report.create({ data: { tenantId: ctx.tenantId, targetType: input.targetType, targetId: input.targetId, reporterId: ctx.userId, reason } });
  await audit(prisma, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'feed.reported', resourceType: 'Report', resourceId: r.id, after: { targetType: input.targetType } });
  return { id: r.id };
}

export async function moderationQueue(ctx: Ctx) {
  if (!hasPerm(ctx, 'community:moderate')) throw forbidden();
  const rows = await prisma.report.findMany({ where: { tenantId: ctx.tenantId, state: 'open' }, orderBy: { createdAt: 'asc' }, take: 50, include: { reporter: { select: { name: true } } } });
  const out = [];
  for (const r of rows) {
    const target = r.targetType === 'post'
      ? await prisma.post.findUnique({ where: { id: r.targetId }, include: { author: { select: { name: true } } } })
      : await prisma.comment.findUnique({ where: { id: r.targetId }, include: { author: { select: { name: true } } } });
    out.push({ id: r.id, targetType: r.targetType, reason: r.reason, reporter: r.reporter.name || 'Learner', createdAt: r.createdAt, target: target ? { body: target.body, author: target.author.name || 'Learner', state: target.state } : null });
  }
  return out;
}

export async function resolveReport(ctx: Ctx, reportId: string, action: 'hide' | 'remove' | 'dismiss', note?: string) {
  if (!hasPerm(ctx, 'community:moderate')) throw forbidden();
  const r = await prisma.report.findFirst({ where: { id: reportId, tenantId: ctx.tenantId } });
  if (!r) throw notFound('Report not found.');
  if (r.state !== 'open') throw conflict('This report is already resolved.');
  const table = r.targetType === 'post' ? prisma.post : prisma.comment;
  if (action === 'dismiss') {
    await prisma.report.update({ where: { id: reportId }, data: { state: 'dismissed', resolvedBy: ctx.userId } });
  } else {
    await (table as typeof prisma.post).update({ where: { id: r.targetId }, data: { state: action === 'hide' ? 'hidden' : 'removed' } });
    await prisma.report.updateMany({ where: { tenantId: ctx.tenantId, targetType: r.targetType, targetId: r.targetId, state: 'open' }, data: { state: 'upheld', resolvedBy: ctx.userId } });
  }
  await audit(prisma, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: `feed.report_${action}`, resourceType: 'Report', resourceId: reportId, after: { note: note?.trim().slice(0, 200) || null } });
  await notify(prisma, ctx.tenantId, r.reporterId, 'report_resolved', { title: `Your report was ${action === 'dismiss' ? 'reviewed' : 'upheld'}`, body: note?.trim().slice(0, 140) || 'Thanks — moderators reviewed it.', href: '/feed', tone: action === 'dismiss' ? 'info' : 'ok' });
  return { ok: true as const, action };
}

export async function setBlock(ctx: Ctx, userId: string, blocked: boolean) {
  if (!hasPerm(ctx, 'learn:self') && !hasPerm(ctx, 'community:post')) throw forbidden();
  if (userId === ctx.userId) throw badRequest('You cannot block yourself.');
  const other = await prisma.membership.findFirst({ where: { userId, tenantId: ctx.tenantId, status: 'active' }, select: { userId: true } });
  if (!other) throw notFound('Learner not found.');
  if (blocked) {
    try { await prisma.block.create({ data: { tenantId: ctx.tenantId, blockerId: ctx.userId, blockedId: userId } }); }
    catch (e) { if ((e as { code?: string }).code !== 'P2002') throw e; }
  } else {
    await prisma.block.deleteMany({ where: { tenantId: ctx.tenantId, blockerId: ctx.userId, blockedId: userId } });
  }
  await audit(prisma, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: blocked ? 'feed.blocked' : 'feed.unblocked', resourceType: 'User', resourceId: userId });
  return { ok: true as const, blocked };
}
