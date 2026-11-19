/**
 * Pure rules for the Ranks page (design: "redesign-v3 ranks"). No database here.
 * - City, State and Everyone scopes. A city with fewer than MIN_CITY_MEMBERS ranked learners is ranked at state level.
 * - Movement compares today's order with the order from the previous standings (points before the last refresh window).
 * - Privacy matches the other leaderboards: private learners and minors show as "Anonymous learner" to others,
 *   and other learners' ids never leave the server.
 */
export const MIN_CITY_MEMBERS = 10;

const CITY_STATE: Record<string, string> = {
  hyderabad: 'Telangana', secunderabad: 'Telangana', warangal: 'Telangana', karimnagar: 'Telangana',
  bengaluru: 'Karnataka', bangalore: 'Karnataka', mysuru: 'Karnataka',
  chennai: 'Tamil Nadu', coimbatore: 'Tamil Nadu',
  pune: 'Maharashtra', mumbai: 'Maharashtra', nagpur: 'Maharashtra',
  vijayawada: 'Andhra Pradesh', visakhapatnam: 'Andhra Pradesh', tirupati: 'Andhra Pradesh',
  delhi: 'Delhi', kolkata: 'West Bengal', ahmedabad: 'Gujarat', kochi: 'Kerala',
};

export function stateOf(city: string | null | undefined): string | null {
  return city ? CITY_STATE[city.trim().toLowerCase()] ?? null : null;
}

export type Scope = { kind: 'city' | 'state' | 'all'; name: string };

/** Where a city's learners are ranked: the city itself if it is big enough, else its state, else everyone. */
export function cityScope(city: string, counts: Record<string, number>): Scope {
  if ((counts[city] ?? 0) >= MIN_CITY_MEMBERS) return { kind: 'city', name: city };
  const st = stateOf(city);
  return st ? { kind: 'state', name: st } : { kind: 'all', name: 'Everyone' };
}

export type RankRow = {
  userId: string; name: string | null; area: string | null; xp: number; prevXp: number;
  private: boolean; avatarUrl: string | null; finisher: boolean; level?: string;
};
export type RankEntry = { rank: number; userId: string; name: string; area: string; points: number; move: number; me: boolean; avatarUrl: string | null; finisher: boolean; level: string };

const order = <T extends { userId: string; name: string }>(rows: T[], pts: (r: T) => number) =>
  rows.slice().sort((a, b) => pts(b) - pts(a) || a.name.localeCompare(b.name) || a.userId.localeCompare(b.userId));

export function rankBoard(rows: RankRow[], viewerId: string, take = 25) {
  const named = rows.filter(r => r.xp > 0).map(r => ({
    ...r,
    name: r.userId === viewerId ? (r.name || 'You') : r.private ? 'Anonymous learner' : (r.name || 'Learner'),
    avatarUrl: r.private && r.userId !== viewerId ? null : r.avatarUrl,
  }));
  const now = order(named, r => r.xp);
  const prevRank = new Map(order(named, r => r.prevXp).map((r, i) => [r.userId, i + 1]));
  const all: RankEntry[] = now.map((r, i) => ({
    rank: i + 1,
    userId: r.userId === viewerId ? r.userId : '',
    name: r.name,
    area: r.area?.trim() || 'Area not set',
    points: r.xp,
    move: r.prevXp > 0 ? (prevRank.get(r.userId)! - (i + 1)) : 0, // positive = moved up
    me: r.userId === viewerId,
    avatarUrl: r.avatarUrl,
    finisher: r.finisher,
    level: r.level ?? '',
  }));
  const mine = all.find(e => e.me) ?? null;
  const above = mine && mine.rank > 1 ? all[mine.rank - 2] : null;
  return {
    total: all.length,
    list: all.slice(0, take),
    me: mine && { rank: mine.rank, total: all.length, topPercent: Math.max(1, Math.ceil((mine.rank / all.length) * 100)), move: mine.move, points: mine.points, level: mine.level },
    nextUp: above && mine ? { name: above.name, rank: above.rank, gap: above.points - mine.points + 1 } : null,
  };
}
