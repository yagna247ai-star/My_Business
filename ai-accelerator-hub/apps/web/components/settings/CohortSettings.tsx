'use client';
import { useState } from 'react';
import { Copy, Pencil, Plus, RefreshCw } from 'lucide-react';
import { api } from '@/lib/client/api';
import { ConfirmDelete, Field, Modal, dateInput, fmtDate, useRun } from './ui';

type Row = { id: string; name: string; slug: string; startDate: string | null; endDate: string | null; maxSize: number | null; inviteCode: string | null; learners: number; teams: number };
type Form = { id?: string; name: string; startDate: string; endDate: string; maxSize: string };
const blank: Form = { name: '', startDate: '', endDate: '', maxSize: '' };

export function CohortSettings({ rows }: { rows: Row[] }) {
  const r = useRun();
  const [q, setQ] = useState(''); const [form, setForm] = useState<Form | null>(null);
  const list = rows.filter(c => !q || c.name.toLowerCase().includes(q.toLowerCase()));
  const payload = (f: Form) => ({ name: f.name, startDate: f.startDate ? new Date(f.startDate).toISOString() : null, endDate: f.endDate ? new Date(f.endDate).toISOString() : null, maxSize: f.maxSize ? Number(f.maxSize) : null });

  return (<div className="stack gap-12">
    <div className="set-toolbar">
      <input className="input set-search" type="search" aria-label="Search cohorts" placeholder="Search cohorts…" value={q} onChange={e => setQ(e.target.value)} />
      <button className="btn btn-primary btn-sm" type="button" onClick={() => setForm({ ...blank })}><Plus size={15} />New cohort</button>
    </div>
    <r.Status />
    <div className="card table-wrap"><table className="tbl"><caption className="sr-only">Cohorts</caption>
      <thead><tr><th>Cohort</th><th>Dates</th><th>Learners</th><th>Invite code</th><th><span className="sr-only">Actions</span></th></tr></thead>
      <tbody>{list.length ? list.map(c => (<tr key={c.id}>
        <td><b>{c.name}</b><div className="muted xs">{c.slug}</div></td>
        <td className="small">{fmtDate(c.startDate)} – {fmtDate(c.endDate)}</td>
        <td>{c.learners}{c.maxSize ? <span className="muted"> / {c.maxSize}</span> : ''}</td>
        <td>{c.inviteCode ? <span className="row gap-8"><span className="kbd-code">{c.inviteCode}</span><button className="btn btn-text btn-sm" type="button" aria-label={`Copy invite code for ${c.name}`} onClick={() => navigator.clipboard?.writeText(c.inviteCode!).then(() => r.setMsg(`Copied ${c.inviteCode}`))}><Copy size={14} /></button></span> : '—'}</td>
        <td><div className="set-actions">
          <button className="btn btn-outline btn-sm" type="button" title="Edit" aria-label={`Edit ${c.name}`} onClick={() => setForm({ id: c.id, name: c.name, startDate: dateInput(c.startDate), endDate: dateInput(c.endDate), maxSize: c.maxSize ? String(c.maxSize) : '' })}><Pencil size={14} /></button>
          <button className="btn btn-soft btn-sm" type="button" disabled={r.busy} title="New invite code (the old one stops working)" aria-label={`New invite code for ${c.name}`} onClick={() => r.run(() => api(`/api/v1/settings/cohorts/${c.id}`, { method: 'PATCH', body: { regenerateInvite: true } }), `New invite code for ${c.name}. The old code no longer works.`)}><RefreshCw size={14} /></button>
          <ConfirmDelete label={`Delete ${c.name}`} confirmText={c.learners ? `Delete (${c.learners} learners keep progress)` : 'Delete'} disabled={r.busy} onConfirm={() => r.run(() => api(`/api/v1/settings/cohorts/${c.id}`, { method: 'DELETE' }), `${c.name} deleted. Its learners keep their journeys and progress.`)} />
        </div></td>
      </tr>)) : <tr><td colSpan={5} className="muted">{rows.length ? 'No cohorts match.' : 'No cohorts yet. Create the first one.'}</td></tr>}</tbody>
    </table></div>

    {form && <Modal title={form.id ? 'Edit cohort' : 'New cohort'} onClose={() => setForm(null)}>
      <form className="stack gap-16" onSubmit={async e => { e.preventDefault(); const ok = await r.run(() => form.id ? api(`/api/v1/settings/cohorts/${form.id}`, { method: 'PATCH', body: payload(form) }) : api('/api/v1/settings/cohorts', { body: payload(form) }), form.id ? `${form.name} updated.` : `${form.name} created with a fresh invite code.`); if (ok) setForm(null); }}>
        {r.err && <p className="callout warn small" role="alert">{r.err}</p>}
        <Field label="Cohort name" error={r.fieldErrs.name}><input className="input" required minLength={3} maxLength={120} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Weekend Cohort 08" /></Field>
        <div className="set-form">
          <Field label="Start date"><input className="input" type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} /></Field>
          <Field label="End date"><input className="input" type="date" min={form.startDate || undefined} value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} /></Field>
        </div>
        <Field label="Maximum learners (optional)" error={r.fieldErrs.maxSize}><input className="input" type="number" min={1} max={10000} value={form.maxSize} onChange={e => setForm({ ...form, maxSize: e.target.value })} /></Field>
        <div className="actions"><button className="btn btn-text" type="button" onClick={() => setForm(null)}>Cancel</button><button className="btn btn-primary" type="submit" disabled={r.busy || form.name.trim().length < 3}>{form.id ? 'Save changes' : 'Create cohort'}</button></div>
      </form>
    </Modal>}
  </div>);
}
