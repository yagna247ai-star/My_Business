import Link from 'next/link';
import { requirePerm, hasPerm } from '@/lib/server/context';
import { helpQueue } from '@/lib/domain/help';
import { HelpDesk } from '@/components/staff/HelpDesk';
import { guarded } from '@/lib/server/page';

export const metadata = { title: 'Help requests' };
async function HelpRequests({ searchParams }: { searchParams: Promise<{ state?: string }> }) {
  const ctx = await requirePerm('review:read');
  const state = (await searchParams).state === 'resolved' ? 'resolved' : 'active';
  const items = await helpQueue(ctx, state);
  return (<>
    <section className="ph ph-plain"><span className="eyebrow">Review</span><h1 id="pageTitle">Help requests</h1><p className="desc">Learners stuck on an Agent Lab step. Each request shows their computer, agent, install method, the error they pasted and any known fixes it matches. Oldest first.</p></section>
    <nav className="tabs-line" aria-label="Filter" style={{ marginTop: 14 }}><Link href="/review/help" aria-current={state === 'active' ? 'page' : undefined}>Open and answered</Link><Link href="/review/help?state=resolved" aria-current={state === 'resolved' ? 'page' : undefined}>Resolved</Link></nav>
    <div style={{ marginTop: 16 }}><HelpDesk items={JSON.parse(JSON.stringify(items))} canReply={hasPerm(ctx, 'review:decide')} /></div>
  </>);
}

export default guarded(HelpRequests);
