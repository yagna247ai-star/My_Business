/**
 * Project showcase (§34.12, §16). Opt-in only: a learner publishes their own *approved* work.
 * Visible to members of the same institution only. Learners under 18 need granted guardian consent.
 */
import { prisma } from '@/lib/prisma';
import type { Ctx } from '@/lib/server/context';
import { badRequest, conflict, forbidden, notFound } from '@/lib/server/errors';
import { audit } from '@/lib/server/audit';
import { assertChildAllowed } from './childSafety';

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
  const slug = `sub-${s.id}`;
  if (await prisma.project.findFirst({ where: { tenantId: ctx.tenantId, slug } })) throw conflict('This project is already on the showcase.');
  return prisma.$transaction(async tx => {
    const p = await tx.project.create({ data: { tenantId: ctx.tenantId, userId: ctx.userId, title, slug, description, isPublic: true, repos: s.url ? { create: { repoUrl: s.url, provider: 'link' } } : undefined } });
    await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'showcase.published', resourceType: 'Project', resourceId: p.id, after: { level: s.progress.level.code } });
    return { id: p.id };
  });
}

export async function unpublish(ctx: Ctx, id: string) {
  const p = await prisma.project.findFirst({ where: { id, tenantId: ctx.tenantId } });
  if (!p) throw notFound('Project not found.');
  if (p.userId !== ctx.userId && !ctx.superAdmin) throw forbidden('Only the author can remove their project.');
  await prisma.$transaction(async tx => { await tx.project.delete({ where: { id } }); await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'showcase.removed', resourceType: 'Project', resourceId: id }); });
  return { ok: true };
}

export async function listShowcase(ctx: Ctx) {
  const rows = await prisma.project.findMany({ where: { tenantId: ctx.tenantId, isPublic: true }, orderBy: { createdAt: 'desc' }, take: 60, include: { user: { select: { name: true } }, repos: { select: { repoUrl: true }, take: 1 } } });
  return rows.map(r => ({ id: r.id, title: r.title, description: r.description, author: r.user.name || 'Learner', mine: r.userId === ctx.userId, link: r.repos[0]?.repoUrl || null, at: r.createdAt }));
}
