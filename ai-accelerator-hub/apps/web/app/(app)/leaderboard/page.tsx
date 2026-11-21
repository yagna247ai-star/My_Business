import Link from 'next/link';
import { EyeOff } from 'lucide-react';
import { requireCtx } from '@/lib/server/context';
import { leaderboard, myTrackJourney } from '@/lib/domain/insights';
import { TRACK_NAMES, isTrackLevel } from '@/lib/domain/trackRules';
import { getSettings } from '@/lib/domain/account';
import { guarded } from '@/lib/server/page';
import { Tr } from '@/components/i18n/Tr';
import { getT } from '@/lib/i18n/server';
import { Tv } from '@/components/i18n/Tv';

export const metadata = { title: 'Standings' };
async function Standings({ searchParams }: { searchParams: Promise<{ scope?: string }> }) {
  const t = await getT();
  const ctx = await requireCtx(); const { scope } = await searchParams;
  const tj = await myTrackJourney(ctx);
  const s = scope === 'tenant' ? 'tenant' : scope === 'cohort' ? 'cohort' : tj ? 'track' : 'cohort';
  const trackName = tj && isTrackLevel(tj.track) ? TRACK_NAMES[tj.track] : null;
  const [lb, settings] = await Promise.all([leaderboard(ctx, s), getSettings(ctx)]);
  return (<>
    <section className="ph ph-plain"><h1 id="pageTitle"><Tr>Standings</Tr></h1><p className="desc">{lb.me ? `You are #${lb.me.pos} of ${lb.total}.` : `${lb.total} learners.`} <Tr>XP comes only from server-verified activity and reviews.</Tr></p></section>
    <nav className="tabs-line" aria-label={t('Scope')} style={{ marginTop: 16 }}>{trackName && <Link href="/leaderboard?scope=track" aria-current={s === 'track' ? 'page' : undefined}><Tv v={trackName} /> <Tr>track</Tr></Link>}<Link href="/leaderboard?scope=cohort" aria-current={s === 'cohort' ? 'page' : undefined}><Tr>My cohort</Tr></Link><Link href="/leaderboard?scope=tenant" aria-current={s === 'tenant' ? 'page' : undefined}>{ctx.tenantName}</Link><Link href="/leaderboard/areas"><Tr>Area crowns</Tr></Link></nav>
    {settings.leaderboardVisibility === 'private' && <p className="callout info small" style={{ marginBottom: 12 }}><EyeOff size={16} /><span><Tr>Others see you as &quot;Anonymous learner&quot;.</Tr> <Link className="link" href="/settings/profile"><Tr>Change in settings</Tr></Link></span></p>}
    <div className="card table-wrap"><table className="tbl"><caption className="sr-only"><Tr>Standings by XP</Tr></caption><thead><tr><th>#</th><th><Tr>Learner</Tr></th><th><Tr>Rank</Tr></th><th><Tr>Streak</Tr></th><th style={{ textAlign: 'right' }}>XP</th></tr></thead>
      <tbody>{lb.rows.map(r => <tr key={r.pos} className={r.me ? 'me' : ''}><td className="num bold">{r.pos}</td><td className={r.me ? 'bold' : ''}>{r.name}{r.me && <span className="badge badge-gold" style={{ marginLeft: 8 }}><Tr>You</Tr></span>}</td><td><span className="badge badge-neutral">{r.rank}</span></td><td className="num">{r.streak}</td><td className="num bold" style={{ textAlign: 'right' }}>{r.xp.toLocaleString('en-IN')}</td></tr>)}</tbody></table></div>
    <p className="muted small" style={{ marginTop: 10 }}><Tr>Learners under 18 and anyone who chooses privacy are shown anonymously. Global (cross-institution) standings require explicit consent and are not shown here.</Tr></p>
  </>);
}

export default guarded(Standings);
