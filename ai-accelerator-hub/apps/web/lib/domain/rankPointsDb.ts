/** Loads ledger rows for the one points rule (docs/RANKS_UNIFIED_SPEC.md). Every ranking calls this. */
import { prisma } from '@/lib/prisma';
import { rankPoints } from './pointsRule';

export async function loadRankPoints(tenantId: string, userIds: string[], opts: { levelIds?: string[] | null; before?: Date } = {}) {
  if (!userIds.length) return new Map<string, { points: number; reachedAt: Date }>();
  const rows = await prisma.xpLedger.findMany({
    where: { tenantId, userId: { in: userIds }, levelId: opts.levelIds?.length ? { in: opts.levelIds } : { not: null }, ...(opts.before ? { createdAt: { lt: opts.before } } : {}) },
    select: { userId: true, amount: true, levelId: true, createdAt: true },
  });
  return rankPoints(rows, opts.levelIds);
}

/** Learners enrolled (active or completed) in one course of one institution (docs/RANKS_UNIFIED_SPEC.md v1.1). */
export async function courseMembers(tenantId: string, journeyId: string) {
  const rows = await prisma.enrollment.findMany({ where: { tenantId, journeyId, state: { in: ['active', 'completed'] } }, select: { userId: true } });
  return new Set(rows.map(r => r.userId));
}

/**
 * The course a ranking is for, and the courses the person can pick from. Learners: their own enrolments in this
 * institution. Staff: every course in the institution with learners. Never another institution's courses.
 */
export async function courseFor(ctx: { tenantId: string; userId: string; superAdmin: boolean; role: string }, requested?: string | null) {
  const { chooseCourse } = await import('./courseRanks');
  const staff = ctx.superAdmin || !['learner', 'team_lead'].includes(ctx.role);
  const [journeys, mine] = await Promise.all([
    prisma.journey.findMany({ where: { tenantId: ctx.tenantId, enrollments: { some: { state: { in: ['active', 'completed'] } } } }, select: { id: true, title: true, levels: { select: { id: true, code: true, title: true, idx: true }, orderBy: { idx: 'asc' } } }, orderBy: { createdAt: 'asc' } }),
    prisma.enrollment.findMany({ where: { tenantId: ctx.tenantId, userId: ctx.userId, state: { in: ['active', 'completed'] } }, select: { journeyId: true, updatedAt: true, enrolledAt: true } }),
  ]);
  const id = chooseCourse({ requested, mine: mine.map(m => ({ journeyId: m.journeyId, lastActiveAt: m.updatedAt ?? m.enrolledAt })), staff, institutionCourses: journeys.map(j => j.id) });
  const options = staff ? journeys : journeys.filter(j => mine.some(m => m.journeyId === j.id));
  const course = journeys.find(j => j.id === id) ?? null;
  return { course, options: options.map(j => ({ id: j.id, title: j.title })) };
}
