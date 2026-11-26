// docs/PROFILE_LEVELS_SPEC.md
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { levelRecord } from '@/lib/domain/levelTitles';

const da = Array.from({ length: 9 }, (_, i) => ({ idx: i + 1, code: `DA0${i + 1}_X`, title: `Level ${i + 1}: Something` }));
const root = join(__dirname, '..');

describe('finished levels on the profile', () => {
  it('AC-1: counts, titles, dates and the next level', () => {
    const r = levelRecord('AI-Powered Data Analytics', da, [{ idx: 1, at: '2026-11-01T10:00:00Z' }, { idx: 2, at: new Date('2026-11-20T10:00:00Z') }]);
    expect(r).toMatchObject({ course: 'AI-Powered Data Analytics', done: 2, total: 9, title: 'SQL Data Journalist', complete: false });
    expect(r.finished).toEqual([
      { idx: 1, code: 'DA01_X', label: 'Level 1', title: 'Data Explorer', at: '2026-11-01T10:00:00.000Z' },
      { idx: 2, code: 'DA02_X', label: 'Level 2', title: 'SQL Data Journalist', at: '2026-11-20T10:00:00.000Z' },
    ]);
    expect(r.next).toEqual({ idx: 3, label: 'Level 3', title: 'Python Coder' });
    expect(r.summary).toBe('Level 1 · Data Explorer, Level 2 · SQL Data Journalist');
    const all = levelRecord('DA', da, da.map(l => ({ idx: l.idx, at: null })));
    expect(all).toMatchObject({ done: 9, complete: true, next: null, title: 'Industry-Ready Data Analyst' });
  });
  it('AC-2: nothing approved → 0 of M and the first title to earn; other courses never mix in', () => {
    const r = levelRecord('DA', da, []);
    expect(r).toMatchObject({ done: 0, total: 9, finished: [], next: { idx: 1, title: 'Data Explorer' } });
    expect(levelRecord('Other', [{ idx: 1, code: 'X1', title: 'Level 1: Retail Explorer' }], [{ idx: 1, at: null }]).finished[0].title).toBe('Retail Explorer');
    expect(readFileSync(join(root, 'lib/domain/levelRecords.ts'), 'utf8')).toMatch(/level\.journeyId === e\.journeyId|journeyId: e\.journeyId/);
  });
  it('AC-3: the learner sees it on Profile & privacy and Career', () => {
    for (const f of ['app/(app)/settings/profile/page.tsx', 'app/(app)/career/page.tsx']) expect(readFileSync(join(root, f), 'utf8'), f).toMatch(/<LevelRecords /);
  });
  it('AC-4/AC-5: talent lists get levels from one batched query, after the existing visibility filters', () => {
    const t = readFileSync(join(root, 'lib/domain/talent.ts'), 'utf8');
    expect(t).toMatch(/levelRecordsFor\(/);
    expect(t).not.toMatch(/for \([^)]*\)\s*\{?\s*await levelRecordsFor/);
    const disc = t.slice(t.indexOf('export async function discoverTalent'), t.indexOf('export async function postOpportunity'));
    expect(disc.indexOf('levelRecordsFor(')).toBeGreaterThan(disc.indexOf('.slice(0, Math.min('));
  });
});

import { profileBadge } from '@/lib/domain/levelTitles';
describe('badge next to the profile photo (AC-6)', () => {
  const lv = (states: string[]) => states.map((state, i) => ({ idx: i + 1, code: `DA0${i + 1}_X`, title: `Level ${i + 1}: X`, state }));
  it('shows the highest finished level and its title, for the course', () => {
    expect(profileBadge('AI-Powered Data Analytics', lv(['approved', 'in_progress', 'locked']))).toMatchObject({ short: 'L1', text: 'L1 · Data Explorer', done: 1, total: 3, aria: 'AI-Powered Data Analytics: Level 1 finished · Data Explorer' });
    expect(profileBadge('DA', lv(['approved', 'approved', 'submitted']))!.text).toBe('L2 · SQL Data Journalist');
  });
  it('nothing until a level is approved (submitted is not finished)', () => {
    expect(profileBadge('DA', lv(['submitted', 'locked']))).toBeNull();
  });
  it('the header passes it to the chip next to the photo', () => {
    expect(readFileSync(join(root, 'app/(app)/layout.tsx'), 'utf8')).toMatch(/profileBadge\(/);
    const shell = readFileSync(join(root, 'components/app/Shell.tsx'), 'utf8');
    expect(shell).toMatch(/<span className="role-chip" title=\{user\.badge\?\.aria\}>\{user\.badge \? `✓ \$\{user\.badge\.text\}` : t\(user\.roleLabel\)\}<\/span>/); // same chip, "Learner" until a level is approved
    expect(shell).not.toMatch(/lvl-badge|menu-level/);
  });
});
