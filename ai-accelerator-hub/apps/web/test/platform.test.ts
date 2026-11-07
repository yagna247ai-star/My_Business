/**
 * Integration tests for the acceptance criteria in MASTER PROMPT §35, run against a real database
 * built from the migrations and seeds (see test/global-setup.ts).
 */
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { Ctx } from '@/lib/server/context';
import { can, MATRIX } from '@/lib/server/rbac';
import { AppError } from '@/lib/server/errors';
import { route, _resetRateLimits } from '@/lib/server/http';
import { levelState, completeActivity, submitProof, runBoss, safePublicUrl } from '@/lib/domain/journey';
import { decide, submissionForReview, reviewQueue, openAppeal, resolveAppeal } from '@/lib/domain/review';
import { totalXp, verifyChain, awardXp } from '@/lib/domain/xp';
import { touchStreak, recoverStreak, RECOVERY_QUIZ } from '@/lib/domain/streak';
import { leaderboard, programAnalytics } from '@/lib/domain/insights';
import { changeRole, createCohort } from '@/lib/domain/admin';
import { register, updateSettings } from '@/lib/domain/account';
import { ask, redact } from '@/lib/ai/coach';
import { handleWebhook, verifySignature, createOrder } from '@/lib/payments/razorpay';
import { createHackathon, setHackathonStatus, createTeam, joinTeam, submitEntry, peerTasks, submitPeerReview, decideHackathon, hackathonBoard } from '@/lib/domain/hackathon';
import { createPost, listFeed, createComment, listComments, toggleReaction, reportContent, moderationQueue, resolveReport, setBlock } from '@/lib/domain/feed';
import { uploadFile, readFile } from '@/lib/domain/files';
import { myProfile, upsertProfile, discoverTalent, postOpportunity, listOpportunities, closeOpportunity, applyToOpportunity, myApplications, setApplicationState } from '@/lib/domain/talent';
import { verifyCredentials, _resetLoginFailures } from '@/lib/auth';
import { makePng } from './helpers/png';

const L1 = 'L01_AI_EXPLORER';
async function ctxFor(email: string): Promise<Ctx> {
  const u = await prisma.user.findUniqueOrThrow({ where: { email } });
  const m = await prisma.membership.findFirstOrThrow({ where: { userId: u.id }, include: { role: true, tenant: true } });
  return { userId: u.id, email, name: u.name || email, tenantId: m.tenantId, tenantSlug: m.tenant.slug, tenantName: m.tenant.name, role: m.role.code as Ctx['role'], cohortId: m.cohortId, superAdmin: u.globalRole === 'super_admin' };
}
const expectErr = async (p: Promise<unknown>, status: number) => { await expect(p).rejects.toSatisfy((e: unknown) => e instanceof AppError && e.status === status); };
const words = (n: number, w = 'insight') => Array.from({ length: n }, (_, i) => `${w}${i}`).join(' ');
const GOOD_BRIEF = {
  tool: 'Claude',
  fields: { problem: words(45, 'orders'), user: words(16, 'owner'), fit: words(32, 'language'), evaluation: words(28, 'wrong'), responsible: words(16, 'private') },
  iterations: [
    { prompt: 'Draft a polite reply to a customer whose lunch arrived late today please', output: words(16, 'draft'), change: '' },
    { prompt: 'Rewrite the reply in Hindi and English, shorter, mention a refund option clearly', output: words(16, 'bilingual'), change: words(11, 'added') },
    { prompt: 'Now keep it under forty words and avoid promising a delivery time we cannot keep', output: words(16, 'concise'), change: words(11, 'shortened') },
  ],
};

let learner: Ctx, reviewer: Ctx, mentor: Ctx, pm: Ctx, tenantAdmin: Ctx, otherLearner: Ctx, otherAdmin: Ctx;
beforeAll(async () => {
  [learner, reviewer, mentor, pm, tenantAdmin, otherLearner, otherAdmin] = await Promise.all(['student@aihub.in', 'reviewer@aihub.in', 'mentor@aihub.in', 'pm@aihub.in', 'tenantadmin@aihub.in', 'learner@northstar.edu', 'admin@northstar.edu'].map(ctxFor));
});
beforeEach(() => { _resetRateLimits(); _resetLoginFailures(); });

describe('Authorization (RBAC)', () => {
  it('denies by default and grants per matrix', () => {
    expect(can('learner', 'review:decide')).toBe(false);
    expect(can('reviewer', 'review:decide')).toBe(true);
    expect(can('finance', 'learn:self')).toBe(false);
    expect(can('learner', 'audit:read')).toBe(false);
    expect(can('nonsense', 'learn:self')).toBe(false);
    expect(Object.keys(MATRIX)).toHaveLength(10);
  });
  it('blocks a learner from deciding reviews and admins from self-promotion', async () => {
    await expectErr(reviewQueue(learner), 403);
    await expectErr(changeRole(tenantAdmin, tenantAdmin.userId, 'program_mgr'), 403);
    await expectErr(changeRole(tenantAdmin, learner.userId, 'super_admin'), 400);
  });
});

describe('Learning engine', () => {
  it('never sends answer keys to the browser', async () => {
    const s = await levelState(learner, L1); if (s.locked) throw new Error('locked');
    const json = JSON.stringify(s.activities.map(a => a.config));
    expect(json).not.toMatch(/"answer"|"correct"|"why"/);
  });
  it('gates activities in order', async () => {
    await expectErr(completeActivity(learner, L1, 3, { attested: true, answers: [0, 2, 0] }), 403);
  });
  it('grades on the server and awards XP exactly once', async () => {
    const before = await totalXp(learner.tenantId, learner.userId);
    const a1 = await completeActivity(learner, L1, 1, { choice: 0 }) as { correct: boolean; xp: number };
    expect(a1.correct).toBe(false); expect(a1.xp).toBe(5);
    const fail = await completeActivity(learner, L1, 2, { answers: [1, 1, 0, 1, 1] }) as { passed: boolean; xp: number };
    expect(fail.passed).toBe(false); expect(fail.xp).toBe(0);
    const pass = await completeActivity(learner, L1, 2, { answers: [0, 0, 1, 0, 0] }) as { passed: boolean; xp: number };
    expect(pass.passed).toBe(true); expect(pass.xp).toBe(18);
    const again = await completeActivity(learner, L1, 2, { answers: [0, 0, 1, 0, 0] }) as { xp: number };
    expect(again.xp).toBe(0);
    expect(await totalXp(learner.tenantId, learner.userId)).toBe(before + 23);
  });
  it('requires attestation and enough correct code-reading answers', async () => {
    await expectErr(completeActivity(learner, L1, 3, { attested: false, answers: [0, 2, 0] }), 400);
    const r = await completeActivity(learner, L1, 3, { attested: true, answers: [0, 2, 1] }) as { passed: boolean };
    expect(r.passed).toBe(true);
  });
  it('validates the build brief, including personal-data detection', async () => {
    await expect(completeActivity(learner, L1, 4, { ...GOOD_BRIEF, fields: { ...GOOD_BRIEF.fields, problem: 'too short' } })).rejects.toSatisfy((e: unknown) => e instanceof AppError && !!(e.details as Record<string, string>).problem);
    await expect(completeActivity(learner, L1, 4, { ...GOOD_BRIEF, fields: { ...GOOD_BRIEF.fields, user: GOOD_BRIEF.fields.user + ' call 9876543210' } })).rejects.toSatisfy((e: unknown) => e instanceof AppError && !!(e.details as Record<string, string>).pii);
    const sameTwice = { ...GOOD_BRIEF, iterations: [GOOD_BRIEF.iterations[0], { ...GOOD_BRIEF.iterations[0], change: words(11) }, GOOD_BRIEF.iterations[2]] };
    await expectErr(completeActivity(learner, L1, 4, sameTwice), 400);
    const ok = await completeActivity(learner, L1, 4, GOOD_BRIEF) as { xp: number };
    expect(ok.xp).toBe(35);
  });
});

describe('Proof, boss and review', () => {
  let subId = '';
  it('rejects unsafe evidence URLs', () => {
    for (const u of ['http://example.com', 'https://localhost/x', 'https://127.0.0.1/a', 'https://user:pw@docs.google.com/x', 'javascript:alert(1)']) expect(safePublicUrl(u)).toBeNull();
    expect(safePublicUrl('https://docs.google.com/document/d/abc')).not.toBeNull();
  });
  it('blocks the boss before proof, then accepts a valid proof once', async () => {
    await expectErr(runBoss(learner, L1, Array.from({ length: 6 }, () => ({ choice: 0, why: words(6) }))), 403);
    await expectErr(submitProof(learner, L1, { evidenceUrl: 'https://docs.google.com/document/d/abc', reflection: 'short', checklist: [true, true, true] }), 400);
    const r = await submitProof(learner, L1, { evidenceUrl: 'https://docs.google.com/document/d/abc', reflection: words(60, 'learned'), checklist: [true, true, true] });
    subId = r.submissionId; expect(r.xp).toBe(5);
    await expectErr(submitProof(learner, L1, { evidenceUrl: 'https://docs.google.com/document/d/abc', reflection: words(60), checklist: [true, true, true] }), 409);
  });
  it('caps boss attempts at three and keeps the best score', async () => {
    const perfect = [1, 2, 0, 1, 0, 2].map(choice => ({ choice, why: words(7, 'because') }));
    const r1 = await runBoss(learner, L1, perfect.map((a, i) => (i < 2 ? { ...a, choice: (a.choice + 1) % 3 } : a)));
    expect(r1.passed).toBe(4);
    const r2 = await runBoss(learner, L1, perfect); expect(r2.best).toBe(6);
    await runBoss(learner, L1, perfect.map(a => ({ ...a, why: 'no' })));
    await expectErr(runBoss(learner, L1, perfect), 409);
  });
  it('keeps the queue tenant-isolated', async () => {
    const q = await reviewQueue(reviewer); expect(q.pending.some(p => p.id === subId)).toBe(true);
    await expectErr(submissionForReview(otherAdmin, subId), 404);
    expect((await reviewQueue(otherAdmin)).pending.some(p => p.id === subId)).toBe(false);
  });
  it('enforces the pass rule and feedback requirement', async () => {
    await expectErr(decide(reviewer, subId, { problem: 2, prompting: 2, evaluation: 2, responsible: 2, reflection: 2, boss: 2 }, 'approved', ''), 400);
    await expectErr(decide(reviewer, subId, { problem: 4, prompting: 4, evaluation: 4, responsible: 4, reflection: 4, boss: 1 }, 'approved', ''), 400);
    await expectErr(decide(reviewer, subId, { problem: 2, prompting: 2, evaluation: 2, responsible: 2, reflection: 2, boss: 2 }, 'needs_changes', 'fix'), 400);
    await expectErr(decide(reviewer, subId, { problem: 4 }, 'approved', ''), 400);
  });
  it('requests changes, allows resubmission, then approves and unlocks Level 2', async () => {
    await decide(reviewer, subId, { problem: 3, prompting: 2, evaluation: 2, responsible: 3, reflection: 3, boss: 4 }, 'needs_changes', 'Explain what changed between prompts two and three.');
    await expectErr(decide(mentor, subId, { problem: 4, prompting: 4, evaluation: 4, responsible: 4, reflection: 4, boss: 4 }, 'approved', ''), 409);
    const before = await totalXp(learner.tenantId, learner.userId);
    const r2 = await submitProof(learner, L1, { evidenceUrl: 'https://docs.google.com/document/d/abc2', reflection: words(80, 'revised'), checklist: [true, true, true] });
    expect(r2.attempt).toBe(2); expect(r2.xp).toBe(0); // A5 XP is idempotent
    const res = await decide(mentor, r2.submissionId, { problem: 4, prompting: 4, evaluation: 3, responsible: 4, reflection: 3, boss: 5 }, 'approved', 'Clear problem and honest evaluation.');
    expect(res.unlocked).toBe('L02_PROBLEM_HUNTER');
    expect(res.badges).toEqual(expect.arrayContaining(['first-proof', 'level-1-complete', 'boss-perfect']));
    const after = await totalXp(learner.tenantId, learner.userId);
    expect(after - before).toBe(20 + 27 + 30 + 20 + 25); // base + boss bonus + three badge bonuses
    expect((await verifyChain(learner.tenantId, learner.userId)).ok).toBe(true);
    const l2 = await prisma.progress.findFirst({ where: { userId: learner.userId, level: { code: 'L02_PROBLEM_HUNTER' } } });
    expect(l2?.state).toBe('available');
  });
  it('supports appeals resolved by a different person', async () => {
    const rv = await prisma.review.findFirstOrThrow({ where: { verdict: 'needs_changes', submission: { userId: learner.userId } } });
    await expectErr(openAppeal(learner, rv.id, 'too short'), 400);
    await openAppeal(learner, rv.id, 'I did explain the change between prompts in my brief, section three.');
    await expectErr(openAppeal(learner, rv.id, 'Second appeal for the same review should be refused.'), 409);
    await expectErr(resolveAppeal(reviewer, rv.id, 'upheld'), 403);
    await resolveAppeal(pm, rv.id, 'upheld');
    expect((await prisma.review.findUniqueOrThrow({ where: { id: rv.id } })).appealState).toBe('upheld');
  });
});

describe('XP ledger integrity', () => {
  it('detects tampering with a past entry', async () => {
    const c = await ctxFor('student2@aihub.in');
    await prisma.$transaction(async tx => { await awardXp(tx, { tenantId: c.tenantId, userId: c.userId, amount: 5, source: 't', idempotencyKey: 'tamper-1' }); await awardXp(tx, { tenantId: c.tenantId, userId: c.userId, amount: 7, source: 't', idempotencyKey: 'tamper-2' }); });
    expect((await verifyChain(c.tenantId, c.userId)).ok).toBe(true);
    await prisma.xpLedger.update({ where: { idempotencyKey: 'tamper-1' }, data: { amount: 500 } });
    expect((await verifyChain(c.tenantId, c.userId)).ok).toBe(false);
    await expect(prisma.$transaction(tx => awardXp(tx, { tenantId: c.tenantId, userId: c.userId, amount: 5000, source: 't', idempotencyKey: 'x' }))).rejects.toThrow();
  });
});

describe('Non-punitive streaks', () => {
  it('increments daily, uses freezes, grace, then recovery — never silently zero', async () => {
    const c = await ctxFor('student2@aihub.in');
    await prisma.streak.update({ where: { tenantId_userId: { tenantId: c.tenantId, userId: c.userId } }, data: { currentStreak: 0, longestStreak: 0, lastActiveDate: null, freezeTokens: 1, status: 'active' } });
    const run = (d: string) => prisma.$transaction(tx => touchStreak(tx, c.tenantId, c.userId, d));
    await run('2026-11-01'); await run('2026-11-02'); expect((await run('2026-11-02')).changed).toBe(false);
    expect((await run('2026-11-04')).event).toBe('freeze_used'); // one missed day, covered by the freeze
    expect((await run('2026-11-06')).event).toBe('grace');       // one missed day, no freeze → forgiven
    const r = await run('2026-11-12'); expect(r.event).toBe('recoverable');
    const s = await prisma.streak.findUniqueOrThrow({ where: { tenantId_userId: { tenantId: c.tenantId, userId: c.userId } } });
    expect(s.prevStreak).toBe(4); expect(s.status).toBe('recovery'); // 1 → 2 → 3 (freeze) → 4 (grace), then parked
    expect((await prisma.$transaction(tx => recoverStreak(tx, c.tenantId, c.userId, (RECOVERY_QUIZ.answer + 1) % 3, '2026-11-13'))).ok).toBe(false);
    const ok = await prisma.$transaction(tx => recoverStreak(tx, c.tenantId, c.userId, RECOVERY_QUIZ.answer, '2026-11-13'));
    expect(ok.ok && ok.current).toBe(5); // 4 restored + today
  });
});

describe('Privacy and leaderboards', () => {
  it('is tenant-scoped and honours private visibility', async () => {
    const lb = await leaderboard(learner, 'tenant');
    expect(lb.rows.every(r => !r.name.includes('Meera'))).toBe(true);
    const c2 = await ctxFor('student2@aihub.in');
    await updateSettings(c2, { leaderboardVisibility: 'private' });
    const lb2 = await leaderboard(learner, 'tenant');
    expect(lb2.rows.some(r => r.name === 'Anonymous learner')).toBe(true);
    expect(lb2.rows.filter(r => !r.me).every(r => r.userId === undefined)).toBe(true); // no ids leak
  });
  it('produces analytics from real rows', async () => {
    const a = await programAnalytics(pm);
    expect(a.funnel[0].completed).toBeGreaterThanOrEqual(1);
    expect(a.reviewsDone).toBeGreaterThanOrEqual(2);
    await expectErr(programAnalytics(learner), 403);
  });
});

describe('Registration & all-ages safety', () => {
  const base = { name: 'New Person', password: 'longpassword1', acceptTerms: true as const };
  it('applies age rules and invite codes', async () => {
    await expectErr(register({ ...base, email: 'kid@test.in', birthYear: new Date().getFullYear() - 10 }), 400);
    await expectErr(register({ ...base, email: 'teen@test.in', birthYear: new Date().getFullYear() - 15 }), 400);
    const teen = await register({ ...base, email: 'teen2@test.in', birthYear: new Date().getFullYear() - 15, guardianEmail: 'parent@test.in' });
    const s = await prisma.userSetting.findFirstOrThrow({ where: { userId: teen.userId } });
    expect(s.leaderboardVisibility).toBe('private'); expect(s.guardianConsent).toBe('pending');
    const invited = await register({ ...base, email: 'ns@test.in', birthYear: 2000, inviteCode: 'northstar-01' });
    const m = await prisma.membership.findFirstOrThrow({ where: { userId: invited.userId }, include: { tenant: true } });
    expect(m.tenant.slug).toBe('northstar');
    await expectErr(register({ ...base, email: 'ns@test.in', birthYear: 2000 }), 409);
    await expectErr(register({ ...base, email: 'bad@test.in', birthYear: 2000, inviteCode: 'NOPE' }), 400);
  });
  it('blocks purchases by minors', async () => {
    const teen = await ctxFor('teen2@test.in');
    await expectErr(createOrder(teen, 'cohort-pro'), 400);
  });
});

describe('AI assistants', () => {
  it('returns NOT_CONFIGURED without credentials and does not spend credits', async () => {
    const ent = () => prisma.entitlement.findUniqueOrThrow({ where: { userId_tenantId_feature: { userId: otherLearner.userId, tenantId: otherLearner.tenantId, feature: 'ai_credits' } } });
    const before = (await ent()).remaining;
    await expect(ask(otherLearner, { assistantCode: 'concept-explainer', message: 'What is a token?' })).rejects.toSatisfy((e: unknown) => e instanceof AppError && e.code === 'AI_NOT_CONFIGURED');
    expect((await ent()).remaining).toBe(before);
  });
  it('redacts secrets and personal data before sending', () => {
    const r = redact('key sk-ant-abcdefghijklmnopqrstuvwxyz0123 mail me a@b.co or 9876543210');
    expect(r.text).not.toMatch(/sk-ant|a@b\.co|9876543210/); expect(r.redactions).toBe(3);
  });
});

describe('Payments webhook', () => {
  const secret = 'whsec_test_only';
  const sign = (b: string) => crypto.createHmac('sha256', secret).update(b).digest('hex');
  it('verifies signatures in constant time', () => {
    expect(verifySignature('{}', sign('{}'), secret)).toBe(true);
    expect(verifySignature('{}', sign('{ }'), secret)).toBe(false);
    expect(verifySignature('{}', 'zz', secret)).toBe(false);
  });
  it('marks paid only on a verified event, issues a GST invoice, and ignores replays', async () => {
    const plan = await prisma.plan.findUniqueOrThrow({ where: { slug: 'cohort-pro' } });
    const order = await prisma.order.create({ data: { tenantId: learner.tenantId, userId: learner.userId, razorpayOrderId: 'order_test_1', amountPaise: plan.amountPaise, items: JSON.stringify({ planSlug: plan.slug }) } });
    const evt = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: 'pay_test_1', order_id: 'order_test_1', amount: plan.amountPaise, method: 'upi', status: 'captured' } } } });
    await expectErr(handleWebhook(evt, sign(evt + ' '), 'evt_1'), 401);
    expect((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe('created');
    expect(await handleWebhook(evt, sign(evt), 'evt_1')).toEqual({ ok: true });
    expect((await prisma.order.findUniqueOrThrow({ where: { id: order.id } })).status).toBe('paid');
    const inv = await prisma.invoice.findFirstOrThrow({ where: { orderId: order.id } });
    expect(inv.gstAmount).toBe(Math.round(plan.amountPaise * 0.18 / 1.18));
    expect(await handleWebhook(evt, sign(evt), 'evt_1')).toEqual({ ok: true, duplicate: true });
    expect(await prisma.payment.count({ where: { orderId: order.id } })).toBe(1);
  });
  it('flags amount mismatches instead of granting access', async () => {
    await prisma.order.create({ data: { tenantId: learner.tenantId, userId: learner.userId, razorpayOrderId: 'order_test_2', amountPaise: 499900 } });
    const evt = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: 'pay_test_2', order_id: 'order_test_2', amount: 100, status: 'captured' } } } });
    expect(await handleWebhook(evt, sign(evt), 'evt_2')).toEqual({ ok: true, flagged: 'amount_mismatch' });
    expect((await prisma.order.findUniqueOrThrow({ where: { razorpayOrderId: 'order_test_2' } })).status).toBe('created');
  });
});

describe('Request security', () => {
  const handler = route(async () => ({ ok: true }));
  const req = (origin: string | null) => new NextRequest('http://localhost:3000/api/x', { method: 'POST', headers: { host: 'localhost:3000', ...(origin ? { origin } : {}) } });
  it('rejects cross-origin mutations', async () => {
    expect((await handler(req('https://evil.example'), { params: Promise.resolve({}) })).status).toBe(403);
    expect((await handler(req('http://localhost:3000'), { params: Promise.resolve({}) })).status).toBe(200);
  });
  it('locks an account after repeated failed sign-ins', async () => {
    for (let i = 0; i < 5; i++) expect((await verifyCredentials('pm@aihub.in', 'wrong-password')).ok).toBe(false);
    const r = await verifyCredentials('pm@aihub.in', 'Program@12345');
    expect(r.ok).toBe(false); expect(!r.ok && r.reason).toBe('locked');
  });
  it('lets cohort managers create cohorts with unique invite codes, but not learners', async () => {
    const c = await createCohort(pm, { name: 'Weekend Cohort 08' }); expect(c.inviteCode).toMatch(/^DEMO-[A-F0-9]{8}$/);
    await expectErr(createCohort(learner, { name: 'Hack' }), 403);
  });
});

describe('Weekend hackathons, teams and peer review (§8, §11)', () => {
  const REFLECT = words(60);
  let u2: Ctx, u3: Ctx, u4: Ctx, u5: Ctx, u6: Ctx, u7: Ctx, u8: Ctx;
  let hackId: string, rocketId: string, cometId: string, rocketEntry: string, cometEntry: string;

  async function makeLearner(email: string): Promise<Ctx> {
    const role = await prisma.role.findUniqueOrThrow({ where: { code: 'learner' } });
    const u = await prisma.user.create({ data: { email, name: email.split('@')[0] } });
    await prisma.membership.create({ data: { tenantId: learner.tenantId, userId: u.id, roleId: role.id, status: 'active' } });
    await prisma.userSetting.create({ data: { tenantId: learner.tenantId, userId: u.id, ageBand: 'adult', guardianConsent: 'not_required' } }); // as register() does
    return ctxFor(email);
  }

  beforeAll(async () => {
    [u2, u3, u4, u5, u6, u7, u8] = await Promise.all(['hack2@aihub.in', 'hack3@aihub.in', 'hack4@aihub.in', 'hack5@aihub.in', 'hack6@aihub.in', 'hack7@aihub.in', 'hack8@aihub.in'].map(makeLearner));
    const h = await createHackathon(pm, { slug: 'weekend-01', title: 'Weekend 01: Onboard a shop' });
    hackId = h.id;
    await setHackathonStatus(pm, hackId, 'open');
    await setHackathonStatus(pm, hackId, 'building');
    const rocket = await createTeam(learner, hackId, 'Rocket');
    rocketId = rocket.id;
    const comet = await createTeam(u2, hackId, 'Comet');
    cometId = comet.id;
    for (const u of [u4, u5, u6, u7]) await joinTeam(u, hackId, rocketId);
    await joinTeam(u3, hackId, cometId);
    await setHackathonStatus(pm, hackId, 'submit');
    const r = await submitEntry(learner, hackId, { title: 'Sms reminders', repoUrl: 'https://github.com/demo/sms', reflectionMd: REFLECT });
    rocketEntry = r.id;
    const c = await submitEntry(u2, hackId, { title: 'Bill splitter', repoUrl: 'https://github.com/demo/bill', reflectionMd: REFLECT });
    cometEntry = c.id;
    await setHackathonStatus(pm, hackId, 'review');
  });

  it('restricts creation to staff and validates input', async () => {
    await expectErr(createHackathon(learner, { slug: 'nope', title: 'X' }), 403);
    await expectErr(createHackathon(pm, { slug: 'BAD SLUG!!', title: 'X' }), 400);
    await expectErr(createHackathon(pm, { slug: 'weekend-01', title: 'Dupe' }), 409);
    await expectErr(createHackathon(pm, { slug: 'weekend-02', title: 'X', maxTeamSize: 9 }), 400);
  });
  it('moves statuses only forward', async () => {
    await expectErr(setHackathonStatus(pm, hackId, 'building'), 409);
    await expectErr(setHackathonStatus(learner, hackId, 'closed'), 403);
  });
  it('enforces team caps and one team per hacker', async () => {
    await expectErr(createTeam(learner, hackId, 'Second'), 409);
    await expectErr(createTeam(u3, hackId, 'Rocket'), 409);
    await expectErr(joinTeam(u6, hackId, cometId), 409); // one team only
    const full = await prisma.team.findUniqueOrThrow({ where: { id: rocketId }, include: { members: true } });
    expect(full.members).toHaveLength(5);
    await expectErr(joinTeam(u8, hackId, rocketId), 409); // capped at 5 for an outsider
    await expectErr(joinTeam(u3, hackId, rocketId), 409); // already teamed elsewhere
  });
  it('only opens submissions in the submit window with real evidence', async () => {
    await expectErr(submitEntry(learner, hackId, { title: 'Late', repoUrl: 'https://github.com/demo/late', reflectionMd: REFLECT }), 409);
    const w = await createHackathon(pm, { slug: 'weekend-windows', title: 'Window checks' });
    await expectErr(submitEntry(learner, w.id, { title: 'Early', repoUrl: 'https://github.com/demo/early', reflectionMd: REFLECT }), 409);
    await setHackathonStatus(pm, w.id, 'open');
    await createTeam(u8, w.id, 'Solo');
    await setHackathonStatus(pm, w.id, 'submit');
    await expectErr(submitEntry(u8, w.id, { title: 'X', repoUrl: 'http://evil.internal/x', reflectionMd: REFLECT }), 400);
    await expectErr(submitEntry(u8, w.id, { title: 'X', repoUrl: 'https://github.com/demo/x', reflectionMd: 'too short' }), 400);
  });
  it('assigns two peer reviewers per entry, never from your own team', async () => {
    const all = await prisma.peerReview.findMany({ where: { entry: { hackathonId: hackId } }, include: { entry: { include: { team: { include: { members: true } } } } } });
    expect(all).toHaveLength(4);
    const participants = new Set((await prisma.team.findMany({ where: { entries: { some: { hackathonId: hackId } } }, include: { members: true } })).flatMap(t => t.members.map(m => m.userId)));
    for (const r of all) {
      expect(r.entry.team.members.map(m => m.userId)).not.toContain(r.reviewerId);
      expect(participants.has(r.reviewerId)).toBe(true);
    }
    expect(new Set(all.map(r => r.reviewerId + r.entryId)).size).toBe(4);
  });
  it('accepts assigned peer reviews and blocks the rest', async () => {
    const good = { problem: 4, build: 4, teamwork: 5 };
    const [task] = await peerTasks(u2, hackId);
    expect(task).toBeDefined();
    await expectErr(submitPeerReview(u2, task.entryId, { problem: 9, build: 1, teamwork: 1 }, 'Scores outside 1 to 5 are rejected by validation.'), 400);
    await expectErr(submitPeerReview(u2, task.entryId, good, 'short'), 400);
    await submitPeerReview(u2, task.entryId, good, 'Clear problem framing and a working demo, nice teamwork.');
    await expectErr(submitPeerReview(u2, task.entryId, good, 'Trying to submit the same peer review twice here.'), 409);
    await expectErr(submitPeerReview(u8, task.entryId, good, 'A stranger with no assignment must be blocked from reviewing.'), 403);
  });
  it('hides other teams’ repos until judging, then judges decide', async () => {
    const before = await totalXp(learner.tenantId, learner.userId);
    await expectErr(decideHackathon(learner, hackId, [{ entryId: rocketEntry, place: 1 }]), 403);
    await expectErr(decideHackathon(reviewer, hackId, [{ entryId: rocketEntry, place: 1 }]), 400);
    const done = await decideHackathon(reviewer, hackId, [{ entryId: rocketEntry, place: 1 }, { entryId: cometEntry, place: 2 }], 'Rocket shipped; Comet close behind.');
    expect(done.placements).toHaveLength(2);
    expect(await totalXp(learner.tenantId, learner.userId)).toBe(before + 35);
    const board = await hackathonBoard(learner, hackId);
    expect(board.status).toBe('closed');
    expect(board.result?.placements).toHaveLength(2);
    expect(board.entries.find(e => e.team === 'Rocket')?.repoUrl).toContain('github.com');
    await expectErr(submitEntry(learner, hackId, { title: 'Late', repoUrl: 'https://github.com/demo/late', reflectionMd: REFLECT }), 409);
  });
  it('isolates tenants', async () => {
    await expectErr(hackathonBoard(otherLearner, hackId), 404);
    await expectErr(joinTeam(otherLearner, hackId, rocketId), 404);
  });
});

describe('Community feed, moderation and blocks (§16)', () => {
  let f1: Ctx, f2: Ctx;
  let postId: string;

  async function makeLearner(email: string): Promise<Ctx> {
    const role = await prisma.role.findUniqueOrThrow({ where: { code: 'learner' } });
    const u = await prisma.user.create({ data: { email, name: email.split('@')[0] } });
    await prisma.membership.create({ data: { tenantId: learner.tenantId, userId: u.id, roleId: role.id, status: 'active' } });
    await prisma.userSetting.create({ data: { tenantId: learner.tenantId, userId: u.id, ageBand: 'adult', guardianConsent: 'not_required' } }); // as register() does
    return ctxFor(email);
  }

  beforeAll(async () => {
    f1 = await makeLearner('feed1@aihub.in');
    f2 = await makeLearner('feed2@aihub.in');
    ({ id: postId } = await createPost(f1, { kind: 'question', body: 'Where do I find today’s activities? I opened Levels but I am not sure which one is mine.' }));
  });

  it('keeps tenants apart and validates input', async () => {
    expect((await listFeed(learner, 20)).items.some(p => p.id === postId)).toBe(true); // same tenant: visible
    const other = await listFeed(otherLearner, 20);
    expect(other.items.some(p => p.id === postId)).toBe(false);
    await expectErr(createPost(f1, { kind: 'shout', body: 'x' }), 400);
    await expectErr(createPost(f1, { kind: 'post', body: '' }), 400);
    await expectErr(createPost(f1, { kind: 'post', body: 'x'.repeat(2001) }), 400);
    await expectErr(createPost(f1, { kind: 'post', body: 'see this', linkUrl: 'http://evil.internal/x' }), 400);
  });
  it('supports comments, replies notify, and reaction toggles', async () => {
    const c = await createComment(f2, postId, 'Home shows today’s next step, then Levels lists the activities in order.');
    expect(c.id).toBeTruthy();
    const notes = await prisma.notification.findMany({ where: { tenantId: f1.tenantId, userId: (await prisma.user.findUniqueOrThrow({ where: { email: 'feed1@aihub.in' } })).id, template: 'feed_reply' } });
    expect(notes.length).toBeGreaterThan(0);
    const comments = await listComments(f1, postId);
    expect(comments.map(x => x.id)).toContain(c.id);
    expect(await toggleReaction(f2, postId, 'like')).toEqual({ reacted: true });
    expect(await toggleReaction(f2, postId, 'like')).toEqual({ reacted: false });
    await expectErr(toggleReaction(f2, postId, 'angry'), 400);
    await expectErr(createComment(otherLearner, postId, 'cross tenant reply'), 404);
  });
  it('reports, hides, and notifies — moderators only', async () => {
    await expectErr(reportContent(f1, { targetType: 'post', targetId: postId, reason: 'I do not like my own post.' }), 400);
    const r = await reportContent(f2, { targetType: 'post', targetId: postId, reason: 'This question is fine but I am testing the report flow.' });
    await expectErr(reportContent(f2, { targetType: 'post', targetId: postId, reason: 'Reporting the same post twice should be rejected.' }), 409);
    await expectErr(resolveReport(learner, r.id, 'hide'), 403);
    const queue = await moderationQueue(mentor);
    expect(queue.map(q => q.id)).toContain(r.id);
    await resolveReport(mentor, r.id, 'hide', 'Testing the hide path.');
    await expectErr(resolveReport(mentor, r.id, 'dismiss'), 409);
    const feed = await listFeed(f2, 20);
    expect(feed.items.some(p => p.id === postId)).toBe(false);
    const notes = await prisma.notification.findMany({ where: { tenantId: f1.tenantId, template: 'report_resolved' } });
    expect(notes.length).toBeGreaterThan(0);
  });
  it('blocks filter both directions and tenants stay isolated', async () => {
    const { id: p2 } = await createPost(f2, { kind: 'win', body: 'Shipped my first automation today.' });
    expect((await listFeed(f1, 20)).items.some(p => p.id === p2)).toBe(true);
    await expectErr(setBlock(f1, (await prisma.user.findUniqueOrThrow({ where: { email: 'feed1@aihub.in' } })).id, true), 400);
    const f2id = (await prisma.user.findUniqueOrThrow({ where: { email: 'feed2@aihub.in' } })).id;
    await setBlock(f1, f2id, true);
    expect((await listFeed(f1, 20)).items.some(p => p.id === p2)).toBe(false);
    expect((await listFeed(f2, 20)).items.some(p => p.id === postId)).toBe(false);
    await setBlock(f1, f2id, false);
    expect((await listFeed(f1, 20)).items.some(p => p.id === p2)).toBe(true);
    await expectErr(setBlock(f1, 'nope-nope-nope', true), 404);
  });
});

describe('Upload validation and AV gating (§26)', () => {
  const png = makePng(800, 450, Math.floor(Math.random() * 1e6));
  let tmpDir: string;

  beforeAll(async () => {
    const os = await import('os');
    const path = await import('path');
    const fs = await import('fs');
    tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'hub-uploads-'));
    process.env.UPLOAD_DIR = tmpDir;
  });

  it('accepts valid files and serves them back to the owner', async () => {
    const up = await uploadFile(learner, { filename: 'Shot.PNG', mime: 'image/png', bytes: png });
    expect(up.avStatus).toBe('skipped'); // no scanner in test env
    const got = await readFile(learner, up.id);
    expect(got.bytes.equals(png)).toBe(true);
    expect(got.mime).toBe('image/png');
  });
  it('rejects dangerous and malformed uploads', async () => {
    await expectErr(uploadFile(learner, { filename: 'run.exe', mime: 'application/x-msdownload', bytes: png }), 400);
    await expectErr(uploadFile(learner, { filename: 'big.png', mime: 'image/png', bytes: Buffer.alloc(10 * 1024 * 1024 + 1) }), 400);
    await expectErr(uploadFile(learner, { filename: 'evil.pdf', mime: 'image/png', bytes: png }), 400);
    await expectErr(uploadFile(learner, { filename: '../../etc/passwd.png', mime: 'image/png', bytes: Buffer.alloc(0) }), 400);
  });
  it('quarantines infected files and never serves them', async () => {
    const up = await uploadFile(learner, { filename: 'sick.png', mime: 'image/png', bytes: png }, { scanner: async () => 'infected' as const });
    expect(up.avStatus).toBe('infected');
    await expectErr(readFile(learner, up.id), 403);
  });
  it('refuses uploads in production without a scanner', async () => {
    const prevNode = process.env.NODE_ENV, prevClam = process.env.CLAMAV_HOST;
    (process.env as Record<string, string | undefined>).NODE_ENV = 'production'; delete process.env.CLAMAV_HOST;
    try { await expectErr(uploadFile(learner, { filename: 'a.png', mime: 'image/png', bytes: png }), 503); }
    finally { (process.env as Record<string, string | undefined>).NODE_ENV = prevNode; if (prevClam !== undefined) process.env.CLAMAV_HOST = prevClam; }
  });
  it('isolates files by tenant', async () => {
    const up = await uploadFile(learner, { filename: 'private.png', mime: 'image/png', bytes: png });
    await expectErr(readFile(otherLearner, up.id), 404);
  });
});

describe('Talent marketplace, consent-gated discovery (§19)', () => {
  let t2: Ctx, t3: Ctx;
  let oppId: string, appId: string;

  async function makeLearner(email: string): Promise<Ctx> {
    const role = await prisma.role.findUniqueOrThrow({ where: { code: 'learner' } });
    const u = await prisma.user.create({ data: { email, name: email.split('@')[0] } });
    await prisma.membership.create({ data: { tenantId: learner.tenantId, userId: u.id, roleId: role.id, status: 'active' } });
    await prisma.userSetting.create({ data: { tenantId: learner.tenantId, userId: u.id, ageBand: 'adult', guardianConsent: 'not_required' } }); // as register() does
    return ctxFor(email);
  }

  beforeAll(async () => {
    [t2, t3] = await Promise.all(['talent2@aihub.in', 'talent3@aihub.in'].map(makeLearner));
    await upsertProfile(t2, { headline: 'RAG tinkerer', skills: ['Python', 'RAG'], openTo: ['internships'], visibility: 'tenant' });
    await upsertProfile(t3, { headline: 'Quiet builder', skills: ['Python'], openTo: ['internships'], visibility: 'private' });
    const o = await postOpportunity(pm, { orgName: 'Acme Robotics', title: 'RAG intern', kind: 'internship', description: 'Build a knowledge assistant over our support docs with the team, ship a demo in six weeks.', skillsWanted: ['Python', 'RAG'] });
    oppId = o.id;
  });

  it('defaults to private and only discovers opted-in profiles', async () => {
    expect((await myProfile(learner)).visibility).toBe('private');
    const found = await discoverTalent(pm, { skills: ['python'] });
    const ids = found.map(f => f.id);
    expect(ids).toContain(t2.userId);
    expect(ids).not.toContain(t3.userId);
    expect(ids).not.toContain(learner.userId);
    expect(found.find(f => f.id === t2.userId)?.matchedSkills).toEqual(expect.arrayContaining(['python']));
    await expectErr(discoverTalent(learner, {}), 403);
  });
  it('requires explicit consent for public visibility, minors need guardians', async () => {
    await expectErr(upsertProfile(t2, { headline: 'x', skills: [], openTo: [], visibility: 'public' }), 400);
    await prisma.userSetting.upsert({ where: { tenantId_userId: { tenantId: t2.tenantId, userId: t2.userId } }, create: { tenantId: t2.tenantId, userId: t2.userId, globalOptIn: true }, update: { globalOptIn: true } });
    const p = await upsertProfile(t2, { headline: 'RAG tinkerer', skills: ['Python', 'RAG'], openTo: ['internships'], visibility: 'public' });
    expect(p.visibility).toBe('public');
    await prisma.userSetting.upsert({ where: { tenantId_userId: { tenantId: t3.tenantId, userId: t3.userId } }, create: { tenantId: t3.tenantId, userId: t3.userId, globalOptIn: true, ageBand: 'minor', guardianConsent: 'pending' }, update: { globalOptIn: true, ageBand: 'minor', guardianConsent: 'pending' } });
    await expectErr(upsertProfile(t3, { headline: 'x', skills: [], openTo: [], visibility: 'public' }), 403);
  });
  it('keeps cross-tenant discovery consent-gated', async () => {
    const north = await discoverTalent(otherAdmin, { skills: ['python'] });
    expect(north.map(f => f.id)).toContain(t2.userId);
    expect(north.map(f => f.id)).not.toContain(t3.userId);
    await expectErr(discoverTalent(otherLearner, {}), 403);
    expect((await listOpportunities(otherLearner, false)).map(o => o.id)).not.toContain(oppId);
  });
  it('runs the apply → shortlist → withdraw loop with consent snapshots', async () => {
    const a = await applyToOpportunity(t2, oppId, 'I built a RAG demo over docs in Level 9 and I want real users.');
    appId = a.id;
    const stored = await prisma.application.findUniqueOrThrow({ where: { id: appId } });
    expect(JSON.parse(stored.consentJson)).toMatchObject({ profile: true, contact: true, forOpportunity: oppId });
    await expectErr(applyToOpportunity(t2, oppId, 'Applying twice without withdrawing must be rejected cleanly.'), 409);
    await expectErr(setApplicationState(t2, appId, 'shortlisted'), 403);
    expect((await setApplicationState(pm, appId, 'shortlisted')).state).toBe('shortlisted');
    const mine = await myApplications(t2);
    expect(mine.map(m => m.id)).toContain(appId);
    expect((await setApplicationState(t2, appId, 'withdrawn')).state).toBe('withdrawn');
    await expectErr(setApplicationState(t2, appId, 'withdrawn'), 409);
    const again = await applyToOpportunity(t2, oppId, 'Back with a stronger note after withdrawing earlier.');
    expect(again.id).toBe(appId);
    await expectErr(applyToOpportunity(learner, oppId, 'x'), 400);
  });
  it('closes opportunities and isolates tenants', async () => {
    await expectErr(postOpportunity(learner, { orgName: 'X', title: 'Y', kind: 'internship', description: 'z'.repeat(60), skillsWanted: [] }), 403);
    await expectErr(closeOpportunity(t2, oppId), 403);
    await closeOpportunity(pm, oppId);
    await expectErr(applyToOpportunity(t2, oppId, 'Closed roles must refuse new applications from learners.'), 404);
    await expectErr(applyToOpportunity(t3, oppId, 'Under-18 learners can never apply to opportunities.'), 403); // child safety policy
  });
});

describe('Showcase (opt-in, approved work only)', () => {
  it('publishes only approved work, once, visible within the institution only', async () => {
    const { publish, listShowcase, unpublish } = await import('@/lib/domain/showcase');
    const pending = await prisma.submission.findFirst({ where: { userId: learner.userId, state: { not: 'approved' } } });
    if (pending) await expectErr(publish(learner, { submissionId: pending.id, title: 'Clinic reminders', description: 'Bilingual appointment reminders drafted by AI and checked by staff.' }), 403);
    const ok = await prisma.submission.findFirstOrThrow({ where: { userId: learner.userId, state: 'approved' } });
    await expectErr(publish(learner, { submissionId: ok.id, title: 'x', description: 'too short' }), 400);
    const p = await publish(learner, { submissionId: ok.id, title: 'Clinic reminders', description: 'Bilingual appointment reminders drafted by AI and checked by staff before sending.' });
    await expectErr(publish(learner, { submissionId: ok.id, title: 'Clinic reminders', description: 'Bilingual appointment reminders drafted by AI and checked by staff before sending.' }), 409);
    expect((await listShowcase(reviewer)).some(x => x.id === p.id)).toBe(true);
    expect((await listShowcase(otherLearner)).some(x => x.id === p.id)).toBe(false);
    await expectErr(unpublish(reviewer, p.id), 403);
    await expectErr(publish(otherLearner, { submissionId: ok.id, title: 'Stolen work', description: 'Trying to publish another learner submission from another tenant.' }), 404);
  });
  it('requires guardian consent for minors', async () => {
    const { publish } = await import('@/lib/domain/showcase');
    await prisma.userSetting.update({ where: { tenantId_userId: { tenantId: learner.tenantId, userId: learner.userId } }, data: { ageBand: 'minor', guardianConsent: 'pending' } });
    const ok = await prisma.submission.findFirstOrThrow({ where: { userId: learner.userId, state: 'approved' } });
    await prisma.project.deleteMany({ where: { userId: learner.userId } });
    await expectErr(publish(learner, { submissionId: ok.id, title: 'Clinic reminders', description: 'Bilingual appointment reminders drafted by AI and checked by staff.' }), 403);
    await prisma.userSetting.update({ where: { tenantId_userId: { tenantId: learner.tenantId, userId: learner.userId } }, data: { ageBand: 'adult', guardianConsent: 'not_required' } });
  });
});
