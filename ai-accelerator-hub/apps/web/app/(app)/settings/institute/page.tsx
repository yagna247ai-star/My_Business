import { requireCtx, hasPerm } from '@/lib/server/context';
import { forbidden } from '@/lib/server/errors';
import { guarded } from '@/lib/server/page';
import { getInstitute, listInstitutes } from '@/lib/domain/settingsAdmin';
import { InstituteSettings } from '@/components/settings/InstituteSettings';

export const metadata = { title: 'Institute settings' };
async function Institute() {
  const ctx = await requireCtx();
  if (!ctx.superAdmin && !hasPerm(ctx, 'institute:manage')) throw forbidden();
  const [mine, all] = await Promise.all([getInstitute(ctx), ctx.superAdmin ? listInstitutes(ctx) : Promise.resolve(null)]);
  return (<>
    <section className="ph ph-plain"><h1 id="pageTitle">{ctx.superAdmin ? 'Institutions' : 'Institution profile'}</h1><p className="desc">{ctx.superAdmin ? 'The profile of the institution you are in, and every institution on the platform: open (switch to) any of them, edit profiles and codes, or create new ones.' : 'Your institution’s full profile and logo. The institution code, plan and status are managed by the platform team.'}</p></section>
    <div style={{ marginTop: 18 }}><InstituteSettings mine={JSON.parse(JSON.stringify(mine))} all={all ? JSON.parse(JSON.stringify(all)) : null} superAdmin={ctx.superAdmin} /></div>
  </>);
}
export default guarded(Institute);
