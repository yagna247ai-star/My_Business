import { requireCtx, hasPerm } from '@/lib/server/context';
import { feedEngagement, feedPrompts, listFeed } from '@/lib/domain/feed';
import { asTab } from '@/lib/domain/feedCore';
import { FeedPanels } from '@/components/feed/FeedPanels';
import { guarded } from '@/lib/server/page';
import { Tr } from '@/components/i18n/Tr';

export const metadata = { title: 'Community feed' };
// docs/FEED_ENGAGEMENT_SPEC.md: ?post= opens a post from a notification (AC-5); ?tab= picks a filter (AC-8).
async function Feed({ searchParams }: { searchParams: Promise<{ post?: string; tab?: string }> }) {
  const ctx = await requireCtx();
  const sp = await searchParams;
  const tab = asTab(sp.tab);
  const postId = sp.post && /^[\w-]{1,40}$/.test(sp.post) ? sp.post : undefined;
  const [first, prompts, engagement] = await Promise.all([listFeed(ctx, 20, undefined, { tab, postId }), feedPrompts(ctx).catch(() => ({ prompt: null, win: null, unanswered: 0 })), feedEngagement(ctx)]);
  return (<>
    <section className="ph ph-plain"><h1 id="pageTitle"><Tr>Community feed</Tr></h1><p className="desc"><Tr>Ask when you are stuck, share what worked, celebrate wins. Only people in your organisation can see it.</Tr></p></section>
    <FeedPanels initial={JSON.parse(JSON.stringify(first.items))} nextCursor={first.nextCursor} prompts={prompts} engagement={engagement} canLead={hasPerm(ctx, 'community:moderate') || hasPerm(ctx, 'cohort:manage')} initialTab={tab} />
  </>);
}

export default guarded(Feed);
