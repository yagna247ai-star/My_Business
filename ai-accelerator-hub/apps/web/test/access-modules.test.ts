import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { MODULES, moduleLevel, permsForLevels, levelsOf, type Level } from '@/lib/domain/accessModules';
import { MATRIX, ALL_PERMISSIONS, effectivePerms, type Role } from '@/lib/server/rbac';

// docs/ACCESS_MODULES_AND_NAV_SPEC.md
const read = (p: string) => fs.readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');
const ROLES = Object.keys(MATRIX).filter(r => r !== 'super_admin') as Role[];

describe('modules', () => {
  it('AC-1: every permission is in exactly one module', () => {
    const all = MODULES.flatMap(m => m.manage);
    expect([...all].sort()).toEqual([...ALL_PERMISSIONS].sort());
    expect(new Set(all).size).toBe(all.length);
    for (const m of MODULES) for (const p of m.view) expect(m.manage, m.key).toContain(p);
  });
  it('AC-2: chosen levels survive the round trip for every role', () => {
    for (const role of ROLES) for (const m of MODULES) for (const lv of (m.view.length ? ['none', 'view', 'manage'] : ['none', 'manage']) as Level[]) {
      const { grants, revokes } = permsForLevels(role, { [m.key]: lv });
      const eff = effectivePerms(role, JSON.stringify(grants), JSON.stringify(revokes));
      expect(moduleLevel(eff, m.key), `${role} ${m.key} ${lv}`).toBe(lv === moduleLevel(MATRIX[role], m.key) ? moduleLevel(MATRIX[role], m.key) : lv);
    }
  });
  it('AC-3: role defaults give no grants or revokes', () => {
    for (const role of ROLES) expect(permsForLevels(role, levelsOf(MATRIX[role]))).toEqual({ grants: [], revokes: [] });
  });
  it('names the levels plainly', () => {
    expect(moduleLevel(MATRIX.mentor, 'reviews')).toBe('manage');
    expect(moduleLevel(MATRIX.support, 'reviews')).toBe('view');
    expect(moduleLevel(MATRIX.learner, 'people')).toBe('none');
  });
});

describe('side bars and menu', () => {
  it('AC-4: the Settings menu collapses, with aria-expanded, applied before paint', () => {
    expect(read('components/settings/SettingsNav.tsx')).toMatch(/aria-expanded/);
    expect(read('app/layout.tsx')).toContain('aih_setnav');
  });
  it('AC-5: staff menu has Analytics, Access, Ranks and Showcase in clear groups', () => {
    const nav = read('app/(app)/layout.tsx');
    for (const s of ["href: '/admin', label: 'Analytics'", "href: '/settings/access'", "group: 'Overview'", "group: 'Governance'"]) expect(nav).toContain(s);
    expect(nav).toMatch(/!learner[^\n]*\/ranks/);
  });
});
