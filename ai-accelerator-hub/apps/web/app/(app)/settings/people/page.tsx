import { requirePerm } from '@/lib/server/context';
import { guarded } from '@/lib/server/page';
import { listMembers } from '@/lib/domain/admin';
import { listCohortsAdmin } from '@/lib/domain/settingsAdmin';
import { ASSIGNABLE, ROLE_LABEL } from '@/lib/server/rbac';
import { PeopleSettings } from '@/components/settings/PeopleSettings';

export const metadata = { title: 'People settings' };
async function People() {
  const ctx = await requirePerm('members:manage');
  const [members, cohorts] = await Promise.all([listMembers(ctx), listCohortsAdmin(ctx)]);
  return (<>
    <section className="ph ph-plain"><h1 id="pageTitle">People</h1><p className="desc">Everyone in {ctx.tenantName}. Add people, change their role, cohort or status, or remove them from the institute. Every change is recorded in the audit log.</p></section>
    <div style={{ marginTop: 18 }}><PeopleSettings rows={JSON.parse(JSON.stringify(members))} roles={ASSIGNABLE.map(c => ({ code: c, label: ROLE_LABEL[c] }))} cohorts={cohorts.map(c => ({ id: c.id, name: c.name }))} meId={ctx.userId} /></div>
  </>);
}
export default guarded(People);
