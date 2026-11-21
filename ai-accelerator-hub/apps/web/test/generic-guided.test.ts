import { describe, it, expect } from 'vitest';
import { GENERIC_GUIDED } from '@/lib/domain/genericGuided';
import { validateStep } from '@/lib/domain/guidedSteps';

describe('guided steps for the AI-Powered Data Analytics journey', () => {
  it('every one of the 45 days has 2–5 steps with a concept, an instruction and a check', () => {
    for (let d = 1; d <= 45; d++) {
      const steps = GENERIC_GUIDED[d];
      expect(steps, `day ${d}`).toBeTruthy();
      expect(steps.length, `day ${d}`).toBeGreaterThanOrEqual(2);
      expect(steps.length, `day ${d}`).toBeLessThanOrEqual(5);
      for (const s of steps) { expect(s.title && s.concept.length > 30 && s.do.length > 0, `day ${d}: ${s.title}`).toBeTruthy(); }
    }
  });
  it('every paste check compiles, accepts its own sample and rejects empty or unrelated text', () => {
    for (let d = 1; d <= 45; d++) for (const s of GENERIC_GUIDED[d]) {
      const c = s.check;
      if (c.kind !== 'paste') continue;
      expect(() => new RegExp(c.pattern, 'im'), `day ${d}: ${s.title}`).not.toThrow();
      expect(validateStep(s, { paste: c.sample }), `day ${d}: ${s.title} sample`).toEqual({ ok: true });
      expect(validateStep(s, { paste: '' }).ok).toBe(false);
    }
  });
  it('SQL checks need a real query, not just any text', () => {
    const s = GENERIC_GUIDED[7].find(x => x.title.startsWith('NULL'))!;
    expect(validateStep(s, { paste: 'I did it' }).ok).toBe(false);
    expect(validateStep(s, { paste: "SELECT * FROM loans WHERE closed_on = NULL" }).ok).toBe(false);
    expect(validateStep(s, { paste: "SELECT * FROM loans WHERE closed_on IS NULL; -- 41 rows" }).ok).toBe(true);
  });
  it('Day 13 grade check rejects wrong grades at the edges', () => {
    const s = GENERIC_GUIDED[13][1];
    expect(validateStep(s, { paste: '85 A\n84.9 B\n70 B\n50 C\n49.5 Fail' }).ok).toBe(true);
    expect(validateStep(s, { paste: '85 A\n84.9 A\n70 B\n50 C\n49.5 C' }).ok).toBe(false);
  });
});
