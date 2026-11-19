/**
 * Gamification (crown on top approved level), profile photos (avatar URL helpers) and the journey builder's
 * validation. Pure functions only: no database needed.
 */
import { describe, it, expect } from 'vitest';
import { topApprovedLevel, crownLabel } from '@/lib/domain/gamify';
import { avatarUrlFor, fileIdFromAvatarUrl } from '@/lib/domain/avatar';
import { journeyProblems, journeySpecSchema, type JourneySpec } from '@/lib/domain/journeyBuilder';

const CUID = 'ckx7q2w1a0000abcd1234efgh';

describe('crown: top approved level', () => {
  it('is null when nothing is approved yet', () => {
    expect(topApprovedLevel([{ idx: 1, state: 'available' }, { idx: 2, state: 'locked' }])).toBeNull();
  });
  it('is the highest approved level, not the first', () => {
    const levels = [{ idx: 1, state: 'approved' }, { idx: 2, state: 'approved' }, { idx: 3, state: 'in_progress' }, { idx: 4, state: 'approved' }];
    expect(topApprovedLevel(levels)).toBe(4);
  });
  it('ignores levels that are only completed or in review', () => {
    expect(topApprovedLevel([{ idx: 1, state: 'approved' }, { idx: 2, state: 'in_review' }, { idx: 3, state: 'completed' }])).toBe(1);
  });
  it('crown label names the level and its title', () => {
    expect(crownLabel(4, 'Prompt Wizard')).toBe('Top level: Level 4 · Prompt Wizard');
    expect(crownLabel(null)).toBeNull();
  });
});

describe('profile photo: avatar URL', () => {
  it('builds an inline file URL from a valid file id', () => {
    expect(avatarUrlFor(CUID)).toBe(`/api/v1/files/${CUID}?inline=1`);
  });
  it('rejects a file id that is not id-shaped (no path injection)', () => {
    expect(() => avatarUrlFor('../../etc/passwd')).toThrow();
    expect(() => avatarUrlFor('short')).toThrow();
  });
  it('reads the file id back from an avatar URL, and ignores other URLs', () => {
    expect(fileIdFromAvatarUrl(`/api/v1/files/${CUID}?inline=1`)).toBe(CUID);
    expect(fileIdFromAvatarUrl('https://evil.example/x.png')).toBeNull();
    expect(fileIdFromAvatarUrl(null)).toBeNull();
  });
});

const base = (): JourneySpec => journeySpecSchema.parse({
  slug: 'shop-analytics',
  title: 'Analytics for Shops',
  stages: [{ idx: 1, title: 'Foundations' }, { idx: 2, title: 'Insight' }],
  levels: [
    { idx: 1, code: 'L01_BASICS', title: 'Basics', stageIdx: 1, xp: 100 },
    { idx: 2, code: 'L02_QUERIES', title: 'Queries', stageIdx: 2, xp: 150 },
  ],
});

describe('journey builder: validation', () => {
  it('accepts a sound journey', () => {
    expect(journeyProblems(base())).toEqual([]);
  });
  it('flags a bad slug', () => {
    expect(journeyProblems({ ...base(), slug: 'Bad Slug!' }).join(' ')).toMatch(/Slug/);
  });
  it('flags a level in an undefined stage', () => {
    const s = base(); s.levels[1].stageIdx = 9;
    expect(journeyProblems(s).join(' ')).toMatch(/stage 9, which is not defined/);
  });
  it('flags gaps in level numbering', () => {
    const s = base(); s.levels[1].idx = 3;
    expect(journeyProblems(s).join(' ')).toMatch(/without gaps: level 2 is missing/);
  });
  it('flags duplicate level codes', () => {
    const s = base(); s.levels[1].code = 'L01_BASICS';
    expect(journeyProblems(s).join(' ')).toMatch(/used twice/);
  });
  it('flags a stage with no levels', () => {
    const s = base(); s.stages.push({ idx: 3, title: 'Empty' });
    expect(journeyProblems(s).join(' ')).toMatch(/Stage 3 has no levels/);
  });
  it('rejects more than 15 levels at the schema level', () => {
    const levels = Array.from({ length: 16 }, (_, i) => ({ idx: (i % 15) + 1, code: `L${i}_X`, title: 'T', stageIdx: 1, xp: 1 }));
    expect(journeySpecSchema.safeParse({ ...base(), levels }).success).toBe(false);
  });
});
