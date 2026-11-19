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
    <section className="ph ph-plain"><h1 id="pageTitle">{ctx.superAdmin ? 'Institutes' : 'Institute'}</h1><p className="desc">{ctx.superAdmin ? 'Edit the institute you are signed in to, and create, edit, deactivate or delete any institute on the platform.' : 'Your institute’s name and contact details. Plan and status are managed by the platform team.'}</p></section>
    <div style={{ marginTop: 18 }}><InstituteSettings mine={JSON.parse(JSON.stringify(mine))} all={all ? JSON.parse(JSON.stringify(all)) : null} superAdmin={ctx.superAdmin} /></div>
  </>);
}
export default guarded(Institute);
