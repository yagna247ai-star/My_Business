/**
 * Integration (Postgres): free progression.
 * Skip any activity or day → the next level opens when everything is done or skipped → the learner is told the
 * points earned out of the total → skipped work can be finished later for its points → review never re-locks or
 * resets a level the learner has opened → the track is fixed once Module 1 is finished.
 */
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import type { Ctx } from '@/lib/server/context';
import { AppError } from '@/lib/server/errors';
import { _resetRateLimits } from '@/lib/server/http';
import { register } from '@/lib/domain/account';
import { completeActivity, completeDay, completeStep, levelState, skipActivity, skipDay } from '@/lib/domain/journey';
import { myTrack } from '@/lib/domain/journeyTracks';
import { totalXp } from '@/lib/domain/xp';


const status = async (p: Promise<unknown>) => { try { await p; return 200; } catch (e) { return (e as AppError).status; } };
const ctxFor = async (email: string): Promise<Ctx> => {
  const u = await prisma.user.findUniqueOrThrow({ where: { email } });
  const m = await prisma.membership.findFirstOrThrow({ where: { userId: u.id }, include: { role: true, tenant: true } });
  return { userId: u.id, email, name: u.name || email, tenantId: m.tenantId, tenantSlug: m.tenant.slug, tenantName: m.tenant.name, role: m.role.code as Ctx['role'], cohortId: m.cohortId, superAdmin: false };
};
const RUN = Date.now().toString(36);
const EMAIL = `free.progress.${RUN}@example.test`;

describe('Free progression (integration)', () => {
  let me: Ctx; let L1 = ''; let L2 = ''; let shot = '';
  const screenshot = async (entityId: string, width = 1280, height = 720) => (await prisma.file.create({ data: { tenantId: me.tenantId, ownerId: me.userId, s3Key: `test/${RUN}/${Math.random()}`, mime: 'image/png', avStatus: 'clean', entityType: 'level_evidence', entityId, width, height } })).id;

  beforeAll(async () => {
    const y = new Date().getFullYear();
    await register({ name: 'Free Learner', email: EMAIL, password: 'Freexxxx@1234', birthYear: y - 22, journeySlug: 'da-education-easy', acceptTerms: true } as never);
    me = await ctxFor(EMAIL);
    const e = await prisma.enrollment.findFirstOrThrow({ where: { userId: me.userId, state: 'active' }, include: { journey: { include: { levels: { orderBy: { idx: 'asc' } } } } } });
    [L1, L2] = [e.journey.levels[0].code, e.journey.levels[1].code];
    shot = await screenshot(L1);
  });
  beforeEach(() => _resetRateLimits());

  it('a guided day is done step by step (the old one-screenshot route is refused), and earns its points once', async () => {
    const page = await prisma.content.findFirstOrThrow({ where: { level: { code: L1, journey: { slug: 'da-education-easy' } }, kind: 'md', position: 1 } });
    expect(await status(completeDay(me, L1, 1, { steps: [true, true, true, true], fileId: shot }))).toBe(400);
    const steps = JSON.parse(page.payload!).steps as { check: { kind: string } }[];
    expect(steps.length).toBeGreaterThanOrEqual(3);
    const before = await totalXp(me.tenantId, me.userId);
    let xp = 0;
    for (let i = 0; i < steps.length; i++) xp += (await completeStep(me, L1, 1, i, { answer: 'Class teachers call absent children first and the principal tracks catch-up plans for each absent child this week.' })).xp;
    expect(xp).toBeGreaterThan(0);
    expect(await totalXp(me.tenantId, me.userId)).toBe(before + xp);
    expect(await status(completeStep(me, L1, 1, 0, { answer: 'again, the same thing once more for the record' }))).toBe(409);
    expect(await status(skipDay(me, L1, 1))).toBe(409); // a done day cannot be skipped
  });

  it('skipping opens the next activity and earns no points; a completed activity cannot be skipped', async () => {
    const lv = await prisma.level.findFirstOrThrow({ where: { code: L1, journey: { slug: 'da-education-easy' } }, include: { activities: true } });
    const brief = JSON.parse(lv.activities.find(a => a.idx === 1)!.config);
    await completeActivity(me, L1, 1, { choice: brief.check.answer });
    expect(await status(skipActivity(me, L1, 1))).toBe(409);
    expect(await status(skipActivity(me, L1, 3))).toBe(403); // activity 2 is not finished or skipped yet
    const before = await totalXp(me.tenantId, me.userId);
    for (const idx of [2, 3, 4, 5]) await skipActivity(me, L1, idx);
    expect(await totalXp(me.tenantId, me.userId)).toBe(before);
    const st = await levelState(me, L1);
    if (st.locked) throw new Error('locked');
    expect(st.activities.filter(a => a.state === 'skipped').map(a => a.idx)).toEqual([2, 3, 4, 5]);
    expect(st.activities.find(a => a.idx === 6)!.state).toBe('available');
    expect(st.completion.complete).toBe(false);
  });

  it('the next level opens once every activity and day is done or skipped, and the learner is told the points', async () => {
    expect((await levelState(me, L2)).locked).toBe(true);
    await skipActivity(me, L1, 6);
    for (const day of [2, 3, 4]) await skipDay(me, L1, day);
    expect((await levelState(me, L2)).locked).toBe(true);
    const last = await skipDay(me, L1, 5);
    expect(last.advanced?.next).toBe(L2);
    expect(last.advanced?.message).toMatch(/^You earned \d+ of \d+ points in this level\. .+ is open\. Skipped steps earned no points/);
    expect((await levelState(me, L2)).locked).toBe(false);
    const n = await prisma.notification.findFirst({ where: { userId: me.userId, template: 'level_completed' } });
    expect(JSON.parse(n!.payload!).title).toMatch(/complete: \d+ of \d+ points/);
    const st = await levelState(me, L1);
    if (st.locked) throw new Error('locked');
    expect(st.completion.complete).toBe(true);
    expect(st.completion.next?.code).toBe(L2);
  });

  it('skipped work can still be done later for its points, and finishing again never re-locks the next level', async () => {
    const lv = await prisma.level.findFirstOrThrow({ where: { code: L1, journey: { slug: 'da-education-easy' } }, include: { activities: true } });
    const learn = JSON.parse(lv.activities.find(a => a.idx === 2)!.config);
    const before = await totalXp(me.tenantId, me.userId);
    const r = await completeActivity(me, L1, 2, { answers: learn.quiz.map((q: { answer: number }) => q.answer) }) as { xp: number };
    expect(r.xp).toBeGreaterThan(0);
    expect(await totalXp(me.tenantId, me.userId)).toBe(before + r.xp);
    // Day 2 was skipped as a whole; doing one of its steps later earns that step's points and keeps the day finished.
    const d2 = await completeStep(me, L1, 2, 0, { answer: 'Measure: absence days; period: last 10 school days; breakdown: by class and section at Kukatpally.' });
    expect(d2.xp).toBe(3);
    expect((await prisma.dayProgress.findFirstOrThrow({ where: { userId: me.userId, day: 2 } })).state).toBe('done');
    expect((await levelState(me, L2)).locked).toBe(false);
  });

  it('review approval never resets a level the learner has already opened', async () => {
    const e = await prisma.enrollment.findFirstOrThrow({ where: { userId: me.userId, state: 'active' } });
    const l2 = await prisma.level.findFirstOrThrow({ where: { code: L2, journeyId: e.journeyId } });
    await prisma.progress.update({ where: { enrollmentId_levelId: { enrollmentId: e.id, levelId: l2.id } }, data: { state: 'in_progress' } });
    const { advanceIfComplete } = await import('@/lib/domain/journey');
    const p1 = await prisma.progress.findFirstOrThrow({ where: { enrollmentId: e.id, level: { code: L1 } } });
    expect((await advanceIfComplete(me.tenantId, p1.id))?.next).toBeNull();
    expect((await prisma.progress.findUniqueOrThrow({ where: { enrollmentId_levelId: { enrollmentId: e.id, levelId: l2.id } } })).state).toBe('in_progress');
  });

  it('the track is fixed once Module 1 is finished, even without review approval', async () => {
    const t = await myTrack(me);
    expect(t?.changeable).toBe(false);
  });
});
