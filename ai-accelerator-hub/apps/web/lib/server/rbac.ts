/**
 * Role-based permissions for the 10 canonical roles (docs/ai-accelerator-hub-architecture.md §5.2,
 * MASTER PROMPT §4). Attribute checks (own resource, same tenant, assigned cohort) are done in services.
 * Deny by default: a permission not listed here is not granted.
 */
export type Role = 'super_admin' | 'tenant_admin' | 'program_mgr' | 'instructor' | 'mentor' | 'reviewer' | 'learner' | 'team_lead' | 'finance' | 'support';

export type Permission =
  | 'learn:self'            // progress through the journey, submit own evidence
  | 'ai:use'                // use AI assistants within quota
  | 'community:post'
  | 'community:moderate'
  | 'review:read'           // read the review queue
  | 'review:decide'         // score and decide submissions
  | 'cohort:read'
  | 'cohort:manage'         // create cohorts, invite codes, schedules
  | 'members:read'
  | 'members:manage'        // change roles, suspend
  | 'content:manage'        // author/publish levels and activities
  | 'analytics:read'
  | 'audit:read'
  | 'billing:self'          // buy plans for self
  | 'billing:manage'        // refunds, reconciliation, invoices
  | 'ledger:verify'
  | 'talent:discover'       // search consent-gated talent profiles
  | 'talent:post';           // publish opportunities on behalf of an org

const ALL: Permission[] = ['learn:self', 'ai:use', 'community:post', 'community:moderate', 'review:read', 'review:decide', 'cohort:read', 'cohort:manage', 'members:read', 'members:manage', 'content:manage', 'analytics:read', 'audit:read', 'billing:self', 'billing:manage', 'ledger:verify', 'talent:discover', 'talent:post'];

export const MATRIX: Record<Role, Permission[]> = {
  super_admin: ALL,
  tenant_admin: ['ai:use', 'community:moderate', 'review:read', 'cohort:read', 'cohort:manage', 'members:read', 'members:manage', 'content:manage', 'analytics:read', 'audit:read', 'ledger:verify', 'talent:discover', 'talent:post'],
  program_mgr: ['ai:use', 'community:moderate', 'review:read', 'cohort:read', 'cohort:manage', 'members:read', 'content:manage', 'analytics:read', 'audit:read', 'ledger:verify', 'talent:discover', 'talent:post'],
  instructor: ['ai:use', 'review:read', 'review:decide', 'cohort:read', 'members:read', 'content:manage', 'analytics:read'],
  mentor: ['ai:use', 'community:moderate', 'review:read', 'review:decide', 'cohort:read', 'members:read', 'talent:discover'],
  reviewer: ['ai:use', 'review:read', 'review:decide'],
  learner: ['learn:self', 'ai:use', 'community:post', 'billing:self'],
  team_lead: ['learn:self', 'ai:use', 'community:post', 'billing:self', 'cohort:read'],
  finance: ['billing:manage', 'audit:read'],
  support: ['community:moderate', 'review:read', 'members:read', 'audit:read'],
};

export const ROLE_LABEL: Record<Role, string> = {
  super_admin: 'Super Admin', tenant_admin: 'Institution Admin', program_mgr: 'Program Manager', instructor: 'Instructor',
  mentor: 'Cohort Mentor', reviewer: 'Reviewer', learner: 'Learner', team_lead: 'Team Lead', finance: 'Finance & Operations', support: 'Support & Moderation',
};

export const isRole = (r: string): r is Role => r in MATRIX;
export const can = (role: string | undefined | null, p: Permission) => !!role && isRole(role) && MATRIX[role].includes(p);
/** Roles a tenant admin may assign. Super admin is platform-level only and can never be granted per tenant. */
export const ASSIGNABLE: Role[] = ['tenant_admin', 'program_mgr', 'instructor', 'mentor', 'reviewer', 'learner', 'team_lead', 'finance', 'support'];
