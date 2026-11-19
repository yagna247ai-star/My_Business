'use client';
import { useState } from 'react';
import { EyeOff, Pencil, Plus, Power } from 'lucide-react';
import { api } from '@/lib/client/api';
import { ConfirmDelete, Field, Modal, fmtDate, useRun } from './ui';

type Opp = { id: string; orgName: string; title: string; kind: string; description: string; skillsWanted: string[]; status: string; applications: number; poster: string; createdAt: string };
type Prof = { id: string; name: string; email: string; headline: string; skills: string[]; openTo: string[]; visibility: string; updatedAt: string };
type OppForm = { id?: string; orgName: string; title: string; kind: string; description: string; skills: string; status: 'open' | 'closed' };
const blankOpp: OppForm = { orgName: '', title: '', kind: 'internship', description: '', skills: '', status: 'open' };
const VIS: Record<string, string> = { private: 'Only them', tenant: 'This institute', public: 'Public' };

export function TalentSettings({ opps, profiles }: { opps: Opp[] | null; profiles: Prof[] | null }) {
  const [tab, setTab] = useState<'opps' | 'profiles'>(opps ? 'opps' : 'profiles');
  const r = useRun();
  const [q, setQ] = useState('');
  const [form, setForm] = useState<OppForm | null>(null);
  const [prof, setProf] = useState<{ id: string; name: string; headline: string } | null>(null);
  const match = (s: string) => !q || s.toLowerCase().includes(q.toLowerCase());
  const oppBody = (f: OppForm) => ({ orgName: f.orgName, title: f.title, kind: f.kind, description: f.description, skillsWanted: f.skills.split(',').map(s => s.trim()).filter(Boolean), status: f.status });

  return (<div className="stack gap-12">
    {opps && profiles && <div className="tabs-line" role="tablist" aria-label="Talent">
      <button role="tab" type="button" aria-selected={tab === 'opps'} onClick={() => setTab('opps')}>Opportunities<span className="cnt">{opps.length}</span></button>
      <button role="tab" type="button" aria-selected={tab === 'profiles'} onClick={() => setTab('profiles')}>Talent profiles<span className="cnt">{profiles.length}</span></button>
    </div>}
    <div className="set-toolbar">
      <input className="input set-search" type="search" aria-label="Search" placeholder={tab === 'opps' ? 'Search opportunities…' : 'Search people or skills…'} value={q} onChange={e => setQ(e.target.value)} />
      {tab === 'opps' && <button className="btn btn-primary btn-sm" type="button" onClick={() => setForm({ ...blankOpp })}><Plus size={15} />New opportunity</button>}
    </div>
    <r.Status />

    {tab === 'opps' && opps && <div className="card table-wrap"><table className="tbl"><caption className="sr-only">Opportunities</caption>
      <thead><tr><th>Opportunity</th><th>Kind</th><th>Applications</th><th>Status</th><th>Posted</th><th><span className="sr-only">Actions</span></th></tr></thead>
      <tbody>{opps.filter(o => match(`${o.title} ${o.orgName} ${o.skillsWanted.join(' ')}`)).map(o => (<tr key={o.id}>
        <td><b>{o.title}</b><div className="muted xs">{o.orgName}{o.skillsWanted.length ? ` · ${o.skillsWanted.slice(0, 4).join(', ')}` : ''}</div></td>
        <td className="small">{o.kind}</td><td>{o.applications}</td>
        <td><span className={`badge ${o.status === 'open' ? 'badge-success' : 'badge-neutral'}`}>{o.status}</span></td>
        <td className="small">{fmtDate(o.createdAt)}<div className="muted xs">{o.poster}</div></td>
        <td><div className="set-actions">
          <button className="btn btn-outline btn-sm" type="button" title="Edit" aria-label={`Edit ${o.title}`} onClick={() => setForm({ id: o.id, orgName: o.orgName, title: o.title, kind: o.kind, description: o.description, skills: o.skillsWanted.join(', '), status: o.status as 'open' | 'closed' })}><Pencil size={14} /></button>
          <button className="btn btn-soft btn-sm" type="button" title={o.status === 'open' ? 'Close to applications' : 'Reopen'} aria-label={`${o.status === 'open' ? 'Close' : 'Reopen'} ${o.title}`} disabled={r.busy} onClick={() => r.run(() => api(`/api/v1/settings/talent/opportunities/${o.id}`, { method: 'PATCH', body: { status: o.status === 'open' ? 'closed' : 'open' } }), o.status === 'open' ? `${o.title} closed to new applications.` : `${o.title} reopened.`)}><Power size={14} /></button>
          <ConfirmDelete label={`Delete ${o.title}`} confirmText={o.applications ? `Delete with ${o.applications} applications` : 'Delete'} disabled={r.busy} onConfirm={() => r.run(() => api(`/api/v1/settings/talent/opportunities/${o.id}`, { method: 'DELETE' }), `${o.title} deleted.`)} />
        </div></td>
      </tr>))}{!opps.length && <tr><td colSpan={6} className="muted">No opportunities yet. Post the first one.</td></tr>}</tbody>
    </table></div>}

    {tab === 'profiles' && profiles && <div className="card table-wrap"><table className="tbl"><caption className="sr-only">Talent profiles</caption>
      <thead><tr><th>Learner</th><th>Headline</th><th>Skills</th><th>Visible to</th><th>Updated</th><th><span className="sr-only">Actions</span></th></tr></thead>
      <tbody>{profiles.filter(p => match(`${p.name} ${p.email} ${p.headline} ${p.skills.join(' ')}`)).map(p => (<tr key={p.id}>
        <td><b>{p.name}</b><div className="muted xs">{p.email}</div></td>
        <td className="small">{p.headline || <span className="muted">—</span>}</td>
        <td className="small">{p.skills.slice(0, 5).join(', ') || '—'}</td>
        <td><span className={`badge ${p.visibility === 'private' ? 'badge-neutral' : 'badge-info'}`}>{VIS[p.visibility] ?? p.visibility}</span></td>
        <td className="small">{fmtDate(p.updatedAt)}</td>
        <td><div className="set-actions">
          <button className="btn btn-outline btn-sm" type="button" title="Edit" aria-label={`Edit headline for ${p.name}`} onClick={() => setProf({ id: p.id, name: p.name, headline: p.headline })}><Pencil size={14} /></button>
          {p.visibility !== 'private' && <button className="btn btn-soft btn-sm" type="button" title="Hide profile" aria-label={`Hide ${p.name}'s profile`} disabled={r.busy} onClick={() => r.run(() => api(`/api/v1/settings/talent/profiles/${p.id}`, { method: 'PATCH', body: { visibility: 'private' } }), `${p.name}'s profile is now hidden. Only they can make it visible again.`)}><EyeOff size={14} /></button>}
          <ConfirmDelete label={`Remove ${p.name}'s profile`} confirmText="Remove profile" disabled={r.busy} onConfirm={() => r.run(() => api(`/api/v1/settings/talent/profiles/${p.id}`, { method: 'DELETE' }), `${p.name}'s talent profile removed. They have been notified.`)} />
        </div></td>
      </tr>))}{!profiles.length && <tr><td colSpan={6} className="muted">No learner has created a talent profile yet. Learners create them from Career.</td></tr>}</tbody>
    </table></div>}

    {form && <Modal title={form.id ? 'Edit opportunity' : 'New opportunity'} wide onClose={() => setForm(null)}>
      <form className="stack gap-16" onSubmit={async e => { e.preventDefault(); const ok = await r.run(() => form.id ? api(`/api/v1/settings/talent/opportunities/${form.id}`, { method: 'PATCH', body: oppBody(form) }) : api('/api/v1/settings/talent/opportunities', { body: oppBody(form) }), form.id ? `${form.title} updated.` : `${form.title} posted. Learners can now apply.`); if (ok) setForm(null); }}>
        {r.err && <p className="callout warn small" role="alert">{r.err}</p>}
        <div className="set-form">
          <Field label="Title" error={r.fieldErrs.title}><input className="input" required maxLength={140} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Data analyst intern" /></Field>
          <Field label="Organisation" error={r.fieldErrs.orgName}><input className="input" required maxLength={120} value={form.orgName} onChange={e => setForm({ ...form, orgName: e.target.value })} /></Field>
          <Field label="Kind"><select className="select" value={form.kind} onChange={e => setForm({ ...form, kind: e.target.value })}><option value="internship">Internship</option><option value="job">Job</option><option value="project">Project</option><option value="sponsorship">Sponsorship</option></select></Field>
          <Field label="Status"><select className="select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as 'open' | 'closed' })}><option value="open">Open</option><option value="closed">Closed</option></select></Field>
          <Field label="Skills wanted" hint="Comma-separated, up to 15" full><input className="input" value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })} placeholder="SQL, Excel, Power BI" /></Field>
          <Field label="Description" error={r.fieldErrs.description} hint={`${form.description.trim().length}/50 characters minimum`} full><textarea className="textarea" rows={5} required maxLength={8000} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></Field>
        </div>
        <div className="actions"><button className="btn btn-text" type="button" onClick={() => setForm(null)}>Cancel</button><button className="btn btn-primary" type="submit" disabled={r.busy || form.description.trim().length < 50 || !form.title.trim() || !form.orgName.trim()}>{form.id ? 'Save changes' : 'Post opportunity'}</button></div>
      </form>
    </Modal>}

    {prof && <Modal title={`Edit ${prof.name}'s headline`} onClose={() => setProf(null)}>
      <form className="stack gap-16" onSubmit={async e => { e.preventDefault(); const ok = await r.run(() => api(`/api/v1/settings/talent/profiles/${prof.id}`, { method: 'PATCH', body: { headline: prof.headline } }), 'Headline updated.'); if (ok) setProf(null); }}>
        {r.err && <p className="callout warn small" role="alert">{r.err}</p>}
        <Field label="Headline" hint="Use this to correct something inappropriate or wrong."><input className="input" maxLength={140} value={prof.headline} onChange={e => setProf({ ...prof, headline: e.target.value })} /></Field>
        <div className="actions"><button className="btn btn-text" type="button" onClick={() => setProf(null)}>Cancel</button><button className="btn btn-primary" type="submit" disabled={r.busy}>Save</button></div>
      </form>
    </Modal>}
  </div>);
}
