'use client';
/** Settings → Learning tracks: which staff roles may move learners to another track (during Module 1 only). */
import { useState } from 'react';
import { api, ApiError } from '@/lib/client/api';

type Opt = { role: string; label: string; allowed: boolean };
export function TrackSettings({ options }: { options: Opt[] }) {
  const [rows, setRows] = useState(options);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const save = async () => {
    setBusy(true); setMsg(null);
    try {
      const r = await api<{ options: Opt[] }>('/api/v1/settings/tracks', { method: 'PUT', body: { roles: rows.filter(r => r.allowed).map(r => r.role) } });
      setRows(r.options); setMsg({ ok: true, text: 'Saved.' });
    } catch (e) { setMsg({ ok: false, text: e instanceof ApiError ? e.message : 'Could not save. Please try again.' }); }
    finally { setBusy(false); }
  };
  return (
    <section className="card card-pad stack gap-12" aria-labelledby="trackRolesTitle">
      <div><h2 className="h3" id="trackRolesTitle">Who can change a learner’s track</h2>
        <p className="small text-2" style={{ margin: '4px 0 0' }}>These roles see “Move to another track” on a learner’s profile. Super Admins can always do it. The learner then chooses whether to keep their Module 1 work or restart Module 1; their points are always kept.</p></div>
      <fieldset style={{ border: 0, padding: 0, margin: 0 }} className="stack gap-8">
        <legend className="sr-only">Roles allowed to change tracks</legend>
        {rows.map(r => (
          <label key={r.role} htmlFor={`role-${r.role}`} style={{ display: 'flex', gap: 10, alignItems: 'center', cursor: 'pointer' }}>
            <input id={`role-${r.role}`} type="checkbox" checked={r.allowed} disabled={busy} onChange={e => { setMsg(null); setRows(x => x.map(y => y.role === r.role ? { ...y, allowed: e.target.checked } : y)); }} style={{ width: 16, height: 16 }} />
            <span>{r.label}</span>
          </label>
        ))}
      </fieldset>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button type="button" className="btn btn-gold btn-sm" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
        {msg && <span className={msg.ok ? 'small' : 'field-err'} role={msg.ok ? 'status' : 'alert'}>{msg.text}</span>}
      </div>
    </section>
  );
}
