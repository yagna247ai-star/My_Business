import { Award, Lock, ShieldCheck, ShieldAlert } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { requireCtx } from '@/lib/server/context';
import { ledger, totalXp, verifyChain } from '@/lib/domain/xp';
import { pick, nextOf, TIERS } from '@/lib/domain/insights';
import { guarded } from '@/lib/server/page';

export const metadata = { title: 'Achievements' };
const SRC: Record<string, string> = { activity_complete: 'Activity completed', proof_submitted: 'Proof submitted', review_approved: 'Review approved', boss_bonus: 'Boss bonus', badge_bonus: 'Badge bonus' };
async function Achievements() {
  const ctx = await requireCtx();
  const [rows, xp, chain, mine, all] = await Promise.all([ledger(ctx.tenantId, ctx.userId), totalXp(ctx.tenantId, ctx.userId), verifyChain(ctx.tenantId, ctx.userId), prisma.userBadge.findMany({ where: { userId: ctx.userId } }), prisma.badge.findMany({ orderBy: { xpBonus: 'asc' } })]);
  const have = new Map(mine.map(b => [b.badgeId, b.earnedAt])); const tier = pick(TIERS, xp), nt = nextOf(TIERS, xp);
  return (<>
    <section className="ph ph-plain"><h1 id="pageTitle">Achievements</h1><p className="desc">Badges and every XP point with where it came from. Entries are append-only and hash-chained — nothing can be edited, only added.</p></section>
    <div className="kpis" style={{ margin: '20px 0' }}>
      <div className="card kpi"><div className="k">Total XP</div><div className="v">{xp.toLocaleString('en-IN')}</div><div className="d">{tier.name} tier{nt ? ` · ${nt.min - xp} to ${nt.name}` : ''}</div></div>
      <div className="card kpi"><div className="k">Badges</div><div className="v">{mine.length}<span className="muted" style={{ fontSize: 18 }}> / {all.length}</span></div><div className="d">{all.length - mine.length} still to earn</div></div>
      <div className="card kpi"><div className="k">Ledger entries</div><div className="v">{chain.total}</div><div className="d">server-awarded only</div></div>
      <div className="card kpi"><div className="k">Integrity</div><div className="v" style={{ fontSize: 22, display: 'flex', gap: 6, alignItems: 'center' }}>{chain.ok ? <><ShieldCheck size={22} />Verified</> : <><ShieldAlert size={22} />Check failed</>}</div><div className="d">SHA-256 hash chain</div></div>
    </div>
    <section aria-labelledby="bT"><h2 className="h3" id="bT" style={{ marginBottom: 12 }}>Badges</h2><div className="badge-grid">{all.map(b => { const at = have.get(b.id); return <div key={b.id} className={`bdg ${b.tier} ${at ? 'earned' : 'locked'}`}><span className="medal" aria-hidden="true"><Award size={26} />{!at && <span className="lk"><Lock size={13} /></span>}</span><span className="tier">{b.tier}</span><b>{b.name}</b><small className="bold">{at ? `Earned ${new Date(at).toLocaleDateString('en-IN')}` : `+${b.xpBonus} XP`}</small></div>; })}</div></section>
    <section className="card" style={{ marginTop: 24 }} aria-labelledby="lT"><h2 className="h3" id="lT" style={{ padding: '18px 20px 0' }}>XP history</h2>
      {rows.length ? <div className="table-wrap" style={{ marginTop: 10 }}><table className="tbl"><caption className="sr-only">XP ledger, newest first</caption><thead><tr><th>When (IST)</th><th>Source</th><th>Hash</th><th style={{ textAlign: 'right' }}>XP</th></tr></thead><tbody>{rows.map(r => <tr key={r.id}><td className="small">{r.createdAt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td><td>{SRC[r.source] || r.source}</td><td className="mono">{r.rowHash?.slice(0, 12)}…</td><td className="num bold" style={{ textAlign: 'right' }}>+{r.amount}</td></tr>)}</tbody></table></div> : <p className="text-2" style={{ padding: 20 }}>No XP yet — finish your first activity.</p>}
    </section>
  </>);
}

export default guarded(Achievements);
