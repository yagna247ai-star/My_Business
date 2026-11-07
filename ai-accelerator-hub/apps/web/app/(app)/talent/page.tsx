import { requirePerm, hasPerm } from '@/lib/server/context';
import { listOpportunities } from '@/lib/domain/talent';
import { TalentPanels } from '@/components/talent/TalentPanels';
import { guarded } from '@/lib/server/page';

export const metadata = { title: 'Talent discovery' };
async function Talent() {
  const ctx = await requirePerm('talent:discover');
  const opps = await listOpportunities(ctx);
  return (<>
    <section className="ph ph-plain"><h1 id="pageTitle">Talent</h1><p className="desc">Skill-based discovery only — every profile below opted in. No scores, no ranking black box{hasPerm(ctx, 'talent:post') ? '; post roles for your organisation here too.' : '.'}</p></section>
    <TalentPanels mine={opps.filter(o => o.mine)} canPost={hasPerm(ctx, 'talent:post')} />
  </>);
}

export default guarded(Talent);
