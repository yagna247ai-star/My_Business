/**
 * Request context: the only way route handlers and pages learn who the caller is.
 * Tenant and role are re-read from the database on every request (never trusted from the client
 * or a stale token), so a suspended membership or a role change takes effect immediately.
 */
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { can, type Permission, type Role, isRole } from './rbac';
import { forbidden, unauthorized } from './errors';

export type Ctx = { userId: string; email: string; name: string; tenantId: string; tenantSlug: string; tenantName: string; role: Role; cohortId: string | null; superAdmin: boolean };

export async function getCtx(): Promise<Ctx | null> {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return null;
  const wantedTenant = (session as unknown as { tenantId?: string })?.tenantId || undefined;
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, name: true, globalRole: true } });
  if (!user) return null;
  const membership = await prisma.membership.findFirst({
    where: { userId, status: 'active', ...(wantedTenant ? { tenantId: wantedTenant } : {}), tenant: { status: 'active' } },
    include: { role: true, tenant: true }, orderBy: { createdAt: 'asc' },
  });
  if (!membership || !isRole(membership.role.code)) return null;
  return { userId: user.id, email: user.email, name: user.name || user.email, tenantId: membership.tenantId, tenantSlug: membership.tenant.slug, tenantName: membership.tenant.name, role: membership.role.code, cohortId: membership.cohortId, superAdmin: user.globalRole === 'super_admin' };
}

export async function requireCtx(): Promise<Ctx> {
  const ctx = await getCtx();
  if (!ctx) throw unauthorized();
  return ctx;
}

export async function requirePerm(p: Permission): Promise<Ctx> {
  const ctx = await requireCtx();
  if (!ctx.superAdmin && !can(ctx.role, p)) throw forbidden();
  return ctx;
}

export const hasPerm = (ctx: Ctx, p: Permission) => ctx.superAdmin || can(ctx.role, p);
/** Is this person actually a learner here? Super admins can open learner pages but have no journey, so they get the staff home and menu. */
export const isLearner = (ctx: Ctx) => ctx.role !== 'super_admin' && can(ctx.role, 'learn:self'); // super_admin holds every permission, learn:self included
