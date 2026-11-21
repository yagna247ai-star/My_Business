import Link from 'next/link';
import { Trophy, RefreshCw, ArrowUp, ArrowDown } from 'lucide-react';
import { requireCtx } from '@/lib/server/context';
import { ranks, type Tab } from '@/lib/domain/ranks';
import { guarded } from '@/lib/server/page';
import { Crown } from '@/components/app/Crown';
import { Tr } from '@/components/i18n/Tr';
import { getT } from '@/lib/i18n/server';
import { Tv } from '@/components/i18n/Tv';

export const metadata = { title: 'Ranks' };
const fmt = (n: number) => n.toLocaleString('en-IN');

function Avatar({ name, url, size = 36 }: { name: string; url: string | null; size?: number }) {
  return url
    ? <img className="rk-av" src={url} alt="" width={size} height={size} style={{ width: size, height: size }} />
    : <span className="rk-av rk-av-empty" aria-hidden="true" title={name} style={{ width: size, height: size }} />;
}

function Move({ n }: { n: number }) {
  if (!n) return null;
  return n > 0
    ? <span className="rk-move up" aria-label={`Up ${n}`}><ArrowUp size={11} aria-hidden="true" />{n}</span>
    : <span className="rk-move down" aria-label={`Down ${-n}`}><ArrowDown size={11} aria-hidden="true" />{-n}</span>;
}

async function Ranks({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const t = await getT();
  const ctx = await requireCtx();
  const q = (await searchParams).tab;
  const tab: Tab = q === 'state' || q === 'all' ? q : 'city';
  const r = await ranks(ctx, tab);
  if (!r) return <div className="card empty"><h1 className="h3"><Tr>No ranks yet</Tr></h1><p className="text-2"><Tr>Ranks appear once the journey is set up.</Tr></p></div>;
  const { board, scope } = r;
  const [first, second, third] = board.list;
  const rest = board.list.slice(3);
  const tabs: { key: Tab; label: string; sub: string }[] = [
    { key: 'city', label: 'City', sub: r.city ?? 'Not set' },
    { key: 'state', label: 'State', sub: r.state ?? 'Not set' },
    { key: 'all', label: 'The hackathon', sub: 'Everyone' },
  ];
  const where = scope.kind === 'all' ? 'everyone' : scope.name;

  return (<div className="rk">
    <section className="rk-head">
      <span className="rk-head-ic" aria-hidden="true"><Trophy size={20} /></span>
      <div><span className="eyebrow"><Tr>Leaderboard</Tr></span><h1 id="pageTitle"><Tr>Ranks</Tr></h1><p className="muted small"><Tr>Ranks refresh every 15 minutes. Movement is since yesterday.</Tr></p></div>
    </section>

    <div className="rk-grid">
      <aside className="rk-side">
        <nav className="rk-tabs" aria-label={t('Rank scope')}>
          {tabs.map(t => <Link key={t.key} href={`/ranks?tab=${t.key}`} aria-current={tab === t.key ? 'page' : undefined}><b><Tv v={t.label} /></b><span><Tv v={t.sub} /></span></Link>)}
        </nav>

        {board.me ? (
          <section className="rk-standing" aria-label={t('Your standing')}>
            <div className="rk-standing-top">
              <span className="rk-standing-eyebrow"><Tr>Your standing ·</Tr> <Tv v={where} /></span>
              <Avatar name={ctx.name || 'You'} url={null} size={44} />
            </div>
            <p className="rk-top"><Tr>Top</Tr> <Tv v={board.me.topPercent} />%</p>
            <p className="rk-pos"><Tr>You are</Tr> <b>#{board.me.rank}</b> <Tr>of</Tr> <b>{fmt(board.me.total)}</b> {scope.kind === 'all' ? <Tr>overall</Tr> : `in ${scope.name}`}.</p>
            <dl className="rk-stats">
              <div><dt>{fmt(board.me.points)}</dt><dd><Tr>points</Tr></dd></div>
              <div><dt>{board.me.level}</dt><dd><Tr>level</Tr></dd></div>
              <div><dt>{board.me.move > 0 ? `Up ${board.me.move}` : board.me.move < 0 ? `Down ${-board.me.move}` : <Tr>Steady</Tr>}</dt><dd>{board.me.move ? <Tr>since yesterday</Tr> : <Tr>same place as yesterday</Tr>}</dd></div>
            </dl>
          </section>
        ) : (
          <section className="rk-standing" aria-label={t('Your standing')}><p className="rk-pos"><Tr>Earn your first points to join the ranks.</Tr></p></section>
        )}

        {board.nextUp && (
          <section className="card rk-next" aria-label={t('Next place up')}>
            <h2 className="h4"><Tr>Next place up</Tr></h2>
            <div className="rk-next-row"><span><b>{board.nextUp.name}</b> <Tr>is at #</Tr>{board.nextUp.rank}.</span><span className="rk-pill">{fmt(board.nextUp.gap)} <Tr>points to go</Tr></span></div>
          </section>
        )}
        {r.note && <p className="callout info small"><Tv v={r.note} /></p>}
        <p className="muted xs rk-foot"><RefreshCw size={12} aria-hidden="true" /><span><Tr>Cities with fewer than 10 ranked learners are ranked at state level.</Tr> <Link className="link bold" href="/leaderboard/areas"><Tr>Area crowns and the final fight</Tr></Link></span></p>
      </aside>

      <section className="rk-main" aria-labelledby="rk-title">
        <div className="rk-main-head"><h2 className="h3" id="rk-title"><Tr>Top of</Tr> <Tv v={where} /></h2><span className="muted small"><Tr>First</Tr> {Math.min(25, board.total)} <Tr>of</Tr> {fmt(board.total)} <Tr>members.</Tr></span></div>

        {first && (
          <div className="rk-podium" aria-label={t('Top three')}>
            {[second, first, third].map((p, i) => p && (
              <div key={p.rank} className={`rk-pod rk-pod-${p.rank}`} style={{ order: i }}>
                <div className="rk-pod-person">
                  {p.rank === 1 && <span className="rk-pod-crown"><Crown tier={1} size={30} title={t('First place')} /></span>}
                  <Avatar name={p.name} url={p.avatarUrl} size={p.rank === 1 ? 72 : 58} />
                  <b className="rk-pod-name">{p.name}</b>
                  {p.me && <span className="rk-you"><Tr>You</Tr></span>}
                  <span className="muted xs">{p.level}</span>
                  <span className="rk-pill">{fmt(p.points)} <Tr>pts</Tr></span>
                </div>
                <div className="rk-step"><span className="rk-step-n">{p.rank}</span></div>
              </div>
            ))}
          </div>
        )}

        {rest.length > 0 && (
          <ol className="card rk-list" start={4} aria-label={t('Ranks 4 and below')}>
            {rest.map(p => (
              <li key={p.rank} className={p.me ? 'me' : ''}>
                <span className="rk-n">{p.rank}</span>
                <Avatar name={p.name} url={p.avatarUrl} />
                <span className="rk-who"><span className="rk-name">{p.name}{p.me && <span className="rk-you"><Tr>You</Tr></span>}{p.finisher && <span className="rk-badge"><Crown tier={1} size={12} /> <Tr>Journey Finisher</Tr></span>}</span><span className="muted xs"><Tv v={p.area} /> · {p.level}</span></span>
                <Move n={p.move} />
                <span className="rk-pts"><b>{fmt(p.points)}</b> <Tr>pts</Tr></span>
              </li>
            ))}
          </ol>
        )}
        {board.total === 0 && <p className="muted"><Tr>No points yet in</Tr> <Tv v={where} />.</p>}
      </section>
    </div>
  </div>);
}

export default guarded(Ranks);
