import { Crown } from '@/components/app/Crown';
import Link from 'next/link';
import { Lock, CheckCircle2, Clock, Unlock, BookOpen, ExternalLink, Copy } from 'lucide-react';
import { requirePerm } from '@/lib/server/context';
import { journeyOverview } from '@/lib/domain/journey';
import { guarded } from '@/lib/server/page';
import { topApprovedLevel } from '@/lib/domain/gamify';
import { myTrack } from '@/lib/domain/journeyTracks';
import { TrackPanel } from '@/components/learn/TrackPanel';
import { getLocale, getT } from '@/lib/i18n/server';
import { Tv } from '@/components/i18n/Tv';
import { learnerTitle, starsText, titleFor } from '@/lib/domain/levelTitles';
import { journeyMaterialsFor } from '@/lib/domain/dayMaterials';

export const metadata = { title: 'Journey' };
const NUM = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen'];
const words = (n: number) => NUM[n] ?? String(n);
async function Journey() {
  const ctx = await requirePerm('learn:self');
  const [{ levels, enrollment }, track, t, locale] = await Promise.all([journeyOverview(ctx), myTrack(ctx), getT(), getLocale()]);
  // Earned title and the next one (docs/LEVEL_TITLES_SPEC.md v1.1); study materials of this course (DAY_MATERIALS v1.2).
  const earned = learnerTitle(levels, levels.filter(l => l.state === 'approved').map(l => l.idx));
  const nextLevel = levels.find(l => l.idx > earned.levelIdx) ?? null;
  const materials = await journeyMaterialsFor(ctx, enrollment.id, enrollment.journeyId);
  const top = topApprovedLevel(levels);
  const stages = [...new Map(levels.filter(l => l.stage).map(l => [l.stage!.idx, l.stage!.title])).entries()];
  return (
    <>
      <section className="ph ph-cream"><div style={{ position: 'relative' }}><span className="eyebrow">{t('Your journey')}</span><h1 id="pageTitle">{t('{s} stages. {l} levels. One portfolio.', locale === 'en' ? { s: words(stages.length), l: words(levels.length) } : { s: stages.length, l: levels.length })}</h1><p className="desc">{t('Finish or skip every activity and day of a level to open the next one. Reviews score your proof for points and never block you.')}</p></div></section>
      <section className="card card-pad row gap-12 wrap" aria-label={t('Your title')} style={{ marginBottom: 18, alignItems: 'center' }}>
        <span style={{ fontSize: 28 }} aria-hidden="true">🏅</span>
        <div style={{ flex: 1, minWidth: 220 }}><div className="muted xs bold">{t('Your title')}</div><div className="h3" style={{ margin: 0 }}><Tv v={earned.current} /> {earned.stars > 0 && <span style={{ color: 'var(--gold, #E8B94F)' }}>{starsText(earned.stars)}</span>}</div></div>
        <div className="small">{earned.isMax ? t('Top title of this course. Brilliant work!') : nextLevel ? <>{t('Next')}: <b>{t('Level {n}', { n: nextLevel.idx })} · <Tv v={earned.next ?? ''} /></b> · {t('{n} level(s) to go', { n: earned.levelsToNext })} <Link className="link bold" href={`/levels/${nextLevel.code}`}>{t('Go')} →</Link></> : null}</div>
      </section>
      {track && <TrackPanel track={track} />}
      {stages.map(([idx, title]) => (
        <section key={idx} style={{ marginBottom: 24 }} aria-labelledby={`st-${idx}`}>
          <h2 className="h3" id={`st-${idx}`} style={{ marginBottom: 10 }}>{t('Stage {n} · {title}', { n: idx, title })}</h2>
          <div className="lv-grid">{levels.filter(l => l.stage?.idx === idx).map(l => {
            const locked = l.state === 'locked';
            const status = l.state === 'approved' ? <><CheckCircle2 size={14} />{t('Approved')}</> : locked ? <><Lock size={14} />{t('After Level {n} is complete', { n: l.idx - 1 })}</> : !l.published ? <><Unlock size={14} />{t('Unlocked · content coming')}</> : <><Clock size={14} />{t(l.state.replace('_', ' '))}</>;
            const inner = <><span className="code lv-code">L{String(l.idx).padStart(2, '0')} · {l.xp} XP</span><span className="nm"><Tv v={l.title} />{l.idx === top ? <> <span className="crown-tag" aria-label={t('Your top approved level')}><Crown size={16} /> {t('Top level')}</span></> : null}</span><span className="muted xs">{(l.summary || '').split(' · ').slice(0, 3).join(' · ')}</span><span className="xs bold" style={{ color: 'var(--gold-ink, #8a6a12)' }}>{l.state === 'approved' ? <>✓ {t('Earned')}: </> : <>🏅 {t('Earns')}: </>}<Tv v={titleFor(l, levels.length).title} /> {starsText(titleFor(l, levels.length).stars)}</span><span className="st"><Tv v={status} /></span></>;
            return locked ? <div key={l.idx} className="lv-tile locked" aria-label={`Level ${l.idx} ${l.title}, locked`}><Tv v={inner} /></div> : <Link key={l.idx} href={`/levels/${l.code}`} className="lv-tile current lift"><Tv v={inner} /></Link>;
          })}</div>
        </section>
      ))}
      <section className="card card-pad stack gap-12" id="materials" aria-labelledby="matT" style={{ marginTop: 8 }}>
        <h2 className="h3" id="matT"><BookOpen size={18} aria-hidden="true" /> {t('Study materials')}</h2>
        <p className="muted small">{t('Slides, documents, sheets and videos your mentors added for each day. Open them, and make your own copy to practise in.')}</p>
        {!materials.length && <p className="muted small">{t('No materials have been added to this course yet.')}</p>}
        {materials.map(g => (
          <div key={g.levelId} className="stack gap-8">
            <h3 className="h4" style={{ margin: 0 }}>{t('Level {n}', { n: g.idx })} · <Tv v={g.title} /> <span className="muted small">· {t('{n} materials', { n: g.count })}</span></h3>
            {g.locked ? <p className="muted small"><Lock size={13} aria-hidden="true" /> {t('These open with the level.')}</p> : g.days.map(d => (
              <div key={d.day} className="stack gap-4">
                <Link className="small bold link" href={`/levels/${g.code}/days/${d.day}`}>{t('Day {n}', { n: d.day })}</Link>
                <ul className="stack gap-4" style={{ listStyle: 'none', margin: 0, padding: 0 }}>{d.items.map(m => (
                  <li key={m.id} className="mat-row" style={{ padding: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}><b><Tv v={m.title} /></b> <span className="badge badge-neutral xs">{m.kind}</span>{m.note && <div className="muted xs"><Tv v={m.note} /></div>}</div>
                    <a className="btn btn-gold btn-sm" href={`/api/v1/materials/${m.id}/open`} target="_blank" rel="noopener noreferrer">{t('Open')} <ExternalLink size={13} aria-hidden="true" /></a>
                    {m.copyUrl && <a className="btn btn-soft btn-sm" href={m.copyUrl} target="_blank" rel="noopener noreferrer"><Copy size={13} aria-hidden="true" /> {t('Copy to practise')}</a>}
                  </li>))}</ul>
              </div>))}
          </div>))}
      </section>
    </>
  );
}

export default guarded(Journey);
