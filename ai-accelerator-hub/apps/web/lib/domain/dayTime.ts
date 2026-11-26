/**
 * The day's time estimate (docs/DAY_TIME_ESTIMATE_SPEC.md). Every lesson file said "Time: 4 h 30 min"; the real time is
 * reading the lesson plus the day's guided steps, each of which has its own minutes. Pure.
 */
const WPM = 180; // careful reading of a technical lesson

/** Minutes to read the lesson, without code blocks and the trainer's answer key; at least 5, rounded to 5. */
export function readMinutes(md: string) {
  const text = md.replace(/```[\s\S]*?```/g, ' ').split(/^##\s+Check yourself/m)[0];
  const words = text.split(/\s+/).filter(w => /[\p{L}\p{N}]/u.test(w)).length;
  return Math.max(5, Math.round(words / WPM / 5) * 5);
}

export const fmtMinutes = (m: number) => (m < 60 ? `${m} min` : `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ''}`);

export type DayTime = { total: number; read: number; steps: number; count: number };

/** Lesson reading plus guided steps, the total rounded to 5 minutes; null when the day has no step minutes. */
export function dayMinutes(md: string, stepMinutes: (number | undefined)[]): DayTime | null {
  const steps = stepMinutes.reduce<number>((n, x) => n + (x ?? 0), 0);
  if (!steps) return null;
  const read = readMinutes(md);
  return { total: Math.max(5, Math.round((read + steps) / 5) * 5), read, steps, count: stepMinutes.length };
}

/** Puts the real estimate into the lesson's header line ("> **Time:** … · **Module:** …"); leaves other lessons as they are. */
export function withDayTime(md: string, t: DayTime | null) {
  if (!t) return md;
  const value = `about ${fmtMinutes(t.total)} (lesson ${fmtMinutes(t.read)} + ${t.count} step${t.count === 1 ? '' : 's'} ${fmtMinutes(t.steps)})`;
  return md.replace(/^(>\s*\*\*[^*\n]{1,20}:\*\*\s*)([^·\n]{1,30}?)(\s*·)/m, (all, a: string, _v: string, c: string, at: number) => (at < 400 ? `${a}${value}${c}` : all));
}
