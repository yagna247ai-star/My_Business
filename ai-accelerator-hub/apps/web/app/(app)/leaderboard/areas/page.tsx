import Link from 'next/link';
import { requireCtx } from '@/lib/server/context';
import { areaStandings } from '@/lib/domain/standings';
import { guarded } from '@/lib/server/page';
import { Crown } from '@/components/app/Crown';

export const metadata = { title: 'Area standings' };
const PLACE = { 1: '1st', 2: '2nd', 3: '3rd' } as const;

async function AreaStandings({ searchParams }: { searchParams: Promise<{ level?: string }> }) {
  const ctx = await requireCtx();
  const { level } = await searchParams;
  const s = await areaStandings(ctx, level);
  if (!s) return <div className="card empty"><h1 className="h3">No journey yet</h1><p className="text-2">Area standings appear once the data analytics journey is set up.</p></div>;
  const scope = s.level ? `Level ${s.level.idx} — ${s.level.title}` : 'Whole journey';

  return (<>
    <section className="ph ph-plain">
      <h1 id="pageTitle">Area standings</h1>
      <p className="desc">{scope}. The top 3 in each area wear a crown. {s.me ? `You are #${s.me} overall.` : ''}</p>
    </section>
    <nav className="tabs-line" aria-label="Level" style={{ marginTop: 16, flexWrap: 'wrap' }}>
      <Link href="/leaderboard/areas" aria-current={!s.level ? 'page' : undefined}>All levels</Link>
      {s.journey.levels.map(l => <Link key={l.code} href={`/leaderboard/areas?level=${l.code}`} aria-current={s.level?.code === l.code ? 'page' : undefined}>L{l.idx}</Link>)}
    </nav>

    <h2 className="h3" style={{ margin: '8px 0 10px' }}>Crowns by area</h2>
    {s.areas.length === 0 && <p className="muted">No points yet at this level.</p>}
    <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
      {s.areas.map(a => (
        <section key={a.area} className="card" aria-label={`${a.area} top 3`} style={{ padding: 14 }}>
          <h3 className="h4" style={{ marginBottom: 8 }}>{a.area} <span className="muted small">· {a.count} ranked</span></h3>
          <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {a.top.map(t => <li key={t.crown} className={t.me ? 'bold' : ''} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span><span className={`crown-tag tier-${t.crown}`} style={{ marginLeft: 0, marginRight: 8 }}><Crown tier={t.crown} size={18} />{PLACE[t.crown]}</span>{t.name}{t.me && <span className="badge badge-gold" style={{ marginLeft: 6 }}>You</span>}</span>
              <span className="num">{t.points.toLocaleString('en-IN')}</span>
            </li>)}
          </ol>
        </section>))}
    </div>

    <h2 className="h3" style={{ margin: '22px 0 10px' }}>Global ranking</h2>
    <div className="card table-wrap"><table className="tbl"><caption className="sr-only">Global ranking by points</caption>
      <thead><tr><th>#</th><th>Learner</th><th>Area</th><th style={{ textAlign: 'right' }}>Points</th></tr></thead>
      <tbody>{s.global.map(g => <tr key={g.pos} className={g.me ? 'me' : ''}><td className="num bold">{g.pos}</td><td className={g.me ? 'bold' : ''}>{g.name}</td><td>{g.area}</td><td className="num bold" style={{ textAlign: 'right' }}>{g.points.toLocaleString('en-IN')}</td></tr>)}</tbody>
    </table></div>

    {s.bracket && <>
      <h2 className="h3" style={{ margin: '22px 0 10px' }}>Final fight bracket</h2>
      <p className="muted small" style={{ marginBottom: 10 }}>Top 8 by points, seeded best against lowest. Each match is won by the higher score on the capstone challenge; a tie goes to the higher seed.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        {s.bracket.rounds.map((r, i) => (
          <section key={i} className="card" aria-label={`Round ${i + 1}`} style={{ padding: 12 }}>
            <h3 className="h4" style={{ marginBottom: 8 }}>{i === s.bracket!.rounds.length - 1 ? 'Final' : `Round ${i + 1}`}</h3>
            {r.map((m, j) => <div key={j} style={{ borderTop: j ? '1px solid var(--line, #ddd)' : undefined, padding: '6px 0' }}>
              <div className={m.aWon ? 'bold' : ''}>{m.a} <span className="num muted">{m.scoreA}</span></div>
              <div className={m.b && !m.aWon ? 'bold' : 'muted'}>{m.b ?? 'Bye'} {m.b && <span className="num muted">{m.scoreB}</span>}</div>
            </div>)}
          </section>))}
      </div>
      <p className="callout success champion" style={{ marginTop: 12 }}><span>🏆 Champion: <b>{s.bracket.champion}</b> wins the final fight.</span></p>
    </>}
    <p className="muted small" style={{ marginTop: 10 }}>Learners under 18 and anyone who chooses privacy are shown as &quot;Anonymous learner&quot;. Set your area in <Link className="link" href="/settings/profile">settings</Link>.</p>
  </>);
}

export default guarded(AreaStandings);
