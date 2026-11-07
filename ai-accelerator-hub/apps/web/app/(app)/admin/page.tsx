import Link from 'next/link';
import { requirePerm } from '@/lib/server/context';
import { programAnalytics } from '@/lib/domain/insights';
import { guarded } from '@/lib/server/page';

export const metadata = { title: 'Cohort Analytics' };
async function Analytics() {
  const ctx = await requirePerm('analytics:read'); const a = await programAnalytics(ctx);
  const max = Math.max(1, ...a.funnel.map(f => f.completed));
  let worst = -1, worstDrop = 0; a.funnel.forEach((f, i) => { if (i && a.funnel[i - 1].completed) { const d = 1 - f.completed / a.funnel[i - 1].completed; if (d > worstDrop) { worstDrop = d; worst = i; } } });
  const sh = a.streakHealth; const total = Object.values(sh).reduce((x, y) => x + y, 0) || 1;
  return (<>
    <section className="ph ph-plain"><h1 id="pageTitle">Cohort analytics</h1><p className="desc">{ctx.tenantName} · computed live from activity, review and ledger records. Learning outcomes first — XP is a means, not the goal.</p></section>
    <div className="kpis" style={{ margin: '20px 0' }}>
      <div className="card kpi"><div className="k">Enrolled</div><div className="v">{a.enrolled}</div><div className="d">{a.activeLearners} active in the last 7 days</div></div>
      <div className="card kpi"><div className="k">Levels approved</div><div className="v">{a.approvedLevels}</div><div className="d">competence demonstrated</div></div>
      <div className="card kpi"><div className="k">Median review time</div><div className="v">{a.medianReviewHours === null ? '—' : `${Math.round(a.medianReviewHours)} h`}</div><div className="d">{a.pending} waiting · {a.reviewsDone} decided</div></div>
      <div className="card kpi"><div className="k">AI cost (month)</div><div className="v">${a.aiCostUsd.toFixed(2)}</div><div className="d">{a.aiTokens.toLocaleString('en-IN')} tokens · revenue ₹{a.revenueInr.toLocaleString('en-IN')}</div></div>
    </div>
    <div className="grid-12">
      <section className="card card-pad span-8" aria-labelledby="fT"><h2 className="h3" id="fT">Level 1 activity funnel</h2>
        <div className="stack gap-12" style={{ marginTop: 14 }}>{a.funnel.map((f, i) => <div key={f.idx}><div className="row between small"><span className="bold">{f.idx}. {f.name}</span><span className="muted num">{f.completed}{i > 0 && a.funnel[i - 1].completed ? ` · −${Math.round((1 - f.completed / a.funnel[i - 1].completed) * 100)}%` : ''}</span></div><div className={`bar ${i === worst ? '' : 'blue'}`} style={{ marginTop: 6 }} role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={f.completed} aria-label={f.name}><i style={{ width: `${Math.max(2, (f.completed / max) * 100)}%` }} /></div></div>)}</div>
        {worst > 0 && worstDrop > 0 && <p className="callout warn small" style={{ marginTop: 14 }}>Largest drop: {a.funnel[worst - 1].name} → {a.funnel[worst].name} (−{Math.round(worstDrop * 100)}%). Look at where learners get stuck in this step.</p>}
        {a.funnel.every(f => f.completed === 0) && <p className="muted small" style={{ marginTop: 10 }}>No activity yet. The funnel fills in as learners complete activities.</p>}
      </section>
      <section className="card card-pad span-4 stack gap-12" aria-labelledby="sT"><h2 className="h3" id="sT">Streak health</h2>
        {([['active', 'Active'], ['frozen', 'Protected by freeze'], ['grace', 'At risk (grace)'], ['recovery', 'Paused — can recover'], ['new', 'Not started']] as const).map(([k, l]) => <div key={k}><div className="row between small"><span className="bold">{l}</span><span className="muted">{sh[k] || 0}</span></div><div className="bar blue" style={{ marginTop: 6 }}><i style={{ width: `${Math.max(2, ((sh[k] || 0) / total) * 100)}%` }} /></div></div>)}
        <Link className="link small" href="/admin/people">See who needs a nudge →</Link>
      </section>
    </div>
  </>);
}

export default guarded(Analytics);
