/**
 * Loads one journey's (and optionally one cohort's) data and runs analyticsCore over it (docs/ANALYTICS_INSIGHTS_SPEC.md).
 */
import { prisma } from '@/lib/prisma';
import type { Ctx } from '@/lib/server/context';
import { hasPerm } from '@/lib/server/context';
import { forbidden } from '@/lib/server/errors';
import { defaultJourney } from './journeyAccess';
import { cohortTable, dayFunnel, findings, headline, learnerRows, weekly, type Activity } from './analyticsCore';

export async function institutionAnalytics(ctx: Ctx, opts: { journeyId?: string; cohortId?: string } = {}) {
  if (!hasPerm(ctx, 'analytics:read')) throw forbidden();
  const t = ctx.tenantId; const now = new Date();
  const journeys = await prisma.journey.findMany({ where: { tenantId: t }, select: { id: true, title: true, isPublished: true }, orderBy: { createdAt: 'asc' } });
  const cohorts = await prisma.cohort.findMany({ where: { tenantId: t }, select: { id: true, name: true }, orderBy: { createdAt: 'desc' } });
  const journey = journeys.find(j => j.id === opts.journeyId) ?? (await defaultJourney(prisma, t)) ?? journeys[0] ?? null;
  const cohortId = cohorts.some(c => c.id === opts.cohortId) ? opts.cohortId! : null;
  if (!journey) return { journeys, cohorts, journey: null, cohortId, empty: true as const };

  const levels = await prisma.level.findMany({ where: { tenantId: t, journeyId: journey.id }, select: { id: true, idx: true, title: true }, orderBy: { idx: 'asc' } });
  const levelIds = levels.map(l => l.id);
  const totalDays = await prisma.content.count({ where: { levelId: { in: levelIds }, kind: 'md' } });

  const [enrollments, members] = await Promise.all([
    prisma.enrollment.findMany({ where: { tenantId: t, journeyId: journey.id }, select: { id: true, userId: true, cohortId: true, state: true, enrolledAt: true, user: { select: { name: true, email: true } } } }),
    prisma.membership.findMany({ where: { tenantId: t, status: 'active' }, select: { userId: true, cohortId: true, role: { select: { code: true } } } }),
  ]);
  const memberOf = new Map(members.map(m => [m.userId, m]));
  const raw = enrollments.filter(e => memberOf.has(e.userId)).map(e => ({ userId: e.userId, name: e.user.name || e.user.email, role: memberOf.get(e.userId)!.role.code, cohortId: e.cohortId ?? memberOf.get(e.userId)!.cohortId, state: e.state, enrolledAt: e.enrolledAt }));
  const scoped = cohortId ? raw.filter(e => e.cohortId === cohortId) : raw;
  const userIds = [...new Set(scoped.map(e => e.userId))];
  const enrollmentIds = enrollments.filter(e => userIds.includes(e.userId)).map(e => e.id);

  const [days, acts, subs, progress] = await Promise.all([
    prisma.dayProgress.findMany({ where: { tenantId: t, enrollmentId: { in: enrollmentIds }, state: 'done' }, select: { userId: true, day: true, completedAt: true, updatedAt: true } }),
    prisma.activityProgress.findMany({ where: { enrollmentId: { in: enrollmentIds }, state: 'completed' }, select: { userId: true, completedAt: true, updatedAt: true } }),
    prisma.submission.findMany({ where: { tenantId: t, userId: { in: userIds }, progress: { levelId: { in: levelIds } } }, select: { userId: true, state: true, submittedAt: true, reviews: { select: { reviewedAt: true, verdict: true }, orderBy: { reviewedAt: 'asc' }, take: 1 } } }),
    prisma.progress.findMany({ where: { tenantId: t, enrollmentId: { in: enrollmentIds } }, select: { userId: true, levelId: true, state: true } }),
  ]);
  const activity: Activity[] = [
    ...days.map(d => ({ userId: d.userId, at: d.completedAt ?? d.updatedAt, day: d.day })),
    ...acts.map(a => ({ userId: a.userId, at: a.completedAt ?? a.updatedAt, day: null })),
    ...subs.map(s => ({ userId: s.userId, at: s.submittedAt, day: null })),
  ];
  const approvedBy = new Map<string, number>();
  for (const p of progress) if (p.state === 'approved') approvedBy.set(p.userId, (approvedBy.get(p.userId) ?? 0) + 1);
  const finished = new Set([...approvedBy.entries()].filter(([, n]) => levels.length > 0 && n >= levels.length).map(([u]) => u));

  const rows = learnerRows(scoped, activity, totalDays, now, finished);
  const learnerSet = new Set(rows.map(r => r.userId));
  const learnerActs = activity.filter(a => learnerSet.has(a.userId));
  const funnel = dayFunnel(learnerActs.filter(a => a.day != null), totalDays);
  const cohortRows = cohortTable(rows, new Map(cohorts.map(c => [c.id, c.name])));

  const ls = subs.filter(s => learnerSet.has(s.userId));
  const decided = ls.filter(s => s.reviews.length);
  const hours = decided.map(s => (s.reviews[0].reviewedAt.getTime() - s.submittedAt.getTime()) / 3600e3).sort((a, b) => a - b);
  const reviews = {
    submitted: ls.length, decided: decided.length, approved: ls.filter(s => s.state === 'approved').length,
    needsChanges: ls.filter(s => s.state === 'needs_changes').length, waiting: ls.filter(s => s.state === 'pending').length,
    medianHours: hours.length ? hours[Math.floor(hours.length / 2)] : null,
  };
  const levelFunnel = levels.map(l => ({ idx: l.idx, title: l.title, reached: progress.filter(p => p.levelId === l.id && p.state !== 'locked' && learnerSet.has(p.userId)).length, approved: progress.filter(p => p.levelId === l.id && p.state === 'approved' && learnerSet.has(p.userId)).length }));

  const costs = ctx.superAdmin ? await (async () => {
    const ai = await prisma.aiUsageLedger.aggregate({ where: { tenantId: t, period: now.toISOString().slice(0, 7) }, _sum: { costMicros: true } });
    const rev = await prisma.payment.aggregate({ where: { tenantId: t, status: 'captured' }, _sum: { amountPaise: true } });
    return { aiUsd: (ai._sum.costMicros || 0) / 1e6, revenueInr: (rev._sum.amountPaise || 0) / 100 };
  })() : null;

  const attention = rows.filter(r => r.status === 'at_risk' || r.status === 'not_started')
    .sort((a, b) => (a.lastActive?.getTime() ?? 0) - (b.lastActive?.getTime() ?? 0)).slice(0, 10)
    .map(r => ({ userId: r.userId, name: r.name, status: r.status, lastActive: r.lastActive?.toISOString() ?? null, daysDone: r.daysDone }));

  return {
    journeys, cohorts, journey: { id: journey.id, title: journey.title }, cohortId, empty: false as const, totalDays,
    headline: headline(rows), findings: findings({ rows, funnel, cohorts: cohortRows, reviewsWaiting: reviews.waiting }),
    funnel, levelFunnel, weekly: weekly(learnerActs, now, 8), cohortsTable: cohortRows, reviews, attention, costs,
  };
}
