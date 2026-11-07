/**
 * Learning engine: six-activity framework (§9), competence-gated unlocking (§6), server-side grading.
 * Every read and write is scoped to ctx.tenantId and ctx.userId.
 */
import { prisma } from '@/lib/prisma';
import type { Ctx } from '@/lib/server/context';
import { badRequest, conflict, forbidden, notFound } from '@/lib/server/errors';
import { audit, notify } from '@/lib/server/audit';
import { awardXp } from './xp';
import { touchStreak } from './streak';
import { evaluateBadges } from './badges';
import { resolveConfig } from './personalise';
import { personaOf } from './profile';

/* ---------- config helpers ---------- */
type AnyCfg = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
export const parseCfg = (s: string | null | undefined): AnyCfg => { try { return s ? JSON.parse(s) : {}; } catch { return {}; } };

/** Remove answer keys and explanations before sending config to the browser. */
export function publicConfig(cfg: AnyCfg): AnyCfg {
  const strip = (q: AnyCfg) => { const { answer, why, correct, ...rest } = q; void answer; void why; void correct; return rest; };
  const out: AnyCfg = { ...cfg };
  if (out.check) out.check = strip(out.check);
  if (Array.isArray(out.quiz)) out.quiz = out.quiz.map(strip);
  if (Array.isArray(out.questions)) out.questions = out.questions.map(strip);
  if (Array.isArray(out.scenarios)) out.scenarios = out.scenarios.map(strip);
  return out;
}

const words = (s: unknown) => String(s || '').trim().split(/\s+/).filter(Boolean).length;
const tokens = (s: string) => new Set(s.toLowerCase().split(/[^a-z0-9ऀ-෿]+/).filter(w => w.length > 2));
const similarity = (a: string, b: string) => { const A = tokens(a), B = tokens(b); if (!A.size || !B.size) return 0; let i = 0; A.forEach(t => { if (B.has(t)) i++; }); return i / (A.size + B.size - i); };
const PII = [/\b[6-9]\d{9}\b/, /\b[\w.+-]+@[\w-]+\.[\w.]+\b/, /\b\d{4}\s?\d{4}\s?\d{4}\b/]; // Indian mobile, email, 12-digit ID-like numbers

/** Accept only public https URLs (no credentials, no private hosts). Reviewers open these, so treat them as untrusted. */
export function safePublicUrl(raw: string): string | null {
  let u: URL; try { u = new URL(raw.trim()); } catch { return null; }
  if (u.protocol !== 'https:' || u.username || u.password) return null;
  const h = u.hostname.toLowerCase();
  if (h === 'localhost' || h.endsWith('.local') || h.endsWith('.internal') || /^(\d+\.){3}\d+$/.test(h) || h.includes(':') || !h.includes('.')) return null;
  return u.toString();
}

/* ---------- state ---------- */
export async function getEnrollment(ctx: Ctx) {
  const e = await prisma.enrollment.findFirst({ where: { tenantId: ctx.tenantId, userId: ctx.userId, state: { in: ['active', 'completed'] } }, include: { journey: true, cohort: true } });
  if (!e) throw forbidden('You are not enrolled in a journey in this institution.');
  return e;
}

export async function journeyOverview(ctx: Ctx) {
  const e = await getEnrollment(ctx);
  const levels = await prisma.level.findMany({ where: { tenantId: ctx.tenantId, journeyId: e.journeyId }, orderBy: { idx: 'asc' }, include: { stage: true } });
  const progress = await prisma.progress.findMany({ where: { tenantId: ctx.tenantId, enrollmentId: e.id } });
  const byLevel = new Map(progress.map(p => [p.levelId, p]));
  return { enrollment: e, levels: levels.map(l => ({ id: l.id, idx: l.idx, code: l.code, title: l.title, summary: l.summary, description: l.description, xp: l.xpReward, published: l.isPublished, stage: l.stage ? { idx: l.stage.idx, title: l.stage.title } : null, state: byLevel.get(l.id)?.state || 'locked' })) };
}

export async function levelState(ctx: Ctx, code: string) {
  const e = await getEnrollment(ctx);
  const level = await prisma.level.findFirst({ where: { tenantId: ctx.tenantId, journeyId: e.journeyId, code }, include: { activities: { orderBy: { idx: 'asc' } }, stage: true } });
  if (!level) throw notFound('Level not found.');
  const progress = await prisma.progress.findUnique({ where: { enrollmentId_levelId: { enrollmentId: e.id, levelId: level.id } }, include: { activityProgress: true, bossProgress: true, submissions: { orderBy: { submittedAt: 'desc' }, include: { reviews: { orderBy: { reviewedAt: 'desc' }, include: { reviewer: { select: { name: true } } } } } } } });
  if (!progress || progress.state === 'locked') return { level, locked: true as const };
  const ap = new Map(progress.activityProgress.map(a => [a.activityId, a]));
  const persona = await personaOf(ctx.tenantId, ctx.userId);
  const latest = progress.submissions[0] || null;
  const acts = level.activities.map((a, i) => {
    const rec = ap.get(a.id); const prevDone = i === 0 || ap.get(level.activities[i - 1].id)?.state === 'completed';
    let state: string = rec?.state === 'completed' ? 'completed' : prevDone ? 'available' : 'locked';
    if (a.idx === 6 && state !== 'completed' && latest) state = latest.state === 'needs_changes' ? 'needs_changes' : latest.state === 'pending' ? 'in_review' : state;
    if (a.idx === 5 && latest?.state === 'needs_changes') state = 'available';
    const cfg = resolveConfig(parseCfg(a.config), persona);
    return { id: a.id, idx: a.idx, code: a.code, title: a.title, xp: a.xpReward, state, config: publicConfig(cfg), data: rec?.data ? JSON.parse(rec.data) : null, authored: cfg.kind && cfg.kind !== 'unauthored' };
  });
  const boss = progress.bossProgress;
  return { level, locked: false as const, persona, progress, activities: acts, latest, boss: boss ? { attempts: boss.attempts, max: boss.maxAttempts, result: boss.harnessResult ? JSON.parse(boss.harnessResult) : null } : { attempts: 0, max: 3, result: null } };
}

async function loadForWrite(ctx: Ctx, code: string, idx: number) {
  if (ctx.role !== 'learner' && ctx.role !== 'team_lead') throw forbidden('Only learners can complete activities.');
  const st = await levelState(ctx, code);
  if (st.locked) throw forbidden('This level is locked.');
  const act = st.activities.find(a => a.idx === idx); if (!act) throw notFound('Activity not found.');
  if (!act.authored) throw conflict('This activity has not been published yet.');
  if (act.state === 'locked') throw forbidden('Finish the previous activity first.');
  const raw = await prisma.activity.findUniqueOrThrow({ where: { id: act.id } });
  return { st, act, cfg: resolveConfig(parseCfg(raw.config), st.persona) };
}

async function markComplete(ctx: Ctx, st: Extract<Awaited<ReturnType<typeof levelState>>, { locked: false }>, act: { id: string; idx: number; xp: number; code: string }, data: unknown) {
  return prisma.$transaction(async tx => {
    const already = await tx.activityProgress.findUnique({ where: { progressId_activityId: { progressId: st.progress.id, activityId: act.id } } });
    const first = already?.state !== 'completed';
    await tx.activityProgress.upsert({ where: { progressId_activityId: { progressId: st.progress.id, activityId: act.id } }, update: { state: 'completed', data: JSON.stringify(data), ...(first ? { completedAt: new Date(), xpEarned: act.xp } : {}) }, create: { progressId: st.progress.id, activityId: act.id, userId: ctx.userId, enrollmentId: st.progress.enrollmentId, state: 'completed', xpEarned: act.xp, completedAt: new Date(), data: JSON.stringify(data) } });
    let xp = 0, streak = false;
    if (first && act.xp > 0) {
      const r = await awardXp(tx, { tenantId: ctx.tenantId, userId: ctx.userId, amount: act.xp, source: 'activity_complete', idempotencyKey: `act:${st.progress.id}:${act.id}`, levelId: st.level.id, activityId: act.id, metadata: { code: act.code } });
      xp = r.amount;
      if (r.awarded) await tx.progress.update({ where: { id: st.progress.id }, data: { xpEarned: { increment: xp }, state: st.progress.state === 'available' ? 'in_progress' : undefined } });
      streak = (await touchStreak(tx, ctx.tenantId, ctx.userId)).changed;
      await evaluateBadges(tx, ctx.tenantId, ctx.userId);
    }
    await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'activity.completed', resourceType: 'Activity', resourceId: act.id, after: { code: act.code, xp } });
    return { xp, first, streak };
  });
}

/* ---------- activities 1–4: server grading ---------- */
export async function completeActivity(ctx: Ctx, code: string, idx: number, payload: AnyCfg) {
  if (idx === 5 || idx === 6) throw badRequest('Use the proof or boss endpoints for activities 5 and 6.');
  const { st, act, cfg } = await loadForWrite(ctx, code, idx);
  if (st.locked) throw forbidden();

  if (cfg.kind === 'briefing') {
    const choice = Number(payload.choice);
    if (!Number.isInteger(choice) || choice < 0 || choice >= cfg.check.options.length) throw badRequest('Choose an answer.');
    const r = await markComplete(ctx, st, act, { choice });
    return { ...r, correct: choice === cfg.check.answer, why: cfg.check.why };
  }
  if (cfg.kind === 'learn') {
    const answers: unknown[] = Array.isArray(payload.answers) ? payload.answers : [];
    if (answers.length !== cfg.quiz.length) throw badRequest(`Answer all ${cfg.quiz.length} questions.`);
    const wrong = cfg.quiz.map((q: AnyCfg, i: number) => (Number(answers[i]) === q.answer ? -1 : i)).filter((i: number) => i >= 0);
    const score = Math.round(((cfg.quiz.length - wrong.length) / cfg.quiz.length) * 100);
    if (score < cfg.passPct) return { passed: false, score, wrong, xp: 0 };
    const r = await markComplete(ctx, st, act, { score });
    return { passed: true, score, wrong, ...r };
  }
  if (cfg.kind === 'explore') {
    if (payload.attested !== true) throw badRequest('Confirm that you opened the repository.');
    const answers: unknown[] = Array.isArray(payload.answers) ? payload.answers : [];
    if (answers.length !== cfg.questions.length) throw badRequest('Answer every question.');
    const right = cfg.questions.filter((q: AnyCfg, i: number) => Number(answers[i]) === q.answer).length;
    const wrong = cfg.questions.map((q: AnyCfg, i: number) => (Number(answers[i]) === q.answer ? -1 : i)).filter((i: number) => i >= 0);
    if (right < cfg.passMin) return { passed: false, right, wrong, xp: 0 };
    const r = await markComplete(ctx, st, act, { right, attested: true });
    return { passed: true, right, wrong, ...r };
  }
  if (cfg.kind === 'build') {
    const errors: Record<string, string> = {};
    const f = (payload.fields || {}) as Record<string, string>;
    for (const fld of cfg.fields) if (words(f[fld.key]) < fld.minWords) errors[fld.key] = `Write at least ${fld.minWords} words (you have ${words(f[fld.key])}).`;
    if (!cfg.tools.includes(payload.tool)) errors.tool = 'Choose the AI tool you used.';
    const its = (Array.isArray(payload.iterations) ? payload.iterations : []) as { prompt?: string; output?: string; change?: string }[];
    const rules = cfg.iterationRules;
    for (let i = 0; i < cfg.iterations; i++) {
      const it = its[i] || {};
      if (words(it.prompt) < rules.promptMinWords) errors[`it${i}.prompt`] = `Prompt ${i + 1}: at least ${rules.promptMinWords} words.`;
      if (words(it.output) < rules.outputMinWords) errors[`it${i}.output`] = `Output ${i + 1}: summarise it in at least ${rules.outputMinWords} words.`;
      if (i > 0 && words(it.change) < rules.changeMinWords) errors[`it${i}.change`] = `Iteration ${i + 1}: explain what you changed (at least ${rules.changeMinWords} words).`;
      if (i > 0 && it.prompt && its[i - 1]?.prompt && similarity(it.prompt, its[i - 1].prompt!) > rules.maxSimilarity) errors[`it${i}.prompt`] = `Prompt ${i + 1} is almost the same as prompt ${i}. Change it meaningfully.`;
    }
    const all = [...Object.values(f), ...its.flatMap(x => [x.prompt, x.output, x.change])].join(' ');
    if (PII.some(re => re.test(all))) errors.pii = 'Remove phone numbers, email addresses or ID numbers before saving.';
    if (Object.keys(errors).length) throw badRequest('Your brief needs a few fixes.', errors);
    const brief = { tool: payload.tool, fields: Object.fromEntries(cfg.fields.map((x: AnyCfg) => [x.key, String(f[x.key]).trim()])), iterations: its.slice(0, cfg.iterations).map(x => ({ prompt: String(x.prompt).trim(), output: String(x.output).trim(), change: String(x.change || '').trim() })) };
    return markComplete(ctx, st, act, { brief, savedAt: new Date().toISOString() });
  }
  throw badRequest('Unsupported activity.');
}

/* ---------- activity 5: proof ---------- */
export async function submitProof(ctx: Ctx, code: string, p: { evidenceUrl: string; demoUrl?: string; reflection: string; checklist: boolean[] }) {
  const { st, act, cfg } = await loadForWrite(ctx, code, 5);
  if (st.locked) throw forbidden();
  if (st.latest && (st.latest.state === 'pending' || st.latest.state === 'approved')) throw conflict(st.latest.state === 'approved' ? 'This level is already approved.' : 'Your proof is already waiting for review.');
  const errors: Record<string, string> = {};
  const evidence = safePublicUrl(p.evidenceUrl || ''); if (!evidence) errors.evidenceUrl = 'Use a public https link (Google Docs, Notion, GitHub…).';
  const demo = p.demoUrl ? safePublicUrl(p.demoUrl) : null; if (p.demoUrl && !demo) errors.demoUrl = 'Demo link must be a public https URL.';
  if (words(p.reflection) < cfg.minWords) errors.reflection = `Write at least ${cfg.minWords} words (you have ${words(p.reflection)}).`;
  if (!Array.isArray(p.checklist) || p.checklist.length !== cfg.checklist.length || !p.checklist.every(Boolean)) errors.checklist = 'Confirm every item in the checklist.';
  if (PII.some(re => re.test(p.reflection || ''))) errors.reflection = 'Remove phone numbers, email addresses or ID numbers.';
  if (Object.keys(errors).length) throw badRequest('Your proof needs a few fixes.', errors);
  const brief = st.activities.find(a => a.idx === 4)?.data?.brief || null;
  const attempt = st.progress.submissions.length + 1;
  return prisma.$transaction(async tx => {
    const sub = await tx.submission.create({ data: { tenantId: ctx.tenantId, userId: ctx.userId, progressId: st.progress.id, type: 'link', url: evidence, deployedUrl: demo, reflectionMd: p.reflection.trim(), state: 'pending', metadata: JSON.stringify({ attempt, brief, checklist: p.checklist }) } });
    await tx.activityProgress.upsert({ where: { progressId_activityId: { progressId: st.progress.id, activityId: act.id } }, update: { state: 'completed', data: JSON.stringify({ submissionId: sub.id }) }, create: { progressId: st.progress.id, activityId: act.id, userId: ctx.userId, enrollmentId: st.progress.enrollmentId, state: 'completed', xpEarned: act.xp, completedAt: new Date(), data: JSON.stringify({ submissionId: sub.id }) } });
    const xp = await awardXp(tx, { tenantId: ctx.tenantId, userId: ctx.userId, amount: act.xp, source: 'proof_submitted', idempotencyKey: `act:${st.progress.id}:${act.id}`, levelId: st.level.id, activityId: act.id });
    await tx.progress.update({ where: { id: st.progress.id }, data: { state: 'submitted', attempts: { increment: 1 }, ...(xp.awarded ? { xpEarned: { increment: xp.amount } } : {}) } });
    await touchStreak(tx, ctx.tenantId, ctx.userId);
    await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'submission.created', resourceType: 'Submission', resourceId: sub.id, after: { attempt, level: code } });
    await notify(tx, ctx.tenantId, ctx.userId, 'submission_received', { title: 'Proof received', body: `Attempt ${attempt} is in the review queue. Try the Boss challenge while you wait.`, href: `/levels/${code}?a=6`, tone: 'info' });
    const reviewers = await tx.membership.findMany({ where: { tenantId: ctx.tenantId, status: 'active', role: { code: { in: ['reviewer', 'mentor', 'instructor'] } } } });
    for (const r of reviewers) await notify(tx, ctx.tenantId, r.userId, 'submission_needs_review', { title: `New proof: ${ctx.name}`, body: `${st.level.title} · attempt ${attempt}`, href: `/review/${sub.id}`, tone: 'gold' });
    return { submissionId: sub.id, attempt, xp: xp.amount };
  });
}

/* ---------- activity 6: boss ---------- */
export async function runBoss(ctx: Ctx, code: string, answers: { choice: number; why: string }[]) {
  const { st, cfg } = await loadForWrite(ctx, code, 6);
  if (st.locked) throw forbidden();
  if (!st.latest) throw forbidden('Submit your proof (activity 5) before the Boss challenge.');
  if (st.latest.state === 'approved') throw conflict('This level is already approved.');
  if (!Array.isArray(answers) || answers.length !== cfg.scenarios.length) throw badRequest(`Answer all ${cfg.scenarios.length} scenarios.`);
  const results = cfg.scenarios.map((s: AnyCfg, i: number) => {
    const a = answers[i] || { choice: -1, why: '' };
    const choiceOk = (s.correct as number[]).includes(Number(a.choice));
    const whyOk = words(a.why) >= cfg.minWhyWords;
    return { pass: choiceOk && whyOk, reason: !choiceOk ? 'Not the best tool for this situation.' : !whyOk ? `Explain why in at least ${cfg.minWhyWords} words.` : 'Correct.' };
  });
  const passed = results.filter((r: { pass: boolean }) => r.pass).length;
  return prisma.$transaction(async tx => {
    const bp = await tx.bossChallengeProgress.upsert({ where: { progressId: st.progress.id }, update: {}, create: { progressId: st.progress.id, state: 'in_progress', maxAttempts: cfg.attempts } });
    if (bp.attempts >= bp.maxAttempts) throw conflict('No attempts left. Your best result has been shared with your reviewer.');
    const prev = bp.harnessResult ? JSON.parse(bp.harnessResult) : { best: 0 };
    const best = Math.max(prev.best || 0, passed);
    await tx.bossChallengeProgress.update({ where: { id: bp.id }, data: { attempts: { increment: 1 }, state: best >= 4 ? 'passed' : 'in_progress', passed: best >= 4, harnessResult: JSON.stringify({ best, total: cfg.scenarios.length, last: passed, answers }) } });
    await touchStreak(tx, ctx.tenantId, ctx.userId);
    await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'boss.attempt', resourceType: 'BossChallengeProgress', resourceId: bp.id, after: { passed, attempt: bp.attempts + 1 } });
    return { passed, total: cfg.scenarios.length, best, attemptsLeft: bp.maxAttempts - bp.attempts - 1, results };
  });
}
