import { describe, it, expect } from 'vitest';
import { toEntries, areaBoard } from '@/lib/domain/standingsCore';

const rows = [
  { userId: 'u1', name: 'Asha', area: 'Hyderabad', xp: 900, private: false },
  { userId: 'u2', name: 'Ravi', area: 'Hyderabad', xp: 800, private: true },
  { userId: 'u3', name: 'Meena', area: 'Hyderabad', xp: 700, private: false },
  { userId: 'u4', name: 'Kiran', area: 'Hyderabad', xp: 600, private: false },
  { userId: 'u5', name: 'Sita', area: 'Danda', xp: 500, private: false },
  { userId: 'u6', name: 'Noor', area: null, xp: 400, private: false },
];

describe('standings entries', () => {
  it('masks private learners except for the viewer', () => {
    const e = toEntries(rows, 'u1');
    expect(e.find(x => x.userId === 'u2')!.name).toBe('Anonymous learner');
    expect(toEntries(rows, 'u2').find(x => x.userId === 'u2')!.name).toBe('Ravi');
  });
  it('puts learners with no area under "Area not set"', () => {
    expect(toEntries(rows, 'u1').find(x => x.userId === 'u6')!.area).toBe('Area not set');
  });
});

describe('area board', () => {
  const b = areaBoard(toEntries(rows, 'u1'));
  it('crowns the top 3 per area only', () => {
    const hyd = b.areas.find(a => a.area === 'Hyderabad')!;
    expect(hyd.top.map(t => t.userId)).toEqual(['u1', 'u2', 'u3']);
    expect(hyd.top.map(t => t.crown)).toEqual([1, 2, 3]);
    expect(hyd.count).toBe(4);
  });
  it('ranks everyone globally by points', () => {
    expect(b.global.map(g => g.userId)).toEqual(['u1', 'u2', 'u3', 'u4', 'u5', 'u6']);
  });
  it('ignores learners with zero points', () => {
    const z = areaBoard(toEntries([{ userId: 'z', name: 'Zed', area: 'Pune', xp: 0, private: false }], 'x'));
    expect(z.areas).toHaveLength(0);
  });
});
