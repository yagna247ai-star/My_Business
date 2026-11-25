/**
 * Pure rules for "automated review only" (docs/AUTO_REVIEW_ONLY_SPEC.md). No database.
 */
/** The dimensions templateReview() can score, with the data-analytics rubric weights. */
export const DEFAULT_WEIGHTS: Record<string, number> = { correct_result: 0.35, business_reading: 0.2, method: 0.2, reflection: 0.15, data_checks: 0.1 };
export const DEFAULT_THRESHOLD = 3;
export const ESCALATE_AFTER_MS = 15 * 60_000;

/**
 * Weights and pass mark for a level. A missing rubric, or one whose dimensions the template cannot score
 * (e.g. GENERIC_RUBRIC: problem, tech, ux…), would score every dimension 1 and reject everyone, so it falls back.
 */
export function rubricOrDefault(r: { dimensions: string; passThreshold: number } | null | undefined): { weights: Record<string, number>; threshold: number } {
  if (!r) return { weights: DEFAULT_WEIGHTS, threshold: DEFAULT_THRESHOLD };
  let dims: Record<string, { weight?: number }> = {};
  try { dims = JSON.parse(r.dimensions); } catch { /* fall back below */ }
  const weights = Object.fromEntries(Object.entries(dims).map(([k, v]) => [k, Number(v?.weight) || 0]));
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  const scored = Object.entries(weights).filter(([k]) => k in DEFAULT_WEIGHTS).reduce((a, [, w]) => a + w, 0);
  if (total <= 0 || scored / total < 0.99) return { weights: DEFAULT_WEIGHTS, threshold: DEFAULT_THRESHOLD };
  return { weights, threshold: r.passThreshold || DEFAULT_THRESHOLD };
}

/** A person is asked only when automation has had 15 minutes and still has not decided a ready submission. */
export function needsHuman(s: { state: string; submittedAt: Date; bossDone: boolean }, now = new Date()): boolean {
  return s.state === 'pending' && s.bossDone && now.getTime() - s.submittedAt.getTime() >= ESCALATE_AFTER_MS;
}
