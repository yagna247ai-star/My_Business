import { requirePerm } from '@/lib/server/context';
import { moderationQueue } from '@/lib/domain/feed';
import { ModQueue } from '@/components/feed/ModQueue';
import { guarded } from '@/lib/server/page';

export const metadata = { title: 'Moderation queue' };
async function Moderation() {
  const ctx = await requirePerm('community:moderate');
  const queue = await moderationQueue(ctx);
  return (<>
    <section className="ph ph-plain"><h1 id="pageTitle">Moderation queue</h1><p className="desc">Review reports in order. Hiding removes content from the feed; dismissal keeps it. Every decision is audited and both sides are notified.</p></section>
    <ModQueue initial={queue} />
  </>);
}

export default guarded(Moderation);
