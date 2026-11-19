/**
 * Automated review by rubric template (no human wait). Pure rules; the rubric weights come from
 * docs/data-analytics-journey/00-INDEX.md §5: correct 0.35, business reading 0.25, method 0.20,
 * data checks 0.10, reflection 0.10. Pass: weighted average ≥ 3.0 and boss ≥ 2 correct.
 */
import { describe, it, expect } from 'vitest';
import { templateReview, type ReviewInput } from '@/lib/domain/autoReview';

const WEIGHTS = { correct_result: 0.35, business_reading: 0.25, method: 0.2, data_checks: 0.1, reflection: 0.1 };
const good: ReviewInput = { bossBest: 4, bossTotal: 4, bossMin: 2, reflectionWords: 60, briefFieldsMet: true, limitsWritten: true };

describe('automated review template', () => {
  it('approves a complete, correct submission and gives whole-number scores 1–5', () => {
    const r = templateReview(good, WEIGHTS, 3.0);
    expect(r.verdict).toBe('approved');
    for (const v of Object.values(r.scores)) expect(Number.isInteger(v) && v >= 1 && v <= 5).toBe(true);
    expect(r.avg).toBeGreaterThanOrEqual(3.0);
  });
  it('asks for changes when the boss is below the minimum, and says why', () => {
    const r = templateReview({ ...good, bossBest: 1 }, WEIGHTS, 3.0);
    expect(r.verdict).toBe('needs_changes');
    expect(r.feedback).toMatch(/boss|scenario/i);
  });
  it('asks for changes when the reflection is too short, and says why', () => {
    const r = templateReview({ ...good, reflectionWords: 12 }, WEIGHTS, 3.0);
    expect(r.verdict).toBe('needs_changes');
    expect(r.feedback).toMatch(/reflection/i);
  });
  it('approved work has nothing missing; a gap is listed with the points still available', () => {
    expect(templateReview(good, WEIGHTS, 3.0).missing).toEqual([]);
    const r = templateReview({ ...good, reflectionWords: 12 }, WEIGHTS, 3.0);
    expect(r.missing.length).toBeGreaterThan(0);
    for (const m of r.missing) {
      expect(m.points).toBeGreaterThan(0);
      expect(m.points).toBeLessThan(10); // encouraging: a fix earns a small, visible step
      expect(m.item.length).toBeGreaterThan(5);
    }
  });
  it('never waits: every input gives a decision', () => {
    const r = templateReview({ ...good, briefFieldsMet: false, limitsWritten: false, bossBest: 0 }, WEIGHTS, 3.0);
    expect(['approved', 'needs_changes']).toContain(r.verdict);
  });
});

import { parseGaps } from '@/lib/domain/gaps';

describe('gap highlights for the learner', () => {
  it('reads each gap from the automated feedback, with its points', () => {
    const r = templateReview({ ...good, bossBest: 1, reflectionWords: 10, limitsWritten: false }, WEIGHTS, 3.0);
    const gaps = parseGaps(r.feedback);
    expect(gaps.map(g => g.area)).toEqual(['Boss', 'Reflection', 'Data checks']);
    expect(gaps.map(g => g.points)).toEqual([5, 3, 2]);
    expect(gaps[1].text).toMatch(/at least 50 words/);
  });
  it('approved feedback has no gaps', () => {
    expect(parseGaps(templateReview(good, WEIGHTS, 3.0).feedback)).toEqual([]);
  });
});
