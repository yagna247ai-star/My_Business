/** Points, area rankings and the final-fight bracket (docs/data-analytics-journey/GAMIFICATION-SPEC.md). Pure. */
import { describe, it, expect } from 'vitest';
import { dayPoints, levelDayPoints, levelPoints, topByArea, seedRound, decide, rankByWins, hackathonRanking, type Entry, MODULE_WEIGHT } from '@/lib/domain/points';

const e = (userId: string, name: string, area: string, points: number): Entry => ({ userId, name, area, points });

describe('points: days and levels', () => {
  it('day 1 (M1, weight 1.0) is 10 points and day 42 (M9, weight 3.0) is 30', () => {
    expect(dayPoints(1)).toBe(10);
    expect(dayPoints(42)).toBe(30);
  });
  it('a module total is the sum of its days', () => {
    // M1 has days 1–4 at weight 1.0 → 4 × 10 = 40
    expect(levelDayPoints('DA01_FUNDAMENTALS')).toBe(40);
  });
  it('a learner level score adds completed day points and activity XP', () => {
    expect(levelPoints('DA01_FUNDAMENTALS', [1, 2, 9], 25)).toBe(10 + 10 + 25);
  });
  it('every module has a weight', () => {
    expect(Object.keys(MODULE_WEIGHT)).toHaveLength(9);
  });
  it('rejects a day outside 1–45', () => {
    expect(() => dayPoints(46)).toThrow();
  });
});

describe('area rankings (top 3 per area)', () => {
  const entries = [
    e('1', 'Asha', 'Hyderabad', 300), e('2', 'Ravi', 'Hyderabad', 250), e('3', 'Meera', 'Hyderabad', 200),
    e('4', 'Kiran', 'Hyderabad', 150), e('5', 'Dev', 'Danda', 90), e('6', 'Lata', 'Danda', 120),
  ];
  it('keeps the top 3 in each area, ordered by points', () => {
    const top = topByArea(entries, 3);
    expect(top.Hyderabad.map(x => x.name)).toEqual(['Asha', 'Ravi', 'Meera']);
    expect(top.Danda.map(x => x.name)).toEqual(['Lata', 'Dev']);
  });
  it('ties are broken by name, so the result is stable', () => {
    const tie = [e('1', 'Zed', 'Pune', 50), e('2', 'Amy', 'Pune', 50)];
    expect(topByArea(tie, 1).Pune[0].name).toBe('Amy');
  });
  it('hackathon ranking is split by area and has one global order', () => {
    const r = hackathonRanking(entries);
    expect(r.global[0].name).toBe('Asha');
    expect(r.byArea.Danda.map(x => x.name)).toEqual(['Lata', 'Dev']);
  });
});

describe('final fight: bracket', () => {
  it('seeds best against worst', () => {
    const six = [e('1', 'A', 'x', 600), e('2', 'B', 'x', 500), e('3', 'C', 'x', 400), e('4', 'D', 'x', 300), e('5', 'E', 'x', 200), e('6', 'F', 'x', 100)];
    const r = seedRound(six);
    expect(r.map(m => [m.a.name, m.b?.name])).toEqual([['A', 'F'], ['B', 'E'], ['C', 'D']]);
  });
  it('an odd field gives the middle seed a bye', () => {
    const five = [e('1', 'A', 'x', 5), e('2', 'B', 'x', 4), e('3', 'C', 'x', 3), e('4', 'D', 'x', 2), e('5', 'E', 'x', 1)];
    const r = seedRound(five);
    expect(r[r.length - 1].b).toBeNull();
  });
  it('the higher final-challenge score wins; a tie goes to the higher seed', () => {
    const m = { a: e('1', 'A', 'x', 10), b: e('2', 'B', 'x', 5) };
    expect(decide(m, 40, 55).name).toBe('B');
    expect(decide(m, 40, 40).name).toBe('A');
  });
  it('ranking after the bracket is by wins, then points', () => {
    const all = [e('1', 'A', 'x', 10), e('2', 'B', 'x', 50), e('3', 'C', 'x', 30)];
    const ranked = rankByWins({ '1': 2, '2': 0, '3': 2 }, all);
    expect(ranked.map(x => x.name)).toEqual(['C', 'A', 'B']);
  });
});

import { runBracket } from '@/lib/domain/points';

describe('final fight: full bracket run', () => {
  const field = [e('1', 'A', 'x', 900), e('2', 'B', 'x', 800), e('3', 'C', 'x', 700), e('4', 'D', 'x', 600), e('5', 'E', 'x', 500)];
  const final: Record<string, number> = { '1': 40, '2': 90, '3': 70, '4': 60, '5': 10 };

  it('plays rounds until one champion is left', () => {
    const r = runBracket(field, id => final[id] ?? 0);
    expect(r.champion.name).toBe('B');
    expect(r.rounds.length).toBeGreaterThanOrEqual(2);
    expect(r.rounds[r.rounds.length - 1].length).toBe(1);
  });
  it('the final ranking is by wins, then points, and includes everyone', () => {
    const r = runBracket(field, id => final[id] ?? 0);
    expect(r.ranking).toHaveLength(5);
    expect(r.ranking[0].name).toBe('B');
  });
  it('a single learner is champion with no matches', () => {
    const r = runBracket([field[0]], () => 0);
    expect(r.champion.name).toBe('A');
    expect(r.rounds).toHaveLength(0);
  });
});
