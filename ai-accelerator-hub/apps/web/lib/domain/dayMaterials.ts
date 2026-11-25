/**
 * Day-wise study materials (docs/DAY_MATERIALS_SPEC.md): staff attach Drive / Docs / video links to a day lesson;
 * learners open them, and tick "Studied" and "Practised". Every link must open for anyone.
 */
import { prisma } from '@/lib/prisma';
import type { Ctx } from '@/lib/server/context';
import { hasPerm } from '@/lib/server/context';
import { audit, notify } from '@/lib/server/audit';
import { badRequest, forbidden, notFound } from '@/lib/server/errors';
import { normaliseShareUrl } from './linkHealthCore';
import { probeLink, shareHelp } from './proofRelevance';
import { copyUrl, detectKind, materialProblem, materialSchema, MAX_PER_DAY, type Kind } from './dayMaterialsCore';

const needContent = (ctx: Ctx) => { if (!hasPerm(ctx, 'content:manage')) throw forbidden('You need Content & journeys access to change day materials.'); };

async function dayInTenant(ctx: Ctx, contentId: string) {
  const c = await prisma.content.findFirst({ where: { id: contentId, kind: 'md', level: { tenantId: ctx.tenantId } }, select: { id: true, title: true, position: true, levelId: true, level: { select: { journeyId: true } } } });
  if (!c) throw notFound('Day lesson not found.');
  return c;
}

/** Staff can always open; a learner can when the day's level is open for them (same rule as the day page). */
async function canOpen(ctx: Ctx, c: { levelId: string; level: { journeyId: string } }) {
  if (hasPerm(ctx, 'content:manage')) return true;
  const e = await prisma.enrollment.findFirst({ where: { tenantId: ctx.tenantId, userId: ctx.userId, journeyId: c.level.journeyId, state: { in: ['active', 'completed'] } }, select: { id: true } });
  if (!e) return false;
  const p = await prisma.progress.findUnique({ where: { enrollmentId_levelId: { enrollmentId: e.id, levelId: c.levelId } }, select: { state: true } });
  return !!p && p.state !== 'locked';
}

const view = (m: { id: string; title: string; url: string; kind: string; note: string; sortOrder: number; linkStatus: string; linkCheckedAt: Date | null }) =>
  ({ id: m.id, title: m.title, url: m.url, kind: m.kind as Kind, note: m.note, sortOrder: m.sortOrder, linkStatus: m.linkStatus, linkCheckedAt: m.linkCheckedAt?.toISOString() ?? null, copyUrl: copyUrl(m.url) });

/* ---------- staff ---------- */

export async function staffMaterials(ctx: Ctx, contentId: string) {
  needContent(ctx); await dayInTenant(ctx, contentId);
  const rows = await prisma.dayMaterial.findMany({ where: { contentId }, orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }], include: { _count: { select: { progress: { where: { openedAt: { not: null } } } } } } });
  return rows.map(m => ({ ...view(m), opened: m._count.progress }));
}

async function checkedUrl(raw: string, existing: number) {
  const url = normaliseShareUrl(raw.trim());
  const why = materialProblem(url, existing);
  if (why) throw badRequest(why, { url: why });
  const status = await probeLink(url);
  if (status === 'private') throw badRequest(`This link asks people for access. ${shareHelp(url)}`, { url: 'Make it viewable by anyone with the link.' });
  if (status === 'broken') throw badRequest('This link does not open (page not found). Check it and copy it again.', { url: 'Page not found.' });
  return { url, status };
}

export async function addMaterial(ctx: Ctx, contentId: string, raw: unknown) {
  needContent(ctx);
  const c = await dayInTenant(ctx, contentId);
  const input = materialSchema.parse(raw);
  const count = await prisma.dayMaterial.count({ where: { contentId } });
  if (count >= MAX_PER_DAY) throw badRequest('A day can have at most 12 materials.');
  const { url, status } = await checkedUrl(input.url, count);
  const m = await prisma.$transaction(async tx => {
    const m = await tx.dayMaterial.create({ data: { tenantId: ctx.tenantId, contentId, title: input.title, url, kind: input.kind ?? detectKind(url), note: input.note ?? '', sortOrder: count, linkStatus: status, linkCheckedAt: new Date(), createdById: ctx.userId } });
    await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'content.material_added', resourceType: 'Content', resourceId: c.id, after: { title: input.title, url } });
    return m;
  });
  return view(m);
}

async function materialInTenant(ctx: Ctx, id: string) {
  const m = await prisma.dayMaterial.findFirst({ where: { id, tenantId: ctx.tenantId } });
  if (!m) throw notFound('Material not found.');
  return m;
}

export async function updateMaterial(ctx: Ctx, id: string, raw: { title?: string; url?: string; kind?: Kind; note?: string; move?: 'up' | 'down' }) {
  needContent(ctx);
  const m = await materialInTenant(ctx, id);
  if (raw.move) {
    const siblings = await prisma.dayMaterial.findMany({ where: { contentId: m.contentId }, orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }], select: { id: true } });
    const i = siblings.findIndex(x => x.id === id), j = raw.move === 'up' ? i - 1 : i + 1;
    if (j >= 0 && j < siblings.length) { [siblings[i], siblings[j]] = [siblings[j], siblings[i]]; await prisma.$transaction(siblings.map((x, k) => prisma.dayMaterial.update({ where: { id: x.id }, data: { sortOrder: k } }))); }
    return { ok: true as const };
  }
  const input = materialSchema.parse({ title: raw.title ?? m.title, url: raw.url ?? m.url, kind: raw.kind ?? m.kind, note: raw.note ?? m.note });
  const link = input.url !== m.url ? await checkedUrl(input.url, 0) : null;
  await prisma.$transaction(async tx => {
    await tx.dayMaterial.update({ where: { id }, data: { title: input.title, note: input.note ?? '', kind: input.kind ?? m.kind, ...(link ? { url: link.url, linkStatus: link.status, linkCheckedAt: new Date(), kind: raw.kind ?? detectKind(link.url) } : {}) } });
    await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'content.material_updated', resourceType: 'DayMaterial', resourceId: id, before: { title: m.title, url: m.url }, after: { title: input.title, url: link?.url ?? m.url } });
  });
  return { ok: true as const };
}

export async function deleteMaterial(ctx: Ctx, id: string) {
  needContent(ctx);
  const m = await materialInTenant(ctx, id);
  await prisma.$transaction(async tx => {
    await tx.dayMaterial.delete({ where: { id } });
    await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'content.material_removed', resourceType: 'DayMaterial', resourceId: id, before: { title: m.title, url: m.url } });
  });
  return { ok: true as const };
}

/* ---------- learners ---------- */

export async function learnerMaterials(ctx: Ctx, contentId: string) {
  const rows = await prisma.dayMaterial.findMany({ where: { contentId, tenantId: ctx.tenantId }, orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }], include: { progress: { where: { userId: ctx.userId } } } });
  return rows.map(m => ({ ...view(m), opened: !!m.progress[0]?.openedAt, studied: !!m.progress[0]?.studiedAt, practised: !!m.progress[0]?.practisedAt }));
}

async function materialForUse(ctx: Ctx, id: string) {
  const m = await prisma.dayMaterial.findFirst({ where: { id, tenantId: ctx.tenantId } });
  if (!m) throw notFound('Material not found.');
  const c = await prisma.content.findUnique({ where: { id: m.contentId }, select: { levelId: true, level: { select: { journeyId: true } } } });
  if (!c?.levelId || !c.level || !(await canOpen(ctx, { levelId: c.levelId, level: c.level }))) throw forbidden('Finish the earlier days first: this material opens with its day.');
  return m;
}

/** Records the first open, then returns the stored link (never a link from the request). */
export async function openMaterial(ctx: Ctx, id: string) {
  const m = await materialForUse(ctx, id);
  await prisma.materialProgress.upsert({ where: { materialId_userId: { materialId: id, userId: ctx.userId } }, update: {}, create: { materialId: id, userId: ctx.userId, openedAt: new Date() } });
  await prisma.materialProgress.updateMany({ where: { materialId: id, userId: ctx.userId, openedAt: null }, data: { openedAt: new Date() } });
  return m.url;
}

export async function setMaterialProgress(ctx: Ctx, id: string, p: { studied?: boolean; practised?: boolean }) {
  await materialForUse(ctx, id);
  const now = new Date();
  const data = { ...(p.studied !== undefined ? { studiedAt: p.studied ? now : null } : {}), ...(p.practised !== undefined ? { practisedAt: p.practised ? now : null } : {}) };
  await prisma.materialProgress.upsert({ where: { materialId_userId: { materialId: id, userId: ctx.userId } }, update: data, create: { materialId: id, userId: ctx.userId, openedAt: now, ...data } });
  return { ok: true as const };
}

/* ---------- daily link check ---------- */

export async function checkMaterialLinks(limit = 200) {
  const rows = await prisma.dayMaterial.findMany({ orderBy: [{ linkCheckedAt: { sort: 'asc', nulls: 'first' } }], take: limit });
  const counts: Record<string, number> = { open: 0, private: 0, broken: 0, unknown: 0 };
  for (const m of rows) {
    const status = await probeLink(m.url); counts[status]++;
    await prisma.dayMaterial.update({ where: { id: m.id }, data: { linkStatus: status, linkCheckedAt: new Date() } });
    if ((status === 'private' || status === 'broken') && m.linkStatus !== status) await notify(prisma, m.tenantId, m.createdById, 'material_link_broken', { title: 'A day material link stopped opening', body: `“${m.title}”: ${status === 'private' ? 'learners see “Request access”.' : 'the page was not found.'} ${shareHelp(m.url)}`, href: '/admin/content', tone: 'warn' });
  }
  return { checked: rows.length, ...counts };
}
