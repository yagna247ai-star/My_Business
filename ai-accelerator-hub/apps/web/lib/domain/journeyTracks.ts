/**
 * Journey tracks: Easy, Intermediate, Hard and Critical versions of a domain journey (each its own Journey).
 *  - Learners choose a track at registration and may change it themselves until Module 1 is complete.
 *  - Staff whose role is allowed in Settings (default: Institution Admin, Program Manager, Instructor; Super Admin
 *    always) can move a learner to another track, also only until Module 1 is complete. The learner then chooses
 *    how to continue: keep their Module 1 work, or restart Module 1 from Day 1.
 *  - Points are always kept. From Module 2 to Day 45 the track is fixed.
 */
import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { Ctx } from '@/lib/server/context';
import { hasPerm } from '@/lib/server/context';
import { badRequest, forbidden, notFound } from '@/lib/server/errors';
import { audit, notify } from '@/lib/server/audit';
import { enrollInJourney, parseSettings } from './journeyAccess';
import { canChangeLearnerTracks, canEditTrackSettings, isTrackLevel, trackChangeAllowed, trackChangeRoles, TRACK_CHANGE_ROLE_OPTIONS, TRACK_NAMES, type TrackLevel } from './trackRules';
import { ROLE_LABEL, type Role } from '@/lib/server/rbac';

type Tx = Prisma.TransactionClient;
export type ChangeMode = 'continue' | 'restart';
const FAMILY = 'data-analytics-domain';

async function tenantSettings(tenantId: string) {
  const t = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { settings: true } });
  return parseSettings(t?.settings);
}

/** The learner's current track, the other tracks of the same domain, whether they can still change, and any pending change. */
async function trackState(tenantId: string, userId: string) {
  const enr = await prisma.enrollment.findFirst({ where: { tenantId, userId, state: 'active' }, include: { journey: { select: { id: true, title: true, config: true } } } });
  if (!enr) return null;
  const cfg = parseSettings(enr.journey.config);
  if (cfg.family !== FAMILY || !isTrackLevel(cfg.track)) return null;
  const domain = String(cfg.domain);
  const journeys = await prisma.journey.findMany({ where: { tenantId, isPublished: true }, select: { id: true, title: true, config: true } });
  const options = journeys.map(j => ({ j, c: parseSettings(j.config) }))
    .filter(x => x.c.family === FAMILY && x.c.domain === domain && isTrackLevel(x.c.track))
    .map(x => ({ level: x.c.track as TrackLevel, journeyId: x.j.id, title: String(x.c.problem ?? x.j.title) }))
    .sort((a, b) => ['easy', 'intermediate', 'hard', 'critical'].indexOf(a.level) - ['easy', 'intermediate', 'hard', 'critical'].indexOf(b.level));
  const m1 = await prisma.progress.findFirst({ where: { enrollmentId: enr.id, level: { idx: 1 } }, select: { state: true, completedAt: true } });
  const pending = await prisma.trackChange.findFirst({ where: { tenantId, userId, state: 'pending' }, orderBy: { createdAt: 'desc' } });
  const by = pending ? await prisma.user.findUnique({ where: { id: pending.requestedBy }, select: { name: true } }) : null;
  const pendingTo = pending ? options.find(o => o.journeyId === pending.toJourneyId) : null;
  return {
    enrollmentId: enr.id, journeyId: enr.journeyId, domain, level: cfg.track as TrackLevel, title: String(cfg.problem ?? enr.journey.title),
    options, module1State: m1?.state ?? null, changeable: trackChangeAllowed(m1?.state, !!m1?.completedAt),
    pending: pending && pendingTo ? { id: pending.id, level: pendingTo.level, title: pendingTo.title, reason: pending.reason, by: by?.name ?? 'Your program team' } : null,
  };
}

const view = (s: NonNullable<Awaited<ReturnType<typeof trackState>>>) => ({
  domain: s.domain, level: s.level, levelName: TRACK_NAMES[s.level], title: s.title, changeable: s.changeable,
  options: s.options.map(o => ({ level: o.level, name: TRACK_NAMES[o.level], title: o.title, current: o.level === s.level })),
  pending: s.pending && { id: s.pending.id, level: s.pending.level, name: TRACK_NAMES[s.pending.level], title: s.pending.title, reason: s.pending.reason, by: s.pending.by },
});

/** For the learner's own journey page. Null when the learner is not on a tracked journey. */
export async function myTrack(ctx: Ctx) {
  const s = await trackState(ctx.tenantId, ctx.userId);
  return s ? view(s) : null;
}

/** For staff looking at a learner. */
export async function learnerTrack(ctx: Ctx, userId: string) {
  if (!hasPerm(ctx, 'members:read') && !ctx.superAdmin) throw forbidden();
  const m = await prisma.membership.findUnique({ where: { tenantId_userId: { tenantId: ctx.tenantId, userId } } });
  if (!m) throw notFound('Member not found in this institution.');
  const s = await trackState(ctx.tenantId, userId);
  return s ? { ...view(s), canChange: canChangeLearnerTracks(ctx, await tenantSettings(ctx.tenantId)) } : null;
}

/** Move the active enrollment to the target track's journey. Points (XP ledger) are never touched. */
// A move enrols the learner in a whole new journey, so it gets more room than Prisma's 5 s default (as account.ts does).
const MOVE_TX = { maxWait: 10_000, timeout: 15_000 };

async function applyMove(tx: Tx, a: { tenantId: string; userId: string; fromEnrollmentId: string; toJourneyId: string; mode: ChangeMode; cohortId: string | null }) {
  const toEnrollmentId = await enrollInJourney(tx, { tenantId: a.tenantId, userId: a.userId, journeyId: a.toJourneyId, cohortId: a.cohortId });
  const toL1 = await tx.progress.findFirst({ where: { enrollmentId: toEnrollmentId, level: { idx: 1 } }, include: { level: { include: { activities: true } } } });
  if (!toL1) return toEnrollmentId;
  // Both modes start Module 1 of the new track clean; "continue" then carries over the Module 1 activities already done.
  await tx.activityProgress.deleteMany({ where: { progressId: toL1.id } });
  await tx.dayProgress.deleteMany({ where: { enrollmentId: toEnrollmentId, levelId: toL1.levelId } });
  await tx.progress.update({ where: { id: toL1.id }, data: { state: 'available', completedAt: null } });
  if (a.mode === 'continue') {
    const done = await tx.activityProgress.findMany({ where: { enrollmentId: a.fromEnrollmentId, state: 'completed', progress: { level: { idx: 1 } } }, include: { activity: { select: { idx: true } } } });
    // One batched insert. xpEarned 0: the points were already awarded once and stay in the ledger.
    const rows = done.flatMap(d => {
      const target = toL1.level.activities.find(x => x.idx === d.activity.idx);
      return target ? [{ progressId: toL1.id, activityId: target.id, userId: a.userId, enrollmentId: toEnrollmentId, state: 'completed', xpEarned: 0, data: JSON.stringify({ carriedFromTrackChange: true }), completedAt: d.completedAt ?? new Date() }] : [];
    });
    if (rows.length) await tx.activityProgress.createMany({ data: rows });
    const fromL1 = await tx.progress.findFirst({ where: { enrollmentId: a.fromEnrollmentId, level: { idx: 1 } }, select: { levelId: true } });
    const days = fromL1 ? await tx.dayProgress.findMany({ where: { enrollmentId: a.fromEnrollmentId, levelId: fromL1.levelId, state: 'done' } }) : [];
    // Day pages finished in Module 1 stay done too (no new points: they were awarded once).
    if (days.length) await tx.dayProgress.createMany({ data: days.map(d => ({ tenantId: a.tenantId, enrollmentId: toEnrollmentId, levelId: toL1.levelId, userId: a.userId, day: d.day, state: 'done', steps: d.steps, fileId: d.fileId, xpEarned: 0, completedAt: d.completedAt })), skipDuplicates: true });
    if (rows.length) await tx.progress.update({ where: { id: toL1.id }, data: { state: 'in_progress' } });
  }
  return toEnrollmentId;
}

function targetOf(s: NonNullable<Awaited<ReturnType<typeof trackState>>>, level: unknown) {
  if (!isTrackLevel(level)) throw badRequest('Choose Easy, Intermediate, Hard or Critical.');
  if (level === s.level) throw badRequest(`You are already on the ${TRACK_NAMES[level]} track.`);
  const t = s.options.find(o => o.level === level);
  if (!t) throw badRequest('That track is not open in this institution.');
  if (!s.changeable) throw badRequest('Module 1 is complete, so this track is now fixed until Day 45.');
  return t;
}

/** The learner changes their own track (only during Module 1) and chooses how to continue. */
export async function changeOwnTrack(ctx: Ctx, input: { level: unknown; mode: ChangeMode; ack?: boolean }) {
  const s = await trackState(ctx.tenantId, ctx.userId);
  if (!s) throw badRequest('Your journey has no tracks to choose from.');
  const t = targetOf(s, input.level);
  if (t.level === 'critical' && !input.ack) throw badRequest('Confirm the safeguarding and data-ethics rules to start the Critical track.', { ack: 'Tick the box to confirm the rules.' });
  const m = await prisma.membership.findUnique({ where: { tenantId_userId: { tenantId: ctx.tenantId, userId: ctx.userId } }, select: { cohortId: true } });
  await prisma.$transaction(async tx => {
    await tx.trackChange.updateMany({ where: { tenantId: ctx.tenantId, userId: ctx.userId, state: 'pending' }, data: { state: 'cancelled', decidedAt: new Date() } });
    const c = await tx.trackChange.create({ data: { tenantId: ctx.tenantId, userId: ctx.userId, fromJourneyId: s.journeyId, toJourneyId: t.journeyId, requestedBy: ctx.userId, reason: 'Chosen by the learner', state: 'applied', mode: input.mode, decidedAt: new Date() } });
    await applyMove(tx, { tenantId: ctx.tenantId, userId: ctx.userId, fromEnrollmentId: s.enrollmentId, toJourneyId: t.journeyId, mode: input.mode, cohortId: m?.cohortId ?? null });
    await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'track.changed_by_learner', resourceType: 'TrackChange', resourceId: c.id, before: { track: s.level }, after: { track: t.level, mode: input.mode } });
  }, MOVE_TX);
  return { ok: true, level: t.level };
}

/** Staff move a learner to another track (only during Module 1). The learner then chooses how to continue. */
export async function requestTrackChange(ctx: Ctx, userId: string, input: { level: unknown; reason?: string }) {
  if (!canChangeLearnerTracks(ctx, await tenantSettings(ctx.tenantId))) throw forbidden('Your role is not allowed to change learners’ tracks. An admin can allow it in Settings → Learning tracks.');
  if (userId === ctx.userId) throw badRequest('Change your own track from your journey page.');
  const member = await prisma.membership.findUnique({ where: { tenantId_userId: { tenantId: ctx.tenantId, userId } } });
  if (!member) throw notFound('Member not found in this institution.');
  const s = await trackState(ctx.tenantId, userId);
  if (!s) throw badRequest('This learner is not on a journey with tracks.');
  const t = targetOf(s, input.level);
  const reason = input.reason?.trim().slice(0, 500) || null;
  await prisma.$transaction(async tx => {
    await tx.trackChange.updateMany({ where: { tenantId: ctx.tenantId, userId, state: 'pending' }, data: { state: 'cancelled', decidedAt: new Date() } });
    const c = await tx.trackChange.create({ data: { tenantId: ctx.tenantId, userId, fromJourneyId: s.journeyId, toJourneyId: t.journeyId, requestedBy: ctx.userId, reason } });
    await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'track.change_requested', resourceType: 'TrackChange', resourceId: c.id, before: { track: s.level }, after: { track: t.level, reason } });
    await notify(tx, ctx.tenantId, userId, 'track_change', { title: `${ctx.name || 'Your program team'} moved you to the ${TRACK_NAMES[t.level]} track`, body: 'Open your journey to choose: keep your Module 1 work, or restart Module 1. Your points are kept either way.', href: '/levels', tone: 'info' });
  });
  return { ok: true };
}

/** The learner applies a pending staff change, choosing to keep their Module 1 work or restart Module 1. */
export async function decideTrackChange(ctx: Ctx, changeId: string, input: { mode: ChangeMode; ack?: boolean }) {
  const c = await prisma.trackChange.findFirst({ where: { id: changeId, tenantId: ctx.tenantId, userId: ctx.userId, state: 'pending' } });
  if (!c) throw notFound('This track change is no longer waiting for you.');
  const s = await trackState(ctx.tenantId, ctx.userId);
  if (!s || s.journeyId !== c.fromJourneyId) {
    await prisma.trackChange.update({ where: { id: c.id }, data: { state: 'cancelled', decidedAt: new Date() } });
    throw badRequest('Your journey changed since this was requested, so it was cancelled.');
  }
  const t = s.options.find(o => o.journeyId === c.toJourneyId);
  if (!t) throw badRequest('That track is no longer open.');
  if (!s.changeable) throw badRequest('Module 1 is complete, so your track is now fixed until Day 45.');
  if (t.level === 'critical' && !input.ack) throw badRequest('Confirm the safeguarding and data-ethics rules to start the Critical track.', { ack: 'Tick the box to confirm the rules.' });
  const m = await prisma.membership.findUnique({ where: { tenantId_userId: { tenantId: ctx.tenantId, userId: ctx.userId } }, select: { cohortId: true } });
  await prisma.$transaction(async tx => {
    await applyMove(tx, { tenantId: ctx.tenantId, userId: ctx.userId, fromEnrollmentId: s.enrollmentId, toJourneyId: t.journeyId, mode: input.mode, cohortId: m?.cohortId ?? null });
    await tx.trackChange.update({ where: { id: c.id }, data: { state: 'applied', mode: input.mode, decidedAt: new Date() } });
    await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'track.change_applied', resourceType: 'TrackChange', resourceId: c.id, before: { track: s.level }, after: { track: t.level, mode: input.mode } });
    if (c.requestedBy !== ctx.userId) await notify(tx, ctx.tenantId, c.requestedBy, 'track_change_applied', { title: `${ctx.name} moved to the ${TRACK_NAMES[t.level]} track`, body: input.mode === 'continue' ? 'They kept their Module 1 work.' : 'They restarted Module 1.', href: '/settings/people', tone: 'info' });
  }, MOVE_TX);
  return { ok: true, level: t.level };
}

/** Settings → Learning tracks: which staff roles may change learners' tracks. */
export async function getTrackSettings(ctx: Ctx) {
  if (!canEditTrackSettings(ctx)) throw forbidden();
  const roles = trackChangeRoles(await tenantSettings(ctx.tenantId));
  return { options: TRACK_CHANGE_ROLE_OPTIONS.map(r => ({ role: r, label: ROLE_LABEL[r], allowed: roles.includes(r) })) };
}

export async function setTrackSettings(ctx: Ctx, roles: string[]) {
  if (!canEditTrackSettings(ctx)) throw forbidden('Only a Super Admin, Institution Admin or Program Manager can change this.');
  const clean = [...new Set(roles)].filter((r): r is Role => (TRACK_CHANGE_ROLE_OPTIONS as string[]).includes(r));
  await prisma.$transaction(async tx => {
    const t = await tx.tenant.findUniqueOrThrow({ where: { id: ctx.tenantId }, select: { settings: true } });
    const settings = parseSettings(t.settings);
    await tx.tenant.update({ where: { id: ctx.tenantId }, data: { settings: JSON.stringify({ ...settings, trackChangeRoles: clean }) } });
    await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'settings.track_change_roles', resourceType: 'Tenant', resourceId: ctx.tenantId, before: { roles: trackChangeRoles(settings) }, after: { roles: clean } });
  });
  return getTrackSettings(ctx);
}
