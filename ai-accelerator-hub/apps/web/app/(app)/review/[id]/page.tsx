import Link from 'next/link';
import { ChevronLeft, ExternalLink } from 'lucide-react';
import { requirePerm, hasPerm } from '@/lib/server/context';
import { submissionForReview } from '@/lib/domain/review';
import { ReviewScorer } from '@/components/staff/ReviewScorer';
import { AppealResolver } from '@/components/staff/AppealResolver';
import { guarded } from '@/lib/server/page';

export const dynamic = 'force-dynamic';
type Brief = { tool: string; fields: Record<string, string>; iterations: { prompt: string; output: string; change: string }[] };
async function ReviewDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const ctx = await requirePerm('review:read');
  const d = await submissionForReview(ctx, id); const s = d.submission; const meta = JSON.parse(s.metadata || '{}'); const brief: Brief | null = meta.brief;
  const labels: Record<string, string> = { problem: 'Problem', user: 'User', fit: 'Why AI', evaluation: 'What the AI got wrong', responsible: 'Data handling' };
  return (<>
    <Link className="btn btn-text" href="/review"><ChevronLeft size={15} />Queue</Link>
    <section className="ph ph-plain" style={{ marginTop: 8 }}><h1 id="pageTitle">{s.user.name} · {s.progress.level.title}</h1><p className="desc">Attempt {meta.attempt || 1} · submitted {s.submittedAt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST · status {s.state.replace('_', ' ')}</p></section>
    {d.own && <p className="callout warn" style={{ margin: '12px 0' }}>This is your own submission. Someone else must review it.</p>}
    <div className="panel-grid" style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', marginTop: 16 }}>
      <div className="stack gap-16">
        <section className="card card-pad"><h2 className="h3">Evidence</h2>
          <div className="kv"><span>Brief link</span><span>{s.url ? <a className="link" href={s.url} target="_blank" rel="noopener noreferrer nofollow">Open <ExternalLink size={13} /></a> : '—'}</span></div>
          <div className="kv"><span>Demo</span><span>{s.deployedUrl ? <a className="link" href={s.deployedUrl} target="_blank" rel="noopener noreferrer nofollow">Open <ExternalLink size={13} /></a> : '—'}</span></div>
          <div className="kv"><span>Boss</span><span>{d.boss ? `${d.boss.best} of ${d.boss.total} scenarios` : 'Not attempted'}</span></div>
          <p className="muted xs" style={{ marginTop: 8 }}>Links are untrusted, learner-supplied content. They open in a new tab without referrer.</p>
        </section>
        {brief && <section className="card card-pad stack gap-12"><h2 className="h3">AI Explorer brief · {brief.tool}</h2>{Object.entries(brief.fields).map(([k, v]) => <div key={k}><div className="section-label">{labels[k] || k}</div><p style={{ whiteSpace: 'pre-wrap', marginTop: 4 }}>{v}</p></div>)}{brief.iterations.map((it, i) => <div key={i} className="q"><b>Iteration {i + 1}</b><p className="small" style={{ marginTop: 4 }}><b>Prompt:</b> {it.prompt}</p><p className="small text-2"><b>Output:</b> {it.output}</p>{it.change && <p className="small text-2"><b>Change:</b> {it.change}</p>}</div>)}</section>}
        <section className="card card-pad"><h2 className="h3">Reflection</h2><p style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>{s.reflectionMd}</p></section>
        {s.reviews.length > 0 && <section className="card card-pad stack gap-12"><h2 className="h3">Decision history</h2>{s.reviews.map(r => <div key={r.id} className={`callout ${r.verdict === 'approved' ? 'ok' : 'warn'}`}><div><b>{r.verdict === 'approved' ? 'Approved' : 'Changes requested'} · {r.weightedAvg?.toFixed(2)} by {r.reviewer.name}</b>{r.feedbackMd && <span>“{r.feedbackMd}”</span>}{r.appealState && <p className="small" style={{ marginTop: 6 }}>Appeal: {r.appealState}{r.appealNote ? ` — “${r.appealNote}”` : ''}</p>}{r.appealState === 'open' && hasPerm(ctx, 'cohort:manage') && r.reviewerId !== ctx.userId && <AppealResolver reviewId={r.id} />}</div></div>)}</section>}
      </div>
      <ReviewScorer id={s.id} dims={d.rubric.dims} threshold={d.rubric.threshold} bossMin={d.rubric.bossMin} checks={d.checks} canDecide={d.canDecide} />
    </div>
  </>);
}

export default guarded(ReviewDetail);
