import Link from 'next/link';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { requireCtx } from '@/lib/server/context';
import { reviewLevel, parseTarget, targetLabel } from '@/lib/domain/contentReview';
import { guarded } from '@/lib/server/page';
import { Markdown } from '@/components/learn/Markdown';
import { ActivityPreview } from '@/components/admin/ActivityPreview';
import { DayMaterialsAdmin } from '@/components/admin/DayMaterialsAdmin';
import { hasPerm } from '@/lib/server/context';
import { PublishToggle, SuggestionsPanel } from '@/components/admin/ContentReviewControls';

export const metadata = { title: 'Content review · level' };
export const dynamic = 'force-dynamic';

async function LevelReview({ params, searchParams }: { params: Promise<{ journeyId: string; idx: string }>; searchParams: Promise<{ item?: string }> }) {
  const { journeyId, idx } = await params; const { item } = await searchParams;
  const ctx = await requireCtx();
  const r = await reviewLevel(ctx, journeyId, Number(idx));
  const items = ['level', ...r.days.map(d => `day:${d.day}`), ...r.activities.map(a => `activity:${a.idx}`)];
  const cur = item && parseTarget(item) && items.includes(item) ? item : (r.days[0] ? `day:${r.days[0].day}` : 'level');
  const t = parseTarget(cur)!;
  const openCount = (k: string) => r.suggestions.filter(s => s.target === k && s.state === 'open').length;
  const pos = items.indexOf(cur); const prev = items[pos - 1]; const next = items[pos + 1];
  const href = (k: string) => `/admin/content/${journeyId}/${idx}?item=${encodeURIComponent(k)}`;
  const day = t.kind === 'day' ? r.days.find(d => d.day === t.n) : null;
  const act = t.kind === 'activity' ? r.activities.find(a => a.idx === t.n) : null;
  return (<>
    <Link className="link small" href={`/admin/content/${journeyId}`}><ArrowLeft size={14} /> {r.level.journey.title}</Link>
    <section className="ph ph-plain" style={{ marginTop: 8 }}>
      <span className="eyebrow">Level {r.level.idx} of {r.level.levelCount}{r.level.stage ? ` · ${r.level.stage}` : ''}</span>
      <div className="row between wrap gap-12" style={{ alignItems: 'center' }}>
        <h1 id="pageTitle" style={{ margin: 0 }}>{r.level.title}</h1>
        <PublishToggle levelId={r.level.id} published={r.level.isPublished} canPublish={r.canPublish} />
      </div>
      <p className="desc">{r.level.summary} · {r.level.code} · {r.level.xpReward} XP</p>
    </section>
    <div className="grid-12" style={{ marginTop: 16, alignItems: 'start' }}>
      <nav className="span-3 card card-pad stack gap-4" aria-label="Level contents" style={{ position: 'sticky', top: 80 }}>
        {items.map(k => {
          const p = parseTarget(k)!; const n = openCount(k);
          const label = p.kind === 'level' ? 'Whole level' : p.kind === 'day' ? `Day ${p.n} · ${(r.days.find(d => d.day === p.n)?.title ?? '').replace(/^Day \d+\s+—\s+/, '').slice(0, 34)}` : `Activity ${p.n} · ${r.activities.find(a => a.idx === p.n)?.title.split(':')[0]}`;
          return <Link key={k} href={href(k)} className={`nav-item ${k === cur ? 'active' : ''}`} aria-current={k === cur ? 'page' : undefined} style={{ display: 'flex', justifyContent: 'space-between', gap: 6, fontSize: 13, padding: '6px 8px', borderRadius: 8 }}>
            <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span><span className="row gap-4" style={{ flex: 'none' }}>{r.feedback[k] && <span className="muted xs" title="Learners: useful / not useful">👍{r.feedback[k].up} 👎{r.feedback[k].down}</span>}{n > 0 && <span className="badge badge-gold">{n}</span>}</span>
          </Link>;
        })}
      </nav>
      <article className="span-6 card card-pad" aria-label={targetLabel(cur)}>
        {t.kind === 'level' && <div className="stack gap-12">
          <h2 className="h3" style={{ margin: 0 }}>Whole level</h2>
          <p className="small" style={{ margin: 0 }}>Use this for suggestions about the level as a whole: its order, difficulty, missing topics, or how the days and activities fit together.</p>
          <ul className="small" style={{ margin: 0, paddingLeft: 20, listStyle: 'disc', lineHeight: 1.7 }}>
            {r.days.map(d => <li key={d.day}><Link className="link" href={href(`day:${d.day}`)}>{d.title}</Link></li>)}
            {r.activities.map(a => <li key={a.idx}><Link className="link" href={href(`activity:${a.idx}`)}>Activity {a.idx}: {a.title}</Link> · {a.xp} XP</li>)}
          </ul>
        </div>}
        {day && <><p className="muted xs" style={{ marginTop: 0 }}>Exactly as learners see it.</p><Markdown md={day.body} />{(hasPerm(ctx, 'content:manage') || hasPerm(ctx, 'materials:manage')) && <DayMaterialsAdmin contentId={day.contentId} day={day.day} />}</>}
        {act && <><h2 className="h3" style={{ marginTop: 0 }}>Activity {act.idx}: {act.title}</h2><p className="muted xs">Learner view plus what learners never see (answers, right moves), highlighted in green.</p><ActivityPreview a={act} /></>}
        {!day && !act && t.kind !== 'level' && <p className="muted">Not found in this level.</p>}
        <nav className="row between" aria-label="Previous and next" style={{ marginTop: 18 }}>
          {prev ? <Link className="btn btn-outline btn-sm" href={href(prev)}><ChevronLeft size={15} /> {targetLabel(prev)}</Link> : <span />}
          {next ? <Link className="btn btn-primary btn-sm" href={href(next)}>{targetLabel(next)} <ChevronRight size={15} /></Link> : <span />}
        </nav>
      </article>
      <div className="span-3"><SuggestionsPanel levelId={r.level.id} target={cur} targetName={targetLabel(cur)} items={r.suggestions} /></div>
    </div>
  </>);
}
export default guarded(LevelReview);
