/**
 * Courses, cohorts, sessions and the class calendar in every institution (docs/INSTITUTION_SHARING_SPEC.md).
 * Cross-institution writes are Super Admin only and audited in each institution they touch.
 */
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import type { Ctx } from '@/lib/server/context';
import { audit } from '@/lib/server/audit';
import { AppError, forbidden, notFound } from '@/lib/server/errors';
import { calendarSchema, type Calendar } from './cohortCalendar';
import { cloneJourney } from './institutions';
import { applyLocal, localChanges, missingCourse, planShare, type Local } from './sharingCore';

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];
type Sched = Record<string, unknown> & { calendar?: unknown; base?: unknown; local?: Local; sessions?: { startsAt: string; title: string }[] };

export const parseSched = (raw: string | null): Sched => { try { return raw ? JSON.parse(raw) as Sched : {}; } catch { return {}; } };
export const calOf = (v: unknown): Calendar | null => { const r = calendarSchema.safeParse(v); return r.success ? r.data : null; };
const inviteFor = (slug: string) => `${slug.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'HUB'}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
const mergeSessions = (a: Sched['sessions'] = [], b: Sched['sessions'] = []) => {
  const seen = new Set(a.map(s => `${s.startsAt}|${s.title}`));
  return [...a, ...b.filter(s => !seen.has(`${s.startsAt}|${s.title}`))].sort((x, y) => x.startsAt.localeCompare(y.startsAt));
};

/** Every copy of a shared cohort, the given one included. */
export async function copiesOf(db: Tx | typeof prisma, groupId: string) {
  return db.cohort.findMany({ where: { groupId }, select: { id: true, tenantId: true, schedule: true } });
}

/** AC-3/AC-4: put this cohort in every active institution (link a same-name cohort, else create one). */
export async function shareCohortTx(tx: Tx, ctx: Ctx, cohortId: string) {
  if (!ctx.superAdmin) throw forbidden('Only a Super Admin can share a cohort with other institutions.');
  const c = await tx.cohort.findUnique({ where: { id: cohortId } });
  if (!c) throw notFound('Cohort not found.');
  const groupId = c.groupId ?? c.id;
  const src = parseSched(c.schedule);
  const base = calOf(src.base) ?? calOf(src.calendar);
  if (!c.groupId || (base && !src.base)) await tx.cohort.update({ where: { id: c.id }, data: { groupId, ...(base ? { schedule: JSON.stringify({ ...src, base, local: {}, calendar: base }) } : {}) } });
  const tenants = await tx.tenant.findMany({ where: { status: 'active' }, select: { id: true, slug: true, cohorts: { select: { id: true, slug: true, groupId: true } } } });
  const plan = planShare(c.slug, c.tenantId, tenants, groupId);
  const fresh = { ...src, sessions: src.sessions ?? [], ...(base ? { base, local: {}, calendar: base } : {}) };
  for (const tenantId of plan.create) {
    const slug = tenants.find(t => t.id === tenantId)!.slug;
    const n = await tx.cohort.create({ data: { tenantId, groupId, name: c.name, slug: c.slug, startDate: c.startDate, endDate: c.endDate, maxSize: c.maxSize, inviteCode: inviteFor(slug), schedule: JSON.stringify(fresh) } });
    await audit(tx, { tenantId, actorUserId: ctx.userId, action: 'cohort.shared', resourceType: 'Cohort', resourceId: n.id, after: { from: c.id, mode: 'created' } });
  }
  for (const l of plan.link) {
    const e = await tx.cohort.findUniqueOrThrow({ where: { id: l.cohortId } });
    const s = parseSched(e.schedule);
    const own = calOf(s.calendar);
    const local = base && own ? localChanges(base, own) : {};
    const next = { ...s, sessions: mergeSessions(s.sessions, src.sessions), ...(base ? { base, local, calendar: applyLocal(base, local) } : {}) };
    await tx.cohort.update({ where: { id: e.id }, data: { groupId, schedule: JSON.stringify(next) } });
    await audit(tx, { tenantId: l.tenantId, actorUserId: ctx.userId, action: 'cohort.shared', resourceType: 'Cohort', resourceId: e.id, after: { from: c.id, mode: 'linked' } });
  }
  return { created: plan.create.length, linked: plan.link.length };
}

export async function shareCohort(ctx: Ctx, cohortId: string) {
  if (!ctx.superAdmin) throw forbidden('Only a Super Admin can share a cohort with other institutions.');
  const c = await prisma.cohort.findFirst({ where: { id: cohortId, tenantId: ctx.tenantId }, select: { id: true } });
  if (!c) throw notFound('Cohort not found.');
  return prisma.$transaction(tx => shareCohortTx(tx, ctx, c.id), { timeout: 30_000, maxWait: 10_000 });
}

/** AC-6: for the cohort cards: which institutions run each shared cohort (Super Admin only). */
export async function cohortPlaces(ctx: Ctx, groupIds: string[]) {
  const out = new Map<string, string[]>();
  if (!ctx.superAdmin || !groupIds.length) return out;
  const rows = await prisma.cohort.findMany({ where: { groupId: { in: groupIds } }, select: { groupId: true, tenant: { select: { name: true, code: true } } } });
  for (const r of rows) out.set(r.groupId!, [...(out.get(r.groupId!) ?? []), r.tenant.code ?? r.tenant.name]);
  for (const [k, v] of out) out.set(k, [...new Set(v)].sort());
  return out;
}

/** AC-8: copy a course into every active institution that does not run it yet. */
export async function shareJourney(ctx: Ctx, journeyId: string) {
  if (!ctx.superAdmin) throw forbidden('Only a Super Admin can share a course with other institutions.');
  const j = await prisma.journey.findFirst({ where: { id: journeyId, tenantId: ctx.tenantId }, select: { id: true, slug: true, title: true, isPublished: true } });
  if (!j) throw notFound('Course not found.');
  const tenants = await prisma.tenant.findMany({ where: { status: 'active' }, select: { id: true, name: true, code: true, journeys: { select: { slug: true } } } });
  const missing = missingCourse(j.slug, tenants.map(t => ({ id: t.id, journeySlugs: t.journeys.map(x => x.slug) })));
  const copied: string[] = []; const skipped: { institution: string; reason: string }[] = [];
  for (const tenantId of missing) {
    const t = tenants.find(x => x.id === tenantId)!;
    try {
      await prisma.$transaction(async tx => {
        const id = await cloneJourney(tx, j.id, tenantId, ctx.userId);
        if (j.isPublished) await tx.journey.update({ where: { id }, data: { isPublished: true } });
        await audit(tx, { tenantId, actorUserId: ctx.userId, action: 'journey.shared', resourceType: 'Journey', resourceId: id, after: { from: j.id, slug: j.slug, published: j.isPublished } });
      }, { timeout: 60_000, maxWait: 10_000 });
      copied.push(t.code ?? t.name);
    } catch (e) {
      skipped.push({ institution: t.code ?? t.name, reason: e instanceof AppError ? e.message : 'The copy failed; nothing was saved.' });
    }
  }
  return { copied, skipped, already: tenants.length - missing.length };
}

/** AC-8: for the journey list: where each course runs (Super Admin only). */
export async function coursePlaces(ctx: Ctx) {
  if (!ctx.superAdmin) return { places: {} as Record<string, string[]>, total: 0 };
  const rows = await prisma.tenant.findMany({ where: { status: 'active' }, select: { name: true, code: true, journeys: { select: { slug: true } } } });
  const places: Record<string, string[]> = {};
  for (const t of rows) for (const j of t.journeys) (places[j.slug] ??= []).push(t.code ?? t.name);
  return { places, total: rows.length };
}
