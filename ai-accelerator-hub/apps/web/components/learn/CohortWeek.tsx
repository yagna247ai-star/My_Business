'use client';
/**
 * Mission Control "This week" from the cohort calendar (docs/COHORT_WEEK_SPEC.md): each date's course day, Session and Lab
 * (offline venue or online Join), the day's materials opening right here, attendance check-in, and one next step.
 */
import { useState } from 'react';
import Link from 'next/link';
import { BookOpen, CheckCircle2, ExternalLink, FileSpreadsheet, FileText, Folder, MapPin, NotebookPen, Presentation, Radio, Trophy, Users, Video } from 'lucide-react';
import type { CohortWeekView } from '@/lib/domain/cohortCalendar';
import { api } from '@/lib/client/api';
import { useT } from '@/components/i18n/I18nProvider';
import { Tv } from '@/components/i18n/Tv';

const ICON = { slides: Presentation, doc: FileText, sheet: FileSpreadsheet, video: Video, folder: Folder, notebook: NotebookPen, other: BookOpen } as const;
const STATE: Record<string, [string, string]> = { done: ['✓ Done', 'ok'], missed: ['Catch up', 'warn'], today: ['Today', 'now'], upcoming: ['Upcoming', ''] };

export function CohortWeek({ w: initial }: { w: CohortWeekView }) {
  const t = useT();
  const [w, setW] = useState(initial);
  const [err, setErr] = useState('');
  const checkIn = async (iso: string, block: string) => {
    setErr('');
    try {
      await api('/api/v1/attendance', { body: { date: iso, block } });
      setW(v => ({ ...v, attendance: { ...v.attendance, attended: v.attendance.attended + 1 }, days: v.days.map(d => d.iso !== iso ? d : { ...d, blocks: d.blocks.map(b => b.key !== block ? b : { ...b, canCheckIn: false, mark: { status: 'present', source: 'learner' } }) }) }));
    } catch (e) { setErr((e as Error).message); }
  };
  const opened = (id: string) => setW(v => ({ ...v, days: v.days.map(d => ({ ...d, materials: d.materials.map(m => m.id === id ? { ...m, opened: true } : m) })) }));
  const nextText = w.next ? { catchup: t('Catch up first'), today: t('Today'), next: t('Next class') }[w.next.why] : null;
  return (
    <section className="card card-pad span-12 stack gap-12" aria-labelledby="weekT">
      <div className="row between wrap gap-8" style={{ alignItems: 'center' }}>
        <h2 className="h3" id="weekT" style={{ margin: 0 }}>{t('This week')} <span className="muted small">· {w.range}</span></h2>
        <div className="row gap-12 wrap small" style={{ alignItems: 'center' }}>
          <span><b>{t('{n} of {m} class days done', { n: w.progress.done, m: w.progress.total })}</b></span>
          <span className="wk-bar" role="progressbar" aria-valuenow={w.progress.pct} aria-valuemin={0} aria-valuemax={100} aria-label={t('Week progress')}><i style={{ width: `${w.progress.pct}%` }} /></span>
          {w.attendance.held > 0 && <span className="muted">{t('Attended {n} of {m} sessions', { n: w.attendance.attended, m: w.attendance.held })}</span>}
        </div>
      </div>
      {w.next && (
        <div className={`wk-next ${w.next.why}`}>
          <span><b>{nextText}:</b> {t('Day {n}', { n: w.next.day })} · <Tv v={w.next.title} />{w.next.materials > 0 && <span className="muted"> · {t('{n} material(s)', { n: w.next.materials })}</span>}</span>
          <Link className="btn btn-gold btn-sm" href={w.next.href}>{w.next.why === 'catchup' ? t('Catch up now') : t('Open the day')} →</Link>
        </div>
      )}
      {err && <p className="callout warn small" role="alert"><Tv v={err} /></p>}
      <div className="week" role="list">
        {w.days.map(d => (
          <div key={d.iso} role="listitem" className={`day ${d.isToday ? 'today' : ''} ${d.past && d.state !== 'missed' ? 'past' : ''}`}>
            <span className="dn">{t(d.name)} {d.date}{d.isToday ? ` · ${t('today')}` : ''}</span>
            {d.state ? <span className={`wk-st ${STATE[d.state][1]}`}>{t(STATE[d.state][0])}</span>
              : <span className="wk-st">{d.kind === 'halfday' ? t('Half day · catch up') : d.kind === 'holiday' ? t('Holiday') : d.kind === 'before' ? t('Before the course starts') : t('No class')}</span>}
            {d.course && <Link className="de link bold" href={d.course.href}>{t('Day {n}', { n: d.course.day })} · <Tv v={d.course.title} /></Link>}
            {d.blocks.map(b => (
              <div key={b.key} className="wk-item live">
                <span className="wk-h"><Radio size={12} aria-hidden="true" /> <Tv v={b.label} /> · {b.time}</span>
                <span className="muted xs">{b.mode === 'offline' ? <><MapPin size={11} aria-hidden="true" /> {t('Offline')}{b.venue ? <> · <Tv v={b.venue} /></> : null}</> : t('Online')}</span>
                {b.join && <a className="link bold small" href={b.join} target="_blank" rel="noopener noreferrer">{t('Join')} →</a>}
                {b.mark ? <span className={`xs bold ${b.mark.status === 'present' ? 'wk-ok' : 'wk-warn'}`}>{b.mark.status === 'present' ? <><CheckCircle2 size={11} aria-hidden="true" /> {t('Attended')}</> : b.mark.status === 'excused' ? t('Excused') : t('Marked absent')}{b.mark.source === 'mentor' ? ` · ${t('by mentor')}` : ''}</span>
                  : b.canCheckIn ? <button type="button" className="btn btn-outline btn-sm wk-check" onClick={() => checkIn(d.iso, b.key)}>{t('I attended')}</button> : null}
              </div>
            ))}
            {d.materials.length > 0 && (
              <ul className="wk-mats" aria-label={t('Materials')}>
                {d.materials.map(m => { const I = ICON[m.kind as keyof typeof ICON] ?? BookOpen; return (
                  <li key={m.id}><a href={`/api/v1/materials/${m.id}/open`} target="_blank" rel="noopener noreferrer" onClick={() => opened(m.id)} title={t('Open')}><I size={12} aria-hidden="true" /> <Tv v={m.title} /> <ExternalLink size={10} aria-hidden="true" /></a>{m.studied && <span className="wk-ok xs" aria-label={t('Studied')}> ✓</span>}</li>); })}
              </ul>
            )}
            {d.peer && <span className="muted xs"><Users size={11} aria-hidden="true" /> {t('{n} of {m} classmates finished this day', { n: d.peer.done, m: d.peer.total })}</span>}
            {d.extras.map((x, k) => <span key={k} className="xs">{x.kind === 'hackathon' ? <Trophy size={11} aria-hidden="true" /> : <Radio size={11} aria-hidden="true" />} <Tv v={x.title} />{'time' in x ? ` · ${x.time}` : ''}{x.kind === 'live' && x.cta && x.href ? <> · <a className="link" href={x.href} target="_blank" rel="noopener noreferrer">{t(x.cta)}</a></> : null}</span>)}
          </div>
        ))}
      </div>
    </section>
  );
}
