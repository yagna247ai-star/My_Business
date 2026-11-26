import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { parseMembersCsv, bulkSkipReason, BULK_ACTIONS, canUseBulkAction, PERMISSION_INFO } from '@/lib/domain/adminControlCore';
import { effectivePerms, MATRIX, type Permission } from '@/lib/server/rbac';
import { hasPerm, type Ctx } from '@/lib/server/context';

// docs/SUPER_ADMIN_CONTROL_SPEC.md
describe('CSV import', () => {
  it('AC-1: handles BOM, CRLF, quotes and spaces; defaults role and area', () => {
    const csv = '﻿name,email,role,cohort,area\r\n"Rao, Asha", Asha@Example.com ,learner,Batch 1,warangal\r\nRavi Kumar,ravi@example.com,,,\r\n';
    const r = parseMembersCsv(csv);
    expect(r.errors).toEqual([]);
    expect(r.rows).toEqual([
      { line: 2, name: 'Rao, Asha', email: 'asha@example.com', role: 'learner', cohort: 'Batch 1', area: 'Warangal', institution: null },
      { line: 3, name: 'Ravi Kumar', email: 'ravi@example.com', role: 'learner', cohort: null, area: 'Bhagyanagar', institution: null },
    ]);
  });
  it('AC-1: reports bad email, unknown role, unknown area and duplicates by line', () => {
    const r = parseMembersCsv('name,email,role,area\nA One,not-an-email,learner,\nB Two,b@x.com,wizard,\nC Three,c@x.com,learner,Atlantis\nD Four,b@x.com,learner,\nE Five,e@x.com,super_admin,');
    expect(r.errors.map(e => e.line)).toEqual([2, 3, 4, 5, 6]);
    expect(r.errors[0].message).toMatch(/email/i);
    expect(r.errors[1].message).toMatch(/role/i);
    expect(r.errors[2].message).toMatch(/area/i);
    expect(r.errors[3].message).toMatch(/twice|duplicate/i);
    expect(r.errors[4].message).toMatch(/role/i);
  });
  it('reads an optional institution code column (docs/INSTITUTIONS_SPEC.md)', () => {
    expect(parseMembersCsv('name,email,institution\nAsha Rao,a@x.com,skill01').rows[0].institution).toBe('SKILL01');
  });
  it('needs name and email columns, and caps the size', () => {
    expect(parseMembersCsv('foo,bar\n1,2').errors[0].message).toMatch(/name.*email/i);
    const big = 'name,email\n' + Array.from({ length: 2001 }, (_, i) => `P ${i},p${i}@x.com`).join('\n');
    expect(parseMembersCsv(big).errors[0].message).toMatch(/2,000/);
  });
});

describe('effective permissions', () => {
  it('AC-2: role ∪ grants − revokes; super_admin always has everything; unknown names ignored', () => {
    expect(effectivePerms('mentor', '[]', '[]').sort()).toEqual([...MATRIX.mentor].sort());
    const p = effectivePerms('mentor', JSON.stringify(['content:manage', 'nonsense']), JSON.stringify(['review:decide']));
    expect(p).toContain('content:manage');
    expect(p).not.toContain('review:decide');
    expect(p).not.toContain('nonsense' as Permission);
    expect(effectivePerms('super_admin', '[]', JSON.stringify(['members:manage']))).toContain('members:manage');
    expect(effectivePerms('learner', 'not json', null)).toEqual(MATRIX.learner);
  });
  it('AC-6: hasPerm uses the effective permissions when present', () => {
    const base: Ctx = { userId: 'u', email: 'e', name: 'n', tenantId: 't', tenantSlug: 's', tenantName: 'T', role: 'mentor', cohortId: null, superAdmin: false };
    expect(hasPerm(base, 'content:manage')).toBe(false);
    expect(hasPerm({ ...base, perms: effectivePerms('mentor', '["content:manage"]', '[]') }, 'content:manage')).toBe(true);
    expect(hasPerm({ ...base, perms: effectivePerms('mentor', '[]', '["review:read"]') }, 'review:read')).toBe(false);
  });
  it('every permission has a plain-English description for the Access screen', () => {
    for (const p of MATRIX.super_admin) expect(PERMISSION_INFO[p]?.length, p).toBeGreaterThan(10);
  });
});

describe('bulk rules', () => {
  it('AC-3: skips the caller and protects Super Admins', () => {
    expect(bulkSkipReason({ actorId: 'a', actorSuper: false, targetId: 'a', targetSuper: false })).toMatch(/yourself/);
    expect(bulkSkipReason({ actorId: 'a', actorSuper: false, targetId: 'b', targetSuper: true })).toMatch(/Super Admin/);
    expect(bulkSkipReason({ actorId: 'a', actorSuper: true, targetId: 'b', targetSuper: true })).toBeNull();
    expect(bulkSkipReason({ actorId: 'a', actorSuper: false, targetId: 'b', targetSuper: false })).toBeNull();
  });
  it('AC-3: Institution Admins cannot force a change or make Institution Admins', () => {
    expect(BULK_ACTIONS).toEqual(['suspend', 'activate', 'reset_link', 'force_change', 'set_role', 'set_cohort', 'set_area', 'remove']);
    expect(canUseBulkAction(false, 'force_change')).toBe(false);
    expect(canUseBulkAction(false, 'set_role', 'tenant_admin')).toBe(false);
    expect(canUseBulkAction(false, 'set_role', 'mentor')).toBe(true);
    expect(canUseBulkAction(true, 'force_change')).toBe(true);
    expect(canUseBulkAction(true, 'set_role', 'tenant_admin')).toBe(true);
  });
});

describe('forced password change', () => {
  it('AC-5: the app shell sends people who must change their password to /settings/password', () => {
    const src = fs.readFileSync(new URL('../app/(app)/layout.tsx', import.meta.url), 'utf8');
    expect(src).toMatch(/mustChangePassword/);
    expect(src).toContain("'/settings/password'");
  });
});
