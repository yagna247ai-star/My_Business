import { describe, it, expect } from 'vitest';
import { learnerRows, headline, dayFunnel, weekly, findings, cohortTable, pct, type RawEnrollment, type Activity } from '@/lib/domain/analyticsCore';

// docs/ANALYTICS_INSIGHTS_SPEC.md
const NOW = new Date('2026-11-26T12:00:00Z');
const ago = (d: number) => new Date(NOW.getTime() - d * 86400e3);
const enr = (userId: string, opts: Partial<RawEnrollment> = {}): RawEnrollment => ({ userId, name: userId, role: 'learner', cohortId: 'A', state: 'active', enrolledAt: ago(30), ...opts });

describe('who counts', () => {
  it('AC-1: one person counts once; staff never count', () => {
    const rows = learnerRows([enr('u1'), enr('u1', { state: 'completed' }), enr('m1', { role: 'mentor' }), enr('u2', { state: 'dropped' })], [], 45, NOW);
    expect(rows.map(r => r.userId)).toEqual(['u1']);
  });
  it('AC-2: active, at risk, not started follow the definitions', () => {
    const acts: Activity[] = [{ userId: 'a', at: ago(2), day: 1 }, { userId: 'r', at: ago(9), day: 1 }];
    const rows = learnerRows([enr('a'), enr('r'), enr('n', { enrolledAt: ago(5) }), enr('fresh', { enrolledAt: ago(1) })], acts, 45, NOW);
    const by = Object.fromEntries(rows.map(r => [r.userId, r.status]));
    expect(by).toEqual({ a: 'active', r: 'at_risk', n: 'not_started', fresh: 'new' });
    const h = headline(rows);
    expect(h.learners).toBe(4); expect(h.activeWeek).toBe(1); expect(h.needAttention).toBe(2);
  });
});

describe('funnel and findings', () => {
  it('AC-3: zero days are listed; the biggest drop needs 5 learners on the day before', () => {
    const acts: Activity[] = [];
    for (let i = 0; i < 10; i++) acts.push({ userId: `u${i}`, at: ago(1), day: 1 });
    for (let i = 0; i < 4; i++) acts.push({ userId: `u${i}`, at: ago(1), day: 2 });
    const f = dayFunnel(acts, 4);
    expect(f.days.map(d => d.done)).toEqual([10, 4, 0, 0]);
    expect(f.biggestDrop).toEqual({ day: 2, from: 10, to: 4, dropPct: 60 });
    const small = dayFunnel([{ userId: 'x', at: ago(1), day: 1 }], 3);
    expect(small.biggestDrop).toBeNull();
  });
  it('AC-4: findings rank the biggest problems first and link somewhere', () => {
    const rows = learnerRows(Array.from({ length: 10 }, (_, i) => enr(`u${i}`, { enrolledAt: ago(10) })), [{ userId: 'u0', at: ago(1), day: 1 }], 45, NOW);
    const fs = findings({ rows, funnel: dayFunnel([], 45), cohorts: cohortTable(rows, new Map([['A', 'Batch A']])), reviewsWaiting: 0 });
    expect(fs[0].text).toMatch(/9 learners have not started/);
    expect(fs[0].href).toMatch(/^\/settings\/people/);
    expect(findings({ rows: [], funnel: dayFunnel([], 45), cohorts: [], reviewsWaiting: 0 })).toEqual([{ priority: 1, text: 'No learners in this journey yet. Share an invite code from Cohorts & Sessions.', href: '/admin/cohorts' }]);
  });
  it('AC-5: no NaN with zero learners', () => {
    const h = headline([]);
    expect(h).toEqual({ learners: 0, started: 0, activeWeek: 0, activePct: null, avgProgress: null, needAttention: 0, finished: 0 });
    expect(pct(0, 0)).toBeNull();
    expect(weekly([], NOW, 8)).toHaveLength(8);
  });
});
