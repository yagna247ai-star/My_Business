import Link from 'next/link';
import { AlertTriangle, ArrowRight, Info } from 'lucide-react';
import { requirePerm } from '@/lib/server/context';
import { institutionAnalytics } from '@/lib/domain/analytics';
import { guarded } from '@/lib/server/page';

export const metadata = { title: 'Analytics' };
export const dynamic = 'force-dynamic';

const fmt = (n: number | null, suffix = '') => (n === null ? '—' : `${n.toLocaleString('en-IN')}${suffix}`);
const STATUS: Record<string, string> = { at_risk: 'Stopped (7+ days)', not_started: 'Not started' };

/** Analytics an Institution Admin can act on (docs/ANALYTICS_INSIGHTS_SPEC.md). */
async function Analytics({ searchParams }: { searchParams: Promise<{ journey?: string; cohort?: string }> }) {
  const ctx = await requirePerm('analytics:read');
  const sp = await searchParams;
  const a = await institutionAnalytics(ctx, { journeyId: sp.journey, cohortId: sp.cohort });
  const filters = (
    <form className="row gap-8 wrap" method="get" style={{ marginTop: 14 }} aria-label="Filters">
      <label className="stack gap-4 small"><span className="bold">Journey</span><select className="select" name="journey" defaultValue={a.journey?.id ?? ''}>{a.journeys.map(j => <option key={j.id} value={j.id}>{j.title}{j.isPublished ? '' : ' (draft)'}</option>)}</select></label>
      <label className="stack gap-4 small"><span className="bold">Cohort</span><select className="select" name="cohort" defaultValue={a.cohortId ?? ''}><option value="">All cohorts</option>{a.cohorts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <button className="btn btn-soft btn-sm" type="submit" style={{ alignSelf: 'flex-end' }}>Show</button>
    </form>
  );
  if (a.empty) return (<><section className="ph ph-plain"><h1 id="pageTitle">Analytics</h1><p className="desc">No journey yet. Create one in the Journey Builder.</p></section>{filters}</>);
  const h = a.headline; const maxDay = Math.max(1, ...a.funnel.days.map(d => d.done)); const maxWeek = Math.max(1, ...a.weekly.map(w => w.active));
  const lastWeek = a.weekly[a.weekly.length - 1]?.active ?? 0, prevWeek = a.weekly[a.weekly.length - 2]?.active ?? 0;
  const trend = prevWeek ? Math.round(((lastWeek - prevWeek) / prevWeek) * 100) : null;

  return (<>
    <section className="ph ph-plain"><h1 id="pageTitle">Analytics</h1>
      <p className="desc">{ctx.tenantName} · <b>{a.journey!.title}</b>{a.cohortId ? ` · ${a.cohorts.find(c => c.id === a.cohortId)?.name}` : ' · all cohorts'}. Live from learners’ day, activity and review records. Each number says what it means and what to do.</p>
      {filters}
    </section>

    <div className="kpis" style={{ margin: '20px 0' }}>
      <div className="card kpi"><div className="k">Learners</div><div className="v">{fmt(h.learners)}</div><div className="d">{fmt(h.started)} have started · {fmt(h.finished)} finished the journey</div></div>
      <div className="card kpi"><div className="k">Active this week</div><div className="v">{fmt(h.activePct, '%')}</div><div className="d">{fmt(h.activeWeek)} of {fmt(h.learners)} did some work in the last 7 days{trend !== null ? ` · ${trend >= 0 ? '+' : ''}${trend}% vs last week` : ''}</div></div>
      <div className="card kpi"><div className="k">Average progress</div><div className="v">{fmt(h.avgProgress, '%')}</div><div className="d">of the {a.totalDays} days, per learner</div></div>
      <div className="card kpi"><div className="k">Need attention</div><div className="v" style={{ color: h.needAttention ? 'var(--danger, #b42318)' : undefined }}>{fmt(h.needAttention)}</div><div className="d">stopped for 7+ days, or not started 3+ days after joining</div></div>
    </div>

    <section className="card card-pad stack gap-8" aria-labelledby="fT" style={{ marginBottom: 18 }}>
      <h2 className="h3" id="fT"><AlertTriangle size={18} aria-hidden="true" /> What needs your attention</h2>
      <ol className="stack gap-8" style={{ margin: 0, paddingLeft: 20 }}>{a.findings.map((f, i) => <li key={i}><span>{f.text}</span> <Link className="link small bold" href={f.href}>Act <ArrowRight size={12} aria-hidden="true" /></Link></li>)}</ol>
      {!a.findings.length && <p className="muted small">Nothing urgent. Learners are moving.</p>}
    </section>

    <div className="grid-12">
      <section className="card card-pad span-8" aria-labelledby="dT">
        <h2 className="h3" id="dT">Where learners are: day by day</h2>
        <p className="muted small">How many learners finished each day. A sharp step down means that day is where people stop.</p>
        <div role="img" aria-label={`Learners who finished each of ${a.totalDays} days. Day 1: ${a.funnel.days[0]?.done ?? 0}.${a.funnel.biggestDrop ? ` Biggest drop at day ${a.funnel.biggestDrop.day}, minus ${a.funnel.biggestDrop.dropPct}%.` : ''}`}
          style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 140, marginTop: 12, borderBottom: '1px solid var(--border)' }}>
          {a.funnel.days.map(d => <div key={d.day} title={`Day ${d.day}: ${d.done} learners`} style={{ flex: 1, minWidth: 3, height: `${Math.max(2, (d.done / maxDay) * 100)}%`, background: a.funnel.biggestDrop?.day === d.day ? 'var(--danger, #b42318)' : 'var(--primary)', borderRadius: '3px 3px 0 0', opacity: d.done ? 1 : 0.25 }} />)}
        </div>
        <div className="row between xs muted" style={{ marginTop: 4 }}><span>Day 1</span><span>Day {a.totalDays}</span></div>
        {a.funnel.biggestDrop && <p className="callout warn small" style={{ marginTop: 10 }}>Biggest drop: day {a.funnel.biggestDrop.day} (−{a.funnel.biggestDrop.dropPct}%: {a.funnel.biggestDrop.from} → {a.funnel.biggestDrop.to}). Open it in <Link className="link" href="/admin/content">Content & Day materials</Link> and check the lesson, steps and materials.</p>}
        <h3 className="h4" style={{ marginTop: 16 }}>By level</h3>
        <div className="table-wrap"><table className="tbl"><caption className="sr-only">Learners per level</caption>
          <thead><tr><th>Level</th><th style={{ textAlign: 'right' }}>Reached</th><th style={{ textAlign: 'right' }}>Approved</th><th>Share approved</th></tr></thead>
          <tbody>{a.levelFunnel.map(l => <tr key={l.idx}><td className="small"><b>L{l.idx}</b> · {l.title}</td><td className="num" style={{ textAlign: 'right' }}>{l.reached}</td><td className="num" style={{ textAlign: 'right' }}>{l.approved}</td><td style={{ minWidth: 120 }}><div className="bar blue"><i style={{ width: `${h.learners ? Math.max(2, (l.approved / h.learners) * 100) : 2}%` }} /></div></td></tr>)}</tbody>
        </table></div>
      </section>

      <section className="card card-pad span-4 stack gap-12" aria-labelledby="wT">
        <h2 className="h3" id="wT">Weekly activity</h2>
        <p className="muted small">Learners who did any work, per week (last 8 weeks).</p>
        <div role="img" aria-label={`Active learners per week: ${a.weekly.map(w => w.active).join(', ')}`} style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 110 }}>
          {a.weekly.map(w => <div key={w.weekEnding} style={{ flex: 1, textAlign: 'center' }}><div className="xs num">{w.active}</div><div title={`Week ending ${w.weekEnding}`} style={{ height: `${Math.max(3, (w.active / maxWeek) * 80)}px`, background: 'var(--primary)', borderRadius: 4 }} /></div>)}
        </div>
        <h3 className="h4">Reviews (automated)</h3>
        <dl className="stack gap-4 small" style={{ margin: 0 }}>
          <div className="row between"><dt>Submitted</dt><dd className="num">{a.reviews.submitted}</dd></div>
          <div className="row between"><dt>Approved</dt><dd className="num">{a.reviews.approved}{a.reviews.submitted ? ` (${Math.round((a.reviews.approved / a.reviews.submitted) * 100)}%)` : ''}</dd></div>
          <div className="row between"><dt>Asked to improve</dt><dd className="num">{a.reviews.needsChanges}</dd></div>
          <div className="row between"><dt>Waiting</dt><dd className="num">{a.reviews.waiting}</dd></div>
          <div className="row between"><dt>Typical time to a decision</dt><dd className="num">{a.reviews.medianHours === null ? '—' : a.reviews.medianHours < 1 ? 'under 1 hour' : `${Math.round(a.reviews.medianHours)} h`}</dd></div>
        </dl>
        {a.costs && <><h3 className="h4">Costs (Super Admin)</h3><p className="small">AI this month: ${a.costs.aiUsd.toFixed(2)} · Revenue: ₹{a.costs.revenueInr.toLocaleString('en-IN')}</p></>}
      </section>
    </div>

    <section className="card card-pad" aria-labelledby="cT" style={{ marginTop: 18 }}>
      <h2 className="h3" id="cT">Cohorts compared</h2>
      <div className="table-wrap" style={{ marginTop: 8 }}><table className="tbl"><caption className="sr-only">Cohorts compared</caption>
        <thead><tr><th>Cohort</th><th style={{ textAlign: 'right' }}>Learners</th><th style={{ textAlign: 'right' }}>Active this week</th><th style={{ textAlign: 'right' }}>Avg progress</th><th style={{ textAlign: 'right' }}>Stopped</th><th style={{ textAlign: 'right' }}>Not started</th><th style={{ textAlign: 'right' }}>Finished</th></tr></thead>
        <tbody>{a.cohortsTable.map(c => <tr key={c.cohortId ?? 'none'}><td><Link className="link" href={`/admin?journey=${a.journey!.id}${c.cohortId ? `&cohort=${c.cohortId}` : ''}`}>{c.name}</Link></td><td className="num" style={{ textAlign: 'right' }}>{c.learners}</td><td className="num" style={{ textAlign: 'right' }}>{fmt(c.activePct, '%')}</td><td className="num" style={{ textAlign: 'right' }}>{fmt(c.avgProgress, '%')}</td><td className="num" style={{ textAlign: 'right' }}>{c.atRisk}</td><td className="num" style={{ textAlign: 'right' }}>{c.notStarted}</td><td className="num" style={{ textAlign: 'right' }}>{c.finished}</td></tr>)}
          {!a.cohortsTable.length && <tr><td colSpan={7} className="muted">No learners yet.</td></tr>}</tbody>
      </table></div>
    </section>

    {a.attention.length > 0 && <section className="card card-pad" aria-labelledby="aT" style={{ marginTop: 18 }}>
      <div className="row between wrap"><h2 className="h3" id="aT">Who to contact first</h2><Link className="link small" href="/settings/people?filter=attention">All who need a nudge →</Link></div>
      <div className="table-wrap" style={{ marginTop: 8 }}><table className="tbl"><caption className="sr-only">Learners needing attention</caption>
        <thead><tr><th>Learner</th><th>Status</th><th style={{ textAlign: 'right' }}>Days done</th><th>Last active</th></tr></thead>
        <tbody>{a.attention.map(p => <tr key={p.userId}><td><Link className="link" href={`/settings/people/${p.userId}`}>{p.name}</Link></td><td><span className="badge badge-warn">{STATUS[p.status]}</span></td><td className="num" style={{ textAlign: 'right' }}>{p.daysDone}</td><td className="small">{p.lastActive ? new Date(p.lastActive).toLocaleDateString('en-IN') : 'never'}</td></tr>)}</tbody>
      </table></div>
    </section>}

    <details className="card card-pad" style={{ marginTop: 18 }}>
      <summary className="bold"><Info size={14} aria-hidden="true" /> How we count</summary>
      <ul className="small stack gap-4" style={{ marginTop: 8, paddingLeft: 18 }}>
        <li><b>Learner</b>: an active member with the Learner or Team Lead role, enrolled in this journey. Each person counts once. Staff are never counted.</li>
        <li><b>Active this week</b>: finished a day, an activity or a submission in the last 7 days.</li>
        <li><b>Progress</b>: days finished ÷ {a.totalDays} days in the journey.</li>
        <li><b>Stopped</b>: has started, but did nothing in the last 7 days. <b>Not started</b>: joined 3+ days ago and has done nothing.</li>
        <li><b>Finished</b>: every level of the journey approved.</li>
        <li><b>Reviews</b> are decided automatically against the level’s rubric; “typical time” is the median from submission to decision.</li>
      </ul>
    </details>
  </>);
}

export default guarded(Analytics);
