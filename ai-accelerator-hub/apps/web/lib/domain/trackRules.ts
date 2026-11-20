/** Pure rules for journey tracks (no database), shared by the server, the UI and tests. */
import type { Role } from '@/lib/server/rbac';

export type TrackLevel = 'easy' | 'intermediate' | 'hard' | 'critical';
export const TRACK_LEVELS: TrackLevel[] = ['easy', 'intermediate', 'hard', 'critical'];
export const TRACK_NAMES: Record<TrackLevel, string> = { easy: 'Easy', intermediate: 'Intermediate', hard: 'Hard', critical: 'Critical' };
export const isTrackLevel = (v: unknown): v is TrackLevel => typeof v === 'string' && (TRACK_LEVELS as string[]).includes(v);

/** Staff roles that may move a learner to another track, unless the institution changes it in Settings. */
export const DEFAULT_TRACK_CHANGE_ROLES: Role[] = ['tenant_admin', 'program_mgr', 'instructor'];
/** Roles that can be given (or refused) the right to change learners' tracks. */
export const TRACK_CHANGE_ROLE_OPTIONS: Role[] = ['tenant_admin', 'program_mgr', 'instructor', 'mentor'];
/** Who may edit that list: Super Admin, Institution Admin and Program Manager. */
export const TRACK_SETTINGS_EDITORS: Role[] = ['tenant_admin', 'program_mgr'];

export function trackChangeRoles(settings: Record<string, unknown>): Role[] {
  const v = settings.trackChangeRoles;
  return Array.isArray(v) ? v.filter((r): r is Role => (TRACK_CHANGE_ROLE_OPTIONS as string[]).includes(r)) : DEFAULT_TRACK_CHANGE_ROLES;
}

/** May this staff member move learners between tracks? */
export function canChangeLearnerTracks(a: { role: Role; superAdmin: boolean }, settings: Record<string, unknown>): boolean {
  return a.superAdmin || trackChangeRoles(settings).includes(a.role);
}

export const canEditTrackSettings = (a: { role: Role; superAdmin: boolean }) => a.superAdmin || TRACK_SETTINGS_EDITORS.includes(a.role);

/**
 * A track can change only until Module 1 is complete: approved by review, or finished (every activity and day
 * done or skipped), which opens Module 2. From then to Day 45 the track is fixed, for the learner and for staff.
 */
export function trackChangeAllowed(module1State: string | null | undefined, module1Finished = false): boolean {
  // Fixed once Module 1 is approved, or once the learner has finished (or skipped) all of it and moved on.
  return module1State !== 'approved' && !module1Finished;
}
