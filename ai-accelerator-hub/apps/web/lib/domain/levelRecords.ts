/**
 * Finished levels per course for many learners at once (docs/PROFILE_LEVELS_SPEC.md): three queries in total,
 * whatever the number of learners. A level is finished when a reviewer approved it.
 */
import { prisma } from '@/lib/prisma';
import { levelRecord, type LevelRecord } from './levelTitles';

export const recordKey = (tenantId: string, userId: string) => `${tenantId}:${userId}`;

export async function levelRecordsFor(people: { tenantId: string; userId: string }[]): Promise<Map<string, LevelRecord[]>> {
  const out = new Map<string, LevelRecord[]>();
  if (!people.length) return out;
  const enrollments = await prisma.enrollment.findMany({
    where: { state: { in: ['active', 'completed'] }, OR: people.map(p => ({ tenantId: p.tenantId, userId: p.userId })) },
    orderBy: { enrolledAt: 'asc' }, select: { id: true, tenantId: true, userId: true, journeyId: true, journey: { select: { title: true } } },
  });
  if (!enrollments.length) return out;
  const journeyIds = [...new Set(enrollments.map(e => e.journeyId))];
  const [levels, approved] = await Promise.all([
    prisma.level.findMany({ where: { journeyId: { in: journeyIds } }, select: { id: true, journeyId: true, idx: true, code: true, title: true } }),
    prisma.progress.findMany({ where: { enrollmentId: { in: enrollments.map(e => e.id) }, state: 'approved' }, select: { enrollmentId: true, levelId: true, completedAt: true, updatedAt: true } }),
  ]);
  for (const e of enrollments) {
    // Only this course's levels: levels of another course never mix in (AC-2).
    const course = levels.filter(level => level.journeyId === e.journeyId);
    const idxOf = new Map(course.map(l => [l.id, l.idx]));
    const done = approved.filter(p => p.enrollmentId === e.id && idxOf.has(p.levelId)).map(p => ({ idx: idxOf.get(p.levelId)!, at: p.completedAt ?? p.updatedAt }));
    const k = recordKey(e.tenantId, e.userId);
    out.set(k, [...(out.get(k) ?? []), levelRecord(e.journey.title, course, done)]);
  }
  return out;
}
