'use client';
/**
 * Institutions (docs/INSTITUTIONS_SPEC.md): the full profile with logo and institution code; for the Super Admin,
 * every institution as a card with Open (switch), Edit, Deactivate and Delete, and Create.
 */
import { useState } from 'react';
import { Building2, Home, LogIn, Pencil, Plus, Power } from 'lucide-react';
import { api } from '@/lib/client/api';
import { ConfirmDelete, Field, Modal, useRun } from './ui';

const TYPES: [string, string][] = [['platform', 'Platform (AI Accelerator Hub)'], ['skill_centre', 'Skill / training centre'], ['college', 'College / university'], ['school', 'School'], ['company', 'Company / employer'], ['other', 'Other']];
const typeLabel = (t: string) => TYPES.find(x => x[0] === t)?.[1] ?? 'Other';
const PROFILE = ['legalName', 'contactName', 'contactEmail', 'phone', 'website', 'address', 'city', 'state', 'pincode', 'registrationNo', 'established', 'about'] as const;
type ProfileKey = typeof PROFILE[number];
type Profile = Partial<Record<ProfileKey, string>>;
type Counts = { members: number; cohorts: number; journeys: number; orders: number };
type Inst = { id: string; name: string; slug: string; code: string | null; type: string; logoUrl: string | null; plan: string; status: string; profile: Profile; counts: Counts; current?: boolean; city?: string | null };
type Form = { name: string; slug: string; code: string; type: string; plan: string; status: string; adminEmail: string; logoUrl: string | null } & Record<ProfileKey, string>;

const formOf = (i?: Partial<Inst>): Form => ({ name: i?.name ?? '', slug: i?.slug ?? '', code: i?.code ?? '', type: i?.type ?? 'other', plan: i?.plan ?? 'free', status: i?.status ?? 'active', adminEmail: '', logoUrl: i?.logoUrl ?? null, ...Object.fromEntries(PROFILE.map(k => [k, i?.profile?.[k] ?? ''])) as Record<ProfileKey, string> });

function Logo({ url, name, size = 44 }: { url: string | null; name: string; size?: number }) {
  return url ? <img src={url} alt="" width={size} height={size} style={{ width: size, height: size, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
    : <span aria-hidden="true" style={{ width: size, height: size, borderRadius: 10, display: 'grid', placeItems: 'center', background: 'var(--surface-3)', fontWeight: 800, flexShrink: 0 }}>{name.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase() || <Building2 size={18} />}</span>;
}

function ProfileForm({ f, set, errs, superAdmin, creating, original }: { f: Form; set: (p: Partial<Form>) => void; errs: Record<string, string>; superAdmin: boolean; creating?: boolean; original?: string | null }) {
  const [logoErr, setLogoErr] = useState('');
  const pickLogo = (file?: File) => {
    setLogoErr('');
    if (!file) return;
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) { setLogoErr('Use a PNG, JPEG or WebP image.'); return; }
    if (file.size > 200_000) { setLogoErr('Use an image under 200 KB (e.g. 256 × 256).'); return; }
    const r = new FileReader(); r.onload = () => set({ logoUrl: String(r.result) }); r.readAsDataURL(file);
  };
  const codeChanged = !creating && original && f.code.trim().toUpperCase() !== original;
  return (<div className="set-form">
    <div className="full row gap-12" style={{ alignItems: 'center' }}>
      <Logo url={f.logoUrl} name={f.name || 'Institute'} size={64} />
      <div className="stack gap-4">
        <span className="field-label">Logo</span>
        <input type="file" accept="image/png,image/jpeg,image/webp" aria-label="Upload a logo" onChange={e => pickLogo(e.target.files?.[0])} />
        {f.logoUrl && <button type="button" className="btn btn-text btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => set({ logoUrl: null })}>Remove logo</button>}
        {(logoErr || errs.logo) && <span className="field-err">{logoErr || errs.logo}</span>}
      </div>
    </div>
    <Field label="Institution name" error={errs.name}><input className="input" required minLength={3} maxLength={120} value={f.name} onChange={e => set({ name: e.target.value })} /></Field>
    <Field label="Institution code" error={errs.code} hint={superAdmin ? (creating ? 'Learners type this at registration. Leave empty to suggest one from the name. 3–12 letters or numbers.' : codeChanged ? 'Saving makes the old code stop working at once.' : 'Learners type this at registration.') : 'Set by the platform team.'}>
      <input className="input" value={f.code} disabled={!superAdmin || original === 'AIHUB'} maxLength={12} onChange={e => set({ code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })} style={{ fontFamily: 'var(--font-mono)', letterSpacing: '.05em' }} placeholder={creating ? 'e.g. SKILL01' : ''} />
    </Field>
    <Field label="Type"><select className="select" value={f.type} onChange={e => set({ type: e.target.value })}>{TYPES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
    <Field label="Legal / registered name"><input className="input" maxLength={160} value={f.legalName} onChange={e => set({ legalName: e.target.value })} /></Field>
    <Field label="Contact person"><input className="input" maxLength={100} value={f.contactName} onChange={e => set({ contactName: e.target.value })} /></Field>
    <Field label="Contact email" error={errs.contactEmail}><input className="input" type="email" value={f.contactEmail} onChange={e => set({ contactEmail: e.target.value })} placeholder="hello@institute.in" /></Field>
    <Field label="Phone"><input className="input" value={f.phone} onChange={e => set({ phone: e.target.value })} placeholder="+91 …" /></Field>
    <Field label="Website" error={errs.website}><input className="input" value={f.website} onChange={e => set({ website: e.target.value })} placeholder="https://" /></Field>
    <Field label="Address" full><input className="input" maxLength={300} value={f.address} onChange={e => set({ address: e.target.value })} placeholder="Building, street, area" /></Field>
    <Field label="City / district"><input className="input" maxLength={80} value={f.city} onChange={e => set({ city: e.target.value })} placeholder="Bhagyanagar" /></Field>
    <Field label="State"><input className="input" maxLength={80} value={f.state} onChange={e => set({ state: e.target.value })} placeholder="Telangana" /></Field>
    <Field label="PIN code" error={errs.pincode}><input className="input" inputMode="numeric" maxLength={6} value={f.pincode} onChange={e => set({ pincode: e.target.value.replace(/\D/g, '') })} /></Field>
    <Field label="Registration / affiliation no."><input className="input" maxLength={80} value={f.registrationNo} onChange={e => set({ registrationNo: e.target.value })} placeholder="e.g. AICTE, NSDC, CIN" /></Field>
    <Field label="Year established" error={errs.established}><input className="input" inputMode="numeric" maxLength={4} value={f.established} onChange={e => set({ established: e.target.value.replace(/\D/g, '') })} /></Field>
    {superAdmin && <Field label="Plan"><select className="select" value={f.plan} onChange={e => set({ plan: e.target.value })}><option value="free">Free</option><option value="pro">Pro</option><option value="enterprise">Enterprise</option></select></Field>}
    {superAdmin && creating && <Field label="First admin's email (optional)" hint="An existing account becomes Institution Admin."><input className="input" type="email" value={f.adminEmail} onChange={e => set({ adminEmail: e.target.value })} /></Field>}
    <Field label="About" full><textarea className="textarea" rows={3} maxLength={1500} value={f.about} onChange={e => set({ about: e.target.value })} placeholder="What the institution does, who learns here" /></Field>
  </div>);
}

const bodyOf = (f: Form, superAdmin: boolean, creating = false) => ({
  name: f.name, type: f.type, logoUrl: f.logoUrl, ...Object.fromEntries(PROFILE.map(k => [k, f[k]])),
  ...(superAdmin ? { plan: f.plan, ...(f.code ? { code: f.code } : {}) } : {}),
  ...(creating && f.adminEmail ? { adminEmail: f.adminEmail } : {}),
});

export function InstituteSettings({ mine, all, superAdmin }: { mine: Inst; all: Inst[] | null; superAdmin: boolean }) {
  const own = useRun(); const list = useRun();
  const [f, setF] = useState<Form>(formOf(mine));
  const [edit, setEdit] = useState<(Form & { id: string; original: string | null; current: boolean }) | null>(null);
  const [creating, setCreating] = useState<Form | null>(null);
  const [q, setQ] = useState('');
  const [homeArm, setHomeArm] = useState<string | null>(null); // docs/REGISTRATION_HOME_SPEC.md AC-4: two taps
  const home = (all ?? []).find(r => r.code === 'AIHUB' && r.status === 'active') ?? null;
  const fallback = home ? null : (all ?? []).find(r => r.type === 'platform' && r.status === 'active') ?? null;
  const rows = (all ?? []).filter(r => !q || `${r.name} ${r.code ?? ''} ${r.city ?? ''}`.toLowerCase().includes(q.toLowerCase()));
  const open = (id: string) => list.run(async () => { await api('/api/v1/me/tenant', { method: 'POST', body: { tenantId: id } }); window.location.assign('/dashboard'); }, 'Opening…');

  return (<div className="stack gap-24">
    <form className="card card-pad stack gap-16" onSubmit={e => { e.preventDefault(); own.run(() => api('/api/v1/settings/institute', { method: 'PATCH', body: bodyOf(f, false) }), 'Institution profile saved.'); }}>
      <div className="row between wrap gap-8" style={{ alignItems: 'center' }}>
        <div className="row gap-12" style={{ alignItems: 'center' }}><Logo url={mine.logoUrl} name={mine.name} /><div><h2 className="h3">{mine.name}</h2><p className="muted small">Code <span className="kbd-code">{mine.code ?? '—'}</span> · {typeLabel(mine.type)} · {mine.counts.members} member{mine.counts.members === 1 ? '' : 's'} · {mine.counts.cohorts} cohort{mine.counts.cohorts === 1 ? '' : 's'} · {mine.counts.journeys} journey{mine.counts.journeys === 1 ? '' : 's'}</p></div></div>
        <span className={`badge ${mine.status === 'active' ? 'badge-success' : 'badge-warn'}`}>{mine.status}</span>
      </div>
      {mine.code && <p className="callout info small">New learners join <b>{mine.name}</b> by typing <b>{mine.code}</b> as the institution code when they register (or under Settings → Profile → Join an institution).</p>}
      <own.Status />
      <ProfileForm f={f} set={p => setF({ ...f, ...p })} errs={own.fieldErrs} superAdmin={false} original={mine.code} />
      <div className="actions"><button className="btn btn-primary" type="submit" disabled={own.busy}>Save profile</button></div>
    </form>

    {superAdmin && all && <section className="stack gap-12" aria-labelledby="allT">
      <div className="row between wrap gap-8">
        <h2 className="h3" id="allT">All institutions ({all.length})</h2>
        <div className="row gap-8"><input className="input" type="search" placeholder="Search name, code or city…" aria-label="Search institutions" value={q} onChange={e => setQ(e.target.value)} /><button className="btn btn-primary btn-sm" type="button" onClick={() => setCreating(formOf())}><Plus size={15} />New institution</button></div>
      </div>
      {home
        ? <p className="callout info small">New learners who register without a code, or with <b>AIHUB</b>, join <b>{home.name}</b>.</p>
        : <p className="callout warn small" role="alert">No institution holds the code <b>AIHUB</b>, so new learners without a code join {fallback ? <b>{fallback.name}</b> : 'the server’s default institution'}. Press “Make default for new learners” on AI Accelerator Hub.</p>}
      <list.Status />
      <div className="set-grid">{rows.map(r => (
        <article key={r.id} className="card card-pad stack gap-8" aria-labelledby={`i-${r.id}`} style={{ borderColor: r.current ? 'var(--primary)' : undefined }}>
          <div className="row gap-12" style={{ alignItems: 'center' }}><Logo url={r.logoUrl} name={r.name} /><div style={{ minWidth: 0 }}><h3 className="h4" id={`i-${r.id}`} style={{ margin: 0 }}>{r.name}</h3><span className="muted xs">{typeLabel(r.type)}{r.city ? ` · ${r.city}` : ''}</span></div></div>
          <div className="row gap-6 wrap"><span className="badge badge-neutral">Code {r.code ?? '—'}</span><span className={`badge ${r.status === 'active' ? 'badge-success' : 'badge-warn'}`}>{r.status === 'active' ? 'Active' : 'Deactivated'}</span>{r.current && <span className="badge badge-info">You are here</span>}</div>
          <p className="muted small" style={{ margin: 0 }}>{r.counts.members} members · {r.counts.cohorts} cohorts · {r.counts.journeys} journeys</p>
          <div className="row gap-6 wrap">
            {!r.current && r.status === 'active' && <button className="btn btn-primary btn-sm" type="button" disabled={list.busy} onClick={() => open(r.id)}><LogIn size={14} />Open</button>}
            <button className="btn btn-outline btn-sm" type="button" onClick={() => setEdit({ ...formOf(r), id: r.id, original: r.code, current: !!r.current })}><Pencil size={14} />Edit profile</button>
            {r.code !== 'AIHUB' && r.status === 'active' && (homeArm === r.id
              ? <><button className="btn btn-gold btn-sm" type="button" disabled={list.busy} onClick={() => { setHomeArm(null); void list.run(() => api(`/api/v1/settings/institutes/${r.id}/default`, { method: 'POST' }), `${r.name} now holds AIHUB: new learners without a code join it.${home ? ` ${home.name} got a new code.` : ''}${r.code ? ` The old code ${r.code} stops working.` : ''}`); }}>Confirm: new learners join {r.name}</button><button className="btn btn-text btn-sm" type="button" onClick={() => setHomeArm(null)}>Cancel</button></>
              : <button className="btn btn-soft btn-sm" type="button" disabled={list.busy} onClick={() => setHomeArm(r.id)}><Home size={14} />Make default for new learners</button>)}
            {!r.current && r.code !== 'AIHUB' && <button className="btn btn-soft btn-sm" type="button" aria-label={`${r.status === 'active' ? 'Deactivate' : 'Activate'} ${r.name}`} disabled={list.busy} onClick={() => list.run(() => api(`/api/v1/settings/institutes/${r.id}`, { method: 'PATCH', body: { status: r.status === 'active' ? 'suspended' : 'active' } }), r.status === 'active' ? `${r.name} deactivated.` : `${r.name} reactivated.`)}><Power size={14} /></button>}
            {!r.current && r.code !== 'AIHUB' && <ConfirmDelete label={`Delete ${r.name}`} confirmText="Delete permanently" disabled={list.busy} onConfirm={() => list.run(() => api(`/api/v1/settings/institutes/${r.id}`, { method: 'DELETE' }), `${r.name} deleted.`)} />}
          </div>
        </article>))}</div>
      <p className="muted xs">AIHUB is the home for learners who register without a code, so it can’t be deactivated or deleted. Delete works only for an empty institution; otherwise deactivate it. To move people between institutions, use People → select → “Move to institution…”.</p>
    </section>}

    {edit && <Modal title={`Edit ${edit.name}`} wide onClose={() => setEdit(null)}>
      <form className="stack gap-16" onSubmit={async e => { e.preventDefault(); const ok = await list.run(() => api(`/api/v1/settings/institutes/${edit.id}`, { method: 'PATCH', body: bodyOf(edit, true) }), 'Institution updated.'); if (ok) setEdit(null); }}>
        {list.err && <p className="callout warn small" role="alert">{list.err}</p>}
        <ProfileForm f={edit} set={p => setEdit({ ...edit, ...p })} errs={list.fieldErrs} superAdmin original={edit.original} />
        <div className="actions"><button className="btn btn-text" type="button" onClick={() => setEdit(null)}>Cancel</button><button className="btn btn-primary" type="submit" disabled={list.busy}>Save</button></div>
      </form>
    </Modal>}

    {creating && <Modal title="New institution" wide onClose={() => setCreating(null)}>
      <form className="stack gap-16" onSubmit={async e => { e.preventDefault(); const ok = await list.run(() => api('/api/v1/settings/institutes', { method: 'POST', body: bodyOf(creating, true, true) }), 'Institution created. Share its code with its learners.'); if (ok) setCreating(null); }}>
        {list.err && <p className="callout warn small" role="alert">{list.err}</p>}
        <ProfileForm f={creating} set={p => setCreating({ ...creating, ...p })} errs={list.fieldErrs} superAdmin creating />
        <div className="actions"><button className="btn btn-text" type="button" onClick={() => setCreating(null)}>Cancel</button><button className="btn btn-primary" type="submit" disabled={list.busy}>Create institution</button></div>
      </form>
    </Modal>}
  </div>);
}
