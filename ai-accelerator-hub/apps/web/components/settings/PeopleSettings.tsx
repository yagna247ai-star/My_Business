'use client';
/**
 * The one People screen (Settings → People). /admin/people redirects here, so every people action lives in one
 * place: view profile, nudge, add, edit (name, role, cohort, status, and journey for a Super Admin), remove,
 * and for learners under 18 guardian consent and "turned 18". `canManage` false = read-only staff (view + nudge).
 */
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Eye, KeyRound, Pencil, Send, UserPlus } from 'lucide-react';
import { api } from '@/lib/client/api';
import { ConfirmDelete, Field, Modal, useRun } from './ui';

type Risk = { status: string; message: string; level: string; activitiesDone: number; lastActive: string | null; needsAttention: boolean };
type Row = { userId: string; name: string | null; email: string; role: string; roleLabel: string; status: string; cohortId: string | null; joinedAt: string; journey: { id: string; title: string } | null; minor?: boolean; guardianConsent?: string; risk?: Risk };
type Opt = { code: string; label: string };
type Add = { name: string; email: string; role: string; password: string; cohortId: string };
type Edit = { userId: string; name: string; role: string; status: string; cohortId: string; journeyId: string; originalJourneyId: string };

/** A readable starting password that always meets the 10+ characters / letter / number rule. */
function makePassword() {
  const a = 'abcdefghjkmnpqrstuvwxyz', A = 'ABCDEFGHJKLMNPQRSTUVWXYZ', d = '23456789';
  const pick = (s: string, n: number) => Array.from(crypto.getRandomValues(new Uint32Array(n)), x => s[x % s.length]).join('');
  return `${pick(A, 1)}${pick(a, 6)}-${pick(d, 4)}`;
}

export function PeopleSettings({ rows, roles, cohorts, meId, canManage, journeys, initialFilter = 'all' }: {
  rows: Row[]; roles: Opt[]; cohorts: { id: string; name: string }[]; meId: string; canManage: boolean;
  /** Published journeys; set only for a Super Admin, who may move people between journeys. */
  journeys: { id: string; title: string }[] | null; initialFilter?: 'all' | 'attention';
}) {
  const r = useRun();
  const [tab, setTab] = useState<'all' | 'attention'>(initialFilter);
  const [q, setQ] = useState(''); const [role, setRole] = useState(''); const [status, setStatus] = useState('');
  const [add, setAdd] = useState<Add | null>(null); const [edit, setEdit] = useState<Edit | null>(null);
  const [nudging, setNudging] = useState<{ row: Row; text: string } | null>(null);
  const [consent, setConsent] = useState<{ row: Row; decision: 'granted' | 'revoked'; method: string; note: string } | null>(null);
  const [adult, setAdult] = useState<{ row: Row; method: string; note: string } | null>(null);
  const cohortName = useMemo(() => new Map(cohorts.map(c => [c.id, c.name])), [cohorts]);
  const attention = rows.filter(x => x.risk?.needsAttention);
  const list = (tab === 'attention' ? attention : rows).filter(x => (!q || `${x.name ?? ''} ${x.email}`.toLowerCase().includes(q.toLowerCase())) && (!role || x.role === role) && (!status || x.status === status));
  const locked = (x: Row) => x.userId === meId || x.role === 'super_admin';
  const who = (x: Row) => x.name || x.email;

  return (<div className="stack gap-12">
    <nav className="tabs-line" aria-label="Filter people" style={{ marginBottom: 0 }}>
      <a href="#" aria-current={tab === 'all' ? 'page' : undefined} onClick={e => { e.preventDefault(); setTab('all'); }}>Everyone ({rows.length})</a>
      <a href="#" aria-current={tab === 'attention' ? 'page' : undefined} onClick={e => { e.preventDefault(); setTab('attention'); }}>Needs attention ({attention.length})</a>
    </nav>
    <div className="set-toolbar">
      <div className="row gap-8 wrap" style={{ flex: 1 }}>
        <input className="input set-search" type="search" aria-label="Search people" placeholder="Search name or email…" value={q} onChange={e => setQ(e.target.value)} />
        <select className="select" aria-label="Filter by role" value={role} onChange={e => setRole(e.target.value)}><option value="">All roles</option>{[{ code: 'super_admin', label: 'Super Admin' }, ...roles].map(o => <option key={o.code} value={o.code}>{o.label}</option>)}</select>
        <select className="select" aria-label="Filter by status" value={status} onChange={e => setStatus(e.target.value)}><option value="">Any status</option><option value="active">Active</option><option value="suspended">Suspended</option></select>
      </div>
      {canManage && <button className="btn btn-primary btn-sm" type="button" onClick={() => setAdd({ name: '', email: '', role: 'learner', password: makePassword(), cohortId: '' })}><UserPlus size={15} />Add person</button>}
    </div>
    <r.Status />

    <div className="card table-wrap"><table className="tbl"><caption className="sr-only">People</caption>
      <thead><tr><th>Person</th><th>Role</th><th>Cohort</th><th>Journey</th><th>Progress</th><th>Streak</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead>
      <tbody>{list.length ? list.map(x => (<tr key={x.userId}>
        <td>
          <Link className="bold" href={`/settings/people/${x.userId}`} style={{ color: 'inherit' }}>{x.name || '—'}</Link>{x.userId === meId && <span className="muted xs"> (you)</span>}
          <div className="muted xs">{x.email}</div>
          {x.minor && <div className="row gap-8 wrap" style={{ marginTop: 4 }}>
            <span className={`badge ${x.guardianConsent === 'granted' ? 'badge-neutral' : 'badge-gold'}`}>Under 18 · consent {x.guardianConsent}</span>
            {canManage && <button className="btn btn-text btn-sm" type="button" onClick={() => setConsent({ row: x, decision: x.guardianConsent === 'granted' ? 'revoked' : 'granted', method: 'school_signed_form', note: '' })}>{x.guardianConsent === 'granted' ? 'Withdraw consent' : 'Record consent'}</button>}
            {canManage && <button className="btn btn-text btn-sm" type="button" onClick={() => setAdult({ row: x, method: 'learner_confirmed_with_institution_records', note: '' })}>Turned 18</button>}
          </div>}
        </td>
        <td className="small">{x.roleLabel}</td>
        <td className="small">{x.cohortId ? cohortName.get(x.cohortId) ?? '—' : '—'}</td>
        <td className="small">{x.journey?.title ?? '—'}</td>
        <td className="small">{x.risk ? `${x.risk.level} · ${x.risk.activitiesDone} done` : '—'}</td>
        <td className="small">{x.risk ? <span className={`status ${x.risk.needsAttention ? 'warn' : 'ok'}`} title={x.risk.message}>{x.risk.status}</span> : '—'}</td>
        <td><span className={`badge ${x.status === 'active' ? 'badge-success' : 'badge-warn'}`}>{x.status}</span></td>
        <td><div className="set-actions">
          <Link className="btn btn-soft btn-sm" href={`/settings/people/${x.userId}`} title="View profile" aria-label={`View profile of ${who(x)}`}><Eye size={14} /></Link>
          {x.risk && <button className="btn btn-soft btn-sm" type="button" title="Send a nudge" aria-label={`Nudge ${who(x)}`} onClick={() => setNudging({ row: x, text: `Hi ${x.name?.split(' ')[0] || ''}, we miss you! Even 15 minutes on your next activity keeps your momentum. Need help? Ask your mentor or the coach.` })}><Send size={14} /></button>}
          {canManage && !locked(x) && <>
            <button className="btn btn-outline btn-sm" type="button" title="Edit" aria-label={`Edit ${who(x)}`} onClick={() => setEdit({ userId: x.userId, name: x.name ?? '', role: x.role, status: x.status, cohortId: x.cohortId ?? '', journeyId: x.journey?.id ?? '', originalJourneyId: x.journey?.id ?? '' })}><Pencil size={14} /></button>
            <ConfirmDelete label={`Remove ${who(x)}`} confirmText="Remove" disabled={r.busy} onConfirm={() => r.run(() => api(`/api/v1/settings/people/${x.userId}`, { method: 'DELETE' }), `${who(x)} removed from the institute. Their account still exists.`)} />
          </>}
        </div></td>
      </tr>)) : <tr><td colSpan={8} className="muted">{tab === 'attention' ? 'Nobody needs attention right now.' : 'No one matches these filters.'}</td></tr>}</tbody>
    </table></div>
    <p className="muted xs">Showing {list.length} of {rows.length}. Click a name to see their full profile. Removing someone ends their membership here; their account and past progress are kept.</p>

    {nudging && <Modal title={`Nudge ${who(nudging.row)}`} onClose={() => setNudging(null)}>
      <form className="stack gap-12" onSubmit={async e => { e.preventDefault(); const ok = await r.run(() => api('/api/v1/admin/nudge', { body: { userId: nudging.row.userId, message: nudging.text } }), `Nudge sent to ${who(nudging.row)}.`); if (ok) setNudging(null); }}>
        {r.err && <p className="callout warn small" role="alert">{r.err}</p>}
        <Field label="Message" hint="Delivered in-app, respects quiet hours, and recorded in the audit log."><textarea className="textarea" rows={4} maxLength={500} value={nudging.text} onChange={e => setNudging({ ...nudging, text: e.target.value })} /></Field>
        <div className="actions"><button className="btn btn-text" type="button" onClick={() => setNudging(null)}>Cancel</button><button className="btn btn-primary" type="submit" disabled={r.busy || !nudging.text.trim()}><Send size={14} />Send</button></div>
      </form>
    </Modal>}

    {consent && <Modal title={`${consent.decision === 'granted' ? 'Record verified guardian consent' : 'Withdraw guardian consent'} for ${who(consent.row)}`} onClose={() => setConsent(null)}>
      <form className="stack gap-12" onSubmit={async e => { e.preventDefault(); const ok = await r.run(() => api(`/api/v1/admin/members/${consent.row.userId}/guardian-consent`, { body: { decision: consent.decision, method: consent.method, note: consent.note } }), consent.decision === 'granted' ? 'Guardian consent recorded.' : 'Guardian consent withdrawn.'); if (ok) setConsent(null); }}>
        {r.err && <p className="callout warn small" role="alert">{r.err}</p>}
        <Field label="How was it verified?"><select className="select" value={consent.method} onChange={e => setConsent({ ...consent, method: e.target.value })}><option value="school_signed_form">Signed school or institution consent form</option><option value="guardian_in_person">Guardian confirmed in person</option><option value="guardian_verified_contact">Guardian confirmed on a contact we already hold</option></select></Field>
        <Field label="Note (no ID numbers, phone numbers or emails)"><textarea className="textarea" rows={2} maxLength={500} value={consent.note} onChange={e => setConsent({ ...consent, note: e.target.value })} /></Field>
        {consent.decision === 'revoked' && <p className="callout warn small">Withdrawing makes their work, leaderboard entry and talent profile private, and removes them from open hackathon teams.</p>}
        <p className="muted xs">Recorded in the audit log with your name and the method.</p>
        <div className="actions"><button className="btn btn-text" type="button" onClick={() => setConsent(null)}>Cancel</button><button className="btn btn-primary" type="submit" disabled={r.busy}>Confirm</button></div>
      </form>
    </Modal>}

    {adult && <Modal title={`Confirm ${who(adult.row)} has turned 18`} onClose={() => setAdult(null)}>
      <form className="stack gap-12" onSubmit={async e => { e.preventDefault(); const ok = await r.run(() => api(`/api/v1/admin/members/${adult.row.userId}/age-band`, { body: { method: adult.method, note: adult.note } }), 'Moved to the adult age band.'); if (ok) setAdult(null); }}>
        {r.err && <p className="callout warn small" role="alert">{r.err}</p>}
        <Field label="How was age confirmed?"><select className="select" value={adult.method} onChange={e => setAdult({ ...adult, method: e.target.value })}><option value="learner_confirmed_with_institution_records">Matches the institution’s own records</option><option value="guardian_confirmed">Guardian confirmed</option><option value="staff_checked_document_not_stored">Staff saw a document (not copied or stored)</option></select></Field>
        <Field label="Note (no ID numbers, phone numbers or emails)"><textarea className="textarea" rows={2} maxLength={500} value={adult.note} onChange={e => setAdult({ ...adult, note: e.target.value })} /></Field>
        <p className="callout info small">Their guardian contact is deleted. Their privacy settings stay as they are; they choose what to share.</p>
        <div className="actions"><button className="btn btn-text" type="button" onClick={() => setAdult(null)}>Cancel</button><button className="btn btn-primary" type="submit" disabled={r.busy}>Confirm</button></div>
      </form>
    </Modal>}

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
      <form className="stack gap-16" onSubmit={async e => {
        e.preventDefault();
        const ok = await r.run(async () => {
          await api(`/api/v1/settings/people/${edit.userId}`, { method: 'PATCH', body: { name: edit.name, role: edit.role, status: edit.status as 'active' | 'suspended', cohortId: edit.cohortId || null } });
          if (journeys && edit.journeyId && edit.journeyId !== edit.originalJourneyId) await api(`/api/v1/admin/members/${edit.userId}`, { method: 'PATCH', body: { journeyId: edit.journeyId } });
        }, `${edit.name} updated.`);
        if (ok) setEdit(null);
      }}>
        {r.err && <p className="callout warn small" role="alert">{r.err}</p>}
        <Field label="Full name" error={r.fieldErrs.name}><input className="input" required minLength={2} maxLength={100} value={edit.name} onChange={e => setEdit({ ...edit, name: e.target.value })} /></Field>
        <Field label="Role"><select className="select" value={edit.role} onChange={e => setEdit({ ...edit, role: e.target.value })}>{roles.map(o => <option key={o.code} value={o.code}>{o.label}</option>)}</select></Field>
        <Field label="Cohort"><select className="select" value={edit.cohortId} onChange={e => setEdit({ ...edit, cohortId: e.target.value })}><option value="">No cohort</option>{cohorts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        {journeys && <Field label="Journey" hint="Super Admin only. Their progress on the old journey is kept and comes back if they are moved back."><select className="select" value={edit.journeyId} onChange={e => setEdit({ ...edit, journeyId: e.target.value })}>{!edit.originalJourneyId && <option value="">Not enrolled</option>}{edit.originalJourneyId && !journeys.some(j => j.id === edit.originalJourneyId) && <option value={edit.originalJourneyId}>Current journey (unpublished)</option>}{journeys.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}</select></Field>}
        <Field label="Status" hint="Suspended people can't sign in to this institute."><select className="select" value={edit.status} onChange={e => setEdit({ ...edit, status: e.target.value })}><option value="active">Active</option><option value="suspended">Suspended</option></select></Field>
        <div className="actions"><button className="btn btn-text" type="button" onClick={() => setEdit(null)}>Cancel</button><button className="btn btn-primary" type="submit" disabled={r.busy}>Save changes</button></div>
      </form>
    </Modal>}

  </div>);
}
