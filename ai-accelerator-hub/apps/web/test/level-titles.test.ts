import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { titleFor, learnerTitle } from '@/lib/domain/levelTitles';
import { matchingDays } from '@/lib/domain/dayMaterialsCore';

// docs/LEVEL_TITLES_SPEC.md
const DA = ['DA01_FUNDAMENTALS', 'DA02_SQL', 'DA03_PYTHON_FUNDAMENTALS', 'DA04_PYTHON_ANALYTICS', 'DA05_POWER_BI', 'DA06_AI_FOR_ANALYTICS', 'DA07_MACHINE_LEARNING', 'DA08_ETL_DATA_QUALITY', 'DA09_CAPSTONE_READINESS']
  .map((code, i) => ({ idx: i + 1, code, title: `Level ${i + 1}` }));

describe('titles per level', () => {
  it('AC-1: data analytics titles and stars', () => {
    expect(DA.map(l => titleFor(l, 9).title)).toEqual(['Data Explorer', 'SQL Data Journalist', 'Python Coder', 'Python Data Analytics Specialist', 'Dashboard Storyteller', 'AI-Powered Analyst', 'Machine Learning Practitioner', 'Data Quality Engineer', 'Industry-Ready Data Analyst']);
    expect(DA.map(l => titleFor(l, 9).stars)).toEqual([1, 2, 2, 3, 3, 4, 4, 5, 5]);
  });
  it('AC-2: GenAI keeps its titles; others become Graduate unless they name a role', () => {
    expect(titleFor({ idx: 8, code: 'L08_DEVELOPER', title: 'AI Developer' }, 15).title).toBe('AI Developer');
    expect(titleFor({ idx: 3, code: 'L03_PROMPT_WIZARD', title: 'Prompt Wizard' }, 15).title).toBe('Prompt Wizard');
    expect(titleFor({ idx: 2, code: 'HR02_X', title: 'Recruitment Analytics' }, 6).title).toBe('Recruitment Analytics Graduate');
    expect(titleFor({ idx: 2, code: 'HR02_Y', title: 'Level 2 — People Data Analyst' }, 6).title).toBe('People Data Analyst');
  });
});

describe('the learner’s title', () => {
  it('AC-3: rising, highest approved wins, next title and max', () => {
    expect(learnerTitle(DA, [])).toEqual({ current: 'Rising Data Explorer', stars: 0, next: 'Data Explorer', levelsToNext: 1, isMax: false, levelIdx: 0 });
    expect(learnerTitle(DA, [1, 2])).toMatchObject({ current: 'SQL Data Journalist', stars: 2, next: 'Python Coder', levelsToNext: 1, isMax: false, levelIdx: 2 });
    expect(learnerTitle(DA, [1, 4])).toMatchObject({ current: 'Python Data Analytics Specialist', next: 'Dashboard Storyteller' });
    expect(learnerTitle(DA, [9])).toMatchObject({ current: 'Industry-Ready Data Analyst', next: null, levelsToNext: 0, isMax: true });
  });
  it('AC-4: ranks show titles, not the XP rank names', () => {
    const src = fs.readFileSync(new URL('../lib/domain/ranks.ts', import.meta.url), 'utf8');
    expect(src).toMatch(/learnerTitle\(/);
    expect(src).not.toMatch(/pick\(RANKS/);
  });
});

// docs/DAY_MATERIALS_SPEC.md v1.1
describe('course-wide materials', () => {
  it('AC-5: finds the same day of the same course in other institutions only', () => {
    const all = [
      { contentId: 'c-A', tenantId: 'A', journeySlug: 'da', levelCode: 'DA02_SQL', day: 9 },
      { contentId: 'c-B', tenantId: 'B', journeySlug: 'da', levelCode: 'DA02_SQL', day: 9 },
      { contentId: 'c-B2', tenantId: 'B', journeySlug: 'da', levelCode: 'DA02_SQL', day: 10 },
      { contentId: 'c-C', tenantId: 'C', journeySlug: 'genai', levelCode: 'DA02_SQL', day: 9 },
    ];
    expect(matchingDays(all[0], all).map(x => x.contentId)).toEqual(['c-B']);
  });
  it('AC-6: materials come before the lesson; the level page shows counts', () => {
    const day = fs.readFileSync(new URL('../app/(app)/levels/[code]/days/[day]/page.tsx', import.meta.url), 'utf8');
    expect(day.indexOf('<DayMaterials')).toBeGreaterThan(0);
    expect(day.indexOf('<DayMaterials')).toBeLessThan(day.indexOf('blocks.map'));
  });
});
