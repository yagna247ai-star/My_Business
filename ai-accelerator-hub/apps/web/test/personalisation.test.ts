/**
 * Personalised journey + Agent Lab (docs/PERSONALISED_JOURNEY_BUSINESS_SPEC.md §12 acceptance criteria).
 * Runs against the real migrated + seeded test database.
 */
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import type { Ctx } from '@/lib/server/context';
import { AppError } from '@/lib/server/errors';
import { _resetRateLimits } from '@/lib/server/http';
import { register, exportMyData } from '@/lib/domain/account';
import { buildPlan, derivePersona, onboardingSchema, resolveConfig, type Answers } from '@/lib/domain/personalise';
import { saveProfile, getProfile } from '@/lib/domain/profile';
import { levelState, completeActivity } from '@/lib/domain/journey';
import { startRun, saveStep, submitRun, verifyRun, labQueue, hasSecret, assemblePrompt, KEY_QUIZ, LAB_XP } from '@/lib/domain/agentLab';
import { uploadFile, readFile } from '@/lib/domain/files';
import { totalXp, verifyChain } from '@/lib/domain/xp';
import { makePng } from './helpers/png';

const L1 = 'L01_AI_EXPLORER';
const expectErr = async (p: Promise<unknown>, status: number) => { await expect(p).rejects.toSatisfy((e: unknown) => e instanceof AppError && e.status === status); };
async function ctxFor(email: string): Promise<Ctx> {
  const u = await prisma.user.findUniqueOrThrow({ where: { email } });
  const m = await prisma.membership.findFirstOrThrow({ where: { userId: u.id }, include: { role: true, tenant: true } });
  return { userId: u.id, email, name: u.name || email, tenantId: m.tenantId, tenantSlug: m.tenant.slug, tenantName: m.tenant.name, role: m.role.code as Ctx['role'], cohortId: m.cohortId, superAdmin: u.globalRole === 'super_admin' };
}
const year = new Date().getFullYear();
const base: Answers = { role: 'college_student', codingComfort: 'basic', goal: 'get_job', hoursPerWeek: 5, os: 'macos', learningStyle: 'do' };
const adult = { minor: false, guardianConsent: 'not_required' as const };
const minor = { minor: true, guardianConsent: 'pending' as const };
const w = (n: number, x = 'word') => Array.from({ length: n }, (_, i) => `${x}${i}`).join(' ');

let pro: Ctx, kid: Ctx, reviewer: Ctx, otherAdmin: Ctx, plain: Ctx;
beforeAll(async () => {
  const os = await import('os'); const path = await import('path'); const fs = await import('fs');
  process.env.UPLOAD_DIR = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'hub-lab-'));
  await register({ name: 'Arjun Pro', email: 'arjun.pro@example.test', password: 'Engineer@12345', birthYear: year - 34, inviteCode: 'DEMO-COHORT-07', acceptTerms: true });
  await register({ name: 'Anya Young', email: 'anya.young@example.test', password: 'Youngcoder@123', birthYear: year - 15, inviteCode: 'DEMO-COHORT-07', guardianEmail: 'parent@example.test', acceptTerms: true });
  await register({ name: 'Plain Learner', email: 'plain@example.test', password: 'Plainlearn@123', birthYear: year - 25, inviteCode: 'DEMO-COHORT-07', acceptTerms: true });
  [pro, kid, reviewer, otherAdmin, plain] = await Promise.all(['arjun.pro@example.test', 'anya.young@example.test', 'reviewer@aihub.in', 'admin@northstar.edu', 'plain@example.test'].map(ctxFor));
});
beforeEach(() => _resetRateLimits());

describe('Persona rules (pure)', () => {
  it('maps each kind of learner to a persona', () => {
    expect(derivePersona({ ...base, role: 'school_student', pythonHobby: true }, adult)).toBe('kid_hobbyist');
    expect(derivePersona({ ...base, role: 'school_student' }, minor)).toBe('kid_hobbyist');
    expect(derivePersona({ ...base, role: 'school_student' }, adult)).toBe('student');
    expect(derivePersona(base, adult)).toBe('student');
    expect(derivePersona({ ...base, role: 'working_professional', profession: 'software_engineer' }, adult)).toBe('software_pro');
    expect(derivePersona({ ...base, role: 'working_professional', profession: 'architect' }, adult)).toBe('software_pro');
    expect(derivePersona({ ...base, role: 'working_professional', profession: 'non_engineering' }, adult)).toBe('ai_builder');
    expect(derivePersona({ ...base, role: 'builder' }, adult)).toBe('ai_builder');
    expect(derivePersona({ ...base, role: 'business_owner' }, adult)).toBe('business_owner');
  });

  it('keeps minors safe: no card, paid agents blocked until a guardian approves', () => {
    const p = buildPlan({ ...base, role: 'school_student', pythonHobby: true }, minor);
    expect(p.readiness.map(r => r.id)).toContain('guardian');
    expect(p.readiness.map(r => r.id)).not.toContain('card');
    expect(p.agents.find(a => a.code === 'kilo_code')!.allowed).toBe(true);
    expect(p.agents.filter(a => !a.allowed).map(a => a.code).sort()).toEqual(['claude_code', 'codex_cli', 'opencode']);
    const granted = buildPlan({ ...base, role: 'school_student' }, { minor: true, guardianConsent: 'granted' });
    expect(granted.agents.every(a => a.allowed)).toBe(true);
  });

  it('sets pace, mode, track and OS-specific readiness from the answers', () => {
    const p = buildPlan({ ...base, role: 'working_professional', profession: 'architect', codingComfort: 'daily', hoursPerWeek: 15, os: 'windows' }, adult);
    expect(p).toMatchObject({ persona: 'software_pro', mode: 'pro-code', track: 'AI_SOLUTIONS_ARCH', pace: { key: 'fast' } });
    expect(p.agents[0].code).toBe('claude_code');
    expect(p.readiness.map(r => r.id)).toEqual(expect.arrayContaining(['wsl', 'card']));
    expect(buildPlan({ ...base, hoursPerWeek: 2 }, adult).pace.key).toBe('gentle');
  });

  it('validates answers and rejects personal data', () => {
    expect(onboardingSchema.safeParse({ ...base, role: 'working_professional' }).success).toBe(false); // profession required
    expect(onboardingSchema.safeParse({ ...base, domain: 'call me on 9876543210' }).success).toBe(false);
    expect(onboardingSchema.safeParse({ ...base, contextCard: 'mail me at a@b.co' }).success).toBe(false);
  });

  it('variants change content but never grading rules', () => {
    const cfg = { kind: 'boss', rubric: 'R', attempts: 3, scenarios: [{ s: 'a', correct: [1] }, { s: 'b', correct: [0] }], variants: { student: { attempts: 99, rubric: 'EASY', scenarios: [{ s: 'x', correct: [1] }, { s: 'y', correct: [0] }] } } };
    const r = resolveConfig(cfg, 'student');
    expect(r).toMatchObject({ attempts: 3, rubric: 'R', personalisedFor: 'student' });
    expect(r.scenarios[0].s).toBe('x');
    expect(r.variants).toBeUndefined();
    expect(() => resolveConfig({ ...cfg, variants: { student: { scenarios: [{ s: 'x', correct: [1] }] } } }, 'student')).toThrow();
    const build = resolveConfig({ kind: 'build', fields: [{ key: 'problem', hint: 'base', minWords: 40 }], variants: { kid_hobbyist: { fieldHints: { problem: 'kid hint' }, fields: [] } } }, 'kid_hobbyist');
    expect(build.fields).toEqual([{ key: 'problem', hint: 'kid hint', minWords: 40 }]);
    expect(resolveConfig(cfg, null).scenarios[0].s).toBe('a');
  });
});

describe('Personalised Level 1 (integration)', () => {
  it('shows base content before onboarding and persona content after', async () => {
    const before = await levelState(plain, L1);
    if (before.locked) throw new Error('locked');
    expect(before.activities[0].config.personalisedFor).toBeUndefined();
    expect(before.activities[0].config.problem).toMatch(/tiffin/);

    await saveProfile(plain, { ...base, role: 'school_student', pythonHobby: true });
    const after = await levelState(plain, L1);
    if (after.locked) throw new Error('locked');
    const a1 = after.activities[0].config;
    expect(a1.personalisedFor).toBe('kid_hobbyist');
    expect(a1.problem).toMatch(/coding club/);
    expect(a1.check.answer).toBeUndefined(); // answer keys still stripped
    expect(a1.variants).toBeUndefined(); // other personas' content never sent
    expect(after.activities[1].config.demo.title).toMatch(/Python error/);
    expect(after.activities[5].config.scenarios[0].correct).toBeUndefined();
    expect(after.activities[5].config.scenarios[0].s).toMatch(/marks/);
  });

  it('grades against the persona variant the learner saw', async () => {
    const r = await completeActivity(plain, L1, 1, { choice: 1 });
    expect(r).toMatchObject({ correct: true });
    expect(String((r as { why: string }).why)).toMatch(/Python program/);
  });

  it('derives the persona on the server and ignores a client-sent one', async () => {
    const r = await saveProfile(pro, { ...base, role: 'working_professional', profession: 'software_engineer', codingComfort: 'daily', persona: 'business_owner' });
    expect(r.persona).toBe('software_pro');
    const row = await prisma.learnerProfile.findUniqueOrThrow({ where: { tenantId_userId: { tenantId: pro.tenantId, userId: pro.userId } } });
    expect(row.persona).toBe('software_pro');
    expect(await prisma.auditLog.count({ where: { tenantId: pro.tenantId, actorUserId: pro.userId, action: 'profile.created' } })).toBe(1);
  });

  it('staff cannot create a learning profile', async () => {
    await expectErr(saveProfile(reviewer, base), 403);
  });

  it('includes the profile in the learner’s data export', async () => {
    const ex = await exportMyData(pro);
    expect(ex.learnerProfile?.persona).toBe('software_pro');
  });
});

describe('Agent Lab', () => {
  const png = makePng(800, 450, Math.floor(Math.random() * 1e6));
  const parts = { goal: 'Create a small Python script that renames files', context: 'I keep holiday photos in one folder with random camera names', constraints: 'Python 3 only and no extra packages', output: 'One file rename.py plus a short README', check: 'I will run it on a copy of the folder' };

  it('detects common secret formats', () => {
    expect(hasSecret('key sk-ant-api03-abcdefghijklmnop')).toBe(true);
    expect(hasSecret('ghp_abcdefghijklmnopqrstuvwxyz0123')).toBe(true);
    expect(hasSecret('2.1.211 (Claude Code)')).toBe(false);
    expect(assemblePrompt(parts).split('\n').slice(0, 5).map(l => l.split(':')[0])).toEqual(['Goal', 'Context', 'Constraints', 'Output', 'How I will check it']);
  });

  it('blocks paid agents for a minor without guardian approval, allows free Kilo Code', async () => {
    await expectErr(startRun(kid, { agent: 'claude_code', os: 'windows' }), 403);
    const r = await startRun(kid, { agent: 'kilo_code', os: 'windows' });
    expect(r.state).toBe('in_progress');
  });

  let runId = '';
  it('enforces step order and rejects secrets and wrong version output', async () => {
    await saveProfile(pro, { ...base, role: 'working_professional', profession: 'software_engineer', codingComfort: 'daily' });
    const r = await startRun(pro, { agent: 'claude_code', os: 'macos' });
    runId = r.id;
    expect((await startRun(pro, { agent: 'claude_code', os: 'macos' })).id).toBe(runId); // idempotent
    await expectErr(saveStep(pro, runId, 'install', { method: 'x', versionOutput: '2.1.211 (Claude Code)' }), 403);
    await expectErr(saveStep(pro, runId, 'prepare', { checked: ['laptop'] }), 400); // card + notes missing
    await saveStep(pro, runId, 'prepare', { checked: ['laptop', 'notes', 'card'] });
    await expectErr(saveStep(pro, runId, 'install', { method: 'native', versionOutput: 'sk-ant-api03-abcdefghijklmnopqrst' }), 400);
    await expectErr(saveStep(pro, runId, 'install', { method: 'native', versionOutput: 'hello world' }), 400);
    await saveStep(pro, runId, 'install', { method: 'native', versionOutput: '2.1.211 (Claude Code)' });
    await expectErr(saveStep(pro, runId, 'connect', { quiz: 0, noKeyShared: true }), 400);
    await saveStep(pro, runId, 'connect', { quiz: KEY_QUIZ.answer, noKeyShared: true });
    await expectErr(saveStep(pro, runId, 'prompt', { before: 'make script', parts: { ...parts, check: 'run' } }), 400);
    await saveStep(pro, runId, 'prompt', { before: 'make me a rename script', parts });
    await expectErr(submitRun(pro, runId), 400); // result step missing
  });

  it('accepts only the learner’s own screenshot uploaded for this run', async () => {
    const stray = await uploadFile(pro, { filename: 'other.png', mime: 'image/png', bytes: png });
    await expectErr(saveStep(pro, runId, 'result', { summary: w(35), verified: w(16), screenshotId: stray.id }), 400);
    const shot = await uploadFile(pro, { filename: 'claude.png', mime: 'image/png', bytes: png }, { entityType: 'agent_lab', entityId: runId });
    await saveStep(pro, runId, 'result', { summary: w(35, 'created'), verified: w(16, 'ran'), screenshotId: shot.id });
    const s = await submitRun(pro, runId);
    expect(s.state).toBe('submitted');
    expect(s.autoChecks).toMatchObject({ total: 60, max: 60, gatesOk: true, acknowledged: [] });
    await expectErr(saveStep(pro, runId, 'result', { summary: w(35), verified: w(16), screenshotId: shot.id }), 409);
    // reviewer can open the screenshot; a different learner cannot
    expect((await readFile(reviewer, shot.id)).mime).toBe('image/png');
    await expectErr(readFile(plain, shot.id), 404);
  });

  it('awards XP only after human verification, once, tenant-scoped', async () => {
    const xp0 = await totalXp(pro.tenantId, pro.userId);
    expect((await labQueue(reviewer)).map(i => i.id)).toContain(runId);
    await expectErr(verifyRun(otherAdmin, runId, { answers: { agentRunning: 'yes', matchesResult: 'yes', noSensitiveData: 'yes' }, note: 'Looks right to me.' }), 404);
    await expectErr(verifyRun(pro, runId, { answers: { agentRunning: 'yes', matchesResult: 'yes', noSensitiveData: 'yes' }, note: 'Verifying my own work.' }), 403);
    const v = await verifyRun(reviewer, runId, { answers: { agentRunning: 'yes', matchesResult: 'yes', noSensitiveData: 'yes' }, note: 'Version and screenshot match. Good prompt.' });
    expect(v).toEqual({ state: 'verified', xp: LAB_XP, proofScore: 100, reasons: [] });
    expect(await totalXp(pro.tenantId, pro.userId)).toBe(xp0 + LAB_XP);
    expect((await verifyChain(pro.tenantId, pro.userId)).ok).toBe(true);
    await expectErr(verifyRun(reviewer, runId, { answers: { agentRunning: 'yes', matchesResult: 'yes', noSensitiveData: 'yes' }, note: 'Second time around.' }), 409);
    const n = await prisma.notification.findFirst({ where: { tenantId: pro.tenantId, userId: pro.userId, template: 'agent_lab_verified' } });
    expect(n).not.toBeNull();
  });

  it('lets a learner fix and resubmit after "needs changes"', async () => {
    const r = await startRun(plain, { agent: 'kilo_code', os: 'linux' });
    const plan = (await getProfile(plain))!.plan;
    await saveStep(plain, r.id, 'prepare', { checked: plan.readiness.map(x => x.id) });
    await saveStep(plain, r.id, 'install', { method: 'cli', versionOutput: 'kilo 1.2.3', nodeVersion: 'v24.22.2' });
    await saveStep(plain, r.id, 'connect', { quiz: KEY_QUIZ.answer, noKeyShared: true });
    await saveStep(plain, r.id, 'prompt', { before: 'rename my photos please', parts });
    const shot = await uploadFile(plain, { filename: 'kilo.png', mime: 'image/png', bytes: makePng(900, 500, 7) }, { entityType: 'agent_lab', entityId: r.id });
    await saveStep(plain, r.id, 'result', { summary: w(35), verified: w(16), screenshotId: shot.id });
    await submitRun(plain, r.id);
    expect((await verifyRun(reviewer, r.id, { answers: { agentRunning: 'no', matchesResult: 'partly', noSensitiveData: 'yes' }, note: 'Screenshot does not show the free model.' })).state).toBe('needs_changes');
    const again = await saveStep(plain, r.id, 'result', { summary: w(36), verified: w(17), screenshotId: shot.id });
    expect(again.state).toBe('needs_changes');
    expect((await submitRun(plain, r.id)).attempts).toBe(2);
  });
});
