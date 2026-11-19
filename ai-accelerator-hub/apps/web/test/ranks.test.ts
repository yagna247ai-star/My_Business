import { describe, it, expect } from 'vitest';
import { rankBoard, cityScope, stateOf, MIN_CITY_MEMBERS, type RankRow } from '@/lib/domain/ranksCore';

const row = (id: string, xp: number, prevXp: number, area = 'Hyderabad', extra: Partial<RankRow> = {}): RankRow =>
  ({ userId: id, name: `L${id}`, area, xp, prevXp, private: false, avatarUrl: null, finisher: false, ...extra });

describe('state lookup', () => {
  it('maps known cities to their state', () => {
    expect(stateOf('Hyderabad')).toBe('Telangana');
    expect(stateOf('bengaluru')).toBe('Karnataka');
  });
  it('unknown cities have no state', () => expect(stateOf('Nowhere')).toBeNull());
});

describe('city scope', () => {
  it(`a city with ${MIN_CITY_MEMBERS}+ members is ranked as a city`, () => {
    expect(cityScope('Hyderabad', { Hyderabad: 10 })).toEqual({ kind: 'city', name: 'Hyderabad' });
  });
  it('a smaller city is ranked at state level', () => {
    expect(cityScope('Pune', { Pune: 2 })).toEqual({ kind: 'state', name: 'Maharashtra' });
  });
  it('a small city with no known state falls back to everyone', () => {
    expect(cityScope('Nowhere', { Nowhere: 1 })).toEqual({ kind: 'all', name: 'Everyone' });
  });
});

describe('rank board', () => {
  const rows = [row('a', 900, 900), row('b', 800, 700), row('c', 700, 750), row('d', 600, 600), row('z', 0, 0)];

  it('ranks by points, skips learners with no points, and counts members', () => {
    const b = rankBoard(rows, 'c');
    expect(b.list.map(r => r.name)).toEqual(['La', 'Lb', 'Lc', 'Ld']);
    expect(b.list.map(r => r.rank)).toEqual([1, 2, 3, 4]);
    expect(b.total).toBe(4);
  });
  it('shows movement since the previous standings', () => {
    const b = rankBoard(rows, 'c');
    // previous order: a 900, c 750, b 700, d 600 → b moved up 1, c moved down 1
    expect(b.list.find(r => r.name === 'Lb')!.move).toBe(1);
    expect(b.list.find(r => r.name === 'Lc')!.move).toBe(-1);
    expect(b.list.find(r => r.name === 'La')!.move).toBe(0);
  });
  it('gives the viewer their place, top percent and the gap to the next place', () => {
    const b = rankBoard(rows, 'c');
    expect(b.me).toMatchObject({ rank: 3, total: 4, topPercent: 75, move: -1 });
    expect(b.nextUp).toMatchObject({ rank: 2, gap: 101 });
  });
  it('the leader has no next place', () => {
    expect(rankBoard(rows, 'a').nextUp).toBeNull();
  });
  it('hides private learners from others but not from themselves', () => {
    const p = [row('a', 900, 900, 'Hyderabad', { private: true }), row('b', 800, 800)];
    expect(rankBoard(p, 'b').list[0].name).toBe('Anonymous learner');
    expect(rankBoard(p, 'a').list[0].name).toBe('La');
  });
  it('never sends other learners\' ids', () => {
    const b = rankBoard(rows, 'c');
    expect(b.list.filter(r => r.userId && r.userId !== 'c')).toHaveLength(0);
  });
  it('limits the list but keeps the full member count', () => {
    const many = Array.from({ length: 40 }, (_, i) => row(String(i), 1000 - i, 1000 - i));
    const b = rankBoard(many, '39', 25);
    expect(b.list).toHaveLength(25);
    expect(b.total).toBe(40);
    expect(b.me!.rank).toBe(40);
  });
});
