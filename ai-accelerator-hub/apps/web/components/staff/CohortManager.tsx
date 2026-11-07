'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Plus, Copy } from 'lucide-react';
import { api, ApiError } from '@/lib/client/api';

type Session = { kind: string; title: string; startsAt: string; durationMin: number; liveLink: string | null };
type Cohort = { id: string; name: string; inviteCode: string | null; learners: number; schedule: { sessions?: Session[] } | null };
export function CohortManager({ cohorts, canManage }: { cohorts: Cohort[]; canManage: boolean }) {
  const router = useRouter(); const [name, setName] = useState(''); const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  const [sess, setSess] = useState<{ cohortId: string; title: string; kind: string; startsAt: string; durationMin: number; liveLink: string }>({ cohortId: '', title: '', kind: 'workshop', startsAt: '', durationMin: 90, liveLink: '' });
  const run = async (fn: () => Promise<unknown>, ok: string) => { setErr(''); setMsg(''); try { await fn(); setMsg(ok); router.refresh(); } catch (e) { setErr((e as ApiError).message); } };
  return (<div className="stack gap-20">
    {msg && <p className="callout ok small" role="status">{msg}</p>}{err && <p className="callout warn small" role="alert">{err}</p>}
    {canManage && <form className="card card-pad row gap-12 wrap" onSubmit={e => { e.preventDefault(); run(() => api('/api/v1/admin/cohorts', { body: { name } }), 'Cohort created with a fresh invite code.').then(() => setName('')); }}><label className="sr-only" htmlFor="cn">Cohort name</label><input className="input" id="cn" style={{ flex: 1, minWidth: 220 }} placeholder="New cohort name, e.g. Weekend Cohort 08" value={name} onChange={e => setName(e.target.value)} /><button className="btn btn-gold" type="submit" disabled={name.trim().length < 3}><Plus size={15} />Create cohort</button></form>}
    {cohorts.map(c => (
      <section key={c.id} className="card card-pad stack gap-12" aria-label={c.name}>
        <div className="row between wrap gap-8"><div><h2 className="h3">{c.name}</h2><p className="muted small">{c.learners} learners enrolled</p></div>{c.inviteCode && <button className="btn btn-outline btn-sm" type="button" onClick={() => navigator.clipboard?.writeText(c.inviteCode!).then(() => setMsg(`Copied ${c.inviteCode}`))}><Copy size={14} />Invite code {c.inviteCode}</button>}</div>
        <div className="table-wrap"><table className="tbl"><thead><tr><th>Session</th><th>When (IST)</th><th>Length</th><th>Live link</th></tr></thead><tbody>{(c.schedule?.sessions || []).length ? c.schedule!.sessions!.map((s, i) => <tr key={i}><td><b>{s.title}</b><div className="muted xs">{s.kind}</div></td><td className="small">{new Date(s.startsAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td><td>{s.durationMin} min</td><td>{s.liveLink ? <a className="link" href={s.liveLink} target="_blank" rel="noopener noreferrer">Open</a> : <span className="muted">not set</span>}</td></tr>) : <tr><td colSpan={4} className="muted">No sessions scheduled.</td></tr>}</tbody></table></div>
        {canManage && (sess.cohortId === c.id ? <form className="grid2" style={{ gap: 10 }} onSubmit={e => { e.preventDefault(); run(() => api(`/api/v1/admin/cohorts/${c.id}/sessions`, { body: { title: sess.title, kind: sess.kind, startsAt: new Date(sess.startsAt).toISOString(), durationMin: Number(sess.durationMin), liveLink: sess.liveLink || null } }), 'Session scheduled.').then(() => setSess({ ...sess, cohortId: '' })); }}>
          <input className="input" placeholder="Title" aria-label="Session title" value={sess.title} onChange={e => setSess({ ...sess, title: e.target.value })} />
          <select className="select" aria-label="Kind" value={sess.kind} onChange={e => setSess({ ...sess, kind: e.target.value })}><option value="workshop">Saturday workshop</option><option value="hackathon">Sunday hackathon</option><option value="office_hours">Office hours</option></select>
          <input className="input" type="datetime-local" aria-label="Start time" value={sess.startsAt} onChange={e => setSess({ ...sess, startsAt: e.target.value })} />
          <input className="input" type="number" min={15} max={600} aria-label="Length in minutes" value={sess.durationMin} onChange={e => setSess({ ...sess, durationMin: Number(e.target.value) })} />
          <input className="input" placeholder="https:// live link (optional)" aria-label="Live link" value={sess.liveLink} onChange={e => setSess({ ...sess, liveLink: e.target.value })} />
          <div className="row gap-8"><button className="btn btn-gold btn-sm" type="submit">Schedule</button><button className="btn btn-text btn-sm" type="button" onClick={() => setSess({ ...sess, cohortId: '' })}>Cancel</button></div>
        </form> : <div><button className="btn btn-soft btn-sm" type="button" onClick={() => setSess({ cohortId: c.id, title: '', kind: 'workshop', startsAt: '', durationMin: 90, liveLink: '' })}><Plus size={14} />Schedule a session</button></div>)}
      </section>
    ))}
  </div>);
}
