'use client';
/** Super Admin: what a person can do, by module: No access / View / Manage (docs/ACCESS_MODULES_AND_NAV_SPEC.md). */
import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/client/api';
import { useRun } from './ui';

type Person = { id: string; name: string; email: string; role: string; custom: boolean };
type Level = 'none' | 'view' | 'manage';
type Mod = { key: string; label: string; info: string; hasView: boolean; roleLevel: Level; level: Level };
type Perm = { key: string; info: string; fromRole: boolean; effective: boolean; mode: 'grant' | 'revoke' | 'role' };
type Access = { person: { id: string; name: string; email: string; roleLabel: string }; modules: Mod[]; permissions: Perm[] };

const LABEL: Record<Level, string> = { none: 'No access', view: 'View', manage: 'Manage' };

export function AccessEditor({ people, initialUser }: { people: Person[]; initialUser: string | null }) {
  const r = useRun();
  const [q, setQ] = useState(''); const [uid, setUid] = useState(initialUser || ''); const [data, setData] = useState<Access | null>(null);
  const [levels, setLevels] = useState<Record<string, Level>>({});
  const shown = useMemo(() => people.filter(p => !q || `${p.name} ${p.email} ${p.role}`.toLowerCase().includes(q.toLowerCase())).slice(0, 60), [people, q]);
  const load = (d: Access) => { setData(d); setLevels(Object.fromEntries(d.modules.map(m => [m.key, m.level]))); };
  useEffect(() => {
    if (!uid) { setData(null); return; }
    let live = true;
    api<Access>(`/api/v1/admin/access/${uid}`).then(d => { if (live) load(d); }).catch(e => r.setErr((e as Error).message));
    return () => { live = false; };
  }, [uid]); // eslint-disable-line react-hooks/exhaustive-deps
  const changed = data ? data.modules.some(m => levels[m.key] !== m.level) : false;
  const save = (body: unknown) => r.run(async () => load(await api<Access>(`/api/v1/admin/access/${uid}`, { method: 'PUT', body })), 'Access saved. It applies on their next click.');

  return (
    <div className="access-grid">
      <section className="card card-pad stack gap-8" aria-label="People">
        <input className="input" type="search" placeholder="Search name, email or role…" aria-label="Search people" value={q} onChange={e => setQ(e.target.value)} />
        <ul className="stack gap-4" style={{ listStyle: 'none', margin: 0, padding: 0, maxHeight: 560, overflow: 'auto' }}>
          {shown.map(p => <li key={p.id}><button type="button" className={`btn btn-block btn-sm ${uid === p.id ? 'btn-primary' : 'btn-text'}`} style={{ justifyContent: 'space-between', textAlign: 'left', height: 'auto', padding: '8px 10px' }} aria-pressed={uid === p.id} onClick={() => setUid(p.id)}>
            <span style={{ minWidth: 0 }}><b>{p.name}</b><span className="xs" style={{ display: 'block', opacity: .8, overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.email} · {p.role}</span></span>{p.custom && <span className="badge badge-gold">custom</span>}
          </button></li>)}
          {!shown.length && <li className="muted small">No one matches.</li>}
        </ul>
      </section>

      <section className="card card-pad stack gap-12" aria-label="Access">
        {!data ? <p className="muted">Choose a person on the left to see and change what they can do.</p> : <>
          <div><h2 className="h3">{data.person.name}</h2><p className="muted small">{data.person.email} · role: <b>{data.person.roleLabel}</b>. Their role sets the defaults; change any module below.</p></div>
          <r.Status />
          <div className="stack gap-8">
            {data.modules.map(m => {
              const opts: Level[] = m.hasView ? ['none', 'view', 'manage'] : ['none', 'manage'];
              const cur = levels[m.key];
              return (
                <div key={m.key} className="access-row">
                  <div style={{ minWidth: 0 }}><b>{m.label}</b>{cur !== m.roleLevel && <span className="badge badge-gold" style={{ marginLeft: 6 }}>changed</span>}<div className="muted xs">{m.info}</div></div>
                  <div className="seg" role="radiogroup" aria-label={m.label}>
                    {opts.map(o => <button key={o} type="button" role="radio" aria-checked={cur === o} className={cur === o ? 'on' : ''} onClick={() => setLevels({ ...levels, [m.key]: o })}>{o === 'manage' && !m.hasView ? 'Allowed' : LABEL[o]}{o === m.roleLevel && <span className="xs" aria-label="role default"> ·&nbsp;role</span>}</button>)}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="actions">
            <button className="btn btn-text" type="button" disabled={!changed || r.busy} onClick={() => setLevels(Object.fromEntries(data.modules.map(m => [m.key, m.level])))}>Undo</button>
            <button className="btn btn-text" type="button" disabled={r.busy} onClick={() => save({ levels: Object.fromEntries(data.modules.map(m => [m.key, m.roleLevel])) })}>Reset to role</button>
            <button className="btn btn-primary" type="button" disabled={!changed || r.busy} onClick={() => save({ levels })}>Save access</button>
          </div>
          <details>
            <summary className="small bold">Advanced: individual permissions ({data.permissions.filter(p => p.effective).length} allowed)</summary>
            <ul className="stack gap-4" style={{ margin: '8px 0 0', paddingLeft: 18 }}>{data.permissions.map(p => <li key={p.key} className="small"><code>{p.key}</code> {p.effective ? '✓' : '—'} <span className="muted xs">{p.info}</span></li>)}</ul>
          </details>
        </>}
      </section>
    </div>
  );
}
