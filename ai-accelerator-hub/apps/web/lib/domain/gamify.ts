/**
 * Gamification helpers that are pure (no database), so they can be unit-tested.
 *
 * Crown rule: a learner's TOP level is the highest-numbered level they have had approved.
 * Only approved levels count, so a crown is earned by demonstrated competence, not by opening a page.
 */

export type LevelState = { idx: number; state: string };

/** The idx of the highest approved level, or null if no level is approved yet. */
export function topApprovedLevel(levels: LevelState[]): number | null {
  let top: number | null = null;
  for (const l of levels) {
    if (l.state === 'approved' && (top === null || l.idx > top)) top = l.idx;
  }
  return top;
}

/** A short label for the crown, e.g. "Top level: Level 4". */
export function crownLabel(idx: number | null, title?: string): string | null {
  if (idx === null) return null;
  return title ? `Top level: Level ${idx} · ${title}` : `Top level: Level ${idx}`;
}
