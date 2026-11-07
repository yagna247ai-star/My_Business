import Link from 'next/link';
import { requirePerm, hasPerm } from '@/lib/server/context';
import { reviewQueue } from '@/lib/domain/review';
import { guarded } from '@/lib/server/page';

export const metadata = { title: 'Review Queue' };
const SLA = 72;
async function Queue() {
  const ctx = await requirePerm('review:read'); const q = await reviewQueue(ctx); const canDecide = hasPerm(ctx, 'review:decide');
  const risk = q.pending.filter(p => p.waitingHours > SLA * 0.66).length;
  return (<>
    <section className="ph ph-plain"><h1 id="pageTitle">Review queue</h1><p className="desc">Oldest first. Target: every proof decided within {SLA} hours. Automated checks are suggestions — the decision is yours.</p></section>
    <div className="kpis" style={{ margin: '20px 0' }}>
      <div className="card kpi"><div className="k">Waiting</div><div className="v">{q.pending.length}</div><div className="d">{q.pending[0] ? `oldest ${q.pending[0].waitingHours} h` : 'queue clear'}</div></div>
      <div className="card kpi"><div className="k">SLA risk</div><div className="v">{risk}</div><div className={`d ${risk ? 'down' : 'up'}`}>{risk ? 'over 48 h' : 'all on track'}</div></div>
      <div className="card kpi"><div className="k">Decided (recent)</div><div className="v">{q.decided.length}</div><div className="d">last 30</div></div>
      <div className="card kpi"><div className="k">Open appeals</div><div className="v">{q.decided.filter(d => d.appeal === 'open').length}</div><div className="d">need a second reviewer</div></div>
    </div>
    {!canDecide && <p className="callout info small" style={{ marginBottom: 12 }}>Read-only: your role can view the queue but not score submissions.</p>}
    <h2 className="h3" style={{ marginBottom: 10 }}>Waiting</h2>
    {q.pending.length ? <div className="card table-wrap"><table className="tbl"><caption className="sr-only">Submissions waiting for review</caption><thead><tr><th>Learner</th><th>Level</th><th>Attempt</th><th>Waiting</th><th>Boss</th><th></th></tr></thead><tbody>{q.pending.map(p => <tr key={p.id}><td className="bold">{p.learner}</td><td>{p.level}</td><td className="num">{p.attempt}{p.attempt > 1 && <span className="badge badge-info" style={{ marginLeft: 6 }}>resubmission</span>}</td><td><span className={`status ${p.waitingHours > SLA ? 'warn' : p.waitingHours > SLA * 0.66 ? 'warn' : 'ok'}`}>{p.waitingHours} h</span></td><td className="num">{p.boss || '—'}</td><td><Link className="btn btn-ink btn-sm" href={`/review/${p.id}`}>{canDecide ? 'Review' : 'View'}</Link></td></tr>)}</tbody></table></div> : <div className="card empty"><p>Queue clear. New proofs appear here immediately.</p></div>}
    <h2 className="h3" style={{ margin: '24px 0 10px' }}>Recently decided</h2>
    {q.decided.length ? <div className="card table-wrap"><table className="tbl"><thead><tr><th>Learner</th><th>Level</th><th>Decision</th><th>Score</th><th>Reviewer</th><th>Turnaround</th><th>Appeal</th></tr></thead><tbody>{q.decided.map(d => <tr key={d.id}><td><Link className="link" href={`/review/${d.submissionId}`}>{d.learner}</Link></td><td>{d.level}</td><td><span className={`status ${d.verdict === 'approved' ? 'ok' : 'warn'}`}>{d.verdict === 'approved' ? 'Approved' : 'Changes requested'}</span></td><td className="num bold">{d.avg?.toFixed(2)}</td><td>{d.reviewer}</td><td className="num">{d.turnaroundHours} h</td><td>{d.appeal || '—'}</td></tr>)}</tbody></table></div> : <p className="text-2">Nothing decided yet.</p>}
  </>);
}

export default guarded(Queue);
