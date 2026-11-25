/**
 * Pure rules for analytics an Institution Admin can act on (docs/ANALYTICS_INSIGHTS_SPEC.md).
 * Every number on the page comes from these functions, so they all follow the same definitions.
 */
export type RawEnrollment = { userId: string; name: string; role: string; cohortId: string | null; state: string; enrolledAt: Date };
/** One piece of learner work: a day done, a step, an activity or a submission. day = the journey day, when known. */
export type Activity = { userId: string; at: Date; day?: number | null };
export type Status = 'active' | 'at_risk' | 'not_started' | 'new';
export type LearnerRow = { userId: string; name: string; cohortId: string | null; daysDone: number; progress: number; lastActive: Date | null; status: Status; finished: boolean };

const DAY = 86400e3;
const LEARNER_ROLES = new Set(['learner', 'team_lead']);
export const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : null);

export function learnerRows(enrollments: RawEnrollment[], acts: Activity[], totalDays: number, now = new Date(), finished: Set<string> = new Set()): LearnerRow[] {
  const people = new Map<string, RawEnrollment>();
  for (const e of enrollments) {
    if (!LEARNER_ROLES.has(e.role) || !['active', 'completed'].includes(e.state)) continue;
    const had = people.get(e.userId);
    if (!had || e.enrolledAt < had.enrolledAt) people.set(e.userId, e); // count a person once, from their first enrollment
  }
  const days = new Map<string, Set<number>>(); const last = new Map<string, Date>();
  for (const a of acts) {
    if (!people.has(a.userId)) continue;
    if (a.day != null) { const s = days.get(a.userId) ?? new Set<number>(); s.add(a.day); days.set(a.userId, s); }
    const l = last.get(a.userId); if (!l || a.at > l) last.set(a.userId, a.at);
  }
  return [...people.values()].map(e => {
    const lastActive = last.get(e.userId) ?? null;
    const daysDone = days.get(e.userId)?.size ?? 0;
    const status: Status = lastActive ? (now.getTime() - lastActive.getTime() <= 7 * DAY ? 'active' : 'at_risk')
      : (now.getTime() - e.enrolledAt.getTime() >= 3 * DAY ? 'not_started' : 'new');
    return { userId: e.userId, name: e.name, cohortId: e.cohortId, daysDone, progress: totalDays > 0 ? Math.min(1, daysDone / totalDays) : 0, lastActive, status, finished: finished.has(e.userId) };
  });
}

export function headline(rows: LearnerRow[]) {
  const learners = rows.length;
  const activeWeek = rows.filter(r => r.status === 'active').length;
  return {
    learners,
    started: rows.filter(r => r.lastActive).length,
    activeWeek,
    activePct: pct(activeWeek, learners),
    avgProgress: learners ? Math.round((rows.reduce((s, r) => s + r.progress, 0) / learners) * 100) : null,
    needAttention: rows.filter(r => r.status === 'at_risk' || r.status === 'not_started').length,
    finished: rows.filter(r => r.finished).length,
  };
}

/** Learners who finished each day (1…totalDays, zeros included) and the steepest drop (from a day with 5+ learners). */
export function dayFunnel(acts: Activity[], totalDays: number) {
  const by = new Map<number, Set<string>>();
  for (const a of acts) if (a.day != null) { const s = by.get(a.day) ?? new Set<string>(); s.add(a.userId); by.set(a.day, s); }
  const days = Array.from({ length: Math.max(0, totalDays) }, (_, i) => ({ day: i + 1, done: by.get(i + 1)?.size ?? 0 }));
  let biggestDrop: { day: number; from: number; to: number; dropPct: number } | null = null;
  for (let i = 1; i < days.length; i++) {
    const from = days[i - 1].done, to = days[i].done;
    if (from < 5 || to >= from) continue;
    const dropPct = Math.round((1 - to / from) * 100);
    if (!biggestDrop || dropPct > biggestDrop.dropPct) biggestDrop = { day: days[i].day, from, to, dropPct };
  }
  return { days, biggestDrop };
}

/** Distinct active learners per week, oldest first, the last week ending now. */
export function weekly(acts: Activity[], now: Date, weeks = 8) {
  return Array.from({ length: weeks }, (_, i) => {
    const end = new Date(now.getTime() - (weeks - 1 - i) * 7 * DAY), start = new Date(end.getTime() - 7 * DAY);
    const users = new Set(acts.filter(a => a.at > start && a.at <= end).map(a => a.userId));
    return { weekEnding: end.toISOString().slice(0, 10), active: users.size };
  });
}

export function cohortTable(rows: LearnerRow[], names: Map<string, string>) {
  const groups = new Map<string, LearnerRow[]>();
  for (const r of rows) { const k = r.cohortId ?? ''; groups.set(k, [...(groups.get(k) ?? []), r]); }
  return [...groups.entries()].map(([id, rs]) => {
    const h = headline(rs);
    return { cohortId: id || null, name: id ? names.get(id) ?? 'Cohort' : 'No cohort', learners: h.learners, activePct: h.activePct, avgProgress: h.avgProgress, atRisk: rs.filter(r => r.status === 'at_risk').length, notStarted: rs.filter(r => r.status === 'not_started').length, finished: h.finished };
  }).sort((a, b) => b.learners - a.learners);
}

export type Finding = { priority: number; text: string; href: string };

/** Plain sentences, most important first, each with somewhere to act. */
export function findings(i: { rows: LearnerRow[]; funnel: ReturnType<typeof dayFunnel>; cohorts: ReturnType<typeof cohortTable>; reviewsWaiting: number }): Finding[] {
  if (!i.rows.length) return [{ priority: 1, text: 'No learners in this journey yet. Share an invite code from Cohorts & Sessions.', href: '/admin/cohorts' }];
  const out: Finding[] = [];
  const n = i.rows.length;
  const notStarted = i.rows.filter(r => r.status === 'not_started').length;
  const atRisk = i.rows.filter(r => r.status === 'at_risk').length;
  const plural = (k: number, one: string, many: string) => `${k} ${k === 1 ? one : many}`;
  if (notStarted) out.push({ priority: 100 + (notStarted / n) * 100, text: `${plural(notStarted, 'learner has', 'learners have')} not started, 3+ days after joining. Send a nudge with the Day 1 link.`, href: '/settings/people?filter=attention' });
  if (atRisk) out.push({ priority: 90 + (atRisk / n) * 100, text: `${plural(atRisk, 'learner has', 'learners have')} stopped: nothing done in the last 7 days. A personal message brings most back.`, href: '/settings/people?filter=attention' });
  const d = i.funnel.biggestDrop;
  if (d && d.dropPct >= 20) out.push({ priority: 80 + d.dropPct / 2, text: `Day ${d.day} loses ${d.dropPct}% of learners (${d.from} finished day ${d.day - 1}, ${d.to} finished day ${d.day}). Check that day’s lesson and materials.`, href: '/admin/content' });
  const withData = i.cohorts.filter(c => c.cohortId && c.learners >= 3 && c.avgProgress !== null);
  if (withData.length >= 2) {
    const best = withData.reduce((a, b) => (b.avgProgress! > a.avgProgress! ? b : a)); const worst = withData.reduce((a, b) => (b.avgProgress! < a.avgProgress! ? b : a));
    const gap = best.avgProgress! - worst.avgProgress!;
    if (gap >= 10) out.push({ priority: 60 + gap, text: `${worst.name} is ${gap} points behind ${best.name} on progress (${worst.avgProgress}% vs ${best.avgProgress}%). Ask its mentor what is blocking them.`, href: '/admin/cohorts' });
  }
  if (i.reviewsWaiting) out.push({ priority: 50, text: `${plural(i.reviewsWaiting, 'submission is', 'submissions are')} waiting for a decision. Automated review usually decides within minutes; these may need a person.`, href: '/review' });
  const h = headline(i.rows);
  if (h.activePct !== null && h.activePct >= 70 && !out.length) out.push({ priority: 10, text: `${h.activePct}% of learners were active this week. Keep the rhythm: share the top performers on Ranks.`, href: '/ranks' });
  return out.sort((a, b) => b.priority - a.priority).slice(0, 6).map(f => ({ ...f, priority: Math.round(f.priority) }));
}
