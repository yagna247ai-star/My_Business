/**
 * Evaluation engine (§12): rubric scoring by a human, enforced pass rule, unlock on approval, appeals.
 * Automated checks are advisory and labelled as such; they never decide (§12, §27).
 */
import { prisma } from '@/lib/prisma';
import type { Ctx } from '@/lib/server/context';
import { hasPerm } from '@/lib/server/context';
import { badRequest, conflict, forbidden, notFound } from '@/lib/server/errors';
import { learnerTitle, starsText } from './levelTitles';
import { audit, notify, notifyMany } from '@/lib/server/audit';
import { awardXp } from './xp';
import { evaluateBadges } from './badges';
import { parseCfg } from './journey';

export type Dim = { key: string; name: string; weight: number; l1?: string; l3?: string; l5?: string };
export async function rubricFor(code: string) {
  const r = await prisma.rubric.findUnique({ where: { code } });
  if (!r) throw notFound('Rubric not found.');
  const dims: Dim[] = Object.entries(JSON.parse(r.dimensions) as Record<string, Omit<Dim, 'key'>>).map(([key, v]) => ({ key, name: v.name || key, weight: v.weight, l1: v.l1, l3: v.l3, l5: v.l5 }));
  return { code: r.code, title: r.title, threshold: r.passThreshold, dims, bossMin: 2 };
}
export const weighted = (dims: Dim[], s: Record<string, number>) => Math.round(dims.reduce((a, d) => a + (s[d.key] || 0) * d.weight, 0) * 100) / 100;
export const passes = (rb: Awaited<ReturnType<typeof rubricFor>>, s: Record<string, number>) => weighted(rb.dims, s) >= rb.threshold && (s.boss ?? rb.bossMin) >= rb.bossMin;

const words = (s: unknown) => String(s || '').trim().split(/\s+/).filter(Boolean).length;

/** Deterministic, explainable checks shown to reviewers as suggestions — not AI, and not a decision. */
export function automatedChecks(sub: { reflectionMd: string | null; metadata: string | null }, boss: { best?: number; total?: number } | null) {
  const meta = sub.metadata ? JSON.parse(sub.metadata) : {};
  const brief = meta.brief;
  const out: { key: string; suggestion: number; evidence: string }[] = [];
  const pw = brief ? words(brief.fields?.problem) : 0;
  out.push({ key: 'problem', suggestion: pw >= 80 ? 4 : pw >= 40 ? 3 : 2, evidence: `Problem statement: ${pw} words; user described in ${brief ? words(brief.fields?.user) : 0} words.` });
  const changes = brief ? brief.iterations.slice(1).filter((i: { change: string }) => words(i.change) >= 10).length : 0;
  out.push({ key: 'prompting', suggestion: changes >= 2 ? 3 : 2, evidence: `${brief?.iterations?.length || 0} prompt iterations; ${changes} with an explained change.` });
  const ev = brief ? words(brief.fields?.evaluation) : 0;
  out.push({ key: 'evaluation', suggestion: ev >= 50 ? 4 : ev >= 25 ? 3 : 2, evidence: `Error analysis: ${ev} words.` });
  const rs = brief ? words(brief.fields?.responsible) : 0;
  out.push({ key: 'responsible', suggestion: rs >= 30 ? 4 : rs >= 15 ? 3 : 2, evidence: `Data-handling note: ${rs} words. Checklist confirmed: ${meta.checklist?.every(Boolean) ? 'yes' : 'no'}.` });
  const rw = words(sub.reflectionMd);
  out.push({ key: 'reflection', suggestion: rw >= 120 ? 4 : rw >= 50 ? 3 : 1, evidence: `Reflection: ${rw} words.` });
  const b = boss?.best ?? 0, t = boss?.total ?? 6;
  out.push({ key: 'boss', suggestion: !boss ? 1 : b === t ? 5 : b >= t - 1 ? 4 : b >= 4 ? 3 : b >= 2 ? 2 : 1, evidence: boss ? `Boss best: ${b} of ${t} scenarios.` : 'Boss not attempted yet.' });
  return out;
}

export async function reviewQueue(ctx: Ctx) {
  if (!hasPerm(ctx, 'review:read')) throw forbidden();
  const subs = await prisma.submission.findMany({ where: { tenantId: ctx.tenantId, state: 'pending', userId: { not: ctx.userId } }, orderBy: { submittedAt: 'asc' }, include: { user: { select: { name: true, email: true } }, progress: { include: { level: true, bossProgress: true } } } });
  const decided = await prisma.review.findMany({ where: { submission: { tenantId: ctx.tenantId }, isAiReview: false }, orderBy: { reviewedAt: 'desc' }, take: 30, include: { submission: { include: { user: { select: { name: true } }, progress: { include: { level: true } } } }, reviewer: { select: { name: true } } } });
  return {
    pending: subs.map(s => { const boss = s.progress.bossProgress?.harnessResult ? JSON.parse(s.progress.bossProgress.harnessResult) : null; return { id: s.id, learner: s.user.name || s.user.email, level: s.progress.level.title, levelIdx: s.progress.level.idx, attempt: JSON.parse(s.metadata || '{}').attempt || 1, submittedAt: s.submittedAt, waitingHours: Math.round((Date.now() - s.submittedAt.getTime()) / 3600e3), boss: boss ? `${boss.best}/${boss.total}` : null }; }),
    decided: decided.map(r => ({ id: r.id, submissionId: r.submissionId, learner: r.submission.user.name, level: r.submission.progress.level.title, verdict: r.verdict, avg: r.weightedAvg, reviewer: r.reviewer.name, at: r.reviewedAt, turnaroundHours: Math.round((r.reviewedAt.getTime() - r.submission.submittedAt.getTime()) / 3600e3), appeal: r.appealState })),
  };
}

export async function submissionForReview(ctx: Ctx, id: string) {
  if (!hasPerm(ctx, 'review:read')) throw forbidden();
  const s = await prisma.submission.findFirst({ where: { id, tenantId: ctx.tenantId }, include: { user: { select: { id: true, name: true, email: true } }, reviews: { orderBy: { reviewedAt: 'desc' }, include: { reviewer: { select: { name: true } } } }, progress: { include: { level: { include: { activities: true } }, bossProgress: true, submissions: { orderBy: { submittedAt: 'asc' }, select: { id: true, submittedAt: true, state: true } } } } } });
  if (!s) throw notFound('Submission not found.');
  const a6 = s.progress.level.activities.find(a => a.idx === 6);
  const rb = await rubricFor(parseCfg(a6?.config).rubric || 'GENERIC_RUBRIC');
  const boss = s.progress.bossProgress?.harnessResult ? JSON.parse(s.progress.bossProgress.harnessResult) : null;
  return { submission: s, rubric: rb, checks: automatedChecks(s, boss), boss, own: s.userId === ctx.userId, canDecide: hasPerm(ctx, 'review:decide') && s.userId !== ctx.userId && s.state === 'pending' };
}

export async function decide(ctx: Ctx, id: string, scores: Record<string, number>, verdict: 'approved' | 'needs_changes', feedback: string) {
  if (!hasPerm(ctx, 'review:decide')) throw forbidden();
  const d = await submissionForReview(ctx, id);
  const s = d.submission;
  if (s.userId === ctx.userId) throw forbidden('You cannot review your own submission.');
  if (s.state !== 'pending') throw conflict('This submission has already been decided.');
  for (const dim of d.rubric.dims) { const v = scores[dim.key]; if (!Number.isInteger(v) || v < 1 || v > 5) throw badRequest(`Score "${dim.name}" from 1 to 5.`); }
  const avg = weighted(d.rubric.dims, scores);
  if (verdict === 'approved' && !passes(d.rubric, scores)) throw badRequest(`Approval needs a weighted average of ${d.rubric.threshold.toFixed(1)}+ and a Boss score of ${d.rubric.bossMin}+.`);
  if (verdict === 'needs_changes' && feedback.trim().length < 20) throw badRequest('Explain what to change (at least 20 characters).');
  const level = s.progress.level;
  const a6 = level.activities.find(a => a.idx === 6)!;
  const split = parseCfg(a6.config).xpSplit || { base: a6.xpReward, bossBonus: 0 };

  return prisma.$transaction(async tx => {
    const fresh = await tx.submission.findUniqueOrThrow({ where: { id } });
    if (fresh.state !== 'pending') throw conflict('This submission has already been decided.'); // guards double-clicks and races
    const review = await tx.review.create({ data: { submissionId: id, reviewerId: ctx.userId, rubricId: (await tx.rubric.findUnique({ where: { code: d.rubric.code } }))?.id, verdict, rubricScores: JSON.stringify(scores), weightedAvg: avg, feedbackMd: feedback.trim() || null } });
    await tx.submission.update({ where: { id }, data: { state: verdict } });
    await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: `review.${verdict}`, resourceType: 'Submission', resourceId: id, after: { avg, scores, learner: s.userId } });
    if (verdict === 'needs_changes') {
      await tx.progress.update({ where: { id: s.progressId }, data: { state: 'in_progress' } });
      await notify(tx, ctx.tenantId, s.userId, 'review_decided', { title: `Changes requested on ${level.title}`, body: `${ctx.name}: “${feedback.trim().slice(0, 140)}” You keep all XP and can resubmit for the review points. This never blocks the next level.`, href: `/levels/${level.code}?a=5`, tone: 'warn' });
      return { reviewId: review.id, avg, verdict };
    }
    // Approved: complete A6, award XP split, unlock next level
    await tx.activityProgress.upsert({ where: { progressId_activityId: { progressId: s.progressId, activityId: a6.id } }, update: { state: 'completed', completedAt: new Date(), xpEarned: a6.xpReward }, create: { progressId: s.progressId, activityId: a6.id, userId: s.userId, enrollmentId: s.progress.enrollmentId, state: 'completed', completedAt: new Date(), xpEarned: a6.xpReward } });
    const base = await awardXp(tx, { tenantId: ctx.tenantId, userId: s.userId, amount: split.base, source: 'review_approved', idempotencyKey: `review:${s.progressId}`, levelId: level.id, activityId: a6.id, metadata: { avg } });
    const best = d.boss?.best ?? 0, total = d.boss?.total ?? 6;
    const bonusAmt = best === total ? split.bossBonus : best >= total - 2 ? Math.round(split.bossBonus / 2) : 0;
    const bonus = bonusAmt > 0 ? await awardXp(tx, { tenantId: ctx.tenantId, userId: s.userId, amount: bonusAmt, source: 'boss_bonus', idempotencyKey: `boss:${s.progressId}`, levelId: level.id, metadata: { best, total } }) : { amount: 0 };
    await tx.progress.update({ where: { id: s.progressId }, data: { state: 'approved', completedAt: new Date(), xpEarned: { increment: base.amount + bonus.amount } } });
    // Title unlocked (docs/LEVEL_TITLES_SPEC.md): celebrate the skill this level proves, and show what is next.
    {
      const courseLevels = await tx.level.findMany({ where: { tenantId: ctx.tenantId, journeyId: level.journeyId }, select: { idx: true, code: true, title: true } });
      const approvedIdx = (await tx.progress.findMany({ where: { enrollmentId: s.progress.enrollmentId, state: 'approved' }, select: { level: { select: { idx: true } } } })).map(p => p.level.idx);
      const t = learnerTitle(courseLevels, approvedIdx);
      if (t.levelIdx === level.idx) await notify(tx, ctx.tenantId, s.userId, 'title_unlocked', { title: `Title unlocked: ${t.current} ${starsText(t.stars)}`, body: t.next ? `Next: ${t.next}, ${t.levelsToNext} level${t.levelsToNext === 1 ? '' : 's'} to go.` : 'You reached the top title of this course. Brilliant work.', href: '/dashboard', tone: 'gold' });
    }
    const next = await tx.level.findFirst({ where: { tenantId: ctx.tenantId, journeyId: level.journeyId, idx: level.idx + 1 } });
    if (next) {
      // With free progression the learner may already be working on the next level: never reset it.
      const cur = await tx.progress.findUnique({ where: { enrollmentId_levelId: { enrollmentId: s.progress.enrollmentId, levelId: next.id } }, select: { state: true } });
      if (!cur || cur.state === 'locked') {
        await tx.progress.upsert({ where: { enrollmentId_levelId: { enrollmentId: s.progress.enrollmentId, levelId: next.id } }, update: { state: 'available', unlockedAt: new Date() }, create: { tenantId: ctx.tenantId, enrollmentId: s.progress.enrollmentId, levelId: next.id, userId: s.userId, state: 'available', unlockedAt: new Date() } });
        await tx.unlockEvent.create({ data: { tenantId: ctx.tenantId, userId: s.userId, levelId: next.id, reason: 'prerequisite_met' } });
        await tx.enrollment.updateMany({ where: { id: s.progress.enrollmentId, currentLevelIdx: { lt: next.idx } }, data: { currentLevelIdx: next.idx } });
        await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'level.unlocked', resourceType: 'Level', resourceId: next.id, after: { learner: s.userId, idx: next.idx } });
      }
    }
    const badges = await evaluateBadges(tx, ctx.tenantId, s.userId);
    await notify(tx, ctx.tenantId, s.userId, 'review_decided', { title: `${level.title} approved — ${avg.toFixed(2)} / 5`, body: `+${base.amount + bonus.amount} XP${next ? ` · ${next.title} is unlocked` : ''}${feedback ? ` · “${feedback.trim().slice(0, 100)}”` : ''}`, href: `/levels/${level.code}?a=6`, tone: 'ok' });
    return { reviewId: review.id, avg, verdict, xp: base.amount + bonus.amount, unlocked: next?.code || null, badges };
  });
}

/* Appeals (§12): the learner can ask for a second human review. */
export async function openAppeal(ctx: Ctx, reviewId: string, note: string) {
  const r = await prisma.review.findFirst({ where: { id: reviewId, submission: { tenantId: ctx.tenantId, userId: ctx.userId } }, include: { submission: true } });
  if (!r) throw notFound('Review not found.');
  if (r.appealState) throw conflict('An appeal has already been filed for this review.');
  if (note.trim().length < 30) throw badRequest('Explain your appeal in at least 30 characters.');
  return prisma.$transaction(async tx => {
    await tx.review.update({ where: { id: r.id }, data: { appealState: 'open', appealNote: note.trim() } });
    await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'review.appeal_opened', resourceType: 'Review', resourceId: r.id });
    const staff = await tx.membership.findMany({ where: { tenantId: ctx.tenantId, status: 'active', role: { code: { in: ['program_mgr', 'tenant_admin'] } } } });
    await notifyMany(tx, ctx.tenantId, staff.map(m => m.userId), 'appeal_opened', { title: `Appeal from ${ctx.name}`, body: note.trim().slice(0, 140), href: `/review/${r.submissionId}`, tone: 'warn' });
    return { ok: true };
  });
}

export async function resolveAppeal(ctx: Ctx, reviewId: string, outcome: 'upheld' | 'overturned') {
  if (!hasPerm(ctx, 'cohort:manage')) throw forbidden();
  const r = await prisma.review.findFirst({ where: { id: reviewId, appealState: 'open', submission: { tenantId: ctx.tenantId } }, include: { submission: true } });
  if (!r) throw notFound('Open appeal not found.');
  if (r.reviewerId === ctx.userId) throw forbidden('A different person must resolve an appeal on your own review.');
  return prisma.$transaction(async tx => {
    await tx.review.update({ where: { id: r.id }, data: { appealState: outcome } });
    if (outcome === 'overturned' && r.verdict === 'needs_changes') await tx.submission.update({ where: { id: r.submissionId }, data: { state: 'pending' } }); // goes back for a fresh review
    await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: `review.appeal_${outcome}`, resourceType: 'Review', resourceId: r.id });
    await notify(tx, ctx.tenantId, r.submission.userId, 'appeal_resolved', { title: outcome === 'overturned' ? 'Appeal accepted — your proof will be re-reviewed' : 'Appeal reviewed — the original decision stands', tone: outcome === 'overturned' ? 'ok' : 'info' });
    return { ok: true };
  });
}
