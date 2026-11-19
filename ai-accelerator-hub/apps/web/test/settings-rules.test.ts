import { describe, it, expect } from 'vitest';
import { slugify, SLUG_RE, passwordProblem, mergeInstituteProfile, pickInstituteProfile, memberActionProblem, isAssignable, instituteDeleteProblem, cohortDatesProblem, cleanSkills } from '@/lib/domain/settingsRules';
import { can, MATRIX } from '@/lib/server/rbac';

describe('slugify', () => {
  it('makes a url-safe short name', () => {
    expect(slugify('Weekend Cohort 08!')).toBe('weekend-cohort-08');
    expect(slugify('  École Supérieure  ')).toBe('ecole-superieure');
    expect(slugify('!!!', 'cohort')).toBe('cohort');
    expect(slugify('a'.repeat(60))).toHaveLength(40);
  });
  it('output always passes the short-name rule', () => {
    for (const s of ['VNR College', '--x--', 'a b c', 'Data & AI 2026']) expect(SLUG_RE.test(slugify(s))).toBe(true);
  });
  it('the short-name rule refuses bad input', () => {
    expect(SLUG_RE.test('Upper')).toBe(false);
    expect(SLUG_RE.test('-lead')).toBe(false);
    expect(SLUG_RE.test('trail-')).toBe(false);
    expect(SLUG_RE.test('ok-name-1')).toBe(true);
  });
});

describe('passwordProblem', () => {
  it('matches the registration rule', () => {
    expect(passwordProblem('short1')).toMatch(/10/);
    expect(passwordProblem('1234567890')).toMatch(/letter/);
    expect(passwordProblem('abcdefghij')).toMatch(/number/);
    expect(passwordProblem('Abcdefg-1234')).toBeNull();
  });
});

describe('institute profile', () => {
  it('keeps other settings keys such as the default journey', () => {
    const next = mergeInstituteProfile({ defaultJourneySlug: 'data-analytics-journey', city: 'Pune' }, { city: 'Hyderabad', phone: '  +91 1  ' });
    expect(next).toEqual({ defaultJourneySlug: 'data-analytics-journey', city: 'Hyderabad', phone: '+91 1' });
  });
  it('clears a field set to empty and ignores fields not sent', () => {
    expect(mergeInstituteProfile({ city: 'Pune', website: 'https://x.in' }, { city: '' })).toEqual({ website: 'https://x.in' });
  });
  it('reads back only profile fields', () => {
    expect(pickInstituteProfile({ defaultJourneySlug: 'x', about: 'Hi', phone: 5 })).toEqual({ about: 'Hi' });
  });
});

describe('member actions', () => {
  it('blocks acting on yourself and on platform Super Admins', () => {
    expect(memberActionProblem({ actorId: 'a', targetId: 'a', targetRole: 'learner' })).toMatch(/own/);
    expect(memberActionProblem({ actorId: 'a', targetId: 'b', targetRole: 'super_admin' })).toMatch(/centrally/);
    expect(memberActionProblem({ actorId: 'a', targetId: 'b', targetRole: 'tenant_admin' })).toBeNull();
  });
  it('super_admin is never assignable from People', () => {
    expect(isAssignable('super_admin')).toBe(false);
    expect(isAssignable('learner')).toBe(true);
    expect(isAssignable('nonsense')).toBe(false);
  });
});

describe('institute delete', () => {
  it('only empty, non-current institutes can be deleted', () => {
    expect(instituteDeleteProblem({ isCurrent: true, members: 0, cohorts: 0, journeys: 0, orders: 0 })).toMatch(/signed in/);
    expect(instituteDeleteProblem({ isCurrent: false, members: 1, cohorts: 2, journeys: 0, orders: 0 })).toBe('This institution still has 1 member, 2 cohorts. Deactivate it instead, or remove those first.');
    expect(instituteDeleteProblem({ isCurrent: false, members: 0, cohorts: 0, journeys: 0, orders: 0 })).toBeNull();
  });
});

describe('cohort dates', () => {
  it('end must not be before start; both optional', () => {
    expect(cohortDatesProblem(null, null)).toBeNull();
    expect(cohortDatesProblem('2026-12-01', null)).toBeNull();
    expect(cohortDatesProblem('2026-12-10', '2026-12-01')).toMatch(/after/);
    expect(cohortDatesProblem('nope', null)).toMatch(/valid/);
  });
});

describe('cleanSkills', () => {
  it('trims, de-duplicates and caps', () => {
    expect(cleanSkills([' SQL ', 'SQL', '', 'Excel'])).toEqual(['SQL', 'Excel']);
    expect(cleanSkills(Array.from({ length: 30 }, (_, i) => `s${i}`))).toHaveLength(15);
  });
});

describe('admin privileges for Settings', () => {
  it('Institution Admin can manage institute, people, cohorts and talent', () => {
    for (const p of ['institute:manage', 'members:manage', 'cohort:manage', 'talent:post'] as const) expect(can('tenant_admin', p)).toBe(true);
  });
  it('Super Admin holds every permission, including institute:manage', () => {
    expect(MATRIX.super_admin).toContain('institute:manage');
  });
  it('learners and other staff cannot manage the institute', () => {
    for (const r of ['learner', 'program_mgr', 'instructor', 'mentor', 'reviewer', 'team_lead', 'finance', 'support']) expect(can(r, 'institute:manage')).toBe(false);
  });
});
