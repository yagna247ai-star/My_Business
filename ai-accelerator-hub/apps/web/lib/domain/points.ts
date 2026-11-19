/**
 * Points, area rankings and the final-fight bracket for the data analytics journey.
 * Rules come from docs/data-analytics-journey/GAMIFICATION-SPEC.md. Pure functions, no database.
 */
import { DAY_TO_LEVEL } from './lessonMarkdown';

/** Difficulty weight per module (spec §2). */
export const MODULE_WEIGHT: Record<string, number> = {
  DA01_FUNDAMENTALS: 1.0,
  DA02_SQL: 1.5,
  DA03_PYTHON_FUNDAMENTALS: 1.5,
  DA04_PYTHON_ANALYTICS: 2.0,
  DA05_POWER_BI: 2.0,
  DA06_AI_FOR_ANALYTICS: 2.0,
  DA07_MACHINE_LEARNING: 2.5,
  DA08_ETL_DATA_QUALITY: 2.5,
  DA09_CAPSTONE_READINESS: 3.0,
};

export const BASE_DAY_POINTS = 10;

/** Points for one day's class check: 10 × module weight, rounded to a whole number. */
export function dayPoints(day: number): number {
  const code = DAY_TO_LEVEL[day];
  if (!code) throw new Error(`Day ${day} is not in the journey (1–45).`);
  return Math.round(BASE_DAY_POINTS * MODULE_WEIGHT[code]);
}

/** Total points available for one module (its days only). */
export function levelDayPoints(code: string): number {
  return Object.keys(DAY_TO_LEVEL)
    .map(Number)
    .filter(d => DAY_TO_LEVEL[d] === code)
    .reduce((sum, d) => sum + dayPoints(d), 0);
}

/** A learner's points for one level: their completed days plus the XP of their completed activities. */
export function levelPoints(code: string, completedDays: number[], activityXp: number): number {
  const days = completedDays.filter(d => DAY_TO_LEVEL[d] === code).reduce((s, d) => s + dayPoints(d), 0);
  return days + activityXp;
}

export type Entry = { userId: string; name: string; area: string; points: number };

/** Top N learners in each area, by points (ties broken by name). Spec §3. */
export function topByArea(entries: Entry[], n = 3): Record<string, Entry[]> {
  const byArea: Record<string, Entry[]> = {};
  for (const e of entries) (byArea[e.area] ||= []).push(e);
  const out: Record<string, Entry[]> = {};
  for (const area of Object.keys(byArea).sort()) {
    out[area] = byArea[area]
      .slice()
      .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name))
      .slice(0, n);
  }
  return out;
}

/** Hackathon ranking: split by area, each area ordered, plus one global order. Spec §4. */
export function hackathonRanking(entries: Entry[]) {
  const global = entries.slice().sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));
  return { global, byArea: topByArea(entries, Number.MAX_SAFE_INTEGER) };
}

/**
 * Final-fight bracket: seed by points (best plays worst, then next best plays next worst…).
 * Each match is decided by the higher final-challenge score. Spec §5.
 */
export type Match = { a: Entry; b: Entry | null };

export function seedRound(entries: Entry[]): Match[] {
  const seeds = entries.slice().sort((x, y) => y.points - x.points || x.name.localeCompare(y.name));
  const matches: Match[] = [];
  let i = 0, j = seeds.length - 1;
  while (i < j) matches.push({ a: seeds[i++], b: seeds[j--] });
  if (i === j) matches.push({ a: seeds[i], b: null }); // odd count: one learner gets a bye
  return matches;
}

/** Winner of one match on the final-challenge score. Ties go to the higher seed (the first listed). */
export function decide(m: Match, scoreA: number, scoreB: number): Entry {
  if (!m.b) return m.a;
  return scoreB > scoreA ? m.b : m.a;
}

/** Ranking after the bracket: by wins, then total points. */
export function rankByWins(wins: Record<string, number>, entries: Entry[]): Entry[] {
  return entries.slice().sort((a, b) => (wins[b.userId] || 0) - (wins[a.userId] || 0) || b.points - a.points || a.name.localeCompare(b.name));
}

export type PlayedMatch = { a: Entry; b: Entry | null; scoreA: number; scoreB: number | null; winner: Entry };

/**
 * Run the whole final-fight bracket. Each round is re-seeded by points; the final-challenge score decides
 * each match; byes do not count as wins. Returns every round, the champion, and the ranking (wins, then points).
 */
export function runBracket(entries: Entry[], scoreOf: (userId: string) => number): { rounds: PlayedMatch[][]; champion: Entry; ranking: Entry[] } {
  if (entries.length === 0) throw new Error('A bracket needs at least one learner.');
  const wins: Record<string, number> = {};
  const rounds: PlayedMatch[][] = [];
  let current = entries.slice();
  while (current.length > 1) {
    const played = seedRound(current).map(m => {
      const scoreA = scoreOf(m.a.userId);
      const scoreB = m.b ? scoreOf(m.b.userId) : null;
      const winner = decide(m, scoreA, scoreB ?? 0);
      if (m.b) wins[winner.userId] = (wins[winner.userId] || 0) + 1;
      return { a: m.a, b: m.b, scoreA, scoreB, winner };
    });
    rounds.push(played);
    current = played.map(p => p.winner);
  }
  return { rounds, champion: current[0], ranking: rankByWins(wins, entries) };
}
