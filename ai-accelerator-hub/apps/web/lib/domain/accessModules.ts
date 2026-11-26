/**
 * Access by module (docs/ACCESS_MODULES_AND_NAV_SPEC.md). Pure. A module is a part of the app with three levels:
 * No access, View, Manage. Levels are saved as the existing per-person grants and revokes.
 */
import { MATRIX, isRole, type Permission } from '@/lib/server/rbac';

export type Level = 'none' | 'view' | 'manage';
export type ModuleKey = 'materials' | 'learning' | 'ai' | 'community' | 'reviews' | 'people' | 'cohorts' | 'content' | 'analytics' | 'audit' | 'billing' | 'talent' | 'institute';
export type Module = { key: ModuleKey; label: string; info: string; view: Permission[]; manage: Permission[] };

export const MODULES: Module[] = [
  { key: 'learning', label: 'Learning', info: 'Take journeys, do the days and activities, and hand in proof.', view: [], manage: ['learn:self'] },
  { key: 'ai', label: 'AI coach', info: 'Use the AI coach and AI helpers.', view: [], manage: ['ai:use'] },
  { key: 'community', label: 'Community & showcase', info: 'View: post and comment. Manage: also moderate the feed and the showcase.', view: ['community:post'], manage: ['community:post', 'community:moderate'] },
  { key: 'reviews', label: 'Reviews', info: 'View: see submissions. Manage: also decide them and handle appeals.', view: ['review:read'], manage: ['review:read', 'review:decide'] },
  { key: 'people', label: 'People', info: 'View: see people and their progress. Manage: add, edit, suspend, import, bulk actions, roles.', view: ['members:read'], manage: ['members:read', 'members:manage'] },
  { key: 'cohorts', label: 'Cohorts & sessions', info: 'View: see cohorts. Manage: create cohorts, invite codes and session schedules.', view: ['cohort:read'], manage: ['cohort:read', 'cohort:manage'] },
  { key: 'materials', label: 'Day materials', info: 'Add study links (Drive, Docs, Sheets, videos) to the days of a course for learners.', view: [], manage: ['materials:manage'] },
  { key: 'content', label: 'Content & journeys', info: 'Edit journeys, levels, day lessons and day materials.', view: [], manage: ['content:manage'] },
  { key: 'analytics', label: 'Analytics', info: 'See the analytics page for this institution.', view: [], manage: ['analytics:read'] },
  { key: 'audit', label: 'Audit & points ledger', info: 'View: read the audit log. Manage: also verify the points ledger.', view: ['audit:read'], manage: ['audit:read', 'ledger:verify'] },
  { key: 'billing', label: 'Billing', info: 'View: buy plans for themselves. Manage: refunds, invoices and reconciliation.', view: ['billing:self'], manage: ['billing:self', 'billing:manage'] },
  { key: 'talent', label: 'Talent & careers', info: 'View: search consented talent profiles. Manage: also post opportunities.', view: ['talent:discover'], manage: ['talent:discover', 'talent:post'] },
  { key: 'institute', label: 'Institution settings', info: 'Edit the institution’s details and settings.', view: [], manage: ['institute:manage'] },
];
const BY_KEY = new Map(MODULES.map(m => [m.key, m]));

/** The level a set of permissions gives in a module. A partial set that is neither level reads as the nearest below. */
export function moduleLevel(perms: readonly Permission[], key: ModuleKey): Level {
  const m = BY_KEY.get(key)!; const has = new Set(perms);
  if (m.manage.every(p => has.has(p))) return 'manage';
  if (m.view.length && m.view.every(p => has.has(p))) return 'view';
  return 'none';
}

export const levelsOf = (perms: readonly Permission[]) => Object.fromEntries(MODULES.map(m => [m.key, moduleLevel(perms, m.key)])) as Record<ModuleKey, Level>;

const permsOf = (m: Module, l: Level): Permission[] => (l === 'manage' ? m.manage : l === 'view' ? m.view : []);

/** Grants and revokes that give exactly the chosen levels on top of the role. Unchanged modules add nothing. */
export function permsForLevels(role: string, levels: Partial<Record<ModuleKey, Level>>): { grants: Permission[]; revokes: Permission[] } {
  const base = isRole(role) ? MATRIX[role] : [];
  const grants: Permission[] = [], revokes: Permission[] = [];
  for (const m of MODULES) {
    const want = levels[m.key];
    if (!want || want === moduleLevel(base, m.key)) continue;
    if (want === 'view' && !m.view.length) continue;
    const target = new Set(permsOf(m, want)); const roleHas = m.manage.filter(p => base.includes(p));
    for (const p of target) if (!base.includes(p)) grants.push(p);
    for (const p of roleHas) if (!target.has(p)) revokes.push(p);
  }
  return { grants, revokes };
}
