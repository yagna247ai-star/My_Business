import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { requireCtx } from '@/lib/server/context';
import { reviewJourney, openSuggestions, targetLabel } from '@/lib/domain/contentReview';
import { guarded } from '@/lib/server/page';
import { PublishAll, PublishToggle } from '@/components/admin/ContentReviewControls';

export const metadata = { title: 'Content review · journey' };
export const dynamic = 'force-dynamic';

async function JourneyReview({ params }: { params: Promise<{ journeyId: string }> }) {
  const { journeyId } = await params;
  const ctx = await requireCtx();
  const [{ journey, levels }, todo] = await Promise.all([reviewJourney(ctx, journeyId), openSuggestions(ctx, journeyId)]);
  const drafts = levels.filter(l => !l.isPublished).length;
  const stages = [...new Map(levels.map(l => [l.stage?.idx ?? 0, l.stage?.title ?? 'Levels'])).entries()];
  return (<>
    <Link className="link small" href="/admin/content"><ArrowLeft size={14} /> All journeys</Link>
    <section className="ph ph-plain" style={{ marginTop: 8 }}><h1 id="pageTitle">{journey.title}</h1>
      <p className="desc">{journey.description}</p>
      <div className="row gap-12 wrap" style={{ marginTop: 10 }}>
        <span className="badge badge-neutral">{levels.length} levels · {levels.reduce((n, l) => n + l.days, 0)} day lessons</span>
        {ctx.superAdmin ? <PublishAll journeyId={journey.id} drafts={drafts} /> : <span className="badge badge-neutral">{drafts} drafts</span>}
      </div>
    </section>
    <div className="grid-12" style={{ marginTop: 16, alignItems: 'start' }}>
      <div className="span-8 stack gap-16">
        {stages.map(([si, st]) => (
          <section key={si} className="card card-pad" aria-labelledby={`st${si}`}>
            <h2 className="h3" id={`st${si}`}>{si ? `Stage ${si} · ` : ''}{st}</h2>
            <div className="stack gap-8" style={{ marginTop: 10 }}>
              {levels.filter(l => (l.stage?.idx ?? 0) === si).map(l => (
                <div key={l.id} className="row between wrap gap-12" style={{ padding: '10px 0', borderTop: '1px solid var(--border)' }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <b>L{String(l.idx).padStart(2, '0')} · {l.title}</b>
                    <div className="muted xs">{l.days} day lessons · {l.activities} activities · {l.xpReward} XP{l.openSuggestions ? ` · ${l.openSuggestions} open suggestions` : ''}</div>
                  </div>
                  <div className="row gap-8 wrap" style={{ alignItems: 'center' }}>
                    <PublishToggle levelId={l.id} published={l.isPublished} canPublish={ctx.superAdmin} />
                    <Link className="btn btn-outline btn-sm" href={`/admin/content/${journey.id}/${l.idx}`}>Read and review <ArrowRight size={14} /></Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
      <aside className="span-4 card card-pad stack gap-8" aria-labelledby="todoT">
        <h2 className="h3" id="todoT">Open suggestions ({todo.length})</h2>
        <p className="muted xs" style={{ margin: 0 }}>The to-do list for improving this journey. Mark each one done when the content is changed.</p>
        {todo.length === 0 && <p className="muted small">None open.</p>}
        {todo.slice(0, 40).map(s => (
          <Link key={s.id} href={`/admin/content/${journey.id}/${s.level?.idx ?? 1}?item=${encodeURIComponent(s.target)}`} className="card card-pad" style={{ padding: 10, display: 'block' }}>
            <span className="muted xs">L{s.level?.idx} · {targetLabel(s.target)}</span>
            <p className="small" style={{ margin: '4px 0 0' }}>{s.body.length > 160 ? `${s.body.slice(0, 160)}…` : s.body}</p>
          </Link>
        ))}
      </aside>
    </div>
  </>);
}
export default guarded(JourneyReview);
