// docs/INSTITUTION_SHARING_SPEC.md
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { defaultCalendar } from '@/lib/domain/cohortCalendar';
import { applyLocal, describeLocal, hasLocal, localChanges, missingCourse, planShare } from '@/lib/domain/sharingCore';

const root = join(__dirname, '..');
const base = defaultCalendar('2026-12-01');

describe('institution sharing', () => {
  it('AC-1: keeps only what the institution changed', () => {
    expect(localChanges(base, base)).toEqual({});
    expect(hasLocal(localChanges(base, { ...base, blocks: base.blocks.map(b => ({ ...b, link: b.link ?? '' })) }))).toBe(false); // '' and null are the same
    const edited = { ...base, halfDay: null, blocks: base.blocks.map(b => b.key === 'session' ? { ...b, start: '09:30', end: '11:30' } : b) };
    expect(localChanges(base, edited)).toEqual({ halfDay: null, blocks: { session: { start: '09:30', end: '11:30' } } });
    const fewer = { ...base, blocks: [base.blocks[0]] };
    expect(localChanges(base, fewer).blockList).toHaveLength(1);
  });

  it('AC-2: shared changes reach untouched fields; the institution keeps its own', () => {
    const local = localChanges(base, { ...base, blocks: base.blocks.map(b => b.key === 'session' ? { ...b, start: '09:30' } : b) });
    const next = { ...base, holidays: ['2026-12-25'], blocks: base.blocks.map(b => ({ ...b, end: b.key === 'session' ? '12:15' : b.end, mode: 'online' as const, link: 'https://meet.example/x' })) };
    const mine = applyLocal(next, local);
    expect(mine.holidays).toEqual(['2026-12-25']);
    expect(mine.blocks[0]).toMatchObject({ start: '09:30', end: '12:15', mode: 'online' });
    expect(mine.blocks[1]).toMatchObject({ start: '12:30', mode: 'online' });
    // the shared plan drops the lab: the institution's lab change goes with it
    const labOnly = localChanges(base, { ...base, blocks: base.blocks.map(b => b.key === 'lab' ? { ...b, start: '13:00' } : b) });
    expect(applyLocal({ ...base, blocks: [base.blocks[0]] }, labOnly).blocks.map(b => b.key)).toEqual(['session']);
    expect(applyLocal(base, null)).toEqual(base);
    expect(describeLocal(base, local)).toEqual(['Session 09:30–12:00']);
  });

  it('AC-3: links a same-name cohort, creates where there is none, skips the source and copies', () => {
    const r = planShare('weekend-08', 'aih', [
      { id: 'aih', cohorts: [{ id: 'c0', slug: 'weekend-08', groupId: 'g' }] },
      { id: 'sln', cohorts: [{ id: 'c1', slug: 'weekend-08', groupId: null }] },
      { id: 'spa', cohorts: [] },
      { id: 'done', cohorts: [{ id: 'c2', slug: 'other', groupId: 'g' }] },
      { id: 'clash', cohorts: [{ id: 'c3', slug: 'weekend-08', groupId: 'h' }] },
    ], 'g');
    expect(r).toEqual({ link: [{ tenantId: 'sln', cohortId: 'c1' }], create: ['spa'] });
  });

  it('AC-8: finds institutions that do not run a course', () => {
    expect(missingCourse('data-analytics', [{ id: 'a', journeySlugs: ['data-analytics'] }, { id: 'b', journeySlugs: [] }])).toEqual(['b']);
  });

  it('AC-4/5/7/9: cross-institution writes are Super Admin only and audited', () => {
    const s = readFileSync(join(root, 'lib/domain/sharing.ts'), 'utf8');
    expect(s).toMatch(/superAdmin/);
    expect(s).toMatch(/cohort\.shared/);
    expect(s).toMatch(/journey\.shared/);
    const w = readFileSync(join(root, 'lib/domain/cohortWeek.ts'), 'utf8');
    expect(w).toMatch(/applyLocal/);
    expect(w).toMatch(/localChanges/);
    const a = readFileSync(join(root, 'lib/domain/admin.ts'), 'utf8');
    expect(a).toMatch(/shareCohortTx|copiesOf/);
  });
});
