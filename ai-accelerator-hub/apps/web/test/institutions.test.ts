import { describe, it, expect } from 'vitest';
import { codeProblem, normaliseCode, suggestCode, resolveCode, signTenant, readTenant, planJourneyMap, INSTITUTION_TYPES, profileSchema } from '@/lib/domain/institutionsCore';

// docs/INSTITUTIONS_SPEC.md
const SECRET = 'test-secret-test-secret-test-secret-1234';

describe('institution codes', () => {
  it('AC-1: 3–12 letters or digits, saved upper-case, unique suggestions', () => {
    expect(codeProblem('SLNHRD')).toBeNull();
    expect(codeProblem('ab')).toMatch(/3/);
    expect(codeProblem('TOO-LONG-CODE-1')).not.toBeNull();
    expect(codeProblem('AI HUB')).not.toBeNull();
    expect(normaliseCode('  aihub ')).toBe('AIHUB');
    expect(suggestCode('Sri Lakshmi Narasimha HRD', new Set())).toBe('SLNHRD');
    expect(suggestCode('Disparity', new Set())).toBe('DISPARITY');
    expect(suggestCode('Ascend Analytics Hub', new Set(['AAH']))).toBe('AAH2');
    expect(suggestCode('AI Accelerator Hub', new Set())).toBe('AIAH');
    expect(suggestCode('!!', new Set())).toBe('INST');
    expect(INSTITUTION_TYPES).toContain('company');
  });
});

describe('resolveCode', () => {
  const tenants = [{ id: 't1', code: 'SKILL01', status: 'active' }, { id: 't2', code: 'OFF', status: 'suspended' }];
  const cohorts = [{ id: 'c1', tenantId: 't1', inviteCode: 'BATCH-7' }];
  it('AC-2: institution code, cohort code, empty → default, unknown', () => {
    expect(resolveCode('skill01', tenants, cohorts)).toEqual({ kind: 'institution', tenantId: 't1' });
    expect(resolveCode('batch-7', tenants, cohorts)).toEqual({ kind: 'cohort', tenantId: 't1', cohortId: 'c1' });
    expect(resolveCode('', tenants, cohorts)).toEqual({ kind: 'default' });
    expect(resolveCode('  ', tenants, cohorts)).toEqual({ kind: 'default' });
    expect(resolveCode('NOPE', tenants, cohorts)).toEqual({ kind: 'unknown' });
    expect(resolveCode('OFF', tenants, cohorts)).toEqual({ kind: 'unknown' }); // suspended institutions do not take sign-ups
  });
});

describe('switch cookie', () => {
  it('AC-3: signed; tampering is rejected', () => {
    const v = signTenant('tenant_123', SECRET);
    expect(readTenant(v, SECRET)).toBe('tenant_123');
    expect(readTenant(v.replace('tenant_123', 'tenant_999'), SECRET)).toBeNull();
    expect(readTenant(v, 'other-secret-other-secret-other-1234')).toBeNull();
    expect(readTenant(undefined, SECRET)).toBeNull();
    expect(readTenant('garbage', SECRET)).toBeNull();
  });
});

describe('journey mapping for transfers', () => {
  const src = { levels: [{ id: 'L1', code: 'DA01' }, { id: 'L2', code: 'DA02' }], activities: [{ id: 'A1', levelCode: 'DA01', idx: 1 }, { id: 'A2', levelCode: 'DA02', idx: 1 }], contents: [{ id: 'C1', levelCode: 'DA01', position: 1 }] };
  it('AC-4: maps by codes and lists what is missing', () => {
    const tgt = { levels: [{ id: 'X1', code: 'DA01' }], activities: [{ id: 'Y1', levelCode: 'DA01', idx: 1 }], contents: [{ id: 'Z1', levelCode: 'DA01', position: 1 }] };
    const p = planJourneyMap(src, tgt);
    expect(p.levels.get('L1')).toBe('X1');
    expect(p.activities.get('A1')).toBe('Y1');
    expect(p.contents.get('C1')).toBe('Z1');
    expect(p.missing).toEqual(['level DA02', 'activity DA02#1']);
    expect(planJourneyMap(src, { levels: [{ id: 'a', code: 'DA01' }, { id: 'b', code: 'DA02' }], activities: [{ id: 'c', levelCode: 'DA01', idx: 1 }, { id: 'd', levelCode: 'DA02', idx: 1 }], contents: [{ id: 'e', levelCode: 'DA01', position: 1 }] }).missing).toEqual([]);
  });
});

describe('profile', () => {
  it('validates the full profile', () => {
    expect(profileSchema.safeParse({ type: 'skill_centre', legalName: 'SLN HRD Pvt Ltd', pincode: '500072', contactEmail: 'info@sln.in', website: 'https://sln.in', established: 2009 }).success).toBe(true);
    expect(profileSchema.safeParse({ pincode: '5000' }).success).toBe(false);
    expect(profileSchema.safeParse({ established: 1700 }).success).toBe(false);
    expect(profileSchema.safeParse({ type: 'castle' }).success).toBe(false);
  });
});
