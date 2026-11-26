'use client';
/**
 * Plan a cohort's classes once (docs/COHORT_WEEK_SPEC.md AC-1): start date, class days, daily blocks (Session, Lab;
 * offline with a venue or online with a link), holidays and the half day. Defaults are the SLN plan.
 */
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CalendarDays, Plus, Trash2 } from 'lucide-react';
import { api, ApiError } from '@/lib/client/api';
import { defaultCalendar, type Calendar } from '@/lib/domain/cohortCalendar';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const today = () => new Date(Date.now() + 330 * 60_000).toISOString().slice(0, 10);

export function calendarSummary(c: Calendar) {
  const days = c.classDays.length === 6 && !c.classDays.includes(7) ? 'Mon–Sat' : c.classDays.map(d => DAYS[d - 1]).join(', ');
  const blocks = c.blocks.map(b => `${b.label} ${b.start}–${b.end} ${b.mode}`).join(' · ');
  return `${days} · ${blocks}${c.halfDay ? ` · ${DAYS[c.halfDay - 1]} half day` : ''} · from ${c.startDate}`;
}

/** docs/INSTITUTION_SHARING_SPEC.md: a shared cohort's plan, this institution's own timings, and where it runs. */
export type Shared = { base: Calendar | null; own: string[]; places: string[] } | null;

export function CohortCalendarEditor({ cohortId, initial, canManage, shared = null, superAdmin = false }: { cohortId: string; initial: Calendar | null; canManage: boolean; shared?: Shared; superAdmin?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [c, setC] = useState<Calendar>(initial ?? defaultCalendar(today()));
  const [holidays, setHolidays] = useState((initial?.holidays ?? []).join(', '));
  const [scope, setScope] = useState<'all' | 'mine'>('all');
  const [err, setErr] = useState(''); const [fields, setFields] = useState<Record<string, string>>({}); const [busy, setBusy] = useState(false);
  const setBlock = (i: number, patch: Partial<Calendar['blocks'][number]>) => setC(v => ({ ...v, blocks: v.blocks.map((b, k) => k === i ? { ...b, ...patch } : b) }));
  const save = async () => {
    setErr(''); setFields({}); setBusy(true);
    try {
      await api(`/api/v1/admin/cohorts/${cohortId}/calendar`, { method: 'PUT', body: { ...c, scope: superAdmin && shared ? scope : 'mine', holidays: holidays.split(/[\s,]+/).filter(Boolean), blocks: c.blocks.map(b => ({ ...b, link: b.mode === 'online' ? b.link || null : null })) } });
      setOpen(false); router.refresh();
    } catch (e) { const a = e as ApiError; setErr(a.message); setFields(a.details ?? {}); }
    finally { setBusy(false); }
  };
  return (
    <div className="stack gap-8">
      <div className="row between wrap gap-8" style={{ alignItems: 'center' }}>
        <span className="small"><CalendarDays size={14} aria-hidden="true" /> <b>Class calendar:</b> {initial ? calendarSummary(initial) : <span className="muted">not planned yet: learners see a suggested week until you plan it.</span>}{shared && shared.own.length > 0 && <span className="muted"> · your own timings: {shared.own.join(', ')}</span>}{shared && shared.places.length > 1 && <span className="muted"> · in {shared.places.join(', ')}</span>}</span>
        <span className="row gap-8">
          <Link className="btn btn-outline btn-sm" href={`/admin/cohorts/${cohortId}/week`}>Week board →</Link>
          {canManage && !open && <button className="btn btn-soft btn-sm" type="button" onClick={() => setOpen(true)}>{initial ? 'Edit calendar' : 'Plan the calendar'}</button>}
        </span>
      </div>
      {open && (
        <form className="card card-pad stack gap-12" style={{ background: 'var(--surface-2, var(--surface))' }} onSubmit={e => { e.preventDefault(); void save(); }}>
          {err && <p className="callout warn small" role="alert">{err}{Object.keys(fields).length ? `: ${Object.entries(fields).map(([k, v]) => `${k} — ${v}`).join('; ')}` : ''}</p>}
          <div className="row gap-16 wrap">
            <label className="stack small" style={{ gap: 4 }}><b>First class day</b><input className="input" type="date" value={c.startDate} onChange={e => setC({ ...c, startDate: e.target.value })} required /></label>
            <fieldset className="stack small" style={{ gap: 4, border: 0, padding: 0, margin: 0 }}><legend><b>Class days</b></legend>
              <span className="row gap-8 wrap">{DAYS.map((d, i) => <label key={d} className="row gap-4"><input type="checkbox" checked={c.classDays.includes(i + 1)} onChange={e => setC({ ...c, classDays: e.target.checked ? [...c.classDays, i + 1].sort() : c.classDays.filter(x => x !== i + 1) })} />{d}</label>)}</span>
            </fieldset>
            <label className="stack small" style={{ gap: 4 }}><b>Half day (no classes, catch-up)</b>
              <select className="select" value={c.halfDay ?? ''} onChange={e => setC({ ...c, halfDay: e.target.value ? Number(e.target.value) : null })}><option value="">None</option>{DAYS.map((d, i) => <option key={d} value={i + 1}>{d}</option>)}</select>
            </label>
          </div>
          <div className="stack gap-8">
            <b className="small">Daily blocks (every class day)</b>
            {c.blocks.map((b, i) => (
              <div key={i} className="row gap-8 wrap" style={{ alignItems: 'center' }}>
                <input className="input" style={{ width: 120 }} aria-label="Block name" value={b.label} onChange={e => setBlock(i, { label: e.target.value, key: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `block-${i + 1}` })} />
                <input className="input" style={{ width: 110 }} type="time" aria-label="Starts" value={b.start} onChange={e => setBlock(i, { start: e.target.value })} />
                <span className="muted">to</span>
                <input className="input" style={{ width: 110 }} type="time" aria-label="Ends" value={b.end} onChange={e => setBlock(i, { end: e.target.value })} />
                <select className="select" style={{ width: 110 }} aria-label="Offline or online" value={b.mode} onChange={e => setBlock(i, { mode: e.target.value as 'offline' | 'online' })}><option value="offline">Offline</option><option value="online">Online</option></select>
                {b.mode === 'offline'
                  ? <input className="input" style={{ flex: 1, minWidth: 180 }} placeholder="Venue, e.g. Lab 2, SLN campus" aria-label="Venue" value={b.venue ?? ''} onChange={e => setBlock(i, { venue: e.target.value })} />
                  : <input className="input" style={{ flex: 1, minWidth: 180 }} placeholder="https:// meeting link" aria-label="Meeting link" value={b.link ?? ''} onChange={e => setBlock(i, { link: e.target.value })} />}
                {c.blocks.length > 1 && <button className="btn btn-text btn-sm" type="button" aria-label={`Remove ${b.label}`} onClick={() => setC({ ...c, blocks: c.blocks.filter((_, k) => k !== i) })}><Trash2 size={14} /></button>}
              </div>
            ))}
            {c.blocks.length < 4 && <div><button className="btn btn-text btn-sm" type="button" onClick={() => setC({ ...c, blocks: [...c.blocks, { key: `block-${c.blocks.length + 1}`, label: 'Practice', start: '14:00', end: '15:00', mode: 'offline', venue: '', link: null }] })}><Plus size={14} /> Add a block</button></div>}
          </div>
          <label className="stack small" style={{ gap: 4 }}><b>Holidays (no class; later days move by one)</b><input className="input" placeholder="2026-12-25, 2027-01-26" value={holidays} onChange={e => setHolidays(e.target.value)} /></label>
          <p className="muted xs">Each class day teaches the next course day in order (Level 1 Day 1, Day 2, …). Materials added on the Day materials page appear on that date for learners automatically.</p>
          {shared?.base && (
            <div className="row gap-8 wrap small" style={{ alignItems: 'center' }}>
              {superAdmin
                ? <label className="row gap-4">Save for <select className="select" value={scope} onChange={e => setScope(e.target.value as 'all' | 'mine')}><option value="all">All institutions (each keeps its own timings)</option><option value="mine">Only this institution</option></select></label>
                : <span className="muted">Changes here are your institution&apos;s own timings.</span>}
              {shared.own.length > 0 && <button className="btn btn-text btn-sm" type="button" onClick={() => { setC(shared.base!); setHolidays(shared.base!.holidays.join(', ')); }}>Use the shared timings</button>}
            </div>
          )}
          <div className="row gap-8"><button className="btn btn-gold btn-sm" type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save calendar'}</button><button className="btn btn-text btn-sm" type="button" onClick={() => setOpen(false)}>Cancel</button><Link className="link small" href="/admin/materials" style={{ marginLeft: 'auto' }}>Add day materials →</Link></div>
        </form>
      )}
    </div>
  );
}
