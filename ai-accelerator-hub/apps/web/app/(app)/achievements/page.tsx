import { Award, Lock, ShieldCheck, ShieldAlert } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { requireCtx } from '@/lib/server/context';
import { ledger, totalXp, verifyChain } from '@/lib/domain/xp';
import { pick, nextOf, TIERS } from '@/lib/domain/insights';
import { guarded } from '@/lib/server/page';
import { Tr } from '@/components/i18n/Tr';
import { Tv } from '@/components/i18n/Tv';

export const metadata = { title: 'Achievements' };
const SRC: Record<string, string> = { activity_complete: 'Activity completed', proof_submitted: 'Proof submitted', review_approved: 'Review approved', boss_bonus: 'Boss bonus', badge_bonus: 'Badge bonus' };
async function Achievements() {
  const ctx = await requireCtx();
  const [rows, xp, chain, mine, all] = await Promise.all([ledger(ctx.tenantId, ctx.userId), totalXp(ctx.tenantId, ctx.userId), verifyChain(ctx.tenantId, ctx.userId), prisma.userBadge.findMany({ where: { userId: ctx.userId } }), prisma.badge.findMany({ orderBy: { xpBonus: 'asc' } })]);
  const have = new Map(mine.map(b => [b.badgeId, b.earnedAt])); const tier = pick(TIERS, xp), nt = nextOf(TIERS, xp);
  return (<>
    <section className="ph ph-plain"><h1 id="pageTitle"><Tr>Achievements</Tr></h1><p className="desc"><Tr>Badges and every XP point with where it came from. Entries are append-only and hash-chained — nothing can be edited, only added.</Tr></p></section>
    <div className="kpis" style={{ margin: '20px 0' }}>
      <div className="card kpi"><div className="k"><Tr>Total XP</Tr></div><div className="v">{xp.toLocaleString('en-IN')}</div><div className="d">{tier.name} <Tr>tier</Tr>{nt ? ` · ${nt.min - xp} to ${nt.name}` : ''}</div></div>
      <div className="card kpi"><div className="k"><Tr>Badges</Tr></div><div className="v">{mine.length}<span className="muted" style={{ fontSize: 18 }}> / {all.length}</span></div><div className="d">{all.length - mine.length} <Tr>still to earn</Tr></div></div>
      <div className="card kpi"><div className="k"><Tr>Ledger entries</Tr></div><div className="v">{chain.total}</div><div className="d"><Tr>server-awarded only</Tr></div></div>
      <div className="card kpi"><div className="k"><Tr>Integrity</Tr></div><div className="v" style={{ fontSize: 22, display: 'flex', gap: 6, alignItems: 'center' }}>{chain.ok ? <><ShieldCheck size={22} /><Tr>Verified</Tr></> : <><ShieldAlert size={22} /><Tr>Check failed</Tr></>}</div><div className="d"><Tr>SHA-256 hash chain</Tr></div></div>
    </div>
    <section aria-labelledby="bT"><h2 className="h3" id="bT" style={{ marginBottom: 12 }}><Tr>Badges</Tr></h2><div className="badge-grid">{all.map(b => { const at = have.get(b.id); return <div key={b.id} className={`bdg ${b.tier} ${at ? 'earned' : 'locked'}`}><span className="medal" aria-hidden="true"><Award size={26} />{!at && <span className="lk"><Lock size={13} /></span>}</span><span className="tier"><Tv v={b.tier} /></span><b>{b.name}</b><small className="bold">{at ? `Earned ${new Date(at).toLocaleDateString('en-IN')}` : `+${b.xpBonus} XP`}</small></div>; })}</div></section>
    <section className="card" style={{ marginTop: 24 }} aria-labelledby="lT"><h2 className="h3" id="lT" style={{ padding: '18px 20px 0' }}><Tr>XP history</Tr></h2>
      {rows.length ? <div className="table-wrap" style={{ marginTop: 10 }}><table className="tbl"><caption className="sr-only"><Tr>XP ledger, newest first</Tr></caption><thead><tr><th><Tr>When (IST)</Tr></th><th><Tr>Source</Tr></th><th><Tr>Hash</Tr></th><th style={{ textAlign: 'right' }}>XP</th></tr></thead><tbody>{rows.map(r => <tr key={r.id}><td className="small">{r.createdAt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td><td>{SRC[r.source] || r.source}</td><td className="mono">{r.rowHash?.slice(0, 12)}…</td><td className="num bold" style={{ textAlign: 'right' }}>+{r.amount}</td></tr>)}</tbody></table></div> : <p className="text-2" style={{ padding: 20 }}><Tr>No XP yet — finish your first activity.</Tr></p>}
    </section>
  </>);
}

export default guarded(Achievements);
