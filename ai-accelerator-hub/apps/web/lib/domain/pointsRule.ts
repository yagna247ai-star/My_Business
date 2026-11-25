/**
 * The one points rule for every ranking (docs/RANKS_UNIFIED_SPEC.md). Pure: no database.
 * Points = XP earned on journey levels (ledger entries with a levelId), from any of the learner's journeys.
 * Bonuses without a level (streaks, badges, social) do not count towards rank.
 */
export type LedgerEntry = { userId: string; amount: number; levelId: string | null; createdAt: Date };
export type Ranked = { userId: string; name: string; points: number; reachedAt: Date };

export function rankPoints(entries: LedgerEntry[], levelIds?: string[] | null): Map<string, { points: number; reachedAt: Date }> {
  const only = levelIds && levelIds.length ? new Set(levelIds) : null;
  const out = new Map<string, { points: number; reachedAt: Date }>();
  const sorted = entries.filter(e => e.levelId && (!only || only.has(e.levelId))).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  for (const e of sorted) {
    const cur = out.get(e.userId) ?? { points: 0, reachedAt: e.createdAt };
    cur.points += e.amount;
    cur.reachedAt = e.createdAt; // when they reached their current total
    out.set(e.userId, cur);
  }
  return out;
}

/** Points high to low; a tie goes to whoever reached the total first; then name; then id (stable for everyone). */
export function compareRanked(a: { userId: string; name: string; points: number; reachedAt?: Date | null }, b: { userId: string; name: string; points: number; reachedAt?: Date | null }): number {
  const t = (x?: Date | null) => x ? x.getTime() : Number.MAX_SAFE_INTEGER;
  return b.points - a.points || t(a.reachedAt) - t(b.reachedAt) || a.name.localeCompare(b.name) || a.userId.localeCompare(b.userId);
}
