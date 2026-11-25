import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { DEFAULT_WEIGHTS, DEFAULT_THRESHOLD, rubricOrDefault, needsHuman, ESCALATE_AFTER_MS } from '@/lib/domain/autoReviewCore';
import { templateReview } from '@/lib/domain/autoReview';

// docs/AUTO_REVIEW_ONLY_SPEC.md
const read = (p: string) => fs.readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

describe('automated review only', () => {
  it('AC-1: a missing rubric falls back to default weights and still decides', () => {
    const r = rubricOrDefault(null);
    expect(r.weights).toEqual(DEFAULT_WEIGHTS);
    expect(r.threshold).toBe(DEFAULT_THRESHOLD);
    expect(Object.values(DEFAULT_WEIGHTS).reduce((a, b) => a + b, 0)).toBeCloseTo(1);
    const v = templateReview({ bossBest: 5, bossTotal: 5, bossMin: 3, reflectionScore: 5, briefFieldsMet: true, limitsWritten: true }, r.weights, r.threshold);
    expect(v.verdict).toBe('approved');
  });
  it('reads weights and threshold from a rubric row when present', () => {
    const r = rubricOrDefault({ dimensions: JSON.stringify({ correct_result: { weight: 1 } }), passThreshold: 4 });
    expect(r).toEqual({ weights: { correct_result: 1 }, threshold: 4 });
  });
  it('a rubric whose dimensions the template cannot score uses the default weights (GENERIC_RUBRIC bug)', () => {
    const generic = { dimensions: JSON.stringify({ problem: { weight: 0.5 }, tech: { weight: 0.5 } }), passThreshold: 3 };
    expect(rubricOrDefault(generic).weights).toEqual(DEFAULT_WEIGHTS);
    const v = templateReview({ bossBest: 5, bossTotal: 5, bossMin: 3, reflectionScore: 5, briefFieldsMet: true, limitsWritten: true }, rubricOrDefault(generic).weights, 3);
    expect(v.verdict).toBe('approved');
  });
  it('AC-2: a person is needed only after 15 minutes with the Boss done', () => {
    const now = new Date('2026-11-25T10:00:00Z');
    const ago = (m: number) => new Date(now.getTime() - m * 60_000);
    expect(ESCALATE_AFTER_MS).toBe(15 * 60_000);
    expect(needsHuman({ state: 'pending', submittedAt: ago(14), bossDone: true }, now)).toBe(false);
    expect(needsHuman({ state: 'pending', submittedAt: ago(16), bossDone: false }, now)).toBe(false);
    expect(needsHuman({ state: 'pending', submittedAt: ago(16), bossDone: true }, now)).toBe(true);
    expect(needsHuman({ state: 'approved', submittedAt: ago(60), bossDone: true }, now)).toBe(false);
  });
  it('AC-4: submitting proof no longer notifies human reviewers', () => {
    const src = read('lib/domain/journey.ts');
    const submit = src.slice(src.indexOf('export async function submitProof'), src.indexOf('runAutoReview(ctx.tenantId, st.progress.id)'));
    expect(submit).not.toContain('submission_needs_review');
  });
  it('AC-3: the sweep route checks the cron secret', () => {
    expect(read('app/api/cron/auto-review/route.ts')).toMatch(/CRON_SECRET/);
  });
  it('AC-5: the showcase does not promise a human review', () => {
    expect(read('app/(app)/showcase/page.tsx')).not.toMatch(/human review/i);
  });
});
