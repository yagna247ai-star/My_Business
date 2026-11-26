import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { chooseCourse, courseBoardRows } from '@/lib/domain/courseRanks';
import { rankPoints } from '@/lib/domain/pointsRule';

// docs/RANKS_UNIFIED_SPEC.md v1.1: ranks per course, per institution
const d = (s: string) => new Date(`2026-11-${s}T10:00:00Z`);
const GENAI = 'j-genai', DA = 'j-da';

describe('choosing the course', () => {
  const mine = [{ journeyId: GENAI, lastActiveAt: d('10') }, { journeyId: DA, lastActiveAt: d('20') }];
  it('AC-6: the requested course if allowed; else the most recent; staff may pick any', () => {
    expect(chooseCourse({ requested: GENAI, mine, staff: false, institutionCourses: [GENAI, DA, 'j-other'] })).toBe(GENAI);
    expect(chooseCourse({ requested: 'j-other', mine, staff: false, institutionCourses: [GENAI, DA, 'j-other'] })).toBe(DA);
    expect(chooseCourse({ requested: null, mine, staff: false, institutionCourses: [GENAI, DA] })).toBe(DA);
    expect(chooseCourse({ requested: 'j-other', mine: [], staff: true, institutionCourses: [GENAI, 'j-other'] })).toBe('j-other');
    expect(chooseCourse({ requested: 'j-foreign', mine: [], staff: true, institutionCourses: [GENAI] })).toBe(GENAI);
    expect(chooseCourse({ requested: null, mine: [], staff: false, institutionCourses: [] })).toBeNull();
  });
});

describe('no collision between courses', () => {
  const levelsOf = { [GENAI]: ['G1', 'G2'], [DA]: ['D1', 'D2'] };
  const ledger = [
    { userId: 'yagna', amount: 100, levelId: 'G1', createdAt: d('01') },
    { userId: 'yagna', amount: 40, levelId: 'D1', createdAt: d('02') },
    { userId: 'asha', amount: 70, levelId: 'D2', createdAt: d('03') },
    { userId: 'ravi', amount: 90, levelId: 'G2', createdAt: d('04') },
  ];
  const enrolled = { [GENAI]: new Set(['yagna', 'ravi']), [DA]: new Set(['yagna', 'asha']) };
  it('AC-7: each course counts only its own levels and its own learners', () => {
    const genai = courseBoardRows(rankPoints(ledger, levelsOf[GENAI]), enrolled[GENAI]);
    const da = courseBoardRows(rankPoints(ledger, levelsOf[DA]), enrolled[DA]);
    expect(genai).toEqual([{ userId: 'yagna', points: 100 }, { userId: 'ravi', points: 90 }]);
    expect(da).toEqual([{ userId: 'asha', points: 70 }, { userId: 'yagna', points: 40 }]);
  });
  it('a learner with points but not enrolled in the course is not ranked in it', () => {
    expect(courseBoardRows(rankPoints(ledger, levelsOf[GENAI]), new Set(['ravi']))).toEqual([{ userId: 'ravi', points: 90 }]);
  });
});

describe('every ranking filters by course enrollment', () => {
  const read = (p: string) => fs.readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
  it('AC-8: ranks, standings and the standings card use the chosen course', () => {
    for (const f of ['lib/domain/ranks.ts', 'lib/domain/standings.ts', 'lib/domain/insights.ts']) {
      const src = read(f);
      expect(src, f).toMatch(/courseMembers\(/);
      expect(src, f).toMatch(/journeyId/);
    }
    expect(read('app/(app)/ranks/page.tsx')).toMatch(/course/);
  });
});
