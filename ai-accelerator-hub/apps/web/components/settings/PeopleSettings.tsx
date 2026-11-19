'use client';
import { useMemo, useState } from 'react';
import { Pencil, UserPlus, KeyRound } from 'lucide-react';
import { api } from '@/lib/client/api';
import { ConfirmDelete, Field, Modal, fmtDate, useRun } from './ui';

type Row = { userId: string; name: string | null; email: string; role: string; roleLabel: string; status: string; cohortId: string | null; joinedAt: string; journey: { id: string; title: string } | null };
type Opt = { code: string; label: string };
type Add = { name: string; email: string; role: string; password: string; cohortId: string };
type Edit = { userId: string; name: string; role: string; status: string; cohortId: string };

/** A readable starting password the admin can pass on: 3 words-ish + digits, always meets the 10+/letter/number rule. */
function makePassword() {
  const a = 'abcdefghjkmnpqrstuvwxyz', A = 'ABCDEFGHJKLMNPQRSTUVWXYZ', d = '23456789';
  const pick = (s: string, n: number) => Array.from(crypto.getRandomValues(new Uint32Array(n)), x => s[x % s.length]).join('');
  return `${pick(A, 1)}${pick(a, 6)}-${pick(d, 4)}`;
}

export function PeopleSettings({ rows, roles, cohorts, meId }: { rows: Row[]; roles: Opt[]; cohorts: { id: string; name: string }[]; meId: string }) {
  const r = useRun();
  const [q, setQ] = useState(''); const [role, setRole] = useState(''); const [status, setStatus] = useState('');
  const [add, setAdd] = useState<Add | null>(null); const [edit, setEdit] = useState<Edit | null>(null);
  const cohortName = useMemo(() => new Map(cohorts.map(c => [c.id, c.name])), [cohorts]);
  const list = rows.filter(x => (!q || `${x.name ?? ''} ${x.email}`.toLowerCase().includes(q.toLowerCase())) && (!role || x.role === role) && (!status || x.status === status));
  const locked = (x: Row) => x.userId === meId || x.role === 'super_admin';

  return (<div className="stack gap-12">
    <div className="set-toolbar">
      <div className="row gap-8 wrap" style={{ flex: 1 }}>
        <input className="input set-search" type="search" aria-label="Search people" placeholder="Search name or email…" value={q} onChange={e => setQ(e.target.value)} />
        <select className="select" aria-label="Filter by role" value={role} onChange={e => setRole(e.target.value)}><option value="">All roles</option>{[{ code: 'super_admin', label: 'Super Admin' }, ...roles].map(o => <option key={o.code} value={o.code}>{o.label}</option>)}</select>
        <select className="select" aria-label="Filter by status" value={status} onChange={e => setStatus(e.target.value)}><option value="">Any status</option><option value="active">Active</option><option value="suspended">Suspended</option></select>
      </div>
      <button className="btn btn-primary btn-sm" type="button" onClick={() => setAdd({ name: '', email: '', role: 'learner', password: makePassword(), cohortId: '' })}><UserPlus size={15} />Add person</button>
    </div>
    <r.Status />
    <div className="card table-wrap"><table className="tbl"><caption className="sr-only">People</caption>
      <thead><tr><th>Person</th><th>Role</th><th>Cohort</th><th>Journey</th><th>Status</th><th>Joined</th><th><span className="sr-only">Actions</span></th></tr></thead>
      <tbody>{list.length ? list.map(x => (<tr key={x.userId}>
        <td><b>{x.name || '—'}</b>{x.userId === meId && <span className="muted xs"> (you)</span>}<div className="muted xs">{x.email}</div></td>
        <td className="small">{x.roleLabel}</td>
        <td className="small">{x.cohortId ? cohortName.get(x.cohortId) ?? '—' : '—'}</td>
        <td className="small">{x.journey?.title ?? '—'}</td>
        <td><span className={`badge ${x.status === 'active' ? 'badge-success' : 'badge-warn'}`}>{x.status}</span></td>
        <td className="small">{fmtDate(x.joinedAt)}</td>
        <td><div className="set-actions">{locked(x) ? <span className="muted xs">{x.userId === meId ? 'Use Profile' : 'Managed centrally'}</span> : <>
          <button className="btn btn-outline btn-sm" type="button" title="Edit" aria-label={`Edit ${x.name || x.email}`} onClick={() => setEdit({ userId: x.userId, name: x.name ?? '', role: x.role, status: x.status, cohortId: x.cohortId ?? '' })}><Pencil size={14} /></button>
          <ConfirmDelete label={`Remove ${x.name || x.email}`} confirmText="Remove" disabled={r.busy} onConfirm={() => r.run(() => api(`/api/v1/settings/people/${x.userId}`, { method: 'DELETE' }), `${x.name || x.email} removed from the institute. Their account still exists.`)} />
        </>}</div></td>
      </tr>)) : <tr><td colSpan={7} className="muted">No one matches these filters.</td></tr>}</tbody>
    </table></div>
    <p className="muted xs">Showing {list.length} of {rows.length}. Removing someone ends their membership here; their account, other institutes and past progress are kept.</p>

    {add && <Modal title="Add a person" wide onClose={() => setAdd(null)}>
      <form className="stack gap-16" onSubmit={async e => { e.preventDefault(); const ok = await r.run(() => api('/api/v1/settings/people', { body: { name: add.name, email: add.email, role: add.role, password: add.password, cohortId: add.cohortId || null } }), `${add.name} added. If they are new, share the starting password with them: ${add.password}`); if (ok) setAdd(null); }}>
        {r.err && <p className="callout warn small" role="alert">{r.err}</p>}
        <div className="set-form">
          <Field label="Full name" error={r.fieldErrs.name}><input className="input" required minLength={2} maxLength={100} value={add.name} onChange={e => setAdd({ ...add, name: e.target.value })} /></Field>
          <Field label="Email" error={r.fieldErrs.email}><input className="input" type="email" required value={add.email} onChange={e => setAdd({ ...add, email: e.target.value })} /></Field>
          <Field label="Role" error={r.fieldErrs.role}><select className="select" value={add.role} onChange={e => setAdd({ ...add, role: e.target.value })}>{roles.map(o => <option key={o.code} value={o.code}>{o.label}</option>)}</select></Field>
          <Field label="Cohort" error={r.fieldErrs.cohortId}><select className="select" value={add.cohortId} onChange={e => setAdd({ ...add, cohortId: e.target.value })}><option value="">No cohort</option>{cohorts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
          <Field label="Starting password" error={r.fieldErrs.password} hint="Only used if this email has no account yet. 10+ characters with a letter and a number." full>
            <span className="row gap-8"><input className="input" required minLength={10} maxLength={200} value={add.password} onChange={e => setAdd({ ...add, password: e.target.value })} style={{ fontFamily: 'JetBrains Mono, monospace' }} /><button className="btn btn-soft btn-sm" type="button" onClick={() => setAdd({ ...add, password: makePassword() })}><KeyRound size={14} />New</button></span>
          </Field>
        </div>
        <p className="muted xs">Learners are enrolled in the default journey automatically.</p>
        <div className="actions"><button className="btn btn-text" type="button" onClick={() => setAdd(null)}>Cancel</button><button className="btn btn-primary" type="submit" disabled={r.busy}>Add person</button></div>
      </form>
    </Modal>}

    {edit && <Modal title="Edit person" onClose={() => setEdit(null)}>
      <form className="stack gap-16" onSubmit={async e => { e.preventDefault(); const ok = await r.run(() => api(`/api/v1/settings/people/${edit.userId}`, { method: 'PATCH', body: { name: edit.name, role: edit.role, status: edit.status as 'active' | 'suspended', cohortId: edit.cohortId || null } }), `${edit.name} updated.`); if (ok) setEdit(null); }}>
        {r.err && <p className="callout warn small" role="alert">{r.err}</p>}
        <Field label="Full name" error={r.fieldErrs.name}><input className="input" required minLength={2} maxLength={100} value={edit.name} onChange={e => setEdit({ ...edit, name: e.target.value })} /></Field>
        <Field label="Role"><select className="select" value={edit.role} onChange={e => setEdit({ ...edit, role: e.target.value })}>{roles.map(o => <option key={o.code} value={o.code}>{o.label}</option>)}</select></Field>
        <Field label="Cohort"><select className="select" value={edit.cohortId} onChange={e => setEdit({ ...edit, cohortId: e.target.value })}><option value="">No cohort</option>{cohorts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        <Field label="Status" hint="Suspended people can't sign in to this institute."><select className="select" value={edit.status} onChange={e => setEdit({ ...edit, status: e.target.value })}><option value="active">Active</option><option value="suspended">Suspended</option></select></Field>
        <div className="actions"><button className="btn btn-text" type="button" onClick={() => setEdit(null)}>Cancel</button><button className="btn btn-primary" type="submit" disabled={r.busy}>Save changes</button></div>
      </form>
    </Modal>}
  </div>);
}
