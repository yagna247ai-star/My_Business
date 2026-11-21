import Link from 'next/link';
import { requirePerm } from '@/lib/server/context';
import { listJourneys } from '@/lib/domain/journeyBuilder';
import { guarded } from '@/lib/server/page';
import { JourneyBuilder } from '@/components/admin/JourneyBuilder';
import { JourneyAccess } from '@/components/admin/JourneyAccess';
import { journeyAccessOverview } from '@/lib/domain/journeyAccess';

export const metadata = { title: 'Journey builder' };
async function Journeys() {
  const ctx = await requirePerm('content:manage');
  const [journeys, access] = await Promise.all([listJourneys(ctx), journeyAccessOverview(ctx)]);
  return (<>
    <section className="ph ph-plain"><h1 id="pageTitle">Journey builder</h1><p className="desc">Create a journey for {ctx.tenantName}: stages, levels and their order. New journeys stay unpublished until you publish them.</p></section>
    <div className="stack gap-16" style={{ marginTop: 18, maxWidth: 860 }}>
      <JourneyAccess journeys={access} canEdit={ctx.superAdmin} />
      <section className="card card-pad stack gap-8" aria-labelledby="jl">
        <h2 className="h3" id="jl">Your journeys ({journeys.length})</h2>
        {journeys.length === 0 && <p className="muted small">None yet. Create one below.</p>}
        <ul className="checklist">{journeys.map(j => <li key={j.id}><span className="bold">{j.title}</span> <span className="muted xs">· /{j.slug} · {j._count.levels} levels · {j.isPublished ? 'published' : 'unpublished'}</span></li>)}</ul>
        <Link className="link small" href="/admin/content">Review levels, read the content and leave suggestions →</Link> <Link className="link small" href="/levels">See the learner view →</Link>
      </section>
      <JourneyBuilder />
    </div>
  </>);
}
export default guarded(Journeys);
