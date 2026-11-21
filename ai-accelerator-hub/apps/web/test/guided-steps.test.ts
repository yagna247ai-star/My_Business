/**
 * Integration (Postgres): guided steps. In order, checked, points once, skip and come back, the day completes.
 */
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import type { Ctx } from '@/lib/server/context';
import { AppError } from '@/lib/server/errors';
import { _resetRateLimits } from '@/lib/server/http';
import { register } from '@/lib/domain/account';
import { completeStep, guidedDay } from '@/lib/domain/journey';
import { totalXp } from '@/lib/domain/xp';

const status = async (p: Promise<unknown>) => { try { await p; return 200; } catch (e) { return (e as AppError).status; } };
const RUN = Date.now().toString(36);
const EMAIL = `guided.${RUN}@example.test`;

describe('Guided steps (integration)', () => {
  let me: Ctx; let L1 = ''; let L2 = '';
  beforeAll(async () => {
    const y = new Date().getFullYear();
    await register({ name: 'Guided Learner', email: EMAIL, password: 'Guidedxx@1234', birthYear: y - 22, journeySlug: 'da-bfsi-easy', acceptTerms: true } as never);
    const u = await prisma.user.findUniqueOrThrow({ where: { email: EMAIL } });
    const m = await prisma.membership.findFirstOrThrow({ where: { userId: u.id }, include: { role: true, tenant: true } });
    me = { userId: u.id, email: EMAIL, name: 'Guided Learner', tenantId: m.tenantId, tenantSlug: m.tenant.slug, tenantName: m.tenant.name, role: m.role.code as Ctx['role'], cohortId: m.cohortId, superAdmin: false };
    const e = await prisma.enrollment.findFirstOrThrow({ where: { userId: u.id, state: 'active' }, include: { journey: { include: { levels: { orderBy: { idx: 'asc' } } } } } });
    [L1, L2] = [e.journey.levels[0].code, e.journey.levels[1].code];
  });
  beforeEach(() => _resetRateLimits());

  it('steps go in order, answers are checked for quality, and points are awarded once', async () => {
    const g = await guidedDay(me, L1, 1);
    expect(g!.steps.length).toBeGreaterThanOrEqual(3);
    expect(await status(completeStep(me, L1, 1, 1, { answer: 'Branch manager calls bounced borrowers first.' }))).toBe(403); // step 1 before step 0
    expect(await status(completeStep(me, L1, 1, 0, { answer: 'asdf asdf asdf' }))).toBe(400);
    const before = await totalXp(me.tenantId, me.userId);
    const r = await completeStep(me, L1, 1, 0, { answer: 'EMI, borrower, branch, due date and bounce: each EMI row records amount, due date and whether it bounced.' });
    expect(r.xp).toBe(3);
    expect(await status(completeStep(me, L1, 1, 0, { answer: 'again' }))).toBe(409);
    expect(await totalXp(me.tenantId, me.userId)).toBe(before + 3);
  });

  it('a skipped step earns nothing now, can be done later for its points, and the day completes when every step is resolved', async () => {
    const g = (await guidedDay(me, L1, 1))!;
    const skip = await completeStep(me, L1, 1, 1, { skip: true });
    expect(skip.xp).toBe(0);
    for (let i = 2; i < g.steps.length; i++) await completeStep(me, L1, 1, i, { answer: 'If this works, more borrowers pay on time because the branch calls them before the due date instead of after a bounce.' });
    let day = await prisma.dayProgress.findFirstOrThrow({ where: { userId: me.userId, day: 1 } });
    expect(day.state).toBe('done');
    const later = await completeStep(me, L1, 1, 1, { answer: 'Branch manager decides whom to call first; loan officers make the calls; collections head escalates repeat bounces.' });
    expect(later.xp).toBe(3);
    day = await prisma.dayProgress.findFirstOrThrow({ where: { userId: me.userId, day: 1 } });
    expect(day.xpEarned).toBe(g.steps.reduce((n, s) => n + ({ tick: 2, answer: 3, paste: 5, screenshot: 5 })[s.check.kind], 0) - (g.steps.some(s => s.check.kind === 'tick') ? 0 : 0));
  });

  it('a pasted CSV header must match the dataset exactly', async () => {
    const e = await prisma.enrollment.findFirstOrThrow({ where: { userId: me.userId, state: 'active' } });
    const lv2 = await prisma.level.findFirstOrThrow({ where: { code: L2, journeyId: e.journeyId } });
    await prisma.progress.upsert({ where: { enrollmentId_levelId: { enrollmentId: e.id, levelId: lv2.id } }, update: { state: 'available' }, create: { tenantId: e.tenantId, enrollmentId: e.id, levelId: lv2.id, userId: me.userId, state: 'available', unlockedAt: new Date() } });
    expect(await status(completeStep(me, L2, 7, 0, { paste: 'emi_id,loan_account_id' }))).toBe(400);
    const ok = await completeStep(me, L2, 7, 0, { paste: 'emi_id,loan_account_id,product,due_date,emi_amount,status,days_late,auto_debit' });
    expect(ok.xp).toBe(5);
  });
});
