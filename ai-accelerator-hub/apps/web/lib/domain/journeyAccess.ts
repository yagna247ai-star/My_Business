/**
 * Which journeys learners can be on, and who decides. Super Admin controls:
 *  - which journeys are published (open for enrollment),
 *  - which published journey new learners are enrolled in by default (Tenant.settings.defaultJourneySlug),
 *  - which journey each member is on.
 *
 * A member has at most one ACTIVE enrollment per institution. Switching journeys pauses the old enrollment
 * (state 'paused') rather than deleting it, so progress comes back if they are switched back.
 */
import type { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { Ctx } from '@/lib/server/context';
import { badRequest, forbidden, notFound } from '@/lib/server/errors';
import { audit, notify } from '@/lib/server/audit';

type Db = PrismaClient | Prisma.TransactionClient;

/** Used when no default has been chosen yet. */
export const FALLBACK_DEFAULT_SLUG = 'data-analytics-journey';

type Candidate = { id: string; slug: string; isPublished: boolean; createdAt: Date };

/** Pure: the journey new learners join. Chosen default if published, else the data-analytics journey, else the oldest published one. */
export function pickDefaultJourney<T extends Candidate>(journeys: T[], configuredSlug: string | null | undefined): T | null {
  const published = journeys.filter(j => j.isPublished).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  return published.find(j => j.slug === configuredSlug) ?? published.find(j => j.slug === FALLBACK_DEFAULT_SLUG) ?? published[0] ?? null;
}

export function parseSettings(raw: string | null | undefined): Record<string, unknown> {
  if (!raw) return {};
  try { const v = JSON.parse(raw); return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; } catch { return {}; }
}

export async function defaultJourney(db: Db, tenantId: string) {
  const [tenant, journeys] = await Promise.all([
    db.tenant.findUnique({ where: { id: tenantId }, select: { settings: true } }),
    db.journey.findMany({ where: { tenantId }, select: { id: true, slug: true, title: true, isPublished: true, createdAt: true } }),
  ]);
  const slug = parseSettings(tenant?.settings).defaultJourneySlug;
  return pickDefaultJourney(journeys, typeof slug === 'string' ? slug : null);
}

/** Published journeys a new learner can choose, default first, with a short description for the sign-up form. */
/** The registration form only needs the domain tag; never pass the whole config JSON to the browser. */
function publicJourneyConfig(raw: string | null): { family: string; domain: string; name: string; problem: string } | null {
  const c = parseSettings(raw);
  return typeof c.family === 'string' && typeof c.domain === 'string'
    ? { family: c.family, domain: c.domain, name: String(c.name ?? c.domain), problem: String(c.problem ?? '') }
    : null;
}

export async function registrationJourneys(db: Db, tenantId: string) {
  const [tenant, journeys] = await Promise.all([
    db.tenant.findUnique({ where: { id: tenantId }, select: { settings: true } }),
    db.journey.findMany({ where: { tenantId, isPublished: true, levels: { some: { idx: 1 } } }, select: { id: true, slug: true, title: true, description: true, isPublished: true, createdAt: true, config: true, _count: { select: { levels: true } } } }),
  ]);
  const slug = parseSettings(tenant?.settings).defaultJourneySlug;
  const def = pickDefaultJourney(journeys, typeof slug === 'string' ? slug : null);
  return journeys
    // `config` carries the domain tag for domain journeys ({ family, domain, name, problem }); only safe, public fields.
    .map(j => ({ id: j.id, slug: j.slug, title: j.title, description: j.description, levels: j._count.levels, isDefault: j.id === def?.id, config: publicJourneyConfig(j.config) }))
    .sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || a.title.localeCompare(b.title));
}

/**
 * Put a member on a journey: pause any other active enrollment, then reactivate or create this one.
 * A new enrollment starts with Level 1 available. Returns the enrollment id.
 */
export async function enrollInJourney(tx: Prisma.TransactionClient, a: { tenantId: string; userId: string; journeyId: string; cohortId?: string | null }) {
  await tx.enrollment.updateMany({ where: { tenantId: a.tenantId, userId: a.userId, state: 'active', journeyId: { not: a.journeyId } }, data: { state: 'paused' } });
  const existing = await tx.enrollment.findUnique({ where: { tenantId_userId_journeyId: { tenantId: a.tenantId, userId: a.userId, journeyId: a.journeyId } } });
  if (existing) {
    if (existing.state !== 'active' && existing.state !== 'completed') await tx.enrollment.update({ where: { id: existing.id }, data: { state: 'active' } });
    return existing.id;
  }
  const l1 = await tx.level.findFirst({ where: { journeyId: a.journeyId, idx: 1 } });
  if (!l1) throw badRequest('This journey has no Level 1 yet, so nobody can start it.');
  const e = await tx.enrollment.create({ data: { tenantId: a.tenantId, userId: a.userId, journeyId: a.journeyId, cohortId: a.cohortId ?? null, currentLevelIdx: 1 } });
  await tx.progress.create({ data: { tenantId: a.tenantId, enrollmentId: e.id, levelId: l1.id, userId: a.userId, state: 'available', unlockedAt: new Date() } });
  return e.id;
}

const requireSuper = (ctx: Ctx) => { if (!ctx.superAdmin) throw forbidden('Only a Super Admin can change journey access.'); };

/** Journeys with their status and how many members are active on each. */
export async function journeyAccessOverview(ctx: Ctx) {
  const [journeys, def, counts] = await Promise.all([
    prisma.journey.findMany({ where: { tenantId: ctx.tenantId }, orderBy: { createdAt: 'asc' }, select: { id: true, slug: true, title: true, isPublished: true, createdAt: true, _count: { select: { levels: true } } } }),
    defaultJourney(prisma, ctx.tenantId),
    prisma.enrollment.groupBy({ by: ['journeyId'], where: { tenantId: ctx.tenantId, state: 'active' }, _count: true }),
  ]);
  const active = new Map(counts.map(c => [c.journeyId, c._count]));
  return journeys.map(j => ({ id: j.id, slug: j.slug, title: j.title, published: j.isPublished, levels: j._count.levels, activeMembers: active.get(j.id) ?? 0, isDefault: def?.id === j.id }));
}

async function journeyIn(ctx: Ctx, journeyId: string) {
  const j = await prisma.journey.findFirst({ where: { id: journeyId, tenantId: ctx.tenantId } });
  if (!j) throw notFound('Journey not found in this institution.');
  return j;
}

export async function setJourneyPublished(ctx: Ctx, journeyId: string, published: boolean) {
  requireSuper(ctx);
  const j = await journeyIn(ctx, journeyId);
  if (!published && (await defaultJourney(prisma, ctx.tenantId))?.id === j.id) throw badRequest('This is the default journey for new learners. Make another journey the default first.');
  if (published && !(await prisma.level.findFirst({ where: { journeyId: j.id, idx: 1 } }))) throw badRequest('Add Level 1 before publishing this journey.');
  await prisma.$transaction(async tx => {
    await tx.journey.update({ where: { id: j.id }, data: { isPublished: published } });
    await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: published ? 'journey.published' : 'journey.unpublished', resourceType: 'Journey', resourceId: j.id, before: { published: j.isPublished }, after: { published } });
  });
  return { ok: true };
}

export async function setDefaultJourney(ctx: Ctx, journeyId: string) {
  requireSuper(ctx);
  const j = await journeyIn(ctx, journeyId);
  if (!j.isPublished) throw badRequest('Publish this journey before making it the default.');
  await prisma.$transaction(async tx => {
    const t = await tx.tenant.findUniqueOrThrow({ where: { id: ctx.tenantId }, select: { settings: true } });
    const settings = parseSettings(t.settings);
    const before = settings.defaultJourneySlug ?? null;
    await tx.tenant.update({ where: { id: ctx.tenantId }, data: { settings: JSON.stringify({ ...settings, defaultJourneySlug: j.slug }) } });
    await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'journey.default_set', resourceType: 'Tenant', resourceId: ctx.tenantId, before: { defaultJourneySlug: before }, after: { defaultJourneySlug: j.slug } });
  });
  return { ok: true };
}

/** Move a member (or yourself) onto a published journey. Their progress on other journeys is kept. */
export async function setMemberJourney(ctx: Ctx, userId: string, journeyId: string) {
  requireSuper(ctx);
  const j = await journeyIn(ctx, journeyId);
  if (!j.isPublished) throw badRequest('Publish this journey before putting people on it.');
  const m = await prisma.membership.findUnique({ where: { tenantId_userId: { tenantId: ctx.tenantId, userId } } });
  if (!m) throw notFound('Member not found in this institution.');
  await prisma.$transaction(async tx => {
    const before = await tx.enrollment.findFirst({ where: { tenantId: ctx.tenantId, userId, state: 'active' }, select: { journeyId: true } });
    const enrollmentId = await enrollInJourney(tx, { tenantId: ctx.tenantId, userId, journeyId: j.id, cohortId: m.cohortId });
    await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'member.journey_changed', resourceType: 'Enrollment', resourceId: enrollmentId, before: { journeyId: before?.journeyId ?? null }, after: { journeyId: j.id } });
    if (userId !== ctx.userId) await notify(tx, ctx.tenantId, userId, 'journey_changed', { title: `You're now on ${j.title}`, body: 'Your progress on any other journey is saved.', href: '/levels', tone: 'info' });
  });
  return { ok: true };
}
