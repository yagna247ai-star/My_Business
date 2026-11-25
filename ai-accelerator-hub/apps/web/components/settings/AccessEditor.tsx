'use client';
import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/client/api';
import { useRun } from './ui';

type Person = { id: string; name: string; email: string; role: string; custom: boolean };
type Perm = { key: string; info: string; fromRole: boolean; effective: boolean; mode: 'grant' | 'revoke' | 'role' };
type Access = { person: { id: string; name: string; email: string; roleLabel: string }; permissions: Perm[] };

export function AccessEditor({ people, initialUser }: { people: Person[]; initialUser: string | null }) {
  const r = useRun();
  const [q, setQ] = useState(''); const [uid, setUid] = useState(initialUser || ''); const [data, setData] = useState<Access | null>(null);
  const [modes, setModes] = useState<Record<string, Perm['mode']>>({});
  const shown = useMemo(() => people.filter(p => !q || `${p.name} ${p.email} ${p.role}`.toLowerCase().includes(q.toLowerCase())).slice(0, 50), [people, q]);
  useEffect(() => {
    if (!uid) { setData(null); return; }
    let live = true;
    api<Access>(`/api/v1/admin/access/${uid}`).then(d => { if (live) { setData(d); setModes(Object.fromEntries(d.permissions.map(p => [p.key, p.mode]))); } }).catch(e => r.setErr((e as Error).message));
    return () => { live = false; };
  }, [uid]); // eslint-disable-line react-hooks/exhaustive-deps
  const effective = (p: Perm) => modes[p.key] === 'grant' ? true : modes[p.key] === 'revoke' ? false : p.fromRole;
  const changed = data ? data.permissions.some(p => modes[p.key] !== p.mode) : false;
  return (
    <div className="grid2" style={{ gap: 18, alignItems: 'start' }}>
      <section className="card card-pad stack gap-8" aria-label="People">
        <input className="input" type="search" placeholder="Search name, email or role…" aria-label="Search people" value={q} onChange={e => setQ(e.target.value)} />
        <ul className="stack gap-4" style={{ listStyle: 'none', margin: 0, padding: 0, maxHeight: 520, overflow: 'auto' }}>
          {shown.map(p => <li key={p.id}><button type="button" className={`btn btn-block btn-sm ${uid === p.id ? 'btn-primary' : 'btn-text'}`} style={{ justifyContent: 'space-between', textAlign: 'left' }} aria-pressed={uid === p.id} onClick={() => setUid(p.id)}>
            <span><b>{p.name}</b><span className="muted xs" style={{ display: 'block' }}>{p.email} · {p.role}</span></span>{p.custom && <span className="badge badge-gold">custom</span>}
          </button></li>)}
          {!shown.length && <li className="muted small">No one matches.</li>}
        </ul>
      </section>
      <section className="card card-pad stack gap-12" aria-label="Permissions">
        {!data ? <p className="muted">Choose a person to see and change what they can do.</p> : <>
          <div><h2 className="h3">{data.person.name}</h2><p className="muted small">{data.person.email} · role: {data.person.roleLabel}</p></div>
          <r.Status />
          <div className="table-wrap"><table className="tbl"><caption className="sr-only">Permissions for {data.person.name}</caption>
            <thead><tr><th>Permission</th><th>Role default</th><th>Access</th><th>Result</th></tr></thead>
            <tbody>{data.permissions.map(p => (<tr key={p.key}>
              <td className="small"><b>{p.key}</b><div className="muted xs">{p.info}</div></td>
              <td className="small">{p.fromRole ? 'Yes' : 'No'}</td>
              <td><fieldset className="row gap-8" style={{ border: 0, padding: 0, margin: 0 }}><legend className="sr-only">{p.key}</legend>
                {(['role', 'grant', 'revoke'] as const).map(m => <label key={m} className="row gap-4 small" style={{ whiteSpace: 'nowrap' }}><input type="radio" name={`m-${p.key}`} checked={modes[p.key] === m} onChange={() => setModes({ ...modes, [p.key]: m })} />{m === 'role' ? 'Role default' : m === 'grant' ? 'Grant' : 'Remove'}</label>)}
              </fieldset></td>
              <td>{effective(p) ? <span className="badge badge-success">Allowed</span> : <span className="badge badge-neutral">No</span>}</td>
            </tr>))}</tbody>
          </table></div>
          <div className="actions">
            <button className="btn btn-text" type="button" disabled={!changed || r.busy} onClick={() => setModes(Object.fromEntries(data.permissions.map(p => [p.key, p.mode])))}>Undo changes</button>
            <button className="btn btn-text" type="button" disabled={r.busy} onClick={() => setModes(Object.fromEntries(data.permissions.map(p => [p.key, 'role'])))}>Reset all to role</button>
            <button className="btn btn-primary" type="button" disabled={!changed || r.busy} onClick={() => r.run(async () => { const d = await api<Access>(`/api/v1/admin/access/${uid}`, { method: 'PUT', body: { modes } }); setData(d); setModes(Object.fromEntries(d.permissions.map(p => [p.key, p.mode]))); }, 'Access saved.')}>Save access</button>
          </div>
        </>}
      </section>
    </div>
  );
}
