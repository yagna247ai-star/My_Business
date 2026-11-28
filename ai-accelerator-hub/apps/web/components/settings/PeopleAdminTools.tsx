'use client';
/**
 * Super Admin control centre tools on the People screen (docs/SUPER_ADMIN_CONTROL_SPEC.md):
 * the bulk-action bar, CSV import, and the per-person password menu.
 */
import { useState } from 'react';
import { Upload, KeyRound } from 'lucide-react';
import { api } from '@/lib/client/api';
import { Field, Modal, useRun } from './ui';
import { AreaPicker } from './AreaPicker';
import { DEFAULT_AREA } from '@/lib/domain/areas';

type Opt = { code: string; label: string };
type BulkResult = { done: number; skipped: { email: string; reason: string }[]; notFound: number };

const ACTIONS: { key: string; label: string; superOnly?: boolean; needs?: 'role' | 'cohort' | 'area' | 'institution'; danger?: boolean }[] = [
  { key: 'reset_link', label: 'Email a password reset link' },
  { key: 'force_change', label: 'Force password change at next sign-in', superOnly: true },
  { key: 'suspend', label: 'Suspend (disable sign-in here)', danger: true },
  { key: 'activate', label: 'Reactivate' },
  { key: 'set_role', label: 'Change role…', needs: 'role' },
  { key: 'set_cohort', label: 'Move to cohort…', needs: 'cohort' },
  { key: 'set_area', label: 'Set area…', needs: 'area' },
  { key: 'remove', label: 'Remove from institution', danger: true },
  { key: 'move_to', label: 'Move to institution… (with their progress)', superOnly: true, needs: 'institution', danger: true },
  { key: 'add_to', label: 'Also add to institution…', superOnly: true, needs: 'institution' },
];

export function BulkBar({ selected, clear, isSuper, roles, cohorts, institutions = [] }: { selected: string[]; clear: () => void; isSuper: boolean; roles: Opt[]; cohorts: { id: string; name: string }[]; institutions?: { id: string; name: string; code: string | null }[] }) {
  const r = useRun();
  const [action, setAction] = useState('reset_link'); const [inst, setInst] = useState(institutions[0]?.id ?? ''); const [role, setRole] = useState('learner'); const [cohort, setCohort] = useState(''); const [area, setArea] = useState(DEFAULT_AREA);
  const [result, setResult] = useState<BulkResult | null>(null); const [confirming, setConfirming] = useState(false);
  const a = ACTIONS.find(x => x.key === action)!;
  if (!selected.length && !result) return null;
  const value = a.needs === 'role' ? role : a.needs === 'cohort' ? cohort : a.needs === 'area' ? area : undefined;
  const apply = async () => {
    setConfirming(false);
    if (a.needs === 'institution') {
      await r.run(async () => { const out = await api<{ done: number; skipped: { email: string; reason: string }[] }>('/api/v1/admin/people/transfer', { method: 'POST', body: { userIds: selected, toTenantId: inst, mode: action === 'move_to' ? 'move' : 'add' } }); setResult({ done: out.done, skipped: out.skipped, notFound: 0 }); clear(); }, action === 'move_to' ? 'Moved. Their progress now shows in the new institution.' : 'Added.');
      return;
    }
    await r.run(async () => { const out = await api<BulkResult>('/api/v1/admin/people/bulk', { method: 'POST', body: { userIds: selected, action, value } }); setResult(out); clear(); }, 'Done.');
  };
  return (
    <section className="card card-pad stack gap-8" aria-label="Bulk actions" style={{ position: 'sticky', top: 8, zIndex: 5, border: '1px solid var(--accent, #3878F6)' }}>
      {selected.length > 0 && <div className="row gap-8 wrap" style={{ alignItems: 'flex-end' }}>
        <b>{selected.length} selected</b>
        <select className="select" aria-label="Bulk action" value={action} onChange={e => setAction(e.target.value)}>{ACTIONS.filter(x => (isSuper || !x.superOnly) && (x.needs !== 'institution' || institutions.length > 0)).map(x => <option key={x.key} value={x.key}>{x.label}</option>)}</select>
        {a.needs === 'role' && <select className="select" aria-label="New role" value={role} onChange={e => setRole(e.target.value)}>{roles.filter(o => isSuper || o.code !== 'tenant_admin').map(o => <option key={o.code} value={o.code}>{o.label}</option>)}</select>}
        {a.needs === 'cohort' && <select className="select" aria-label="Cohort" value={cohort} onChange={e => setCohort(e.target.value)}><option value="">No cohort</option>{cohorts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>}
        {a.needs === 'area' && <AreaPicker value={area} label="Area" onChange={setArea} />}
        {a.needs === 'institution' && <select className="select" aria-label="Institution" value={inst} onChange={e => setInst(e.target.value)}>{institutions.map(i => <option key={i.id} value={i.id}>{i.name}{i.code ? ` (${i.code})` : ''}</option>)}</select>}
        {confirming ? <><span className="small">Apply to {selected.length}?</span><button className={`btn btn-sm ${a.danger ? 'btn-danger' : 'btn-primary'}`} type="button" disabled={r.busy} onClick={apply}>Yes, apply</button><button className="btn btn-text btn-sm" type="button" onClick={() => setConfirming(false)}>Cancel</button></>
          : <button className="btn btn-primary btn-sm" type="button" disabled={r.busy} onClick={() => setConfirming(true)}>Apply</button>}
        <button className="btn btn-text btn-sm" type="button" onClick={clear}>Clear selection</button>
      </div>}
      {r.err && <p className="callout warn small" role="alert">{r.err}</p>}
      {result && <div className="callout ok small" role="status">
        {result.done} updated{result.skipped.length ? `, ${result.skipped.length} skipped` : ''}{result.notFound ? `, ${result.notFound} not found` : ''}.
        {result.skipped.length > 0 && <ul style={{ margin: '6px 0 0 18px' }}>{result.skipped.slice(0, 20).map(s => <li key={s.email}>{s.email}: {s.reason}</li>)}</ul>}
        <button className="btn btn-text btn-sm" type="button" onClick={() => setResult(null)}>Dismiss</button>
      </div>}
    </section>
  );
}

type ImportOut = { dryRun: boolean; valid: number; errors: { line: number; message: string }[]; created: number; updated: number; emailed: number };

export function ImportCsvButton() {
  const r = useRun();
  const [open, setOpen] = useState(false); const [csv, setCsv] = useState(''); const [file, setFile] = useState(''); const [out, setOut] = useState<ImportOut | null>(null);
  const run = (dryRun: boolean) => r.run(async () => setOut(await api<ImportOut>('/api/v1/admin/people/import', { method: 'POST', body: { csv, dryRun } })), dryRun ? 'Checked.' : 'Imported.');
  const sample = 'name,email,role,cohort,area\nAsha Rao,asha@example.com,learner,Batch 1,Warangal\nRavi Kumar,ravi@example.com,mentor,,Bhagyanagar\n';
  return (<>
    <button className="btn btn-soft btn-sm" type="button" onClick={() => { setOpen(true); setOut(null); setCsv(''); setFile(''); }}><Upload size={15} />Import CSV</button>
    {open && <Modal title="Import people from a CSV file" wide onClose={() => setOpen(false)}>
      <div className="stack gap-12">
        <p className="small">Columns: <code>name,email,role,cohort,area,institution</code>. Role, cohort, area and institution are optional (default learner, no cohort, Bhagyanagar, this institution). Super Admins can put an institution code in the last column to add people there. Each new person gets an email to choose their password (link valid 7 days). Up to 2,000 rows.</p>
        <a className="link small" href={`data:text/csv;charset=utf-8,${encodeURIComponent(sample)}`} download="people-template.csv">Download a template</a>
        <Field label="CSV file"><input className="input" type="file" accept=".csv,text/csv" onChange={async e => { const f = e.target.files?.[0]; if (!f) return; if (f.size > 1_000_000) { r.setErr('The file is larger than 1 MB.'); return; } setFile(f.name); setCsv(await f.text()); setOut(null); }} /></Field>
        {r.err && <p className="callout warn small" role="alert">{r.err}</p>}
        {out && <div className={`callout ${out.errors.length ? 'warn' : 'ok'} small`} role="status">
          {out.dryRun ? <>{out.valid} row{out.valid === 1 ? '' : 's'} ready to import{out.errors.length ? `, ${out.errors.length} with problems (fix them or import the good rows)` : ''}.</>
            : <>{out.created} added, {out.updated} updated, {out.emailed} invite emails sent.</>}
          {out.errors.length > 0 && <ul style={{ margin: '6px 0 0 18px', maxHeight: 220, overflow: 'auto' }}>{out.errors.map((e, i) => <li key={i}>Line {e.line}: {e.message}</li>)}</ul>}
        </div>}
        <div className="actions">
          <button className="btn btn-text" type="button" onClick={() => setOpen(false)}>Close</button>
          <button className="btn btn-soft" type="button" disabled={!csv || r.busy} onClick={() => run(true)}>Check {file || 'file'}</button>
          <button className="btn btn-primary" type="button" disabled={!out?.dryRun || !out.valid || r.busy} onClick={() => run(false)}>Import {out?.dryRun ? out.valid : ''} people</button>
        </div>
      </div>
    </Modal>}
  </>);
}

export function PasswordButton({ userId, name, isSuper }: { userId: string; name: string; isSuper: boolean }) {
  const r = useRun();
  const [open, setOpen] = useState(false); const [pw, setPw] = useState(''); const [must, setMust] = useState(true);
  const call = (body: unknown, ok: string) => r.run(() => api(`/api/v1/admin/people/${userId}/password`, { method: 'POST', body }), ok);
  return (<>
    <button className="btn btn-soft btn-sm" type="button" title="Password" aria-label={`Password options for ${name}`} onClick={() => { setOpen(true); setPw(''); }}><KeyRound size={14} /></button>
    {open && <Modal title={`Password: ${name}`} onClose={() => setOpen(false)}>
      <div className="stack gap-12">
        <p className="muted small">Passwords are stored encrypted one-way, so nobody (including Super Admins) can see them. You can send a reset link{isSuper ? ', set a new password, or require a new one at next sign-in' : ''}. Every action is recorded in the audit log.</p>
        <r.Status />
        <button className="btn btn-soft" type="button" disabled={r.busy} onClick={() => call({ action: 'reset_link' }, `Reset link emailed to ${name}.`)}>Email a reset link</button>
        {isSuper && <>
          <form className="stack gap-8" onSubmit={e => { e.preventDefault(); call({ action: 'set', password: pw, mustChange: must }, `New password set for ${name}.${must ? ' They must change it at next sign-in.' : ''}`); }}>
            <Field label="Set a new password" hint="10+ characters with a letter and a number. Tell the person through a safe channel."><input className="input" type="text" autoComplete="off" minLength={10} maxLength={200} value={pw} onChange={e => setPw(e.target.value)} style={{ fontFamily: 'var(--font-mono)' }} /></Field>
            <label className="row gap-8 small"><input type="checkbox" checked={must} onChange={e => setMust(e.target.checked)} />Must change it at next sign-in</label>
            <button className="btn btn-primary" type="submit" disabled={r.busy || pw.length < 10}>Set password</button>
          </form>
          <div className="row gap-8 wrap">
            <button className="btn btn-outline btn-sm" type="button" disabled={r.busy} onClick={() => call({ action: 'force', on: true }, `${name} must choose a new password at next sign-in.`)}>Force change at next sign-in</button>
            <button className="btn btn-text btn-sm" type="button" disabled={r.busy} onClick={() => call({ action: 'force', on: false }, 'Forced change cleared.')}>Clear forced change</button>
          </div>
        </>}
      </div>
    </Modal>}
  </>);
}

type DupMember = { id: string; name: string | null; email: string; emails: string[]; activity: number; hasPassword: boolean; minor: boolean };
type DupGroup = { confidence: 'certain' | 'likely' | 'possible'; reasons: string[]; primaryId: string; canMerge: boolean; needsSuperAdmin: boolean; members: DupMember[] };
type DupTicket = { id: string; status: string; reason: string; note: string | null; primaryId: string | null; accounts: { id: string; name: string | null; email: string }[] };
const REASON: Record<string, string> = { out_of_scope: 'Another institution is involved', requested: 'Sent by an institution admin', auto_failed: 'Automatic merge failed', too_many_accounts: 'Too many accounts for automatic merge', super_admin_account: 'Includes a Super Admin account', minor_account: 'Includes a learner under 18' };
const LABEL = { certain: 'Certain', likely: 'Likely', possible: 'Same name only' } as const;

/** docs/IDENTITY_DEDUP_SPEC.md §5: duplicates inside your institution merge here; anything bigger goes to a Super Admin as a ticket. Loads only when asked. */
export function DuplicatesPanel({ isSuper }: { isSuper: boolean }) {
  const r = useRun();
  const [rep, setRep] = useState<{ groups: DupGroup[]; possible: DupGroup[]; tickets: DupTicket[]; possiblePairs: number } | null>(null);
  const [found, setFound] = useState<DupGroup | null>(null); const [ea, setEa] = useState(''); const [eb, setEb] = useState('');
  const reload = async () => setRep(await api('/api/v1/admin/people/duplicates'));
  const act = (fn: () => Promise<unknown>, done: string) => r.run(async () => { await fn(); await reload(); setFound(null); setSure(''); }, done);
  const post = (path: string, body: object) => api(path, { method: 'POST', body });
  const [keep, setKeep] = useState<Record<string, string>>({}); // a person can override the suggested account to keep
  const [sure, setSure] = useState(''); // a name-only merge asks once more
  const keyOf = (g: DupGroup) => g.members.map(m => m.id).sort().join('|');
  const keepOf = (g: DupGroup) => keep[keyOf(g)] ?? g.primaryId;
  const ids = (g: DupGroup) => ({ primaryId: keepOf(g), secondaryIds: g.members.filter(m => m.id !== keepOf(g)).map(m => m.id) });
  const certain = rep?.groups.filter(g => g.confidence === 'certain').length ?? 0;
  const open = rep?.tickets.filter(t => t.status === 'open') ?? [];
  const group = (g: DupGroup) => (
    <div key={keyOf(g)} className="stack gap-8" style={{ borderTop: '1px solid var(--line, #e5e7eb)', paddingTop: 8 }}>
      <div className="small"><b>{LABEL[g.confidence]}</b> · {g.reasons.join(', ')}</div>
      <div className="small stack gap-8" role="radiogroup" aria-label="Account to keep">{g.members.map(m => <label key={m.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="radio" name={`keep-${keyOf(g)}`} checked={keepOf(g) === m.id} disabled={!g.canMerge} onChange={() => setKeep(k => ({ ...k, [keyOf(g)]: m.id }))} /><span>{m.name ?? '(no name)'} · {m.emails.join(', ')}{m.minor ? ' · under 18: their privacy settings stay strict' : ''}{m.id === g.primaryId ? ' · suggested' : ''}</span></label>)}</div>
      <div className="row gap-8 wrap" style={{ alignItems: 'center' }}>{g.canMerge
        ? (g.confidence === 'possible' && sure !== keyOf(g)
          ? <button className="btn btn-sm" type="button" disabled={r.busy} onClick={() => setSure(keyOf(g))}>Merge into one account…</button>
          : <>{g.confidence === 'possible' && <span className="small">Only the name matches. Are you sure these are the same person?</span>}<button className="btn btn-sm btn-primary" type="button" disabled={r.busy} onClick={() => act(() => post('/api/v1/admin/people/duplicates', ids(g)), 'Merged into one account.')}>{g.confidence === 'possible' ? 'Yes, same person: merge' : 'Merge into one account'}</button>{g.confidence === 'possible' && <button className="btn btn-text btn-sm" type="button" onClick={() => setSure('')}>Cancel</button>}</>)
        : <><span className="small muted">Another institution is involved, so a Super Admin merges this. </span><button className="btn btn-sm" type="button" disabled={r.busy} onClick={() => act(() => post('/api/v1/admin/people/duplicates/tickets', ids(g)), 'Sent to a Super Admin.')}>Send to Super Admin</button></>}</div>
    </div>
  );
  return (
    <section className="card card-pad stack gap-8" aria-label="Duplicate accounts" style={{ marginTop: 18 }}>
      <div className="row gap-8 wrap" style={{ alignItems: 'center' }}>
        <b>Duplicate accounts</b>
        <button className="btn btn-sm" type="button" disabled={r.busy} onClick={() => act(async () => {}, 'Checked.')}>{rep ? 'Check again' : 'Check for duplicates'}</button>
        {isSuper && certain > 0 && <button className="btn btn-primary btn-sm" type="button" disabled={r.busy} onClick={() => act(() => post('/api/v1/admin/people/duplicates', { auto: true }), 'Merged the certain duplicates. Anything that failed is in the tickets below.')}>Merge all certain ({certain})</button>}
      </div>
      <form className="row gap-8 wrap" style={{ alignItems: 'center' }} onSubmit={e => { e.preventDefault(); void r.run(async () => { setSure(''); setFound(await post('/api/v1/admin/people/duplicates/lookup', { emailA: ea, emailB: eb }) as DupGroup); }, 'Found both accounts.'); }}>
        <span className="small">Merge two accounts by email:</span>
        <input className="input" type="email" style={{ maxWidth: 230 }} aria-label="First account email" placeholder="First account email" value={ea} onChange={e => setEa(e.target.value)} />
        <input className="input" type="email" style={{ maxWidth: 230 }} aria-label="Second account email" placeholder="Second account email" value={eb} onChange={e => setEb(e.target.value)} />
        <button className="btn btn-sm" type="submit" disabled={r.busy || !ea.includes('@') || !eb.includes('@')}>Find</button>
      </form>
      <r.Status />
      {found && <div className="stack gap-8"><b className="small">Your selection</b>{group({ ...found, confidence: found.confidence === 'certain' || found.confidence === 'likely' ? found.confidence : 'possible' })}</div>}
      {rep && !rep.groups.length && !rep.possible.length && !open.length && <p className="small muted">No duplicate accounts found.</p>}
      {rep?.groups.map(group)}
      {rep && rep.possible.length > 0 && <div className="stack gap-8" style={{ borderTop: '1px solid var(--line, #e5e7eb)', paddingTop: 8 }}>
        <b className="small">Same name, different emails ({rep.possible.length}). Check before merging; two people can share a name.</b>
        {rep.possible.map(group)}
      </div>}
      {open.length > 0 && <div className="stack gap-8" style={{ borderTop: '1px solid var(--line, #e5e7eb)', paddingTop: 8 }}>
        <b className="small">{isSuper ? 'Tickets waiting for you' : 'Waiting for a Super Admin'} ({open.length})</b>
        {open.map(t => (
          <div key={t.id} className="small stack gap-8">
            <div>{REASON[t.reason] ?? t.reason}: {t.accounts.map(a => `${a.name ?? '(no name)'} <${a.email}>`).join(' + ')}</div>
            {isSuper && <div className="row gap-8"><button className="btn btn-sm btn-primary" type="button" disabled={r.busy} onClick={() => act(() => post(`/api/v1/admin/people/duplicates/tickets/${t.id}`, { action: 'merge' }), 'Merged and closed the ticket.')}>Merge</button><button className="btn btn-text btn-sm" type="button" disabled={r.busy} onClick={() => act(() => post(`/api/v1/admin/people/duplicates/tickets/${t.id}`, { action: 'reject' }), 'Ticket rejected.')}>Reject</button></div>}
          </div>
        ))}
      </div>}
    </section>
  );
}
