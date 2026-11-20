/**
 * Integration: Education tracks (Easy / Intermediate / Hard / Critical) on Postgres.
 * Choose at sign-up → change during Module 1 (keep work or restart) → staff change with role setting → learner
 * chooses how to continue → locked after Module 1 → points kept → separate standings per track.
 */
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import type { Ctx } from '@/lib/server/context';
import { AppError } from '@/lib/server/errors';
import { _resetRateLimits } from '@/lib/server/http';
import { register } from '@/lib/domain/account';
import { completeActivity } from '@/lib/domain/journey';
import { registrationJourneys } from '@/lib/domain/journeyAccess';
import { totalXp } from '@/lib/domain/xp';
import { leaderboard } from '@/lib/domain/insights';
import { myTrack, changeOwnTrack, requestTrackChange, decideTrackChange, learnerTrack, setTrackSettings, getTrackSettings } from '@/lib/domain/journeyTracks';

const status = async (p: Promise<unknown>) => { try { await p; return 200; } catch (e) { return (e as AppError).status; } };
const ctxFor = async (email: string): Promise<Ctx> => {
  const u = await prisma.user.findUniqueOrThrow({ where: { email } });
  const m = await prisma.membership.findFirstOrThrow({ where: { userId: u.id }, include: { role: true, tenant: true } });
  return { userId: u.id, email, name: u.name || email, tenantId: m.tenantId, tenantSlug: m.tenant.slug, tenantName: m.tenant.name, role: m.role.code as Ctx['role'], cohortId: m.cohortId, superAdmin: false };
};
const activeSlug = async (userId: string) => (await prisma.enrollment.findFirstOrThrow({ where: { userId, state: 'active' }, include: { journey: true } })).journey.slug;
const m1Code = async (userId: string) => (await prisma.enrollment.findFirstOrThrow({ where: { userId, state: 'active' }, include: { journey: { include: { levels: { where: { idx: 1 } } } } } })).journey.levels[0].code;
const doneInM1 = async (userId: string) => {
  const e = await prisma.enrollment.findFirstOrThrow({ where: { userId, state: 'active' } });
  return prisma.activityProgress.count({ where: { enrollmentId: e.id, state: 'completed', progress: { level: { idx: 1 } } } });
};
const briefing = async (c: Ctx) => {
  const code = await m1Code(c.userId);
  const lv = await prisma.level.findFirstOrThrow({ where: { code }, include: { activities: true } });
  const cfg = JSON.parse(lv.activities.find(a => a.idx === 1)!.config);
  await completeActivity(c, code, 1, { choice: cfg.check.answer });
};

const RUN = Date.now().toString(36);
const E = { easy: `track.easy.${RUN}@example.test`, crit: `track.crit.${RUN}@example.test`, peer: `track.peer.${RUN}@example.test` };

describe('Journey tracks (integration)', () => {
  let learner: Ctx, peer: Ctx, staff: Ctx;
  beforeAll(async () => {
    const y = new Date().getFullYear();
    await register({ name: 'Easy Learner', email: E.easy, password: 'Trackxxx@1234', birthYear: y - 22, journeySlug: 'da-education-easy', acceptTerms: true } as never);
    await register({ name: 'Peer Learner', email: E.peer, password: 'Trackxxx@1234', birthYear: y - 23, journeySlug: 'da-education-intermediate', acceptTerms: true } as never);
    [learner, peer] = await Promise.all([E.easy, E.peer].map(ctxFor));
    staff = { ...peer, userId: peer.userId, name: 'Ms Program Manager', role: 'program_mgr' }; // a staff context in the same institution
  });
  beforeEach(() => _resetRateLimits());

  it('sign-up lists the four Education tracks as separate journeys of one domain', async () => {
    const list = await registrationJourneys(prisma, learner.tenantId);
    const edu = list.filter(j => (j.config as { domain?: string } | null)?.domain === 'education');
    expect(edu.map(j => (j.config as { track: string }).track).sort()).toEqual(['critical', 'easy', 'hard', 'intermediate']);
  });

  it('the Critical track needs the safeguarding and data-ethics confirmation at sign-up', async () => {
    const y = new Date().getFullYear();
    const base = { name: 'Critical Learner', email: E.crit, password: 'Trackxxx@1234', birthYear: y - 26, journeySlug: 'da-education-critical', acceptTerms: true };
    expect(await status(register(base as never))).toBe(400);
    expect(await status(register({ ...base, trackAck: true } as never))).toBe(200);
    expect(await activeSlug((await ctxFor(E.crit)).userId)).toBe('da-education-critical');
  });

  it('the learner sees their track and can change it during Module 1, keeping their work and points', async () => {
    const t = await myTrack(learner);
    expect(t).toMatchObject({ level: 'easy', changeable: true });
    expect(t!.options).toHaveLength(4);
    await briefing(learner);
    const xp = await totalXp(learner.tenantId, learner.userId);
    expect(xp).toBeGreaterThan(0);
    await changeOwnTrack(learner, { level: 'hard', mode: 'continue' });
    expect(await activeSlug(learner.userId)).toBe('da-education');
    expect(await doneInM1(learner.userId)).toBe(1);
    expect(await totalXp(learner.tenantId, learner.userId)).toBe(xp);
  });

  it('restart starts Module 1 of the new track from Day 1, still keeping points', async () => {
    const xp = await totalXp(learner.tenantId, learner.userId);
    await changeOwnTrack(learner, { level: 'easy', mode: 'restart' });
    expect(await activeSlug(learner.userId)).toBe('da-education-easy');
    expect(await doneInM1(learner.userId)).toBe(0);
    expect(await totalXp(learner.tenantId, learner.userId)).toBe(xp);
  });

  it('only roles allowed in Settings can move a learner; the learner then chooses how to continue', async () => {
    const mentor = { ...staff, role: 'mentor' as const };
    expect(await status(requestTrackChange(mentor, learner.userId, { level: 'intermediate' }))).toBe(403);
    await setTrackSettings(staff, ['tenant_admin', 'program_mgr', 'instructor', 'mentor']);
    expect((await getTrackSettings(staff)).options.find(o => o.role === 'mentor')!.allowed).toBe(true);
    expect((await learnerTrack(mentor, learner.userId))!.canChange).toBe(true);
    await requestTrackChange(mentor, learner.userId, { level: 'intermediate', reason: 'Strong SQL in Module 1' });
    const pending = (await myTrack(learner))!.pending!;
    expect(pending).toMatchObject({ level: 'intermediate', reason: 'Strong SQL in Module 1' });
    expect(await activeSlug(learner.userId)).toBe('da-education-easy'); // nothing moves until the learner chooses
    await decideTrackChange(learner, pending.id, { mode: 'continue' });
    expect(await activeSlug(learner.userId)).toBe('da-education-intermediate');
    expect((await myTrack(learner))!.pending).toBeNull();
    await setTrackSettings(staff, ['tenant_admin', 'program_mgr', 'instructor']);
  });

  it('standings are separate per track: only learners on the same track are ranked together', async () => {
    const board = await leaderboard(learner, 'track');
    const names = board.rows.map(r => r.name);
    expect(names).toContain('Easy Learner'); // the viewer, now on Intermediate with the peer
    expect(board.rows.length).toBeGreaterThanOrEqual(2);
    const critical = await leaderboard(await ctxFor(E.crit), 'track');
    expect(critical.rows.map(r => r.name)).not.toContain('Easy Learner');
  });

  it('after Module 1 is complete the track is fixed for the learner and for staff', async () => {
    const e = await prisma.enrollment.findFirstOrThrow({ where: { userId: learner.userId, state: 'active' } });
    await prisma.progress.updateMany({ where: { enrollmentId: e.id, level: { idx: 1 } }, data: { state: 'approved' } });
    expect((await myTrack(learner))!.changeable).toBe(false);
    expect(await status(changeOwnTrack(learner, { level: 'easy', mode: 'continue' }))).toBe(400);
    expect(await status(requestTrackChange(staff, learner.userId, { level: 'hard' }))).toBe(400);
  });
});
