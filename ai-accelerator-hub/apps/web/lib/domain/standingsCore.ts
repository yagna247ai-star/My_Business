/**
 * Pure rules for area standings (GAMIFICATION-SPEC §3–5). No database: the page loads rows and calls these.
 * Privacy matches the main leaderboard: private learners and minors show as "Anonymous learner" to others.
 */
import { topByArea, type Entry } from './points';

export type StandingRow = { userId: string; name: string | null; area: string | null; xp: number; private: boolean };
export type BoardEntry = Entry & { me: boolean };
export type AreaTop = BoardEntry & { crown: 1 | 2 | 3 };

export const NO_AREA = 'Area not set';

export function toEntries(rows: StandingRow[], viewerId: string): BoardEntry[] {
  return rows.map(r => ({
    userId: r.userId,
    name: r.userId === viewerId ? (r.name || 'You') : r.private ? 'Anonymous learner' : (r.name || 'Learner'),
    area: r.area?.trim() || NO_AREA,
    points: r.xp,
    me: r.userId === viewerId,
  }));
}

/** Top 3 per area with crowns 1–3, and the global ranking. Learners with no points are not ranked. */
export function areaBoard(entries: BoardEntry[]) {
  const scored = entries.filter(e => e.points > 0);
  const counts: Record<string, number> = {};
  for (const e of scored) counts[e.area] = (counts[e.area] || 0) + 1;
  const tops = topByArea(scored, 3) as Record<string, BoardEntry[]>;
  const areas = Object.entries(tops).map(([area, top]) => ({
    area,
    count: counts[area],
    top: top.map((t, i) => ({ ...t, crown: (i + 1) as 1 | 2 | 3 })),
  })).sort((a, b) => b.top[0].points - a.top[0].points || a.area.localeCompare(b.area));
  const global = scored.slice().sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));
  return { areas, global };
}
