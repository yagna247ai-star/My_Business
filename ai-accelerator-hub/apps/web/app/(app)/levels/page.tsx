import { Crown } from '@/components/app/Crown';
import Link from 'next/link';
import { Lock, CheckCircle2, Clock, Unlock } from 'lucide-react';
import { requirePerm } from '@/lib/server/context';
import { journeyOverview } from '@/lib/domain/journey';
import { guarded } from '@/lib/server/page';
import { topApprovedLevel } from '@/lib/domain/gamify';
import { myTrack } from '@/lib/domain/journeyTracks';
import { TrackPanel } from '@/components/learn/TrackPanel';
import { getLocale, getT } from '@/lib/i18n/server';
import { Tv } from '@/components/i18n/Tv';

export const metadata = { title: 'Journey' };
const NUM = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen'];
const words = (n: number) => NUM[n] ?? String(n);
async function Journey() {
  const ctx = await requirePerm('learn:self');
  const [{ levels }, track, t, locale] = await Promise.all([journeyOverview(ctx), myTrack(ctx), getT(), getLocale()]);
  const top = topApprovedLevel(levels);
  const stages = [...new Map(levels.filter(l => l.stage).map(l => [l.stage!.idx, l.stage!.title])).entries()];
  return (
    <>
      <section className="ph ph-cream"><div style={{ position: 'relative' }}><span className="eyebrow">{t('Your journey')}</span><h1 id="pageTitle">{t('{s} stages. {l} levels. One portfolio.', locale === 'en' ? { s: words(stages.length), l: words(levels.length) } : { s: stages.length, l: levels.length })}</h1><p className="desc">{t('Finish or skip every activity and day of a level to open the next one. Reviews score your proof for points and never block you.')}</p></div></section>
      {track && <TrackPanel track={track} />}
      {stages.map(([idx, title]) => (
        <section key={idx} style={{ marginBottom: 24 }} aria-labelledby={`st-${idx}`}>
          <h2 className="h3" id={`st-${idx}`} style={{ marginBottom: 10 }}>{t('Stage {n} · {title}', { n: idx, title })}</h2>
          <div className="lv-grid">{levels.filter(l => l.stage?.idx === idx).map(l => {
            const locked = l.state === 'locked';
            const status = l.state === 'approved' ? <><CheckCircle2 size={14} />{t('Approved')}</> : locked ? <><Lock size={14} />{t('After Level {n} is complete', { n: l.idx - 1 })}</> : !l.published ? <><Unlock size={14} />{t('Unlocked · content coming')}</> : <><Clock size={14} />{t(l.state.replace('_', ' '))}</>;
            const inner = <><span className="code lv-code">L{String(l.idx).padStart(2, '0')} · {l.xp} XP</span><span className="nm"><Tv v={l.title} />{l.idx === top ? <> <span className="crown-tag" aria-label={t('Your top approved level')}><Crown size={16} /> {t('Top level')}</span></> : null}</span><span className="muted xs">{(l.summary || '').split(' · ').slice(0, 3).join(' · ')}</span><span className="st"><Tv v={status} /></span></>;
            return locked ? <div key={l.idx} className="lv-tile locked" aria-label={`Level ${l.idx} ${l.title}, locked`}><Tv v={inner} /></div> : <Link key={l.idx} href={`/levels/${l.code}`} className="lv-tile current lift"><Tv v={inner} /></Link>;
          })}</div>
        </section>
      ))}
    </>
  );
}

export default guarded(Journey);
