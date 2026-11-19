import { describe, it, expect } from 'vitest';
import { nextStep, hintPrompt, runStuckHelper, MAX_HINTS, FALLBACK } from '@/lib/ai/stuckHelper';

describe('stuck helper routing', () => {
  it('asks what the learner tried before any hint', () => {
    expect(nextStep({ tried: '', hints: [] })).toBe('ask_tried');
  });
  it('gives one hint at a time once they say what they tried', () => {
    expect(nextStep({ tried: 'I used WHERE on the total', hints: [] })).toBe('hint');
    expect(nextStep({ tried: 'x', hints: ['h1', 'h2'] })).toBe('hint');
  });
  it('escalates to a mentor after three hints', () => {
    expect(MAX_HINTS).toBe(3);
    expect(nextStep({ tried: 'x', hints: ['h1', 'h2', 'h3'] })).toBe('escalate');
  });
  it('the prompt forbids giving the full answer and includes earlier hints', () => {
    const p = hintPrompt({ question: 'Filter groups by total', tried: 'WHERE SUM(x) > 5', hints: ['Think about when filtering happens.'], levelTitle: 'SQL' });
    expect(p).toMatch(/never give the full answer/i);
    expect(p).toMatch(/one hint/i);
    expect(p).toContain('Think about when filtering happens.');
  });
});

describe('stuck helper graph', () => {
  const fake = async (prompt: string) => `Hint ${(prompt.match(/^- /gm) || []).length + 1}: look at where the filter runs.`;

  it('runs: ask → hint → hint → hint → escalate', async () => {
    let s = await runStuckHelper({ question: 'Filter groups', tried: '', hints: [], levelTitle: 'SQL' }, fake);
    expect(s.step).toBe('ask_tried');
    expect(s.reply).toMatch(/what have you tried/i);
    const base = { question: 'Filter groups', tried: 'WHERE SUM', levelTitle: 'SQL' };
    s = await runStuckHelper({ ...base, hints: [] }, fake);
    expect(s.step).toBe('hint'); expect(s.hints).toHaveLength(1);
    s = await runStuckHelper({ ...base, hints: s.hints }, fake);
    s = await runStuckHelper({ ...base, hints: s.hints }, fake);
    expect(s.hints).toHaveLength(3);
    s = await runStuckHelper({ ...base, hints: s.hints }, fake);
    expect(s.step).toBe('escalate');
    expect(s.reply).toMatch(/mentor/i);
  });

  it('with no model configured, says so and never invents an answer', async () => {
    const s = await runStuckHelper({ question: 'q', tried: 'x', hints: [], levelTitle: 'SQL' }, null);
    expect(s.step).toBe('fallback');
    expect(s.reply).toBe(FALLBACK);
    expect(s.hints).toHaveLength(0);
  });

  it('if the model fails, falls back instead of erroring', async () => {
    const s = await runStuckHelper({ question: 'q', tried: 'x', hints: [], levelTitle: 'SQL' }, async () => { throw new Error('quota'); });
    expect(s.step).toBe('fallback');
  });
});
