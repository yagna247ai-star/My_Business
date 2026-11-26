/**
 * Day-wise study materials (docs/DAY_MATERIALS_SPEC.md): staff attach Drive / Docs / video links to a day lesson;
 * learners open them, and tick "Studied" and "Practised". Every link must open for anyone.
 */
import { prisma } from '@/lib/prisma';
import type { Ctx } from '@/lib/server/context';
import { hasPerm } from '@/lib/server/context';
import { audit, notify, notifyMany } from '@/lib/server/audit';
import { badRequest, forbidden, notFound } from '@/lib/server/errors';
import { normaliseShareUrl } from './linkHealthCore';
import { probeLink, shareHelp } from './proofRelevance';
import { copyUrl, detectKind, matchingDays, materialProblem, materialSchema, MAX_PER_DAY, type Kind } from './dayMaterialsCore';

export const canManageMaterials = (ctx: Ctx) => hasPerm(ctx, 'materials:manage') || hasPerm(ctx, 'content:manage');
const needContent = (ctx: Ctx) => { if (!canManageMaterials(ctx)) throw forbidden('You need Day materials access to change day materials.'); };

async function dayInTenant(ctx: Ctx, contentId: string) {
  const c = await prisma.content.findFirst({ where: { id: contentId, kind: 'md', level: { tenantId: ctx.tenantId } }, select: { id: true, title: true, position: true, levelId: true, level: { select: { journeyId: true, code: true, tenantId: true, journey: { select: { slug: true } } } } } });
  if (!c) throw notFound('Day lesson not found.');
  return c;
}

/**
 * v1.1: the same day of the same course in the other institutions (each institution has its own copy of a course).
 * A Super Admin's materials go to every copy; an Institution Admin's stay in their institution.
 */
async function otherCopies(ctx: Ctx, c: Awaited<ReturnType<typeof dayInTenant>>) {
  if (!ctx.superAdmin) return [];
  const rows = await prisma.content.findMany({ where: { kind: 'md', position: c.position, level: { code: c.level.code, journey: { slug: c.level.journey.slug } } }, select: { id: true, position: true, level: { select: { tenantId: true, code: true, journey: { select: { slug: true } } } } } });
  const refs = rows.map(r => ({ contentId: r.id, tenantId: r.level.tenantId, journeySlug: r.level.journey.slug, levelCode: r.level.code, day: r.position }));
  return matchingDays({ contentId: c.id, tenantId: c.level.tenantId, journeySlug: c.level.journey.slug, levelCode: c.level.code, day: c.position }, refs);
}

/** Tell the learners of a course that a day has new material (in-app, their institution). */
async function tellLearners(tenantId: string, journeyId: string, day: number, levelCode: string, title: string) {
  const learners = await prisma.enrollment.findMany({ where: { tenantId, journeyId, state: 'active' }, select: { userId: true }, take: 5000 });
  if (!learners.length) return;
  await notifyMany(prisma, tenantId, learners.map(l => l.userId), 'day_material_added', { title: `New material for Day ${day}`, body: `“${title}”: open it on the day page and practise.`, href: `/levels/${levelCode}/days/${day}`, tone: 'info' });
}

/** Staff can always open; a learner can when the day's level is open for them (same rule as the day page). */
async function canOpen(ctx: Ctx, c: { levelId: string; level: { journeyId: string } }) {
  if (canManageMaterials(ctx)) return true;
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
  const copies = await otherCopies(ctx, c);
  const m = await prisma.$transaction(async tx => {
    const m = await tx.dayMaterial.create({ data: { tenantId: ctx.tenantId, contentId, title: input.title, url, kind: input.kind ?? detectKind(url), note: input.note ?? '', sortOrder: count, linkStatus: status, linkCheckedAt: new Date(), createdById: ctx.userId } });
    await tx.dayMaterial.update({ where: { id: m.id }, data: { groupId: m.id } });
    for (const d of copies) {
      if (await tx.dayMaterial.findFirst({ where: { contentId: d.contentId, url }, select: { id: true } })) continue;
      const n = await tx.dayMaterial.count({ where: { contentId: d.contentId } });
      if (n >= MAX_PER_DAY) continue;
      await tx.dayMaterial.create({ data: { tenantId: d.tenantId, contentId: d.contentId, title: input.title, url, kind: m.kind, note: m.note, sortOrder: n, linkStatus: status, linkCheckedAt: new Date(), createdById: ctx.userId, groupId: m.id } });
    }
    await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'content.material_added', resourceType: 'Content', resourceId: c.id, after: { title: input.title, url, copies: copies.length } });
    return m;
  });
  await tellLearners(ctx.tenantId, c.level.journeyId, c.position, c.level.code, input.title).catch(() => {});
  for (const d of copies) {
    const j = await prisma.content.findUnique({ where: { id: d.contentId }, select: { level: { select: { journeyId: true } } } });
    if (j) await tellLearners(d.tenantId, j.level.journeyId, d.day, d.levelCode, input.title).catch(() => {});
  }
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
    const data = { title: input.title, note: input.note ?? '', kind: input.kind ?? m.kind, ...(link ? { url: link.url, linkStatus: link.status, linkCheckedAt: new Date(), kind: raw.kind ?? detectKind(link.url) } : {}) };
    await tx.dayMaterial.update({ where: { id }, data });
    if (ctx.superAdmin && m.groupId) await tx.dayMaterial.updateMany({ where: { groupId: m.groupId, id: { not: id } }, data }); // every institution's copy
    await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'content.material_updated', resourceType: 'DayMaterial', resourceId: id, before: { title: m.title, url: m.url }, after: { title: input.title, url: link?.url ?? m.url } });
  });
  return { ok: true as const };
}

export async function deleteMaterial(ctx: Ctx, id: string) {
  needContent(ctx);
  const m = await materialInTenant(ctx, id);
  await prisma.$transaction(async tx => {
    await tx.dayMaterial.delete({ where: { id } });
    if (ctx.superAdmin && m.groupId) await tx.dayMaterial.deleteMany({ where: { groupId: m.groupId } }); // every institution's copy
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

/** The learner's journey page: every material of their current course, by level and day (docs/DAY_MATERIALS_SPEC.md v1.2). */
export async function journeyMaterialsFor(ctx: Ctx, enrollmentId: string, journeyId: string) {
  const { journeyMaterials } = await import('./dayMaterialsCore');
  const [levels, progress] = await Promise.all([
    prisma.level.findMany({ where: { tenantId: ctx.tenantId, journeyId }, select: { id: true, idx: true, code: true, title: true, contents: { where: { kind: 'md' }, select: { id: true, position: true } } }, orderBy: { idx: 'asc' } }),
    prisma.progress.findMany({ where: { enrollmentId }, select: { levelId: true, state: true } }),
  ]);
  const dayOf = new Map(levels.flatMap(l => l.contents.map(c => [c.id, { levelId: l.id, day: c.position }] as const)));
  const rows = await prisma.dayMaterial.findMany({ where: { tenantId: ctx.tenantId, contentId: { in: [...dayOf.keys()] } }, select: { id: true, contentId: true, title: true, url: true, kind: true, note: true, sortOrder: true } });
  const open = new Map(progress.map(p => [p.levelId, p.state !== 'locked']));
  return journeyMaterials(rows.map(r => ({ ...r, ...dayOf.get(r.contentId)! })), levels.map(l => ({ id: l.id, idx: l.idx, code: l.code, title: l.title, locked: !open.get(l.id) })));
}

/** Staff: the courses, levels and days of this institution, for the Day materials page. */
export async function materialsPicker(ctx: Ctx) {
  needContent(ctx);
  const journeys = await prisma.journey.findMany({ where: { tenantId: ctx.tenantId }, orderBy: [{ isPublished: 'desc' }, { title: 'asc' }], select: { id: true, title: true, levels: { orderBy: { idx: 'asc' }, select: { id: true, idx: true, title: true, contents: { where: { kind: 'md' }, orderBy: { position: 'asc' }, select: { id: true, position: true, title: true } } } } } });
  const counts = await prisma.dayMaterial.groupBy({ by: ['contentId'], where: { tenantId: ctx.tenantId }, _count: { _all: true } });
  const n = new Map(counts.map(c => [c.contentId, c._count._all]));
  return journeys.map(j => ({ id: j.id, title: j.title, levels: j.levels.map(l => ({ id: l.id, idx: l.idx, title: l.title, days: l.contents.map(c => ({ contentId: c.id, day: c.position, title: (c.title ?? '').replace(/^Day \d+\s+—\s+/, ''), materials: n.get(c.id) ?? 0 })) })) }));
}
