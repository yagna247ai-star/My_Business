/**
 * Project showcase (§34.12, §16). Opt-in only: a learner publishes their own *approved* work, and it shows at once.
 * Visible to members of the same institution only. Learners under 18 need granted guardian consent.
 *
 * Links must open for everyone (no "Request access"), checked when the proof is submitted and again on publishing.
 * Moderation (community:moderate — Super Admin, Institution Admin, Program Manager, Mentor, Support): feature, hide
 * with a reason, show again, remove with a reason, and resolve members' reports. Authors can remove their own project.
 * Every action is audited, and the author is told when a moderator hides or removes their project.
 */
import { prisma } from '@/lib/prisma';
import type { Ctx } from '@/lib/server/context';
import { hasPerm } from '@/lib/server/context';
import { badRequest, conflict, forbidden, notFound } from '@/lib/server/errors';
import { audit, notify, notifyMany } from '@/lib/server/audit';
import { assertChildAllowed } from './childSafety';
import { linkPrivateProblem, proofLinkProblem } from './proofRelevance';

export const canModerate = (ctx: Ctx) => ctx.superAdmin || hasPerm(ctx, 'community:moderate');
const needMod = (ctx: Ctx) => { if (!canModerate(ctx)) throw forbidden('Only moderators and admins can manage the showcase.'); };
const reasonOf = (r: unknown) => { const s = String(r ?? '').trim(); if (s.length < 5) throw badRequest('Give a short reason (at least 5 characters). The author sees it.', { reason: 'Say why, so the author can fix it.' }); return s.slice(0, 500); };

export async function publishable(ctx: Ctx) {
  const subs = await prisma.submission.findMany({ where: { tenantId: ctx.tenantId, userId: ctx.userId, state: 'approved' }, include: { progress: { include: { level: true } } }, orderBy: { submittedAt: 'desc' } });
  const published = await prisma.project.findMany({ where: { tenantId: ctx.tenantId, userId: ctx.userId }, select: { slug: true } });
  const taken = new Set(published.map(p => p.slug));
  return subs.map(s => ({ submissionId: s.id, level: s.progress.level.title, url: s.url, published: taken.has(`sub-${s.id}`) }));
}

export async function publish(ctx: Ctx, input: { submissionId: string; title: string; description: string }) {
  const s = await prisma.submission.findFirst({ where: { id: input.submissionId, tenantId: ctx.tenantId, userId: ctx.userId }, include: { progress: { include: { level: true } } } });
  if (!s) throw notFound('Submission not found.');
  if (s.state !== 'approved') throw forbidden('Only reviewer-approved work can go on the showcase.');
  await assertChildAllowed(ctx.tenantId, ctx.userId, 'showcase_publish');
  const title = input.title.trim(), description = input.description.trim();
  if (title.length < 4 || title.length > 90) throw badRequest('Give your project a title of 4–90 characters.', { title: '4–90 characters.' });
  if (description.length < 30 || description.length > 600) throw badRequest('Describe it in 30–600 characters.', { description: '30–600 characters.' });
  // The "Open project" button opens this link: it must open for everyone in the institution.
  if (s.url) { const why = proofLinkProblem(s.url) ?? await linkPrivateProblem(s.url); if (why) throw badRequest(`Your project link cannot go on the showcase yet. ${why}`, { submissionId: why }); }
  const slug = `sub-${s.id}`;
  if (await prisma.project.findFirst({ where: { tenantId: ctx.tenantId, slug } })) throw conflict('This project is already on the showcase.');
  return prisma.$transaction(async tx => {
    const p = await tx.project.create({ data: { tenantId: ctx.tenantId, userId: ctx.userId, title, slug, description, isPublic: true, repos: s.url ? { create: { repoUrl: s.url, provider: 'link' } } : undefined } });
    await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'showcase.published', resourceType: 'Project', resourceId: p.id, after: { level: s.progress.level.code } });
    return { id: p.id };
  });
}

/** The author removes their own project, or a moderator removes any project with a reason (the author is told). */
export async function unpublish(ctx: Ctx, id: string, reason?: string) {
  const p = await prisma.project.findFirst({ where: { id, tenantId: ctx.tenantId } });
  if (!p) throw notFound('Project not found.');
  const own = p.userId === ctx.userId;
  if (!own && !canModerate(ctx)) throw forbidden('Only the author or a moderator can remove this project.');
  const why = own ? null : reasonOf(reason);
  await prisma.$transaction(async tx => {
    await tx.project.delete({ where: { id } });
    await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: own ? 'showcase.removed' : 'showcase.removed_by_moderator', resourceType: 'Project', resourceId: id, before: { title: p.title, author: p.userId }, after: why ? { reason: why } : undefined });
    if (!own) await notify(tx, ctx.tenantId, p.userId, 'showcase_removed', { title: 'Your showcase project was removed', body: `“${p.title}”: ${why}`, href: '/showcase', tone: 'warn' });
  });
  return { ok: true };
}

export async function listShowcase(ctx: Ctx) {
  const mod = canModerate(ctx);
  const rows = await prisma.project.findMany({
    where: { tenantId: ctx.tenantId, isPublic: true, OR: [{ status: 'visible' }, { userId: ctx.userId }] },
    orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }], take: 60,
    include: { user: { select: { name: true } }, repos: { select: { repoUrl: true }, take: 1 }, reports: { where: { userId: ctx.userId }, select: { id: true } } },
  });
  return rows.map(r => ({ id: r.id, title: r.title, description: r.description, author: r.user.name || 'Learner', mine: r.userId === ctx.userId, link: r.repos[0]?.repoUrl || null, at: r.createdAt,
    featured: r.featured, hidden: r.status === 'hidden', hiddenNote: r.userId === ctx.userId || mod ? r.moderationNote : null, reported: r.reports.length > 0 }));
}

/** Any member can report a project once; moderators get a notification. */
export async function report(ctx: Ctx, id: string, reason: unknown) {
  const why = reasonOf(reason);
  const p = await prisma.project.findFirst({ where: { id, tenantId: ctx.tenantId, status: 'visible' }, select: { id: true, title: true, userId: true } });
  if (!p) throw notFound('Project not found.');
  if (p.userId === ctx.userId) throw badRequest('You cannot report your own project. Remove it instead.');
  if (await prisma.showcaseReport.findUnique({ where: { projectId_userId: { projectId: id, userId: ctx.userId } } })) throw conflict('You already reported this project. A moderator will look at it.');
  await prisma.$transaction(async tx => {
    await tx.showcaseReport.create({ data: { tenantId: ctx.tenantId, projectId: id, userId: ctx.userId, reason: why } });
    await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'showcase.reported', resourceType: 'Project', resourceId: id, after: { reason: why } });
    const mods = await tx.membership.findMany({ where: { tenantId: ctx.tenantId, status: 'active', role: { code: { in: ['tenant_admin', 'program_mgr', 'support'] } } }, select: { userId: true } });
    await notifyMany(tx, ctx.tenantId, mods.map(m => m.userId), 'showcase_reported', { title: 'A showcase project was reported', body: `“${p.title}”: ${why}`, href: '/admin/showcase', tone: 'warn' });
  });
  return { ok: true };
}

/* ---------- moderation (Admin → Showcase) ---------- */

export async function adminShowcase(ctx: Ctx) {
  needMod(ctx);
  const rows = await prisma.project.findMany({
    where: { tenantId: ctx.tenantId, isPublic: true }, orderBy: [{ createdAt: 'desc' }], take: 300,
    include: { user: { select: { name: true, email: true } }, repos: { select: { repoUrl: true }, take: 1 }, reports: { orderBy: { createdAt: 'desc' } } },
  });
  return rows.map(r => {
    const open = r.reports.filter(x => !x.resolvedAt);
    return { id: r.id, title: r.title, description: r.description, author: r.user.name || r.user.email, link: r.repos[0]?.repoUrl || null, at: r.createdAt.toISOString(),
      status: r.status as 'visible' | 'hidden', featured: r.featured, note: r.moderationNote, moderatedAt: r.moderatedAt?.toISOString() ?? null,
      openReports: open.map(x => ({ id: x.id, reason: x.reason, at: x.createdAt.toISOString() })), resolvedReports: r.reports.length - open.length };
  }).sort((a, b) => b.openReports.length - a.openReports.length);
}

export type ModAction = 'feature' | 'unfeature' | 'hide' | 'show' | 'dismiss_reports';

export async function moderate(ctx: Ctx, id: string, action: ModAction, reason?: string) {
  needMod(ctx);
  const p = await prisma.project.findFirst({ where: { id, tenantId: ctx.tenantId } });
  if (!p) throw notFound('Project not found.');
  const why = action === 'hide' ? reasonOf(reason) : (String(reason ?? '').trim().slice(0, 500) || null);
  const data = action === 'feature' ? { featured: true } : action === 'unfeature' ? { featured: false }
    : action === 'hide' ? { status: 'hidden', featured: false } : action === 'show' ? { status: 'visible' } : {};
  await prisma.$transaction(async tx => {
    if (Object.keys(data).length) await tx.project.update({ where: { id }, data: { ...data, moderatedById: ctx.userId, moderatedAt: new Date(), ...(action === 'hide' || action === 'show' ? { moderationNote: action === 'hide' ? why : null } : {}) } });
    // Hiding or showing a project, or dismissing, closes its open reports.
    if (action === 'hide' || action === 'show' || action === 'dismiss_reports') await tx.showcaseReport.updateMany({ where: { projectId: id, resolvedAt: null }, data: { resolvedAt: new Date(), resolvedById: ctx.userId } });
    await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: `showcase.${action}`, resourceType: 'Project', resourceId: id, before: { status: p.status, featured: p.featured }, after: { ...data, ...(why ? { reason: why } : {}) } });
    if (action === 'hide') await notify(tx, ctx.tenantId, p.userId, 'showcase_hidden', { title: 'Your showcase project was hidden', body: `“${p.title}”: ${why} Fix it and ask a moderator to show it again.`, href: '/showcase', tone: 'warn' });
    if (action === 'show' && p.status === 'hidden') await notify(tx, ctx.tenantId, p.userId, 'showcase_shown', { title: 'Your showcase project is visible again', body: `“${p.title}” is back on the showcase.`, href: '/showcase', tone: 'ok' });
    if (action === 'feature') await notify(tx, ctx.tenantId, p.userId, 'showcase_featured', { title: 'Your project is featured', body: `“${p.title}” is now featured at the top of the showcase.`, href: '/showcase', tone: 'gold' });
  });
  return { ok: true };
}
