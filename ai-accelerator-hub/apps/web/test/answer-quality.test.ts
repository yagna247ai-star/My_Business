/** Answers are checked for quality, not length: no word counts, real and relevant answers pass, junk does not. */
import { describe, it, expect } from 'vitest';
import { checkAnswer, checkAll } from '../lib/domain/answerQuality';

const topic = 'Your KPIs and formulas';
const hint = 'Absence days, tests missed';

describe('answer quality (no word counts)', () => {
  it('accepts a short but real, relevant answer that an old 25-word minimum would have rejected', () => {
    const q = checkAnswer('Absence rate = days absent ÷ school days; tests missed per child this month.', { topic, hint, depth: 'detail' });
    expect(q.ok).toBe(true);
  });
  it('rejects empty, one-word, keyboard-mash and repeated answers, without ever mentioning a number of words', () => {
    for (const bad of ['', 'ok', 'asdf asdf asdf asdf', 'good good good good good good good', 'aaaaaaaa bbbbbbb cccccccc']) {
      const q = checkAnswer(bad, { topic, hint, depth: 'detail' });
      expect(q.ok, bad).toBe(false);
      expect(q.reason).not.toMatch(/\d+\s*words?|at least/i);
    }
  });
  it('rejects a copy of the example and an answer about something else', () => {
    expect(checkAnswer('Absence days, tests missed', { topic, hint }).ok).toBe(false);
    expect(checkAnswer('I like cricket and movies a lot.', { topic, hint }).ok).toBe(false);
  });
  it('never rejects an answer written in Telugu or Hindi for “not mentioning” an English word', () => {
    expect(checkAnswer('గైర్హాజరు రోజులు మరియు తప్పిన పరీక్షలు ప్రతి విద్యార్థికి లెక్కిస్తాను', { topic, hint }).ok).toBe(true);
    expect(checkAnswer('हर छात्र के अनुपस्थित दिन और छूटी परीक्षाएँ गिनती हूँ', { topic, hint }).ok).toBe(true);
  });
  it('detailed answers score higher than thin ones', () => {
    const thin = checkAnswer('I built the KPI formulas for absence and missed tests in Excel.', { topic, hint, depth: 'detail' });
    const rich = checkAnswer('I defined absence rate as days absent divided by school days. I counted tests missed per child each month. I checked the numbers against the register for two classes. I learned that holidays were double counted, so I removed them before calculating.', { topic, hint, depth: 'detail' });
    expect(rich.score).toBeGreaterThan(thin.score);
  });
  it('a good short answer to a generic question is not rejected for not repeating its words', () => {
    expect(checkAnswer('Rewrote it in Hindi and English, and shorter.', { topic: 'what you changed in the prompt, and why' }).ok).toBe(true);
  });
  it('checkAll returns one kind message per failing field', () => {
    const e = checkAll([{ key: 'a', text: 'ok', topic }, { key: 'b', text: 'Absence days per child and tests missed this term.', topic, hint }]);
    expect(Object.keys(e)).toEqual(['a']);
  });
});
