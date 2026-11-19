'use client';
import { useState } from 'react';
import { Pencil, Plus, Power } from 'lucide-react';
import { api } from '@/lib/client/api';
import { ConfirmDelete, Field, Modal, fmtDate, useRun } from './ui';

type Profile = { contactEmail?: string; phone?: string; website?: string; city?: string; about?: string };
type Counts = { members: number; cohorts: number; journeys: number; orders: number };
type Mine = { id: string; name: string; slug: string; plan: string; status: string; profile: Profile; counts: Counts };
type Row = { id: string; name: string; slug: string; plan: string; status: string; createdAt: string; current: boolean; counts: Counts };
type Form = { name: string; slug: string; plan: string; adminEmail: string } & Required<Profile>;
const blank: Form = { name: '', slug: '', plan: 'free', adminEmail: '', contactEmail: '', phone: '', website: '', city: '', about: '' };

function ProfileFields({ f, set, errs }: { f: Required<Profile>; set: (p: Partial<Form>) => void; errs: Record<string, string> }) {
  return (<>
    <Field label="Contact email" error={errs.contactEmail}><input className="input" type="email" value={f.contactEmail} onChange={e => set({ contactEmail: e.target.value })} placeholder="hello@institute.edu" /></Field>
    <Field label="Phone"><input className="input" value={f.phone} onChange={e => set({ phone: e.target.value })} placeholder="+91 …" /></Field>
    <Field label="Website" error={errs.website}><input className="input" value={f.website} onChange={e => set({ website: e.target.value })} placeholder="https://" /></Field>
    <Field label="City"><input className="input" value={f.city} onChange={e => set({ city: e.target.value })} placeholder="Hyderabad" /></Field>
    <Field label="About" full><textarea className="textarea" rows={3} maxLength={1000} value={f.about} onChange={e => set({ about: e.target.value })} placeholder="One or two lines about the institute" /></Field>
  </>);
}

const fromProfile = (p: Profile) => ({ contactEmail: p.contactEmail ?? '', phone: p.phone ?? '', website: p.website ?? '', city: p.city ?? '', about: p.about ?? '' });

export function InstituteSettings({ mine, all, superAdmin }: { mine: Mine; all: Row[] | null; superAdmin: boolean }) {
  const own = useRun(); const list = useRun();
  const [f, setF] = useState<Form>({ ...blank, name: mine.name, ...fromProfile(mine.profile) });
  const [edit, setEdit] = useState<(Form & { id: string; status: string }) | null>(null);
  const [creating, setCreating] = useState<Form | null>(null);
  const [q, setQ] = useState('');
  const rows = (all ?? []).filter(r => !q || `${r.name} ${r.slug}`.toLowerCase().includes(q.toLowerCase()));

  const openEdit = async (r: Row) => {
    const full = r.id === mine.id ? mine : null;
    setEdit({ ...blank, id: r.id, name: r.name, slug: r.slug, plan: r.plan, status: r.status, ...(full ? fromProfile(full.profile) : {}) });
  };

  return (<div className="stack gap-24">
    <form className="card card-pad stack gap-16" onSubmit={e => { e.preventDefault(); own.run(() => api('/api/v1/settings/institute', { method: 'PATCH', body: { name: f.name, contactEmail: f.contactEmail, phone: f.phone, website: f.website, city: f.city, about: f.about } }), 'Institute details saved.'); }}>
      <div className="row between wrap gap-8"><div><h2 className="h3">{superAdmin ? 'Signed-in institute' : 'Institute details'}</h2><p className="muted small">Short name <span className="kbd-code">{mine.slug}</span> · Plan {mine.plan} · {mine.counts.members} member{mine.counts.members === 1 ? '' : 's'} · {mine.counts.cohorts} cohort{mine.counts.cohorts === 1 ? '' : 's'}</p></div><span className={`badge ${mine.status === 'active' ? 'badge-success' : 'badge-warn'}`}>{mine.status}</span></div>
      <own.Status />
      <div className="set-form">
        <Field label="Institute name" error={own.fieldErrs.name} full><input className="input" required minLength={3} maxLength={120} value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></Field>
        <ProfileFields f={f} set={p => setF({ ...f, ...p })} errs={own.fieldErrs} />
      </div>
      <div><button className="btn btn-primary" type="submit" disabled={own.busy || f.name.trim().length < 3}>Save details</button></div>
    </form>

    {superAdmin && all && (<section className="card card-pad stack gap-12" aria-labelledby="all-inst">
      <h2 className="h3" id="all-inst">All institutes <span className="muted">({all.length})</span></h2>
      <div className="set-toolbar" style={{ marginBottom: 0 }}>
        <input className="input set-search" type="search" aria-label="Search institutes" placeholder="Search institutes…" value={q} onChange={e => setQ(e.target.value)} />
        <button className="btn btn-primary btn-sm" type="button" onClick={() => setCreating({ ...blank })}><Plus size={15} />New institute</button>
      </div>
      <list.Status />
      <div className="table-wrap"><table className="tbl"><caption className="sr-only">Institutes</caption>
        <thead><tr><th>Institute</th><th>Plan</th><th>Status</th><th>Members</th><th>Cohorts</th><th>Created</th><th><span className="sr-only">Actions</span></th></tr></thead>
        <tbody>{rows.length ? rows.map(r => (<tr key={r.id}>
          <td><b>{r.name}</b>{r.current && <span className="badge badge-info" style={{ marginLeft: 8, height: 20 }}>You are here</span>}<div className="muted xs">{r.slug}</div></td>
          <td className="small">{r.plan}</td>
          <td><span className={`badge ${r.status === 'active' ? 'badge-success' : 'badge-warn'}`}>{r.status}</span></td>
          <td>{r.counts.members}</td><td>{r.counts.cohorts}</td><td className="small">{fmtDate(r.createdAt)}</td>
          <td><div className="set-actions">
            <button className="btn btn-outline btn-sm" type="button" title="Edit" aria-label={`Edit ${r.name}`} onClick={() => openEdit(r)}><Pencil size={14} /></button>
            {!r.current && <button className="btn btn-soft btn-sm" type="button" title={r.status === 'active' ? 'Deactivate' : 'Activate'} aria-label={`${r.status === 'active' ? 'Deactivate' : 'Activate'} ${r.name}`} disabled={list.busy} onClick={() => list.run(() => api(`/api/v1/settings/institutes/${r.id}`, { method: 'PATCH', body: { status: r.status === 'active' ? 'suspended' : 'active' } }), r.status === 'active' ? `${r.name} deactivated. Its members can no longer sign in to it.` : `${r.name} reactivated.`)}><Power size={14} /></button>}
            {!r.current && <ConfirmDelete label={`Delete ${r.name}`} confirmText="Delete permanently" disabled={list.busy} onConfirm={() => list.run(() => api(`/api/v1/settings/institutes/${r.id}`, { method: 'DELETE' }), `${r.name} deleted.`)} />}
          </div></td>
        </tr>)) : <tr><td colSpan={7} className="muted">No institutes match.</td></tr>}</tbody>
      </table></div>
      <p className="muted xs">Delete works only for an empty institute (no members, cohorts, journeys or orders). Otherwise deactivate it: data is kept and members can’t sign in to it.</p>
    </section>)}

    {creating && <Modal title="New institute" wide onClose={() => setCreating(null)}>
      <form className="stack gap-16" onSubmit={async e => { e.preventDefault(); const ok = await list.run(() => api('/api/v1/settings/institutes', { body: { name: creating.name, slug: creating.slug || undefined, plan: creating.plan, adminEmail: creating.adminEmail || undefined, contactEmail: creating.contactEmail, phone: creating.phone, website: creating.website, city: creating.city, about: creating.about } }), `${creating.name} created.`); if (ok) setCreating(null); }}>
        {list.err && <p className="callout warn small" role="alert">{list.err}</p>}
        <div className="set-form">
          <Field label="Institute name" error={list.fieldErrs.name}><input className="input" required minLength={3} maxLength={120} value={creating.name} onChange={e => setCreating({ ...creating, name: e.target.value })} /></Field>
          <Field label="Short name (optional)" error={list.fieldErrs.slug} hint="Used in invite codes. Made from the name if empty."><input className="input" maxLength={40} pattern="[a-z0-9-]*" value={creating.slug} onChange={e => setCreating({ ...creating, slug: e.target.value.toLowerCase() })} placeholder="e.g. vnr-college" /></Field>
          <Field label="Plan"><select className="select" value={creating.plan} onChange={e => setCreating({ ...creating, plan: e.target.value })}><option value="free">Free</option><option value="pro">Pro</option><option value="enterprise">Enterprise</option></select></Field>
          <Field label="First admin's email (optional)" error={list.fieldErrs.adminEmail} hint="Must already have an account. They become Institution Admin."><input className="input" type="email" value={creating.adminEmail} onChange={e => setCreating({ ...creating, adminEmail: e.target.value })} /></Field>
          <ProfileFields f={creating} set={p => setCreating({ ...creating, ...p })} errs={list.fieldErrs} />
        </div>
        <div className="actions"><button className="btn btn-text" type="button" onClick={() => setCreating(null)}>Cancel</button><button className="btn btn-primary" type="submit" disabled={list.busy || creating.name.trim().length < 3}>Create institute</button></div>
      </form>
    </Modal>}

    {edit && <Modal title={`Edit ${edit.name || 'institute'}`} wide onClose={() => setEdit(null)}>
      <form className="stack gap-16" onSubmit={async e => { e.preventDefault(); const isMine = edit.id === mine.id; const ok = await list.run(() => api(`/api/v1/settings/institutes/${edit.id}`, { method: 'PATCH', body: { name: edit.name, slug: edit.slug, plan: edit.plan, ...(isMine ? {} : { status: edit.status }), ...(isMine ? { contactEmail: edit.contactEmail, phone: edit.phone, website: edit.website, city: edit.city, about: edit.about } : {}) } }), 'Institute updated.'); if (ok) { setEdit(null); if (isMine) setF({ ...f, name: edit.name }); } }}>
        {list.err && <p className="callout warn small" role="alert">{list.err}</p>}
        <div className="set-form">
          <Field label="Institute name" error={list.fieldErrs.name}><input className="input" required minLength={3} maxLength={120} value={edit.name} onChange={e => setEdit({ ...edit, name: e.target.value })} /></Field>
          <Field label="Short name" error={list.fieldErrs.slug} hint="Changing it doesn't change existing invite codes."><input className="input" required maxLength={40} pattern="[a-z0-9-]+" value={edit.slug} onChange={e => setEdit({ ...edit, slug: e.target.value.toLowerCase() })} /></Field>
          <Field label="Plan"><select className="select" value={edit.plan} onChange={e => setEdit({ ...edit, plan: e.target.value })}><option value="free">Free</option><option value="pro">Pro</option><option value="enterprise">Enterprise</option></select></Field>
          {edit.id !== mine.id && <Field label="Status"><select className="select" value={edit.status} onChange={e => setEdit({ ...edit, status: e.target.value })}><option value="active">Active</option><option value="suspended">Deactivated</option></select></Field>}
          {edit.id === mine.id && <ProfileFields f={edit} set={p => setEdit({ ...edit, ...p })} errs={list.fieldErrs} />}
        </div>
        <div className="actions"><button className="btn btn-text" type="button" onClick={() => setEdit(null)}>Cancel</button><button className="btn btn-primary" type="submit" disabled={list.busy}>Save changes</button></div>
      </form>
    </Modal>}
  </div>);
}
