/** A learner's finished levels, one card per course (docs/PROFILE_LEVELS_SPEC.md). */
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import type { LevelRecord } from '@/lib/domain/levelTitles';
import { starsText } from '@/lib/domain/levelTitles';
import { getT } from '@/lib/i18n/server';
import { Tv } from '@/components/i18n/Tv';

export async function LevelRecords({ records }: { records: LevelRecord[] }) {
  const t = await getT();
  if (!records.length) return null;
  return (
    <section className="stack gap-12" aria-label={t('Levels finished')}>
      {records.map(r => (
        <div key={r.course} className="card card-pad stack gap-12">
          <div className="row between wrap gap-8" style={{ alignItems: 'baseline' }}>
            <h2 className="h3" style={{ margin: 0 }}>{t('Levels finished')} · <Tv v={r.course} /></h2>
            <b>{t('{n} of {m} levels finished', { n: r.done, m: r.total })}</b>
          </div>
          <div className="small">🏅 {t('Your title')}: <b><Tv v={r.title} /></b> {r.stars > 0 && <span style={{ color: 'var(--gold, #E8B94F)' }} aria-label={t('{n} of 5 stars', { n: r.stars })}>{starsText(r.stars)}</span>}</div>
          {r.finished.length ? (
            <ul className="stack gap-8" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {r.finished.map(f => (
                <li key={f.idx} className="row gap-8" style={{ alignItems: 'center' }}>
                  <CheckCircle2 size={18} aria-hidden="true" style={{ color: 'var(--success)' }} />
                  <span><b>{t('Level {n}', { n: f.idx })} · <Tv v={f.title} /></b>{f.at && <span className="muted small"> · {t('approved')} {new Date(f.at).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric' })}</span>}</span>
                </li>
              ))}
            </ul>
          ) : <p className="muted small">{t('No level finished yet. A level counts when a reviewer approves your proof.')}</p>}
          <div className="small">{r.complete ? <b>{t('Course complete. Brilliant work!')}</b> : r.next && <>{t('Next')}: <b>{t('Level {n}', { n: r.next.idx })} · <Tv v={r.next.title} /></b> <Link className="link bold" href="/levels">{t('Go')} →</Link></>}</div>
        </div>
      ))}
    </section>
  );
}
