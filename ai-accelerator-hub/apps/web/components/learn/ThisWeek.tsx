/** Mission Control "This week": live classes, hackathon dates and the study plan, Monday to Sunday in IST (docs/THIS_WEEK_SPEC.md). */
import Link from 'next/link';
import { BookOpen, Radio, Trophy } from 'lucide-react';
import type { weekPlan } from '@/lib/domain/weekPlanCore';
import { getT } from '@/lib/i18n/server';
import { Tv } from '@/components/i18n/Tv';

export async function ThisWeek({ w }: { w: ReturnType<typeof weekPlan> }) {
  const t = await getT();
  const sum = [t('{n} live class(es)', { n: w.summary.live }), t('{n} study day(s)', { n: w.summary.study }), t('{n} material(s)', { n: w.summary.materials })].join(' · ');
  return (
    <section className="card card-pad span-12" aria-labelledby="weekT">
      <div className="row between wrap gap-8" style={{ marginBottom: 14 }}>
        <h2 className="h3" id="weekT">{t('This week')} <span className="muted small">· {w.range}</span></h2>
        <span className="muted small">{sum}</span>
      </div>
      <div className="week" role="list">
        {w.days.map(d => (
          <div key={d.name} role="listitem" className={`day ${d.isToday ? 'today' : ''} ${d.past ? 'past' : ''} ${d.items.some(i => i.kind !== 'study') ? 'event' : ''}`}>
            <span className="dn">{t(d.name)} {d.date}{d.isToday ? ` · ${t('today')}` : ''}</span>
            {d.items.length ? d.items.map((i, k) => (
              <div key={k} className={`wk-item ${i.kind}`}>
                {i.kind === 'live' ? <>
                  <span className="wk-h"><Radio size={13} aria-hidden="true" /> {i.time}</span>
                  <span className="de"><b><Tv v={i.title} /></b> <span className="muted">· {t(i.sessionKind)}</span></span>
                  {i.cta && i.href ? <a className="link bold small" href={i.href} target="_blank" rel="noopener noreferrer">{t(i.cta)} →</a> : <span className="muted xs">{i.status === 'ended' ? t('Ended') : i.status === 'live' ? t('Join link not posted yet') : t('Join opens 15 min before')}</span>}
                </> : i.kind === 'hackathon' ? <>
                  <span className="wk-h"><Trophy size={13} aria-hidden="true" /> {i.time}</span>
                  <span className="de"><Tv v={i.title} /></span>
                </> : <>
                  <span className="wk-h"><BookOpen size={13} aria-hidden="true" /> {t('Study')}</span>
                  <Link className="de link" href={i.href}><Tv v={i.title} /></Link>
                  {i.materials > 0 && <span className="muted xs">{t('{n} material(s)', { n: i.materials })}</span>}
                </>}
              </div>
            )) : <span className="de muted">{d.past ? '—' : t('Free day')}</span>}
          </div>
        ))}
      </div>
      {w.nextLive && <p className="small" style={{ marginTop: 12 }}>{t('No live class this week. Next')}: <b><Tv v={w.nextLive.title} /></b> · {w.nextLive.when}</p>}
      {!w.nextLive && !w.summary.live && w.rhythm && <p className="small muted" style={{ marginTop: 12 }}>{t('No live classes scheduled yet. Usual rhythm')}: <Tv v={w.rhythm} /></p>}
    </section>
  );
}
