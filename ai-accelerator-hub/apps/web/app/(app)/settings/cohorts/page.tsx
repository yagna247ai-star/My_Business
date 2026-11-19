import { requirePerm } from '@/lib/server/context';
import { guarded } from '@/lib/server/page';
import { listCohortsAdmin } from '@/lib/domain/settingsAdmin';
import { CohortSettings } from '@/components/settings/CohortSettings';

export const metadata = { title: 'Cohort settings' };
async function Cohorts() {
  const ctx = await requirePerm('cohort:manage');
  const cohorts = await listCohortsAdmin(ctx);
  return (<>
    <section className="ph ph-plain"><h1 id="pageTitle">Cohorts</h1><p className="desc">Groups of learners who start together. Learners join a cohort with its invite code. Schedule workshops and hackathons in <a className="link" href="/admin/cohorts">Cohorts &amp; sessions</a>.</p></section>
    <div style={{ marginTop: 18 }}><CohortSettings rows={JSON.parse(JSON.stringify(cohorts))} /></div>
  </>);
}
export default guarded(Cohorts);
