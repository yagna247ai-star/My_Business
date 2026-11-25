import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { rankPoints, compareRanked, type LedgerEntry } from '@/lib/domain/pointsRule';

// docs/RANKS_UNIFIED_SPEC.md
const d = (s: string) => new Date(`2026-11-${s}T10:00:00Z`);
const ledger: LedgerEntry[] = [
  { userId: 'a', amount: 50, levelId: 'L1', createdAt: d('01') },
  { userId: 'a', amount: 20, levelId: null, createdAt: d('02') },   // streak bonus: does not count
  { userId: 'a', amount: 30, levelId: 'X9', createdAt: d('03') },   // another journey's level: counts
  { userId: 'b', amount: 80, levelId: 'L2', createdAt: d('04') },
  { userId: 'c', amount: 80, levelId: 'L1', createdAt: d('05') },
];

describe('one points rule', () => {
  it('AC-1: only XP earned on levels counts, from any journey', () => {
    const p = rankPoints(ledger);
    expect(p.get('a')?.points).toBe(80);
    expect(p.get('b')?.points).toBe(80);
  });
  it('AC-2: a level filter counts only that level', () => {
    const p = rankPoints(ledger, ['L1']);
    expect(p.get('a')?.points).toBe(50);
    expect(p.get('c')?.points).toBe(80);
    expect(p.has('b')).toBe(false);
  });
  it('AC-3: ties go to whoever reached the points first, then by name', () => {
    const p = rankPoints(ledger);
    const rows = ['a', 'b', 'c'].map(id => ({ userId: id, name: id.toUpperCase(), ...p.get(id)! }));
    expect(rows.sort(compareRanked).map(r => r.userId)).toEqual(['a', 'b', 'c']); // a reached 80 on the 3rd, b on the 4th, c on the 5th
    const same = [{ userId: 'z', name: 'Zed', points: 10, reachedAt: d('01') }, { userId: 'y', name: 'Amy', points: 10, reachedAt: d('01') }];
    expect(same.sort(compareRanked).map(r => r.name)).toEqual(['Amy', 'Zed']);
  });
});

describe('one page', () => {
  const read = (p: string) => fs.readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
  it('AC-4: old pages redirect to the right Ranks tab', () => {
    expect(read('app/(app)/leaderboard/page.tsx')).toMatch(/redirect\(.*\/ranks\?tab=cohort/);
    expect(read('app/(app)/leaderboard/areas/page.tsx')).toMatch(/\/ranks\?tab=areas/);
  });
  it('AC-5: the menu has one Ranks entry', () => {
    const nav = read('app/(app)/layout.tsx');
    expect(nav).toContain("href: '/ranks'");
    expect(nav).not.toContain("href: '/leaderboard'");
    expect(nav).not.toContain("href: '/leaderboard/areas'");
  });
});
