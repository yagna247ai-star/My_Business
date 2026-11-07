import { requirePerm, hasPerm } from '@/lib/server/context';
import { listMembers } from '@/lib/domain/admin';
import { learnersAtRisk } from '@/lib/domain/insights';
import { ASSIGNABLE, ROLE_LABEL } from '@/lib/server/rbac';
import { PeopleTable } from '@/components/staff/PeopleTable';
import { guarded } from '@/lib/server/page';

export const metadata = { title: 'People' };
async function People() {
  const ctx = await requirePerm('members:read');
  const [members, risk] = await Promise.all([listMembers(ctx), learnersAtRisk(ctx)]);
  const byId = new Map(risk.map(r => [r.userId, r]));
  const rows = members.map(m => { const r = byId.get(m.userId); return { ...m, risk: r ? { status: r.streak.status, message: r.streak.message, level: r.level, activitiesDone: r.activitiesDone, lastActive: r.lastActive, needsAttention: r.needsAttention } : undefined }; });
  return (<>
    <section className="ph ph-plain"><h1 id="pageTitle">People</h1><p className="desc">Members of {ctx.tenantName}. Role changes take effect immediately and are audited. You cannot change your own role.</p></section>
    <div style={{ marginTop: 18 }}><PeopleTable rows={rows} roles={ASSIGNABLE.map(c => ({ code: c, label: ROLE_LABEL[c] }))} canManage={hasPerm(ctx, 'members:manage')} meId={ctx.userId} /></div>
  </>);
}

export default guarded(People);
