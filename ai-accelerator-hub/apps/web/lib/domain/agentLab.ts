/**
 * Agent Lab (PDF Level 1, activity 4 "Set up your AI agent"): set up a real AI coding agent,
 * simplify a prompt, get a result and submit screenshot proof for human verification.
 *
 * Facts about each agent were checked against the vendor's own documentation on VERIFIED_ON.
 * Install commands change; program staff should re-check `source` links each cohort.
 * Nothing here runs or contacts the agent: the learner runs it on their own computer.
 */
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import type { Ctx } from '@/lib/server/context';
import { AppError, badRequest, conflict, forbidden, notFound } from '@/lib/server/errors';
import { audit, notify, notifyMany } from '@/lib/server/audit';
import { awardXp } from './xp';
import { touchStreak } from './streak';
import { evaluateBadges } from './badges';
import { getProfile, safetyOf } from './profile';
import { PAID_AGENTS, type AgentCode } from './personalise';
import { AGENTS, VERIFIED_ON, findMethod, nodeMajor } from './setupGuide';
import { PASS_MARK, scoreAuto, scoreReview } from './proofScore';
import { TECHNIQUE, buildPrompt, checkPrompt, findCase, isTechnique, readSavedPrompt, type TechniqueId } from './promptTechniques';
import { checkAll } from './answerQuality';

export { VERIFIED_ON, AGENTS } from './setupGuide';
export type { AgentInfo, InstallMethod } from './setupGuide';
export const LAB_XP = 40;
type OS = 'macos' | 'windows' | 'linux';

export const STEPS = ['prepare', 'install', 'connect', 'prompt', 'result'] as const;
export type StepId = (typeof STEPS)[number];

/** Patterns for common secret formats. A match blocks the save and tells the learner to rotate the key. */
const SECRETS = [/sk-ant-[A-Za-z0-9_-]{10,}/, /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}/, /\bgh[pousr]_[A-Za-z0-9]{20,}/, /\bAKIA[0-9A-Z]{16}\b/, /\bAIza[0-9A-Za-z_-]{30,}/, /-----BEGIN [A-Z ]*PRIVATE KEY-----/];
export const hasSecret = (s: string) => SECRETS.some(re => re.test(s));

export const KEY_QUIZ = {
  q: 'Where should your API key live?',
  options: ['In my project code so the agent can find it', 'In an environment variable or the agent’s own login, never shared', 'In a screenshot for my reviewer', 'In the community feed so mentors can help'],
  answer: 1,
};

/** The single-shot template (PDF Level 1 activity 3) — kept as a named export for older callers. */
export const PROMPT_PARTS = TECHNIQUE.single_shot.fields;
/** Deterministic prompt assembler for the single-shot template. No model involved. */
export const assemblePrompt = (parts: Record<string, string>) => buildPrompt('single_shot', parts);

const stepSchemas = {
  prepare: z.object({ checked: z.array(z.string().max(40)).max(10) }),
  install: z.object({ method: z.string().max(40), versionOutput: z.string().trim().min(3).max(400), nodeVersion: z.string().trim().max(40).optional() }),
  connect: z.object({ quiz: z.number().int(), noKeyShared: z.literal(true) }),
  // Prompt Studio: technique + blanks. `parts` is the pre-studio shape (single-shot), still accepted.
  prompt: z.object({ technique: z.string().max(30).optional(), caseId: z.string().max(40).nullish(), before: z.string().trim().max(1500).optional().default(''), fields: z.record(z.string(), z.string().max(1500)).optional(), parts: z.record(z.string(), z.string().max(1500)).optional(), spotted: z.number().int().min(0).max(50).nullish() }),
  result: z.object({ summary: z.string().trim().max(3000), verified: z.string().trim().max(1500), screenshotId: z.string().max(40) }),
};
export const stepBody = z.object({ step: z.enum(STEPS), data: z.unknown() });

type Run = Awaited<ReturnType<typeof prisma.agentLabRun.findFirst>> & {};
const parseSteps = (r: { steps: string }) => { try { return JSON.parse(r.steps) as Record<string, { at: string; data: unknown }>; } catch { return {}; } };
type ShotMeta = { width: number | null; height: number | null } | null;
// versionOutput / resultSummary are returned so a revisited step shows what was saved (bug: fields came back empty).
const view = (r: Run, shot: ShotMeta = null) => ({ id: r.id, agent: r.agent, os: r.os, state: r.state, steps: parseSteps(r), attempts: r.attempts, reviewNote: r.reviewNote, verifiedAt: r.verifiedAt, xpAwarded: r.xpAwarded, autoChecks: r.autoChecks ? JSON.parse(r.autoChecks) : null, screenshotId: r.screenshotId, screenshot: r.screenshotId ? shot : null, versionOutput: r.versionOutput, resultSummary: r.resultSummary, proofScore: r.proofScore, reviewScores: r.reviewScores ? JSON.parse(r.reviewScores) : null });
async function viewWithShot(r: NonNullable<Run>) {
  const f = r.screenshotId ? await prisma.file.findFirst({ where: { id: r.screenshotId, tenantId: r.tenantId }, select: { width: true, height: true } }) : null;
  return view(r, f ? { width: f.width, height: f.height } : null);
}

const learnerOnly = (ctx: Ctx) => { if (ctx.role !== 'learner' && ctx.role !== 'team_lead') throw forbidden('Only learners take the Agent Lab.'); };

export async function labOverview(ctx: Ctx) {
  const [profile, runs] = await Promise.all([getProfile(ctx), prisma.agentLabRun.findMany({ where: { tenantId: ctx.tenantId, userId: ctx.userId }, orderBy: { createdAt: 'asc' } })]);
  return { verifiedOn: VERIFIED_ON, agents: Object.values(AGENTS), plan: profile?.plan || null, runs: await Promise.all(runs.map(viewWithShot)), promptParts: PROMPT_PARTS, keyQuiz: { q: KEY_QUIZ.q, options: KEY_QUIZ.options }, xp: LAB_XP, os: profile?.answers.os || null };
}

export async function startRun(ctx: Ctx, input: { agent: AgentCode; os: OS }) {
  learnerOnly(ctx);
  if (!AGENTS[input.agent]) throw badRequest('Choose an agent.');
  const safety = await safetyOf(ctx.tenantId, ctx.userId);
  if (safety.minor && PAID_AGENTS.includes(input.agent) && safety.guardianConsent !== 'granted') throw forbidden('This agent needs a paid plan or API key. Ask your guardian to approve first, or start with Kilo Code’s free models.');
  const key = { tenantId_userId_agent: { tenantId: ctx.tenantId, userId: ctx.userId, agent: input.agent } };
  const existing = await prisma.agentLabRun.findUnique({ where: key });
  if (existing) return view(existing);
  const r = await prisma.agentLabRun.create({ data: { tenantId: ctx.tenantId, userId: ctx.userId, agent: input.agent, os: input.os } });
  await audit(prisma, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'agent_lab.started', resourceType: 'AgentLabRun', resourceId: r.id, after: { agent: input.agent, os: input.os } });
  return view(r);
}

async function ownRun(ctx: Ctx, id: string) {
  learnerOnly(ctx);
  const r = await prisma.agentLabRun.findFirst({ where: { id, tenantId: ctx.tenantId, userId: ctx.userId } });
  if (!r) throw notFound('Lab run not found.');
  return r;
}

export async function saveStep(ctx: Ctx, id: string, step: StepId, raw: unknown) {
  const r = await ownRun(ctx, id);
  if (r.state === 'verified') throw conflict('This lab is already verified.');
  if (r.state === 'submitted') throw conflict('Your proof is with a reviewer. Wait for their decision.');
  const steps = parseSteps(r);
  const i = STEPS.indexOf(step);
  if (i > 0 && !steps[STEPS[i - 1]]) throw forbidden('Finish the previous step first.');
  const errors: Record<string, string> = {};
  const patch: Record<string, unknown> = {};
  let data: unknown;

  if (step === 'prepare') {
    const d = stepSchemas.prepare.parse(raw);
    const plan = (await getProfile(ctx))?.plan;
    const need = (plan?.readiness || []).map(x => x.id);
    const missing = need.filter(n => !d.checked.includes(n));
    if (missing.length) errors.checked = 'Tick every item before you start (or come back when you are ready).';
    data = { checked: d.checked };
  } else if (step === 'install') {
    // Setup guide spec §5: the method must exist for this agent + OS; npm methods need a checked Node.js version.
    const d = stepSchemas.install.parse(raw);
    const m = findMethod(r.agent as AgentCode, r.os as OS, d.method);
    const name = AGENTS[r.agent as AgentCode].name;
    if (!m) throw badRequest('Choose one of the install methods shown.', { method: 'Choose one of the install methods shown.' });
    if (m.needs.includes('node')) {
      const major = nodeMajor(d.nodeVersion || '');
      if (hasSecret(d.nodeVersion || '')) errors.nodeVersion = 'That looks like a secret key. Delete it here, then revoke the key with the provider.';
      else if (major === null) errors.nodeVersion = 'Run node -v and paste what it prints, for example v24.22.2.';
      else if (m.minNode && major < m.minNode) errors.nodeVersion = `${name} via ${m.label} needs Node.js ${m.minNode} or newer; you have ${d.nodeVersion}. Install the LTS version, open a new terminal and check again.`;
    }
    if (hasSecret(d.versionOutput)) errors.versionOutput = 'That looks like a secret key. Delete it here, then revoke the key with the provider and create a new one.';
    else if (!new RegExp(m.check.pattern, 'i').test(d.versionOutput)) errors.versionOutput = `This does not look like the result of the check for ${name} (${m.label}). ${m.check.how}`;
    patch.versionOutput = d.versionOutput;
    data = { method: m.id, methodLabel: m.label, ...(m.needs.includes('node') ? { nodeVersion: d.nodeVersion?.trim() } : {}) };
  } else if (step === 'connect') {
    const d = stepSchemas.connect.parse(raw);
    if (d.quiz !== KEY_QUIZ.answer) errors.quiz = 'Not quite. An API key is like a recharge code: anyone who has it can spend your money. Keep it in an environment variable or the agent’s own login.';
    data = { quizOk: d.quiz === KEY_QUIZ.answer };
  } else if (step === 'prompt') {
    // Prompt Studio spec §4: the same checkPrompt the browser runs live.
    const d = stepSchemas.prompt.parse(raw);
    if (d.technique !== undefined && !isTechnique(d.technique)) throw badRequest('Choose one of the prompting techniques shown.', { technique: 'Choose one of the prompting techniques shown.' });
    const technique: TechniqueId = isTechnique(d.technique) ? d.technique : 'single_shot';
    const fields = Object.fromEntries(TECHNIQUE[technique].fields.map(f => [f.key, String((d.fields || d.parts || {})[f.key] || '').trim()]));
    const caseId = d.caseId && findCase(technique, d.caseId) ? d.caseId : null;
    const chk = checkPrompt(technique, fields, { caseId, spotted: d.spotted ?? null });
    for (const r of chk.rules) if (!r.ok) errors[r.key] = r.msg;
    const before = d.before || findCase(technique, caseId)?.before || '';
    const after = buildPrompt(technique, fields, caseId);
    if (hasSecret(before + Object.values(fields).join(' '))) errors.before = 'Remove the secret key from your prompt, then revoke it with the provider.';
    patch.promptBefore = before; patch.promptAfter = after;
    data = { technique, caseId, fields, before, spotted: d.spotted ?? null };
  } else {
    const d = stepSchemas.result.parse(raw);
    Object.assign(errors, checkAll([
      { key: 'summary', text: d.summary, topic: 'what the agent produced', depth: 'detail' },
      { key: 'verified', text: d.verified, topic: 'how you checked the result worked (ran it, opened the file, tested it)' },
    ]));
    if (hasSecret(d.summary + d.verified)) errors.summary = 'Remove the secret key, then revoke it with the provider.';
    const f = await prisma.file.findFirst({ where: { id: d.screenshotId, tenantId: ctx.tenantId, ownerId: ctx.userId } });
    if (!f || !f.mime.startsWith('image/')) errors.screenshotId = 'Upload a screenshot (PNG, JPG or WebP) of the agent’s result.';
    else if (f.avStatus === 'infected') errors.screenshotId = 'That file failed the virus scan. Upload a different screenshot.';
    else if (f.entityType !== 'agent_lab' || f.entityId !== r.id) errors.screenshotId = 'Upload the screenshot from this lab page.';
    patch.resultSummary = d.summary; patch.screenshotId = d.screenshotId;
    data = { verified: d.verified };
  }
  if (Object.keys(errors).length) throw badRequest('A few things need fixing.', errors);
  steps[step] = { at: new Date().toISOString(), data };
  const up = await prisma.agentLabRun.update({ where: { id: r.id }, data: { ...patch, steps: JSON.stringify(steps), state: r.state === 'needs_changes' ? 'needs_changes' : 'in_progress' } });
  return viewWithShot(up);
}

/** Proof scoring spec §3: the same image attached to another Agent Lab run in this institution. */
async function screenshotReused(tenantId: string, runId: string, fileId: string, hash: string | null, createdAt: Date) {
  if (!hash) return false;
  // Only a LATER copy is "reused": the first, genuine use of an image is never penalised.
  return !!(await prisma.file.findFirst({ where: { tenantId, sha256: hash, entityType: 'agent_lab', id: { not: fileId }, createdAt: { lt: createdAt }, NOT: { entityId: runId } }, select: { id: true } }));
}

async function autoScore(r: NonNullable<Run>) {
  const steps = parseSteps(r);
  const file = r.screenshotId ? await prisma.file.findFirst({ where: { id: r.screenshotId, tenantId: r.tenantId } }) : null;
  const reused = file ? await screenshotReused(r.tenantId, r.id, file.id, file.sha256, file.createdAt) : false;
  return scoreAuto({
    agent: r.agent as AgentCode, os: r.os as OS, versionOutput: r.versionOutput,
    install: steps.install?.data as { method?: string; nodeVersion?: string } | undefined,
    prompt: readSavedPrompt(steps.prompt?.data),
    resultSummary: r.resultSummary, verifiedNote: (steps.result?.data as { verified?: string } | undefined)?.verified,
    screenshot: { exists: !!file, isImage: !!file && file.mime.startsWith('image/'), width: file?.width ?? null, height: file?.height ?? null, avStatus: file?.avStatus ?? null, reused },
  });
}

/** Proof scoring spec §5: the learner's live proof check before submitting. */
export async function precheck(ctx: Ctx, id: string) {
  const r = await ownRun(ctx, id);
  const a = await autoScore(r);
  const missing = STEPS.filter(s => !parseSteps(r)[s]);
  return { ...a, missingSteps: missing, needsAck: a.gatesOk && a.items.some(x => !x.gateFailed && x.points < x.max), passMark: PASS_MARK, reviewerMax: 40 };
}

export async function submitRun(ctx: Ctx, id: string, opts: { acknowledge?: boolean } = {}) {
  const r = await ownRun(ctx, id);
  if (r.state === 'submitted' || r.state === 'verified') throw conflict(r.state === 'verified' ? 'Already verified.' : 'Already submitted.');
  const steps = parseSteps(r);
  const missing = STEPS.filter(s => !steps[s]);
  if (missing.length) throw badRequest(`Finish these steps first: ${missing.join(', ')}.`);
  const a = await autoScore(r);
  if (!a.gatesOk) throw badRequest(`Fix these before submitting: ${a.items.filter(x => x.gateFailed).map(x => `${x.label} — ${x.fix}`).join(' ')}`);
  const weak = a.items.filter(x => !x.gateFailed && x.points < x.max); // includes partial points on a passed gate check (e.g. a small screenshot)
  if (weak.length && !opts.acknowledge) throw new AppError(409, 'ACK_REQUIRED', `Some checks are not full marks (${weak.map(x => x.id).join(', ')}). Fix them, or confirm you understand they lower your score.`);
  const checks = { version: 2, items: a.items, total: a.total, max: a.max, gatesOk: a.gatesOk, acknowledged: weak.length ? weak.map(x => x.id) : [] };
  // Build the response after the commit: viewWithShot reads through the global client, and doing that inside the
  // transaction needs a second connection while this one is held (stalls to the 5 s timeout when connections are scarce).
  const submitted = await prisma.$transaction(async tx => {
    const up = await tx.agentLabRun.update({ where: { id: r.id }, data: { state: 'submitted', attempts: { increment: 1 }, autoChecks: JSON.stringify(checks) } });
    await touchStreak(tx, ctx.tenantId, ctx.userId);
    await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'agent_lab.submitted', resourceType: 'AgentLabRun', resourceId: r.id, after: { agent: r.agent, attempt: up.attempts, checks } });
    const reviewers = await tx.membership.findMany({ where: { tenantId: ctx.tenantId, status: 'active', role: { code: { in: ['reviewer', 'mentor', 'instructor'] } } } });
    await notifyMany(tx, ctx.tenantId, reviewers.map(m => m.userId), 'agent_lab_needs_review', { title: `Agent Lab proof: ${ctx.name}`, body: `${AGENTS[r.agent as AgentCode].name} · attempt ${up.attempts}`, href: '/review/agent-lab', tone: 'gold' });
    return up;
  });
  return viewWithShot(submitted);
}

/* ---------- reviewer side ---------- */
export async function labQueue(ctx: Ctx) {
  const rows = await prisma.agentLabRun.findMany({ where: { tenantId: ctx.tenantId, state: 'submitted', userId: { not: ctx.userId } }, orderBy: { updatedAt: 'asc' }, take: 100 });
  const users = await prisma.user.findMany({ where: { id: { in: rows.map(r => r.userId) } }, select: { id: true, name: true } });
  const name = new Map(users.map(u => [u.id, u.name || 'Learner']));
  return rows.map(r => ({ ...view(r), learner: name.get(r.userId) || 'Learner', agentName: AGENTS[r.agent as AgentCode]?.name || r.agent, versionOutput: r.versionOutput, promptBefore: r.promptBefore, promptAfter: r.promptAfter, resultSummary: r.resultSummary }));
}

const answer = z.enum(['yes', 'partly', 'no']);
export const verifySchema = z.object({ answers: z.object({ agentRunning: answer, matchesResult: answer, noSensitiveData: answer }), note: z.string().trim().min(10, 'Write at least a short note for the learner.').max(2000) });

export async function verifyRun(ctx: Ctx, id: string, input: z.infer<typeof verifySchema>) {
  const r = await prisma.agentLabRun.findFirst({ where: { id, tenantId: ctx.tenantId } });
  if (!r) throw notFound('Lab run not found.');
  if (r.userId === ctx.userId) throw forbidden('You cannot verify your own proof.');
  if (r.state !== 'submitted') throw conflict('This proof is not waiting for review.');
  // Proof scoring spec §4.3: the outcome is computed from the scores, not chosen.
  const auto = r.autoChecks ? JSON.parse(r.autoChecks) as { total?: number; gatesOk?: boolean } : {};
  const sc = scoreReview(auto.total ?? 0, auto.gatesOk ?? false, input.answers);
  const decision: 'verified' | 'needs_changes' = sc.pass ? 'verified' : 'needs_changes';
  return prisma.$transaction(async tx => {
    const claimed = await tx.agentLabRun.updateMany({ where: { id: r.id, state: 'submitted' }, data: { state: decision, reviewerId: ctx.userId, reviewNote: input.note, verifiedAt: decision === 'verified' ? new Date() : null, proofScore: sc.total, reviewScores: JSON.stringify({ answers: input.answers, items: sc.items, reasons: sc.reasons }) } });
    if (claimed.count !== 1) throw conflict('Another reviewer decided this proof first.');
    let xp = 0;
    if (decision === 'verified') {
      const a = await awardXp(tx, { tenantId: ctx.tenantId, userId: r.userId, amount: sc.xp, source: 'agent_lab_verified', idempotencyKey: `agentlab:${r.tenantId}:${r.userId}:${r.agent}`, metadata: { agent: r.agent, runId: r.id, proofScore: sc.total } });
      xp = a.amount;
      if (a.awarded) await tx.agentLabRun.update({ where: { id: r.id }, data: { xpAwarded: xp } });
      await evaluateBadges(tx, ctx.tenantId, r.userId);
    }
    await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: `agent_lab.${decision}`, resourceType: 'AgentLabRun', resourceId: r.id, after: { xp, proofScore: sc.total, answers: input.answers } });
    await notify(tx, ctx.tenantId, r.userId, `agent_lab_${decision}`, decision === 'verified'
      ? { title: `Agent Lab verified · ${sc.total}/100`, body: `${AGENTS[r.agent as AgentCode].name} is set up and working.${xp ? ` +${xp} XP.` : ''}`, href: '/agent-lab', tone: 'ok' }
      : { title: `Agent Lab needs a change · ${sc.total}/100`, body: (sc.reasons[0] || input.note).slice(0, 140), href: '/agent-lab', tone: 'warn' });
    return { state: decision, xp, proofScore: sc.total, reasons: sc.reasons };
  });
}
