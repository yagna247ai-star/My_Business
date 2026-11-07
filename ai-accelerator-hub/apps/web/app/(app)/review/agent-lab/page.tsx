import { requirePerm, hasPerm } from '@/lib/server/context';
import { labQueue } from '@/lib/domain/agentLab';
import { LabVerifier } from '@/components/staff/LabVerifier';
import { guarded } from '@/lib/server/page';

export const metadata = { title: 'Agent Lab proofs' };
async function LabReview() {
  const ctx = await requirePerm('review:read');
  const items = await labQueue(ctx);
  return (<>
    <section className="ph ph-plain"><span className="eyebrow">Review</span><h1 id="pageTitle">Agent Lab proofs</h1><p className="desc">{items.length} waiting. Verify that each learner really set up their agent and checked its result.</p></section>
    <div style={{ marginTop: 20 }}><LabVerifier items={items as any} canDecide={hasPerm(ctx, 'review:decide')} /></div>
  </>);
}

export default guarded(LabReview);
