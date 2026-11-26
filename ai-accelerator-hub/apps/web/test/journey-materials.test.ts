import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { can } from '@/lib/server/rbac';
import { MODULES } from '@/lib/domain/accessModules';
import { journeyMaterials } from '@/lib/domain/dayMaterialsCore';

const read = (p: string) => fs.readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

// docs/DAY_MATERIALS_SPEC.md v1.2
describe('who uploads materials', () => {
  it('AC-7: Institution Admin, Program Manager, Instructor and Course Mentor can; learners cannot', () => {
    for (const r of ['tenant_admin', 'program_mgr', 'instructor', 'mentor', 'super_admin']) expect(can(r, 'materials:manage'), r).toBe(true);
    for (const r of ['learner', 'team_lead', 'finance']) expect(can(r, 'materials:manage'), r).toBe(false);
    expect(MODULES.find(m => m.key === 'materials')?.manage).toEqual(['materials:manage']);
  });
});

describe('materials in the journey', () => {
  it('AC-8: unlocked days list their links; locked levels show only a count', () => {
    const levels = [{ id: 'L1', idx: 1, code: 'DA01', title: 'Fundamentals', locked: false }, { id: 'L2', idx: 2, code: 'DA02', title: 'SQL', locked: true }];
    const rows = [
      { id: 'm1', levelId: 'L1', day: 5, title: 'Day 5 slides', url: 'https://docs.google.com/presentation/d/A/edit', kind: 'slides', note: '', sortOrder: 0 },
      { id: 'm2', levelId: 'L1', day: 3, title: 'Sheet', url: 'https://docs.google.com/spreadsheets/d/B/edit', kind: 'sheet', note: '', sortOrder: 0 },
      { id: 'm3', levelId: 'L2', day: 9, title: 'SQL joins', url: 'https://x.test', kind: 'other', note: '', sortOrder: 0 },
    ];
    const g = journeyMaterials(rows, levels);
    expect(g.map(x => x.code)).toEqual(['DA01', 'DA02']);
    expect(g[0].days.map(d => d.day)).toEqual([3, 5]);
    expect(g[0].days[1].items[0]).toMatchObject({ id: 'm1', title: 'Day 5 slides', copyUrl: 'https://docs.google.com/presentation/d/A/copy' });
    expect(g[1]).toMatchObject({ locked: true, count: 1, days: [] });
  });
  it('AC-9: the journey page shows Study materials; staff menu has Day materials', () => {
    expect(read('app/(app)/levels/page.tsx')).toMatch(/Study materials/);
    expect(read('app/(app)/layout.tsx')).toMatch(/materials:manage/);
  });
});

// docs/LEVEL_TITLES_SPEC.md v1.1
describe('tags in the journey', () => {
  it('AC-5: title banner with next level, and a tag on every level tile', () => {
    const src = read('app/(app)/levels/page.tsx');
    expect(src).toMatch(/learnerTitle\(/);
    expect(src).toMatch(/titleFor\(/);
    expect(src).toMatch(/Earns/);
  });
});
