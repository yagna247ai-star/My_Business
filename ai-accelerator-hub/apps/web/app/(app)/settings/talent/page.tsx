import { requireCtx, hasPerm } from '@/lib/server/context';
import { forbidden } from '@/lib/server/errors';
import { guarded } from '@/lib/server/page';
import { listOpportunitiesAdmin, listTalentProfilesAdmin } from '@/lib/domain/settingsAdmin';
import { TalentSettings } from '@/components/settings/TalentSettings';

export const metadata = { title: 'Talent settings' };
async function Talent() {
  const ctx = await requireCtx();
  const canOpp = hasPerm(ctx, 'talent:post'); const canProfiles = hasPerm(ctx, 'members:manage');
  if (!canOpp && !canProfiles) throw forbidden();
  const [opps, profiles] = await Promise.all([canOpp ? listOpportunitiesAdmin(ctx) : null, canProfiles ? listTalentProfilesAdmin(ctx) : null]);
  return (<>
    <section className="ph ph-plain"><h1 id="pageTitle">Talent</h1><p className="desc">Opportunities that learners can apply to, and the talent profiles learners have created. Learners decide who can see their profile; admins can hide or remove one.</p></section>
    <div style={{ marginTop: 18 }}><TalentSettings opps={opps ? JSON.parse(JSON.stringify(opps)) : null} profiles={profiles ? JSON.parse(JSON.stringify(profiles)) : null} /></div>
  </>);
}
export default guarded(Talent);
