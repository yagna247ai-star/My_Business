import Link from 'next/link';
import { Trophy, RefreshCw, ArrowUp, ArrowDown } from 'lucide-react';
import { requireCtx } from '@/lib/server/context';
import { ranks, type Tab } from '@/lib/domain/ranks';
import { areaStandings } from '@/lib/domain/standings';
import { AreaCrowns } from '@/components/ranks/AreaCrowns';
import { courseFor } from '@/lib/domain/rankPointsDb';
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

type PageTab = Tab | 'areas';

async function Ranks({ searchParams }: { searchParams: Promise<{ tab?: string; level?: string; course?: string }> }) {
  const t = await getT();
  const ctx = await requireCtx();
  const sp = await searchParams;
  const tab: PageTab = sp.tab === 'state' || sp.tab === 'all' || sp.tab === 'cohort' || sp.tab === 'areas' ? sp.tab : 'city';
  // One page, one points rule (docs/RANKS_UNIFIED_SPEC.md). The level filter applies to every tab.
  // v1.1: ranks are per course (journey) in this institution; courses never mix (docs/RANKS_UNIFIED_SPEC.md).
  const { course, options } = await courseFor(ctx, sp.course);
  if (!course) return <div className="card empty"><h1 className="h3"><Tr>No ranks yet</Tr></h1><p className="text-2"><Tr>Ranks appear once you are enrolled in a course.</Tr></p></div>;
  const s = await areaStandings(ctx, sp.level, course.id);
  const href = (p: { tab?: PageTab; level?: string | null; course?: string }) => { const q = new URLSearchParams(); const cid = p.course ?? course.id; if (options.length > 1 || sp.course) q.set('course', cid); const tb = p.tab ?? tab; if (tb !== 'city') q.set('tab', tb); const lv = p.course && p.course !== course.id ? null : p.level === undefined ? sp.level : p.level; if (lv) q.set('level', lv); const qs = q.toString(); return qs ? `/ranks?${qs}` : '/ranks'; };
  const tabsAll: { key: PageTab; label: string }[] = [{ key: 'city', label: 'City' }, { key: 'state', label: 'State' }, { key: 'all', label: 'Everyone' }, { key: 'cohort', label: 'My cohort' }, { key: 'areas', label: 'Area crowns' }];
  const topBar = (<>
    {options.length > 1 && <nav className="tabs-line" aria-label={t('Course')} style={{ marginTop: 12, flexWrap: 'wrap' }}>
      <span className="muted small bold" style={{ alignSelf: 'center', marginRight: 6 }}><Tr>Course</Tr>:</span>
      {options.map(o => <Link key={o.id} href={href({ course: o.id, level: null })} aria-current={o.id === course.id ? 'page' : undefined}><Tv v={o.title} /></Link>)}
    </nav>}
    <nav className="tabs-line" aria-label={t('Rank scope')} style={{ marginTop: 12, flexWrap: 'wrap' }}>
      {tabsAll.map(x => <Link key={x.key} href={href({ tab: x.key })} aria-current={tab === x.key ? 'page' : undefined}><Tv v={x.label} /></Link>)}
    </nav>
    {s && <nav className="tabs-line" aria-label={t('Level')} style={{ marginTop: 6, flexWrap: 'wrap' }}>
      <Link href={href({ level: null })} aria-current={!s.level ? 'page' : undefined}><Tr>All levels</Tr></Link>
      {s.journey.levels.map(l => <Link key={l.code} href={href({ level: l.code })} aria-current={s.level?.code === l.code ? 'page' : undefined}>L{l.idx}</Link>)}
    </nav>}
    <p className="muted xs" style={{ margin: '6px 0 12px' }}><Tr>Ranks for</Tr> <b><Tv v={course.title} /></b> <Tr>in</Tr> <Tv v={ctx.tenantName} />. <Tr>Points are the XP earned on this course’s levels; other courses and institutions are never mixed in.</Tr></p>
  </>);
  if (tab === 'areas') return (<div className="rk">
    <section className="rk-head"><span className="rk-head-ic" aria-hidden="true"><Trophy size={20} /></span><div><span className="eyebrow"><Tr>Leaderboard</Tr></span><h1 id="pageTitle"><Tr>Ranks</Tr></h1><p className="muted small">{s ? <><Tv v={s.level ? `Level ${s.level.idx}: ${s.level.title}` : 'Whole journey'} />. <Tr>The top 3 in each area wear a crown.</Tr> {s.me ? `You are #${s.me} overall.` : ''}</> : <Tr>Area standings appear once a journey is set up.</Tr>}</p></div></section>
    {topBar}
    {s && <AreaCrowns s={s} />}
  </div>);
  const r = await ranks(ctx, tab, s?.level ? [s.level.id] : null, course.id);
  if (!r) return <div className="card empty"><h1 className="h3"><Tr>No ranks yet</Tr></h1><p className="text-2"><Tr>Ranks appear once the journey is set up.</Tr></p></div>;
  const { board, scope } = r;
  const [first, second, third] = board.list;
  const rest = board.list.slice(3);
  const where = scope.kind === 'all' ? 'everyone' : scope.name;

  return (<div className="rk">
    <section className="rk-head">
      <span className="rk-head-ic" aria-hidden="true"><Trophy size={20} /></span>
      <div><span className="eyebrow"><Tr>Leaderboard</Tr></span><h1 id="pageTitle"><Tr>Ranks</Tr></h1><p className="muted small"><Tr>Movement is since yesterday.</Tr> {r.city ? <>· <Tr>City</Tr>: <Tv v={r.city} /></> : null}{r.state ? <> · <Tr>State</Tr>: <Tv v={r.state} /></> : null}</p></div>
    </section>
    {topBar}

    <div className="rk-grid">
      <aside className="rk-side">
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
        <p className="muted xs rk-foot"><RefreshCw size={12} aria-hidden="true" /><span><Tr>Cities with fewer than 10 ranked learners are ranked at state level.</Tr> <Link className="link bold" href={href({ tab: 'areas' })}><Tr>Area crowns and the final fight</Tr></Link></span></p>
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
