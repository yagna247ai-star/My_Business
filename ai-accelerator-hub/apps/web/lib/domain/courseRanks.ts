/** Pure rules for ranks per course (docs/RANKS_UNIFIED_SPEC.md v1.1). */

/** The course to rank: the requested one if this person may see it; else their most recent; staff may pick any. */
export function chooseCourse(i: { requested: string | null | undefined; mine: { journeyId: string; lastActiveAt: Date }[]; staff: boolean; institutionCourses: string[] }): string | null {
  const allowed = new Set(i.staff ? i.institutionCourses : i.mine.map(m => m.journeyId).filter(j => i.institutionCourses.includes(j)));
  if (i.requested && allowed.has(i.requested)) return i.requested;
  const recent = [...i.mine].filter(m => i.institutionCourses.includes(m.journeyId)).sort((a, b) => b.lastActiveAt.getTime() - a.lastActiveAt.getTime())[0];
  if (recent) return recent.journeyId;
  return i.staff ? i.institutionCourses[0] ?? null : null;
}

/** Points for the course's enrolled learners only, highest first (stable). */
export function courseBoardRows(points: Map<string, { points: number }>, enrolled: Set<string>) {
  return [...points.entries()].filter(([u]) => enrolled.has(u)).map(([userId, p]) => ({ userId, points: p.points })).sort((a, b) => b.points - a.points);
}
