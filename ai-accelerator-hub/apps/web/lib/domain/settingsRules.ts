/**
 * Pure rules for the admin Settings area (Institute, People, Cohorts, Talent). No database access,
 * so every decision here is unit-tested in test/settings-rules.test.ts.
 */
import { ASSIGNABLE, type Role } from '@/lib/server/rbac';

export const PLANS = ['free', 'pro', 'enterprise'] as const;
export const INSTITUTE_STATUSES = ['active', 'suspended'] as const;
export const OPPORTUNITY_KINDS = ['internship', 'job', 'project', 'sponsorship'] as const;
export const VISIBILITIES = ['private', 'tenant', 'public'] as const;

/** "Weekend Cohort 08!" → "weekend-cohort-08". Empty input gives the fallback. */
export function slugify(raw: string, fallback = 'item', max = 40): string {
  return raw.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, max).replace(/-+$/, '') || fallback;
}

export const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/;

/** Same strength rule as self-registration: 10+ characters with a letter and a number. */
export function passwordProblem(pw: string): string | null {
  if (pw.length < 10) return 'Use at least 10 characters.';
  if (pw.length > 200) return 'Use at most 200 characters.';
  if (!/[A-Za-z]/.test(pw)) return 'Include at least one letter.';
  if (!/[0-9]/.test(pw)) return 'Include at least one number.';
  return null;
}

/** Contact details kept in Tenant.settings next to other keys (e.g. defaultJourneySlug), which must survive an edit. */
export type InstituteProfile = { contactEmail?: string; phone?: string; website?: string; city?: string; about?: string };
export const PROFILE_KEYS = ['contactEmail', 'phone', 'website', 'city', 'about'] as const;

export function mergeInstituteProfile(existing: Record<string, unknown>, profile: InstituteProfile): Record<string, unknown> {
  const next: Record<string, unknown> = { ...existing };
  for (const k of PROFILE_KEYS) {
    if (profile[k] === undefined) continue;
    const v = String(profile[k]).trim();
    if (v) next[k] = v; else delete next[k];
  }
  return next;
}

export function pickInstituteProfile(settings: Record<string, unknown>): InstituteProfile {
  const out: InstituteProfile = {};
  for (const k of PROFILE_KEYS) if (typeof settings[k] === 'string') out[k] = settings[k] as string;
  return out;
}

/**
 * Can `actor` remove or edit `target` in this institution?
 * Nobody acts on themselves here (that's what personal settings are for), and platform Super Admins
 * are managed centrally, never from an institution's People screen.
 */
export function memberActionProblem(a: { actorId: string; targetId: string; targetRole: string }): string | null {
  if (a.actorId === a.targetId) return 'You cannot change or remove your own membership here.';
  if (a.targetRole === 'super_admin') return 'Platform administrators are managed centrally.';
  return null;
}

export const isAssignable = (r: string): r is Role => (ASSIGNABLE as string[]).includes(r);

/** An institution may be permanently deleted only when nothing lives in it; otherwise deactivate it. */
export function instituteDeleteProblem(a: { isCurrent: boolean; members: number; cohorts: number; journeys: number; orders: number }): string | null {
  if (a.isCurrent) return 'You are signed in to this institution. Switch to another one before deleting it.';
  const parts: string[] = [];
  if (a.members) parts.push(`${a.members} member${a.members === 1 ? '' : 's'}`);
  if (a.cohorts) parts.push(`${a.cohorts} cohort${a.cohorts === 1 ? '' : 's'}`);
  if (a.journeys) parts.push(`${a.journeys} journey${a.journeys === 1 ? '' : 's'}`);
  if (a.orders) parts.push(`${a.orders} order${a.orders === 1 ? '' : 's'}`);
  return parts.length ? `This institution still has ${parts.join(', ')}. Deactivate it instead, or remove those first.` : null;
}

/** Cohort dates: both optional, but the end can't be before the start. */
export function cohortDatesProblem(start?: string | null, end?: string | null): string | null {
  const s = start ? new Date(start) : null; const e = end ? new Date(end) : null;
  if (s && isNaN(s.getTime())) return 'Start date is not a valid date.';
  if (e && isNaN(e.getTime())) return 'End date is not a valid date.';
  if (s && e && e < s) return 'End date must be on or after the start date.';
  return null;
}

export function cleanSkills(skills: string[], max = 15): string[] {
  return [...new Set(skills.map(s => s.trim().slice(0, 40)).filter(Boolean))].slice(0, max);
}
