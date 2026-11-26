/**
 * Request context: the only way route handlers and pages learn who the caller is.
 * Tenant and role are re-read from the database on every request (never trusted from the client
 * or a stale token), so a suspended membership or a role change takes effect immediately.
 */
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { can, effectivePerms, type Permission, type Role, isRole } from './rbac';
import { forbidden, unauthorized } from './errors';

export type Ctx = { userId: string; email: string; name: string; tenantId: string; tenantSlug: string; tenantName: string; role: Role; cohortId: string | null; superAdmin: boolean;
  /** Effective permissions (role + grants − revokes). Absent on hand-built contexts, which then use the role. */
  perms?: Permission[];
  /** An admin requires a new password before the app can be used (docs/SUPER_ADMIN_CONTROL_SPEC.md). */
  mustChangePassword?: boolean };

export async function getCtx(): Promise<Ctx | null> {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return null;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, name: true, globalRole: true, mustChangePassword: true } });
  if (!user) return null;
  const superAdmin = user.globalRole === 'super_admin';
  // The institution chosen in the switcher (signed cookie), else the one in the session, else the first active one.
  const switched = await switchedTenant();
  const sessionTenant = (session as unknown as { tenantId?: string })?.tenantId || undefined;
  const find = (tenantId?: string) => prisma.membership.findFirst({ where: { userId, status: 'active', ...(tenantId ? { tenantId } : {}), tenant: { status: 'active' } }, include: { role: true, tenant: true }, orderBy: { createdAt: 'asc' } });
  let membership = (switched ? await find(switched) : null) ?? (sessionTenant ? await find(sessionTenant) : null) ?? await find();
  // A Super Admin may open any active institution without being a member of it (docs/INSTITUTIONS_SPEC.md §2 #15).
  if (superAdmin && switched && membership?.tenantId !== switched) {
    const t = await prisma.tenant.findFirst({ where: { id: switched, status: 'active' } });
    if (t) return { userId: user.id, email: user.email, name: user.name || user.email, tenantId: t.id, tenantSlug: t.slug, tenantName: t.name, role: 'super_admin', cohortId: null, superAdmin: true, perms: effectivePerms('super_admin', '[]', '[]'), mustChangePassword: user.mustChangePassword };
  }
  if (!membership || !isRole(membership.role.code)) {
    if (!superAdmin) return null;
    const t = await prisma.tenant.findFirst({ where: { status: 'active' }, orderBy: { createdAt: 'asc' } });
    if (!t) return null;
    return { userId: user.id, email: user.email, name: user.name || user.email, tenantId: t.id, tenantSlug: t.slug, tenantName: t.name, role: 'super_admin', cohortId: null, superAdmin: true, perms: effectivePerms('super_admin', '[]', '[]'), mustChangePassword: user.mustChangePassword };
  }
  membership = membership!;
  return { userId: user.id, email: user.email, name: user.name || user.email, tenantId: membership.tenantId, tenantSlug: membership.tenant.slug, tenantName: membership.tenant.name, role: membership.role.code as Role, cohortId: membership.cohortId, superAdmin, perms: effectivePerms(membership.role.code, membership.grants, membership.revokes), mustChangePassword: user.mustChangePassword };
}

/** The signed institution-switch cookie, if valid. */
async function switchedTenant(): Promise<string | null> {
  try {
    const { cookies } = await import('next/headers');
    const { readTenant } = await import('@/lib/domain/institutionsCore');
    return readTenant((await cookies()).get('aih_tenant')?.value, process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || 'dev-only-insecure-secret-not-for-production-use');
  } catch { return null; } // outside a request (scripts, tests)
}

export async function requireCtx(): Promise<Ctx> {
  const ctx = await getCtx();
  if (!ctx) throw unauthorized();
  return ctx;
}

export async function requirePerm(p: Permission): Promise<Ctx> {
  const ctx = await requireCtx();
  if (!hasPerm(ctx, p)) throw forbidden();
  return ctx;
}

export const hasPerm = (ctx: Ctx, p: Permission) => ctx.superAdmin || (ctx.perms ? ctx.perms.includes(p) : can(ctx.role, p));
/** Is this person actually a learner here? Super admins can open learner pages but have no journey, so they get the staff home and menu. */
export const isLearner = (ctx: Ctx) => ctx.role !== 'super_admin' && can(ctx.role, 'learn:self'); // super_admin holds every permission, learn:self included
