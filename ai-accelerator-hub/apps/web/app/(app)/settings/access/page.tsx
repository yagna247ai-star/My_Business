import { prisma } from '@/lib/prisma';
import { requireCtx } from '@/lib/server/context';
import { forbidden } from '@/lib/server/errors';
import { guarded } from '@/lib/server/page';
import { ROLE_LABEL, isRole } from '@/lib/server/rbac';
import { AccessEditor } from '@/components/settings/AccessEditor';

export const metadata = { title: 'Access' };

/** Super Admin: per-person permissions on top of their role (docs/SUPER_ADMIN_CONTROL_SPEC.md §3.6). */
async function Access({ searchParams }: { searchParams: Promise<{ user?: string }> }) {
  const ctx = await requireCtx();
  if (!ctx.superAdmin) throw forbidden('Only a Super Admin can change access.');
  const { user } = await searchParams;
  const ms = await prisma.membership.findMany({ where: { tenantId: ctx.tenantId }, include: { user: { select: { id: true, name: true, email: true } }, role: true }, orderBy: { createdAt: 'asc' } });
  const people = ms.filter(m => m.role.code !== 'super_admin').map(m => ({ id: m.userId, name: m.user.name || m.user.email, email: m.user.email, role: isRole(m.role.code) ? ROLE_LABEL[m.role.code] : m.role.code, custom: m.grants !== '[]' || m.revokes !== '[]' }));
  return (<>
    <section className="ph ph-plain"><h1 id="pageTitle">Access</h1><p className="desc">Each person gets their role’s permissions. Here you can give someone an extra permission, or take one away, without changing their role. Changes apply on their next click and are recorded in the audit log.</p></section>
    <div style={{ marginTop: 18 }}><AccessEditor people={people} initialUser={user ?? null} /></div>
  </>);
}
export default guarded(Access);
