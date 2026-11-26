/** Data for Mission Control "This week" (docs/THIS_WEEK_SPEC.md): the cohort's classes and hackathons, the current level's days and materials. */
import { prisma } from '@/lib/prisma';
import type { Ctx } from '@/lib/server/context';
import { levelDays } from './journey';
import { weekPlan, type Session } from './weekPlanCore';

export async function thisWeek(ctx: Ctx, current: { id: string; code: string }) {
  const enrollment = await prisma.enrollment.findFirst({ where: { tenantId: ctx.tenantId, userId: ctx.userId, state: { in: ['active', 'completed'] } }, orderBy: [{ state: 'asc' }, { updatedAt: 'desc' }], select: { id: true, cohortId: true, cohort: { select: { schedule: true } } } });
  if (!enrollment) return null;
  let sched: { sessions?: Session[]; weekly?: Record<string, string> } = {};
  try { sched = enrollment.cohort?.schedule ? JSON.parse(enrollment.cohort.schedule) : {}; } catch { sched = {}; }
  const [hackathons, days, contents] = await Promise.all([
    prisma.hackathon.findMany({ where: { tenantId: ctx.tenantId, status: { not: 'draft' }, OR: [{ cohortId: enrollment.cohortId }, { cohortId: null }] }, select: { title: true, buildStartAt: true, submitDueAt: true } }),
    levelDays(current.id, enrollment.id),
    prisma.content.findMany({ where: { levelId: current.id, kind: 'md' }, select: { id: true, position: true } }),
  ]);
  const counts = await prisma.dayMaterial.groupBy({ by: ['contentId'], where: { tenantId: ctx.tenantId, contentId: { in: contents.map(c => c.id) } }, _count: { _all: true } });
  const byContent = new Map(counts.map(c => [c.contentId, c._count._all]));
  const materialsOf = new Map(contents.map(c => [c.position, byContent.get(c.id) ?? 0]));
  return weekPlan({
    now: new Date(),
    sessions: Array.isArray(sched.sessions) ? sched.sessions : [],
    hackathons,
    studyDays: days.map(d => ({ day: d.day, title: d.title, state: d.state, href: `/levels/${current.code}/days/${d.day}`, materials: materialsOf.get(d.day) ?? 0 })),
    weekly: sched.weekly ?? null,
  });
}
