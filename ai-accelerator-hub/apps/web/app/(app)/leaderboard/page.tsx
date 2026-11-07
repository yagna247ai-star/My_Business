import Link from 'next/link';
import { EyeOff } from 'lucide-react';
import { requireCtx } from '@/lib/server/context';
import { leaderboard } from '@/lib/domain/insights';
import { getSettings } from '@/lib/domain/account';
import { guarded } from '@/lib/server/page';

export const metadata = { title: 'Standings' };
async function Standings({ searchParams }: { searchParams: Promise<{ scope?: string }> }) {
  const ctx = await requireCtx(); const { scope } = await searchParams;
  const s = scope === 'tenant' ? 'tenant' : 'cohort';
  const [lb, settings] = await Promise.all([leaderboard(ctx, s), getSettings(ctx)]);
  return (<>
    <section className="ph ph-plain"><h1 id="pageTitle">Standings</h1><p className="desc">{lb.me ? `You are #${lb.me.pos} of ${lb.total}.` : `${lb.total} learners.`} XP comes only from server-verified activity and reviews.</p></section>
    <nav className="tabs-line" aria-label="Scope" style={{ marginTop: 16 }}><Link href="/leaderboard?scope=cohort" aria-current={s === 'cohort' ? 'page' : undefined}>My cohort</Link><Link href="/leaderboard?scope=tenant" aria-current={s === 'tenant' ? 'page' : undefined}>{ctx.tenantName}</Link></nav>
    {settings.leaderboardVisibility === 'private' && <p className="callout info small" style={{ marginBottom: 12 }}><EyeOff size={16} /><span>Others see you as &quot;Anonymous learner&quot;. <Link className="link" href="/settings">Change in settings</Link></span></p>}
    <div className="card table-wrap"><table className="tbl"><caption className="sr-only">Standings by XP</caption><thead><tr><th>#</th><th>Learner</th><th>Rank</th><th>Streak</th><th style={{ textAlign: 'right' }}>XP</th></tr></thead>
      <tbody>{lb.rows.map(r => <tr key={r.pos} className={r.me ? 'me' : ''}><td className="num bold">{r.pos}</td><td className={r.me ? 'bold' : ''}>{r.name}{r.me && <span className="badge badge-gold" style={{ marginLeft: 8 }}>You</span>}</td><td><span className="badge badge-neutral">{r.rank}</span></td><td className="num">{r.streak}</td><td className="num bold" style={{ textAlign: 'right' }}>{r.xp.toLocaleString('en-IN')}</td></tr>)}</tbody></table></div>
    <p className="muted small" style={{ marginTop: 10 }}>Learners under 18 and anyone who chooses privacy are shown anonymously. Global (cross-institution) standings require explicit consent and are not shown here.</p>
  </>);
}

export default guarded(Standings);
