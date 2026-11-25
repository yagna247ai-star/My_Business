/**
 * Automated review by rubric template. A submission is decided as soon as its proof and boss are in,
 * so no learner waits for a person. Every decision is recorded like a human review (Review row, audit
 * log, notification), and the learner can still resubmit after feedback.
 *
 * templateReview() is pure: it turns the evidence into 1–5 scores with the rubric's weights and returns
 * a verdict with specific feedback. autoReviewSubmission() reads the database and records the decision
 * through the existing decide() path, using a system reviewer account.
 */
import { prisma } from '@/lib/prisma';
import type { Ctx } from '@/lib/server/context';
import { parseCfg } from './journey';
import { checkAnswer } from './answerQuality';
import { rubricOrDefault } from './autoReviewCore';

export type ReviewInput = {
  bossBest: number;      // scenarios answered correctly
  bossTotal: number;     // scenarios in the boss
  bossMin: number;       // minimum correct to pass (rubric.bossMin)
  /** Quality of the reflection, 1–5 (answerQuality.checkAnswer): a real, relevant account, not a word count. */
  reflectionScore: number;
  briefFieldsMet: boolean;   // every build field is a real, relevant answer
  limitsWritten: boolean;    // the data-limits field is written
};

export type Missing = { item: string; points: number };

export type TemplateReview = {
  scores: Record<string, number>;
  avg: number;
  verdict: 'approved' | 'needs_changes';
  feedback: string;
  missing: Missing[]; // highlighted to the learner, each worth a small step
};

const clamp = (n: number) => Math.min(5, Math.max(1, Math.round(n)));

/** Score every rubric dimension from the evidence, then decide. Same weights and threshold as the rubric. */
export function templateReview(input: ReviewInput, weights: Record<string, number>, threshold: number): TemplateReview {
  const correct = input.bossTotal > 0 ? clamp(1 + (4 * input.bossBest) / input.bossTotal) : 1;
  const reflection = Math.min(5, Math.max(1, Math.round(input.reflectionScore)));
  const scores: Record<string, number> = {
    correct_result: correct,
    business_reading: input.reflectionScore >= 5 ? 5 : input.reflectionScore >= 3 ? 4 : 2,
    method: input.briefFieldsMet ? 4 : 2,
    data_checks: input.limitsWritten ? 4 : 2,
    reflection,
  };
  const avg = Math.round(Object.entries(weights).reduce((s, [k, w]) => s + (scores[k] ?? 1) * w, 0) * 100) / 100;
  const bossOk = input.bossBest >= input.bossMin;
  const reflectionOk = input.reflectionScore >= 3;
  // Hard gates, as in the proof form: boss, reflection length and every build field. The average must also clear the threshold.
  const verdict = avg >= threshold && bossOk && reflectionOk && input.briefFieldsMet ? 'approved' : 'needs_changes';

  const missing: Missing[] = [];
  if (!bossOk) missing.push({ item: `Boss: ${input.bossBest} of ${input.bossTotal} scenarios right (need ${input.bossMin}). Re-read each situation and choose the first step that checks the data.`, points: 5 });
  if (!reflectionOk) missing.push({ item: 'Reflection: say what you did, what surprised you, and what you learned, in your own words.', points: 3 });
  if (!input.briefFieldsMet) missing.push({ item: 'Method: answer every build field with a real, relevant answer in your own words.', points: 3 });
  if (!input.limitsWritten) missing.push({ item: 'Data checks: name at least one limit of your data (what it cannot tell you).', points: 2 });
  const reasons = missing.map(m => m.item);
  const feedback = verdict === 'approved'
    ? 'Approved automatically by the rubric template.'
    : `Not yet. ${reasons.join(' ')} Fix these and resubmit to earn the review points. You keep your XP, and this never stops you moving to the next level.`;
  return { scores, avg, verdict, feedback, missing: verdict === 'approved' ? [] : missing };
}

export const AUTO_REVIEWER_EMAIL = 'auto-reviewer@system.local';

/** The system reviewer for a tenant: an account that cannot log in, with the reviewer role. */
export async function ensureAutoReviewer(tenantId: string) {
  const role = await prisma.role.findUniqueOrThrow({ where: { code: 'reviewer' } });
  const user = await prisma.user.upsert({
    where: { email: AUTO_REVIEWER_EMAIL },
    update: {},
    create: { email: AUTO_REVIEWER_EMAIL, name: 'Automated reviewer (rubric template)', emailVerified: true, passwordHash: null },
  });
  await prisma.membership.upsert({
    where: { tenantId_userId: { tenantId, userId: user.id } },
    update: { roleId: role.id, status: 'active' },
    create: { tenantId, userId: user.id, roleId: role.id, status: 'active' },
  });
  return user;
}

/**
 * Decide the learner's pending submission for a level, if both proof and boss are in.
 * Returns the verdict, or null when there is nothing to decide yet.
 */
export async function autoReviewSubmission(tenantId: string, progressId: string) {
  const sub = await prisma.submission.findFirst({ where: { tenantId, progressId, state: 'pending' }, orderBy: { submittedAt: 'desc' } });
  if (!sub) return null;
  const progress = await prisma.progress.findUniqueOrThrow({
    where: { id: progressId },
    include: { level: { include: { activities: true } }, bossProgress: true },
  });
  if (!progress.bossProgress?.harnessResult) return null; // boss not run yet

  const a4 = progress.level.activities.find(a => a.idx === 4);
  const a6 = progress.level.activities.find(a => a.idx === 6);
  const cfg4 = parseCfg(a4?.config);
  const cfg6 = parseCfg(a6?.config);
  const rubric = await prisma.rubric.findUnique({ where: { code: cfg6.rubric || 'GENERIC_RUBRIC' } })
    ?? await prisma.rubric.findUnique({ where: { code: 'GENERIC_RUBRIC' } });
  const { weights, threshold } = rubricOrDefault(rubric);

  const harness = JSON.parse(progress.bossProgress.harnessResult) as { best?: number; total?: number };
  const buildRow = a4 ? await prisma.activityProgress.findFirst({ where: { progressId, activityId: a4.id } }) : null;
  const fields: Record<string, string> = buildRow?.data ? (JSON.parse(buildRow.data).brief?.fields ?? {}) : {};
  const fieldSpec: { key: string; label: string; hint?: string }[] = cfg4.fields ?? [];
  const good = (f: { key: string; label: string; hint?: string }) => checkAnswer(fields[f.key], { topic: f.label, hint: f.hint, depth: 'detail' }).ok;
  const briefFieldsMet = fieldSpec.every(good); // a level with no build fields has nothing to fail here
  const limitField = fieldSpec.find(f => /limit/i.test(f.key));
  const limitsWritten = limitField ? good(limitField) : false;

  const review = templateReview({
    bossBest: harness.best ?? 0,
    bossTotal: harness.total ?? 4,
    bossMin: 2,
    reflectionScore: (() => { const q = checkAnswer(sub.reflectionMd, { topic: 'what you did, what surprised you, and what you learned', depth: 'detail' }); return q.ok ? q.score : Math.min(q.score, 2); })(),
    briefFieldsMet,
    limitsWritten,
  }, weights, threshold);

  const reviewer = await ensureAutoReviewer(tenantId);
  const ctx: Ctx = {
    userId: reviewer.id, email: AUTO_REVIEWER_EMAIL, name: 'Automated reviewer', tenantId,
    tenantSlug: '', tenantName: '', role: 'reviewer', cohortId: null, superAdmin: false,
  };
  const { decide } = await import('./review');
  await decide(ctx, sub.id, review.scores, review.verdict, review.feedback);
  return { submissionId: sub.id, ...review };
}

/**
 * Decide every pending submission that is ready (Boss done), oldest first. Escalate to people only the ones
 * automation still cannot decide after ESCALATE_AFTER_MS, once each (docs/AUTO_REVIEW_ONLY_SPEC.md).
 */
export async function sweepPendingReviews(limit = 50) {
  const { needsHuman } = await import('./autoReviewCore');
  const { notifyMany } = await import('@/lib/server/audit');
  const pending = await prisma.submission.findMany({
    where: { state: 'pending' }, orderBy: { submittedAt: 'asc' }, take: limit,
    select: { id: true, tenantId: true, progressId: true, submittedAt: true, metadata: true, user: { select: { name: true } }, progress: { select: { bossProgress: { select: { harnessResult: true } }, level: { select: { title: true } } } } },
  });
  let decided = 0, escalated = 0, waiting = 0;
  for (const s of pending) {
    const bossDone = !!s.progress.bossProgress?.harnessResult;
    if (!bossDone) { waiting++; continue; }
    try { if (await autoReviewSubmission(s.tenantId, s.progressId)) { decided++; continue; } }
    catch (e) { console.error('[auto-review sweep]', s.id, (e as Error).message); }
    const meta = (() => { try { return JSON.parse(s.metadata || '{}'); } catch { return {}; } })() as { escalatedAt?: string };
    if (!meta.escalatedAt && needsHuman({ state: 'pending', submittedAt: s.submittedAt, bossDone })) {
      await prisma.$transaction(async tx => {
        await tx.submission.update({ where: { id: s.id }, data: { metadata: JSON.stringify({ ...meta, escalatedAt: new Date().toISOString() }) } });
        const reviewers = await tx.membership.findMany({ where: { tenantId: s.tenantId, status: 'active', role: { code: { in: ['reviewer', 'mentor', 'instructor'] } } }, select: { userId: true } });
        await notifyMany(tx, s.tenantId, reviewers.map(r => r.userId), 'submission_needs_review', { title: `Needs a person: ${s.user.name ?? 'learner'}`, body: `${s.progress.level.title}: automated review could not decide.`, href: `/review/${s.id}`, tone: 'warn' });
      });
      escalated++;
    }
  }
  return { checked: pending.length, decided, escalated, waitingForBoss: waiting };
}
