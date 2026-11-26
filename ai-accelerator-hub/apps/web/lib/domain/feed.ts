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
import { afterCursor, decodeCursor, encodeCursor, engagement, isDuplicate, tabWhere, dayPrompt, winCard, type Tab } from './feedCore';
import { awardXp } from './xp';

/** Under-18s may not share contact details in community text (child safety policy §3). */
const CONTACT = /[\w.+-]+@[\w-]+\.[\w.]+|(?:\+?\d[\s-]?){10,}/;
async function childText(ctx: Ctx, text: string) {
  await assertChildAllowed(ctx.tenantId, ctx.userId, 'community_post');
  if ((await childStatus(ctx.tenantId, ctx.userId)).minor && CONTACT.test(text)) throw badRequest('For your safety, do not share emails or phone numbers in the community.');
}

const KINDS = ['post', 'win', 'question', 'announcement'] as const;
/** Staff who lead the community: announcements and pins (docs/FEED_ENGAGEMENT_SPEC.md AC-13). */
const canLead = (ctx: Ctx) => hasPerm(ctx, 'community:moderate') || hasPerm(ctx, 'cohort:manage');
const LEARNER_ROLES = ['learner', 'team_lead'];
/** A learner's course: their posts belong to it and they see it plus institution-wide posts. Staff see everything. */
async function myJourney(ctx: Ctx): Promise<string | null> {
  if (!hasPerm(ctx, 'learn:self') || ctx.superAdmin) return null;
  const e = await prisma.enrollment.findFirst({ where: { tenantId: ctx.tenantId, userId: ctx.userId, state: { in: ['active', 'completed'] } }, orderBy: [{ state: 'asc' }, { updatedAt: 'desc' }], select: { journeyId: true } });
  return e?.journeyId ?? null;
}
const scopeWhere = (journeyId: string | null) => journeyId ? { OR: [{ journeyId }, { journeyId: null }] } : {};
/** Staff authors (mentors, instructors, admins) get a "Mentor" tag. */
async function staffAuthors(tenantId: string, ids: string[]) {
  if (!ids.length) return new Set<string>();
  const ms = await prisma.membership.findMany({ where: { tenantId, userId: { in: [...new Set(ids)] }, status: 'active' }, select: { userId: true, role: { select: { code: true } } } });
  return new Set(ms.filter(m => !LEARNER_ROLES.includes(m.role.code)).map(m => m.userId));
}
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

export async function createPost(ctx: Ctx, input: { kind: string; body: string; levelCode?: string; linkUrl?: string; day?: number }) {
  if (!hasPerm(ctx, 'community:post') && !hasPerm(ctx, 'learn:self') && !canLead(ctx)) throw forbidden();
  if (!KINDS.includes(input.kind as (typeof KINDS)[number])) throw badRequest('Kind is post, win, question or announcement.');
  if (input.kind === 'announcement' && !canLead(ctx)) throw forbidden('Only mentors and program staff post announcements.');
  const body = input.body.trim();
  if (body.length < 1 || body.length > 2000) throw badRequest('Posts are 1 to 2000 characters.');
  await childText(ctx, body);
  let link: string | null = null;
  if (input.linkUrl) { link = safePublicUrl(input.linkUrl); if (!link) throw badRequest('Links must be public https URLs (SSRF-blocked).'); }
  // AC-1: the same text twice within 10 minutes is a slip or spam.
  const recent = await prisma.post.findMany({ where: { tenantId: ctx.tenantId, authorId: ctx.userId, createdAt: { gt: new Date(Date.now() - 10 * 60_000) } }, select: { body: true, createdAt: true }, take: 20 });
  if (isDuplicate(recent, body)) throw conflict('You just posted this. Edit your post instead of posting it again.');
  const day = Number.isInteger(input.day) && input.day! >= 1 && input.day! <= 400 ? input.day! : null;
  const journeyId = input.kind === 'announcement' ? null : await myJourney(ctx);
  const post = await prisma.post.create({ data: { tenantId: ctx.tenantId, authorId: ctx.userId, kind: input.kind, body, levelCode: input.levelCode?.trim().slice(0, 20) || null, linkUrl: link, journeyId, day } });
  await audit(prisma, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'feed.posted', resourceType: 'Post', resourceId: post.id });
  return { id: post.id };
}

const postInclude = (userId: string) => ({ author: { select: { id: true, name: true } }, _count: { select: { comments: { where: { state: 'visible' } } } }, reacts: { where: { userId }, select: { kind: true } } });

export async function listFeed(ctx: Ctx, take = 20, cursor?: string, opts: { tab?: Tab; postId?: string } = {}) {
  if (!hasPerm(ctx, 'community:post') && !hasPerm(ctx, 'learn:self') && !canLead(ctx)) throw forbidden();
  const tab = opts.tab ?? 'all';
  const [hidden, journeyId] = await Promise.all([blockedIds(ctx.tenantId, ctx.userId), myJourney(ctx)]);
  const c = decodeCursor(cursor);
  // AC-2: blocked authors are filtered in the query, so a page is never short; (time, id) keeps paging stable.
  const base = { tenantId: ctx.tenantId, state: 'visible', ...(hidden.size ? { authorId: { notIn: [...hidden] } } : {}) };
  const where = { AND: [base, scopeWhere(journeyId), tabWhere(tab, ctx.userId), afterCursor(c), ...(tab === 'all' ? [{ pinnedAt: null }] : [])] };
  const [rows, pinned, focus] = await Promise.all([
    prisma.post.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: take + 1, include: postInclude(ctx.userId) }),
    // AC-13: up to 3 pinned posts first, on the first page of All.
    !c && tab === 'all' ? prisma.post.findMany({ where: { AND: [base, scopeWhere(journeyId), { pinnedAt: { not: null } }] }, orderBy: { pinnedAt: 'desc' }, take: 3, include: postInclude(ctx.userId) }) : Promise.resolve([]),
    // AC-5: a post opened from a notification comes first.
    opts.postId && !c ? prisma.post.findFirst({ where: { AND: [base, scopeWhere(journeyId), { id: opts.postId }] }, include: postInclude(ctx.userId) }) : Promise.resolve(null),
  ]);
  const page = rows.slice(0, take);
  const all = [...(focus ? [focus] : []), ...pinned.filter(p => p.id !== focus?.id), ...page.filter(p => p.id !== focus?.id && !pinned.some(x => x.id === p.id))];
  const [counts, staff] = await Promise.all([
    all.length ? prisma.reaction.groupBy({ by: ['postId', 'kind'], where: { postId: { in: all.map(i => i.id) } }, _count: true }) : Promise.resolve([]),
    staffAuthors(ctx.tenantId, all.map(p => p.authorId)),
  ]);
  const lead = canLead(ctx); const mod = hasPerm(ctx, 'community:moderate');
  const items = all.map(p => ({
    id: p.id, kind: p.kind, body: p.body, levelCode: p.levelCode, day: p.day, linkUrl: p.linkUrl,
    author: p.author.name || 'Learner', authorStaff: staff.has(p.authorId), mine: p.authorId === ctx.userId, createdAt: p.createdAt, editedAt: p.editedAt,
    pinned: !!p.pinnedAt, focused: p.id === focus?.id, answered: !!p.acceptedCommentId, acceptedCommentId: p.acceptedCommentId,
    comments: p._count.comments, myReacts: p.reacts.map(r => r.kind),
    likes: counts.find(x => x.postId === p.id && x.kind === 'like')?._count ?? 0,
    celebrates: counts.find(x => x.postId === p.id && x.kind === 'celebrate')?._count ?? 0,
    canAccept: p.kind === 'question' && (p.authorId === ctx.userId || mod), canPin: lead, canEdit: p.authorId === ctx.userId, canDelete: p.authorId === ctx.userId || mod,
  }));
  const last = page[page.length - 1];
  return { items, nextCursor: rows.length > take && last ? encodeCursor(last.createdAt, last.id) : null, tab };
}

/** AC-3: authors edit their own post. */
export async function updatePost(ctx: Ctx, postId: string, body: string) {
  const post = await visiblePostOrThrow(ctx.tenantId, postId);
  if (post.authorId !== ctx.userId) throw forbidden('You can only edit your own posts.');
  const clean = body.trim();
  if (clean.length < 1 || clean.length > 2000) throw badRequest('Posts are 1 to 2000 characters.');
  await childText(ctx, clean);
  await prisma.post.update({ where: { id: post.id }, data: { body: clean, editedAt: new Date() } });
  await audit(prisma, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'feed.edited', resourceType: 'Post', resourceId: post.id, before: { body: post.body } });
  return { ok: true as const };
}

/** AC-3: the author (or a moderator) deletes a post: hidden from everyone, kept for audit. */
export async function deletePost(ctx: Ctx, postId: string) {
  const post = await visiblePostOrThrow(ctx.tenantId, postId);
  if (post.authorId !== ctx.userId && !hasPerm(ctx, 'community:moderate')) throw forbidden();
  await prisma.post.update({ where: { id: post.id }, data: { state: 'removed', pinnedAt: null } });
  await audit(prisma, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'feed.deleted', resourceType: 'Post', resourceId: post.id });
  return { ok: true as const };
}

async function ownComment(ctx: Ctx, commentId: string) {
  const c = await prisma.comment.findFirst({ where: { id: commentId, tenantId: ctx.tenantId, state: 'visible' } });
  if (!c) throw notFound('Reply not found.');
  return c;
}
export async function updateComment(ctx: Ctx, commentId: string, body: string) {
  const c = await ownComment(ctx, commentId);
  if (c.authorId !== ctx.userId) throw forbidden('You can only edit your own replies.');
  const clean = body.trim();
  if (clean.length < 1 || clean.length > 1000) throw badRequest('Comments are 1 to 1000 characters.');
  await childText(ctx, clean);
  await prisma.comment.update({ where: { id: c.id }, data: { body: clean, editedAt: new Date() } });
  await audit(prisma, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'feed.reply_edited', resourceType: 'Comment', resourceId: c.id, before: { body: c.body } });
  return { ok: true as const };
}
export async function deleteComment(ctx: Ctx, commentId: string) {
  const c = await ownComment(ctx, commentId);
  if (c.authorId !== ctx.userId && !hasPerm(ctx, 'community:moderate')) throw forbidden();
  await prisma.$transaction(async tx => {
    await tx.comment.update({ where: { id: c.id }, data: { state: 'removed' } });
    await tx.post.updateMany({ where: { id: c.postId, acceptedCommentId: c.id }, data: { acceptedCommentId: null, answeredAt: null } });
    await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'feed.reply_deleted', resourceType: 'Comment', resourceId: c.id });
  });
  return { ok: true as const };
}

/** AC-9: the asker (or a moderator) accepts a reply; the answerer gets 10 XP once per question. */
export async function acceptAnswer(ctx: Ctx, postId: string, commentId: string) {
  const post = await visiblePostOrThrow(ctx.tenantId, postId);
  if (post.kind !== 'question') throw badRequest('Only questions have an accepted answer.');
  if (post.authorId !== ctx.userId && !hasPerm(ctx, 'community:moderate')) throw forbidden('Only the person who asked can accept an answer.');
  const c = await prisma.comment.findFirst({ where: { id: commentId, postId: post.id, tenantId: ctx.tenantId, state: 'visible' } });
  if (!c) throw notFound('Reply not found.');
  if (c.authorId === post.authorId) throw badRequest('Accept a reply from someone else.');
  const xp = await prisma.$transaction(async tx => {
    await tx.post.update({ where: { id: post.id }, data: { acceptedCommentId: c.id, answeredAt: new Date() } });
    const r = await awardXp(tx, { tenantId: ctx.tenantId, userId: c.authorId, amount: 10, source: 'answer_accepted', idempotencyKey: `feed-accept:${post.id}`, metadata: { postId: post.id, commentId: c.id } });
    await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'feed.answer_accepted', resourceType: 'Post', resourceId: post.id, after: { commentId: c.id } });
    await notify(tx, ctx.tenantId, c.authorId, 'feed_answer_accepted', { title: 'Your answer was accepted', body: r.awarded ? '+10 XP for helping a classmate.' : 'Thanks for helping a classmate.', href: `/feed?post=${post.id}`, tone: 'ok' });
    return r.awarded ? 10 : 0;
  });
  return { ok: true as const, xp };
}

/** AC-13: staff pin a post (at most 3 pinned: pinning a fourth unpins the oldest). */
export async function setPin(ctx: Ctx, postId: string, pinned: boolean) {
  if (!canLead(ctx)) throw forbidden('Only mentors and program staff pin posts.');
  const post = await visiblePostOrThrow(ctx.tenantId, postId);
  await prisma.$transaction(async tx => {
    if (pinned) {
      const others = await tx.post.findMany({ where: { tenantId: ctx.tenantId, state: 'visible', pinnedAt: { not: null }, id: { not: post.id } }, orderBy: { pinnedAt: 'desc' }, select: { id: true } });
      if (others.length >= 3) await tx.post.updateMany({ where: { id: { in: others.slice(2).map(o => o.id) } }, data: { pinnedAt: null, pinnedById: null } });
    }
    await tx.post.update({ where: { id: post.id }, data: pinned ? { pinnedAt: new Date(), pinnedById: ctx.userId } : { pinnedAt: null, pinnedById: null } });
    await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: pinned ? 'feed.pinned' : 'feed.unpinned', resourceType: 'Post', resourceId: post.id });
  });
  return { ok: true as const, pinned };
}

/** AC-10 / AC-11 / AC-12: the day prompt, the "share your win" card and the unanswered count for a learner. */
export async function feedPrompts(ctx: Ctx) {
  const journeyId = await myJourney(ctx);
  if (!journeyId) return { prompt: null, win: null, unanswered: 0 };
  const { journeyOverview, levelDays } = await import('./journey');
  const { titleFor } = await import('./levelTitles');
  const ov = await journeyOverview(ctx).catch(() => null);
  const unanswered = await prisma.post.count({ where: { AND: [{ tenantId: ctx.tenantId, state: 'visible', authorId: { not: ctx.userId } }, scopeWhere(journeyId), tabWhere('unanswered', ctx.userId)] } });
  if (!ov) return { prompt: null, win: null, unanswered };
  const opened = ov.levels.filter(l => l.state !== 'locked');
  const current = [...opened].reverse().find(l => l.state !== 'approved') ?? opened[opened.length - 1];
  const days = current ? await levelDays(current.id, ov.enrollment.id) : [];
  const next = days.find(d => d.state !== 'done' && d.state !== 'skipped') ?? days[days.length - 1];
  const wins = await prisma.post.findMany({ where: { tenantId: ctx.tenantId, authorId: ctx.userId, kind: 'win', state: 'visible', levelCode: { not: null } }, select: { levelCode: true } });
  return {
    prompt: current && next ? dayPrompt({ levelCode: current.code, levelIdx: current.idx, day: next.day, title: next.title }) : null,
    win: winCard(ov.levels, new Set(wins.map(w => w.levelCode!)), l => titleFor(l, ov.levels.length).title),
    unanswered,
  };
}

/** AC-14: this week's engagement for moderators. */
export async function feedEngagement(ctx: Ctx) {
  if (!hasPerm(ctx, 'community:moderate')) return null;
  const since = new Date(Date.now() - 7 * 86_400_000);
  const [posts, replies] = await Promise.all([
    prisma.post.findMany({ where: { tenantId: ctx.tenantId, state: 'visible', createdAt: { gte: since } }, select: { id: true, authorId: true, kind: true, createdAt: true, acceptedCommentId: true } }),
    prisma.comment.findMany({ where: { tenantId: ctx.tenantId, state: 'visible', createdAt: { gte: since } }, select: { postId: true, authorId: true, createdAt: true } }),
  ]);
  return engagement({ posts, replies });
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
  if (post.authorId !== ctx.userId) await notify(prisma, ctx.tenantId, post.authorId, 'feed_reply', { title: 'New reply to your post', body: clean.slice(0, 140), href: `/feed?post=${postId}`, tone: 'info' });
  return { id: c.id };
}

export async function listComments(ctx: Ctx, postId: string) {
  const post = await visiblePostOrThrow(ctx.tenantId, postId, { allowHidden: hasPerm(ctx, 'community:moderate') }); // throws if the post isn't visible to this person
  const hidden = await blockedIds(ctx.tenantId, ctx.userId);
  const rows = await prisma.comment.findMany({ where: { postId, tenantId: ctx.tenantId, state: 'visible' }, orderBy: { createdAt: 'asc' }, include: { author: { select: { id: true, name: true } } } });
  const visible = rows.filter(c => !hidden.has(c.authorId));
  const staff = await staffAuthors(ctx.tenantId, visible.map(c => c.authorId));
  const mod = hasPerm(ctx, 'community:moderate');
  const out = visible.map(c => ({ id: c.id, body: c.body, author: c.author.name || 'Learner', authorStaff: staff.has(c.authorId), mine: c.authorId === ctx.userId, createdAt: c.createdAt, editedAt: c.editedAt, accepted: c.id === post.acceptedCommentId, canDelete: c.authorId === ctx.userId || mod }));
  // AC-9: the accepted answer first.
  return [...out.filter(c => c.accepted), ...out.filter(c => !c.accepted)];
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
  // AC-7: two queries for all targets, not one per report.
  const ids = (t: string) => rows.filter(r => r.targetType === t).map(r => r.targetId);
  const [posts, comments] = await Promise.all([
    prisma.post.findMany({ where: { tenantId: ctx.tenantId, id: { in: ids('post') } }, include: { author: { select: { name: true } } } }),
    prisma.comment.findMany({ where: { tenantId: ctx.tenantId, id: { in: ids('comment') } }, include: { author: { select: { name: true } } } }),
  ]);
  const byId = new Map<string, { body: string; state: string; author: { name: string | null } }>([...posts, ...comments].map(x => [x.id, x]));
  return rows.map(r => { const target = byId.get(r.targetId); return { id: r.id, targetType: r.targetType, reason: r.reason, reporter: r.reporter.name || 'Learner', createdAt: r.createdAt, target: target ? { body: target.body, author: target.author.name || 'Learner', state: target.state } : null }; });
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
