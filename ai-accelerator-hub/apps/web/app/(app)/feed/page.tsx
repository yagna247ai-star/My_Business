import { requireCtx } from '@/lib/server/context';
import { listFeed } from '@/lib/domain/feed';
import { FeedPanels } from '@/components/feed/FeedPanels';
import { guarded } from '@/lib/server/page';

export const metadata = { title: 'Community feed' };
async function Feed() {
  const ctx = await requireCtx();
  const first = await listFeed(ctx);
  return (<>
    <section className="ph ph-plain"><h1 id="pageTitle">Community feed</h1><p className="desc">Ask when you are stuck, share what worked, celebrate wins. Only people in your organisation can see it.</p></section>
    <FeedPanels initial={first.items} nextCursor={first.nextCursor} />
  </>);
}

export default guarded(Feed);
