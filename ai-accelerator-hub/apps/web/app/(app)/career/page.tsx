import { requireCtx } from '@/lib/server/context';
import { myProfile, listOpportunities, myApplications } from '@/lib/domain/talent';
import { CareerPanels } from '@/components/talent/CareerPanels';
import { childStatus } from '@/lib/domain/childSafety';
import { guarded } from '@/lib/server/page';
import { Tr } from '@/components/i18n/Tr';

export const metadata = { title: 'Career' };
async function Career() {
  const ctx = await requireCtx();
  const { minor } = await childStatus(ctx.tenantId, ctx.userId);
  // Child safety policy §3: under-18s never see or apply to opportunities.
  const [profile, opps, apps] = await Promise.all([myProfile(ctx), minor ? [] : listOpportunities(ctx), minor ? [] : myApplications(ctx)]);
  return (<>
    <section className="ph ph-plain"><h1 id="pageTitle"><Tr>Career</Tr></h1><p className="desc"><Tr>Your skill profile, open opportunities, and your applications — you control exactly who sees what.</Tr></p></section>
    <CareerPanels profile={profile} opportunities={opps} applications={apps} minor={minor} />
  </>);
}

export default guarded(Career);
