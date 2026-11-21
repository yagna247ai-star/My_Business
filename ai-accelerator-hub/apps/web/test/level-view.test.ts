/** Level and activity pages: what you do, what you leave with, words you will see, what to get ready. */
import { describe, it, expect } from 'vitest';
import { activityBrief, levelPrep, levelWords } from '../lib/domain/levelView';
import { JOURNEY_SPECS } from '../lib/domain/daDomains/tracks';
import { buildDomainJourney } from '../lib/domain/daDomains/curriculum';

describe('level and activity pages', () => {
  const j = buildDomainJourney(JOURNEY_SPECS.find(s => s.slug === 'bfsi')!);
  it('every activity of every level says what you do here, what you leave with, why, and how long', () => {
    for (const l of j.levels) for (const a of l.activities) {
      const b = activityBrief(a);
      expect(b.doHere.length, `${l.code} ${a.idx}`).toBeGreaterThan(20);
      expect(b.leaveWith.length).toBeGreaterThan(10);
      expect(b.why.length).toBeGreaterThan(10);
      expect(b.minutes).toBeGreaterThan(0);
    }
  });
  it('“Words you will see” come from the level’s own lessons', () => {
    const w = levelWords(j.levels[0].activities);
    expect(w.length).toBeGreaterThanOrEqual(3);
    expect(w[0].meaning.length).toBeGreaterThan(10);
  });
  it('what to get ready fits the module', () => {
    expect(levelPrep({ code: 'BFSI_M3_UNITY_CATALOG', title: 'Set Up Databricks' }).map(x => x.item).join(' ')).toMatch(/Databricks Free Edition/);
    expect(levelPrep({ code: 'BFSI_M7_POWER_BI', title: 'Power BI' }).map(x => x.item).join(' ')).toMatch(/Power BI Desktop/);
    expect(levelPrep({ code: 'X', title: 'Anything' }).length).toBeGreaterThanOrEqual(2);
  });
});

import { activityCoachContext } from '@/lib/domain/levelView';
describe('AI coach context for an activity', () => {
  it('carries the activity content but never its answers', () => {
    const s = activityCoachContext('Mission Briefing: EMI bounces', { kind: 'briefing', problem: 'Which borrowers bounced yesterday?', objective: 'Measurable questions', outcome: 'A canvas', criteria: ['Each KPI has a formula'], check: { q: 'Which is measurable?', options: ['By product, yesterday', 'Are we doing badly?'], answer: 0, why: 'SECRET-WHY' } });
    expect(s).toContain('Which borrowers bounced yesterday?');
    expect(s).toContain('Each KPI has a formula');
    expect(s).toContain('Are we doing badly?');
    expect(s).not.toContain('SECRET-WHY');
  });
  it('leaves out quiz answers and boss solutions, and is capped', () => {
    const learn = activityCoachContext('Learn', { kind: 'learn', lessons: [{ title: 'KPIs', body: 'A KPI is a number you track.' }], quiz: [{ q: 'Q', options: ['a', 'b'], answer: 1, why: 'QUIZ-SECRET' }] });
    expect(learn).toContain('A KPI is a number you track.');
    expect(learn).not.toContain('QUIZ-SECRET');
    const boss = activityCoachContext('Boss', { kind: 'boss', intro: 'Pick the right move', scenarios: [{ s: 'S', correct: [2] }], choices: ['BOSS-CHOICE'] });
    expect(boss).not.toContain('BOSS-CHOICE');
    expect(activityCoachContext('Learn', { kind: 'learn', lessons: Array.from({ length: 6 }, () => ({ title: 'x', body: 'y'.repeat(400) })) }, 500).length).toBeLessThanOrEqual(501);
  });
});
