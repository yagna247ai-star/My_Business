// docs/LEVEL_RIBBON_SPEC.md
import { describe, it, expect } from 'vitest';
import { ribbonNodes } from '@/lib/domain/levelTitles';
import { JOURNEY_SPECS } from '@/lib/domain/daDomains/tracks';
import { buildDomainJourney } from '@/lib/domain/daDomains/curriculum';

const da = ['approved', 'approved', 'submitted', 'locked', 'locked', 'locked', 'locked', 'locked', 'locked'].map((state, i) => ({ idx: i + 1, code: `DA0${i + 1}_X`, title: `Level ${i + 1}: Something`, state }));

describe('level ribbon', () => {
  it('AC-1: every level shows Level N, its mapped title and a state', () => {
    const r = ribbonNodes(da);
    expect(r.nodes[0]).toMatchObject({ label: 'Level 1', title: 'Data Explorer', status: 'done', statusText: 'Done' });
    expect(r.nodes[1].title).toBe('SQL Data Journalist');
    expect(r.nodes[8].title).toBe('Industry-Ready Data Analyst');
  });
  it('AC-2: state labels', () => {
    const s = (state: string) => ribbonNodes([{ idx: 1, code: 'DA01_X', title: 'L1', state }]).nodes[0];
    expect(s('approved')).toMatchObject({ status: 'done', statusText: 'Done' });
    expect(s('submitted')).toMatchObject({ status: 'review', statusText: 'In review' });
    expect(s('needs_changes')).toMatchObject({ status: 'changes', statusText: 'Changes asked' });
    expect(s('available')).toMatchObject({ status: 'current', statusText: 'In progress' });
    expect(s('in_progress')).toMatchObject({ status: 'current', statusText: 'In progress' });
    expect(s('locked')).toMatchObject({ status: 'locked', statusText: 'Locked' });
  });
  it('AC-3/AC-4: the line fills to the last Done level; the count is the course’s own', () => {
    const r = ribbonNodes(da);
    expect(r.total).toBe(9);
    expect(r.doneUpTo).toBe(2);
    expect(r.fillPct).toBeCloseTo((1 / 8) * 100);
    expect(ribbonNodes(da.map(l => ({ ...l, state: 'locked' }))).fillPct).toBe(0);
  });
  it('AC-5: every course gets a non-empty title for every level', () => {
    for (const j of JOURNEY_SPECS) {
      const levels = buildDomainJourney(j).levels.map(l => ({ idx: l.idx, code: l.code, title: l.title, state: "locked" }));
      for (const n of ribbonNodes(levels).nodes) expect(n.title.trim().length, `${j.slug} level ${n.idx}`).toBeGreaterThan(2);
    }
  });
  it('AC-6: accessible name names the level, title and state', () => {
    expect(ribbonNodes(da).nodes[0].aria).toBe('Level 1 · Data Explorer · Done');
  });
});
