import Link from 'next/link';
import { requireCtx } from '@/lib/server/context';
import { areaStandings } from '@/lib/domain/standings';
import { guarded } from '@/lib/server/page';
import { Crown } from '@/components/app/Crown';
import { Tr } from '@/components/i18n/Tr';
import { getT } from '@/lib/i18n/server';
import { Tv } from '@/components/i18n/Tv';

export const metadata = { title: 'Area standings' };
const PLACE = { 1: '1st', 2: '2nd', 3: '3rd' } as const;

async function AreaStandings({ searchParams }: { searchParams: Promise<{ level?: string }> }) {
  const t = await getT();
  const ctx = await requireCtx();
  const { level } = await searchParams;
  const s = await areaStandings(ctx, level);
  if (!s) return <div className="card empty"><h1 className="h3"><Tr>No journey yet</Tr></h1><p className="text-2"><Tr>Area standings appear once the data analytics journey is set up.</Tr></p></div>;
  const scope = s.level ? `Level ${s.level.idx} — ${s.level.title}` : 'Whole journey';

  return (<>
    <section className="ph ph-plain">
      <h1 id="pageTitle"><Tr>Area standings</Tr></h1>
      <p className="desc"><Tv v={scope} /><Tr>. The top 3 in each area wear a crown.</Tr> {s.me ? `You are #${s.me} overall.` : ''}</p>
    </section>
    <nav className="tabs-line" aria-label={t('Level')} style={{ marginTop: 16, flexWrap: 'wrap' }}>
      <Link href="/leaderboard/areas" aria-current={!s.level ? 'page' : undefined}><Tr>All levels</Tr></Link>
      {s.journey.levels.map(l => <Link key={l.code} href={`/leaderboard/areas?level=${l.code}`} aria-current={s.level?.code === l.code ? 'page' : undefined}>L{l.idx}</Link>)}
    </nav>

    <h2 className="h3" style={{ margin: '8px 0 10px' }}><Tr>Crowns by area</Tr></h2>
    {s.areas.length === 0 && <p className="muted"><Tr>No points yet at this level.</Tr></p>}
    <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
      {s.areas.map(a => (
        <section key={a.area} className="card" aria-label={`${a.area} top 3`} style={{ padding: 14 }}>
          <h3 className="h4" style={{ marginBottom: 8 }}><Tv v={a.area} /> <span className="muted small">· {a.count} <Tr>ranked</Tr></span></h3>
          <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {a.top.map(t => <li key={t.crown} className={t.me ? 'bold' : ''} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span><span className={`crown-tag tier-${t.crown}`} style={{ marginLeft: 0, marginRight: 8 }}><Crown tier={t.crown} size={18} />{PLACE[t.crown]}</span>{t.name}{t.me && <span className="badge badge-gold" style={{ marginLeft: 6 }}><Tr>You</Tr></span>}</span>
              <span className="num">{t.points.toLocaleString('en-IN')}</span>
            </li>)}
          </ol>
        </section>))}
    </div>

    <h2 className="h3" style={{ margin: '22px 0 10px' }}><Tr>Global ranking</Tr></h2>
    <div className="card table-wrap"><table className="tbl"><caption className="sr-only"><Tr>Global ranking by points</Tr></caption>
      <thead><tr><th>#</th><th><Tr>Learner</Tr></th><th><Tr>Area</Tr></th><th style={{ textAlign: 'right' }}><Tr>Points</Tr></th></tr></thead>
      <tbody>{s.global.map(g => <tr key={g.pos} className={g.me ? 'me' : ''}><td className="num bold">{g.pos}</td><td className={g.me ? 'bold' : ''}>{g.name}</td><td><Tv v={g.area} /></td><td className="num bold" style={{ textAlign: 'right' }}>{g.points.toLocaleString('en-IN')}</td></tr>)}</tbody>
    </table></div>

    {s.bracket && <>
      <h2 className="h3" style={{ margin: '22px 0 10px' }}><Tr>Final fight bracket</Tr></h2>
      <p className="muted small" style={{ marginBottom: 10 }}><Tr>Top 8 by points, seeded best against lowest. Each match is won by the higher score on the capstone challenge; a tie goes to the higher seed.</Tr></p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        {s.bracket.rounds.map((r, i) => (
          <section key={i} className="card" aria-label={`Round ${i + 1}`} style={{ padding: 12 }}>
            <h3 className="h4" style={{ marginBottom: 8 }}>{i === s.bracket!.rounds.length - 1 ? <Tr>Final</Tr> : `Round ${i + 1}`}</h3>
            {r.map((m, j) => <div key={j} style={{ borderTop: j ? '1px solid var(--line, #ddd)' : undefined, padding: '6px 0' }}>
              <div className={m.aWon ? 'bold' : ''}><Tv v={m.a} /> <span className="num muted"><Tv v={m.scoreA} /></span></div>
              <div className={m.b && !m.aWon ? 'bold' : 'muted'}>{m.b ?? <Tr>Bye</Tr>} {m.b && <span className="num muted"><Tv v={m.scoreB} /></span>}</div>
            </div>)}
          </section>))}
      </div>
      <p className="callout success champion" style={{ marginTop: 12 }}><span><Tr>🏆 Champion:</Tr> <b><Tv v={s.bracket.champion} /></b> <Tr>wins the final fight.</Tr></span></p>
    </>}
    <p className="muted small" style={{ marginTop: 10 }}><Tr>Learners under 18 and anyone who chooses privacy are shown as &quot;Anonymous learner&quot;. Set your area in</Tr> <Link className="link" href="/settings/profile"><Tr>settings</Tr></Link>.</p>
  </>);
}

export default guarded(AreaStandings);
