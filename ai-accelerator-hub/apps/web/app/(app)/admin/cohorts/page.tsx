import { requirePerm, hasPerm } from '@/lib/server/context';
import { listCohorts } from '@/lib/domain/admin';
import { CohortManager } from '@/components/staff/CohortManager';
import { guarded } from '@/lib/server/page';

export const metadata = { title: 'Cohorts & Sessions' };
async function Cohorts() {
  const ctx = await requirePerm('cohort:read'); const cohorts = await listCohorts(ctx);
  return (<>
    <section className="ph ph-plain"><h1 id="pageTitle">Cohorts &amp; sessions</h1><p className="desc">Weekly rhythm: Monday–Friday preparation, Saturday live workshop, Sunday 4-hour hackathon, then a submission window. Learners join with the cohort invite code.</p></section>
    <div style={{ marginTop: 18 }}><CohortManager cohorts={JSON.parse(JSON.stringify(cohorts))} canManage={hasPerm(ctx, 'cohort:manage')} /></div>
  </>);
}

export default guarded(Cohorts);
