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

// docs/LEARNER_ANSWER_CHECK_SPEC.md — correct answers are never refused.
describe('right answers pass (LEARNER_ANSWER_CHECK_SPEC)', () => {
  const reflection = { topic: 'what you did, what surprised you, and what you learned', depth: 'detail' as const };
  it('AC-1: an answer that matches an example holding a result is accepted; a copy of a prose example is not', () => {
    expect(checkAnswer('4,890 · 8 · 611.25', { topic: 'Revenue, Orders and Avg Order Value for September', hint: '4,890 · 8 · 611.25' }).ok).toBe(true);
    expect(checkAnswer('0 with = NULL, 10 with IS NULL, because NULL is not equal to anything', { topic: 'The two counts and why = NULL gives 0', hint: '0 with = NULL, 10 with IS NULL, because NULL is not equal to anything' }).ok).toBe(true);
    expect(checkAnswer('bills, stock counts, supplier invoices, staff attendance, UPI payments', { topic: 'Ten things a grocery shop records in one day', hint: 'bills, stock counts, supplier invoices, staff attendance, UPI payments' }).ok).toBe(false);
  });
  it('AC-2: a short count answers a short question; two words without a number still do not', () => {
    for (const a of ['24 rows', '38', '12 rows left']) expect(checkAnswer(a, { topic: 'How many rows are left (bottom left of the editor)', hint: '24 rows' }).ok, a).toBe(true);
    expect(checkAnswer('many rows', { topic: 'How many rows are left (bottom left of the editor)', hint: '24 rows' }).ok).toBe(false);
  });
  it('AC-3: numbers like 100000, links and "....." are not "not a real answer"; real junk still is', () => {
    expect(checkAnswer('I cleaned the sales sheet and found total revenue was 100000 rupees, which surprised me. I learned to check totals.', reflection).ok).toBe(true);
    expect(checkAnswer('I built the inventory sheet and shared it at https://docs.google.com/spreadsheets/d/1C_Ek6lCZwdzt2Ur7sX5-lHDmyV1ZMxU7jA0V0Y6Kyk4/edit so reviewers can see it.', reflection).ok).toBe(true);
    expect(checkAnswer('I did the inventory..... it took time but I learned that validation matters for data.', reflection).ok).toBe(true);
    for (const bad of ['aaaaa bbbbb ccccc ddddd', 'qwerty asdf zxcv hjkl', 'supercalifragilisticexpialidociousandmorewordsjoined together here']) expect(checkAnswer(bad, reflection).ok, bad).toBe(false);
  });
  it('AC-4: a detailed Telugu or Hindi answer is not asked to add more', () => {
    expect(checkAnswer('నేను షీట్ తయారు చేశాను. డేటా క్లీనింగ్ నేర్చుకున్నాను.', reflection).ok).toBe(true);
    expect(checkAnswer('मैंने शीट बनाई। डेटा साफ़ करना सीखा।', reflection).ok).toBe(true);
  });
  it('AC-5: no refusal mentions a number of words', () => {
    for (const a of ['', 'ok', 'many rows', 'aaaaa bbbbb', 'I did it.']) expect(checkAnswer(a, reflection).reason ?? '').not.toMatch(/\d+\s*words?|at least/i);
  });
});
