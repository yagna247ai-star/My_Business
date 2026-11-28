'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { AuthCard } from '@/components/auth/AuthCard';
import { api, ApiError } from '@/lib/client/api';
import { TrackPicker } from '@/components/learn/TrackPicker';
import { Tr } from '@/components/i18n/Tr';
import { useT } from '@/components/i18n/I18nProvider';
import { Tv } from '@/components/i18n/Tv';

type Form = { name: string; email: string; password: string; birthYear: string; inviteCode: string; guardianEmail: string; journeySlug: string; acceptTerms: boolean; trackAck: boolean };
type JourneyOption = { slug: string; title: string; description: string | null; levels: number; isDefault: boolean; config?: { family: string; domain: string; name: string; problem: string; track?: string } | null };
const DOMAIN_FAMILY = 'data-analytics-domain'; // domain journeys are grouped under one "by industry" choice
type Key = keyof Form;
const THIS_YEAR = new Date().getFullYear();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Same rule as the server (lib/domain/account.ts): only the year is known, so assume the youngest possible age. */
function youngestAge(birthYear: string): number | null {
  const y = Number(birthYear);
  if (!birthYear || !Number.isInteger(y) || y < 1920 || y > THIS_YEAR) return null;
  return THIS_YEAR - y - 1;
}

function validate(f: Form, needsTrack = false): Partial<Record<Key, string>> {
  const e: Partial<Record<Key, string>> = {};
  if (f.name.trim().length < 2) e.name = 'Enter your full name.';
  if (!EMAIL_RE.test(f.email.trim())) e.email = 'Enter a valid email address.';
  if (f.password.length < 10) e.password = 'Use at least 10 characters.';
  else if (!/[A-Za-z]/.test(f.password) || !/[0-9]/.test(f.password)) e.password = 'Include at least one letter and one number.';
  const age = youngestAge(f.birthYear);
  if (age === null) e.birthYear = `Enter a year between 1920 and ${THIS_YEAR}.`;
  else if (age < 13) e.birthYear = 'Learners under 13 must be enrolled by their school or guardian.';
  else if (age < 18) {
    if (!EMAIL_RE.test(f.guardianEmail.trim())) e.guardianEmail = 'A parent or guardian email is required for learners under 18.';
    else if (f.guardianEmail.trim().toLowerCase() === f.email.trim().toLowerCase()) e.guardianEmail = 'Use your parent or guardian’s email, not your own.';
  }
  if (needsTrack && !f.journeySlug) e.journeySlug = 'Choose your track.';
  if (!f.acceptTerms) e.acceptTerms = 'Accept the terms and privacy notice to continue.';
  return e;
}

const ORDER: Key[] = ['name', 'email', 'password', 'birthYear', 'guardianEmail', 'inviteCode', 'journeySlug', 'trackAck', 'acceptTerms'];

export default function RegisterPage() {
  const t = useT();
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [f, setF] = useState<Form>({ name: '', email: '', password: '', birthYear: '', inviteCode: 'AIHUB', guardianEmail: '', journeySlug: '', acceptTerms: false, trackAck: false }); // docs/REGISTRATION_HOME_SPEC.md AC-3
  const [domainKey, setDomainKey] = useState(''); // chosen industry domain (several journeys when it has tracks)
  const [journeys, setJourneys] = useState<JourneyOption[] | null>(null);
  const [journeyCode, setJourneyCode] = useState('AIHUB');
  const [home, setHome] = useState<{ name: string; code: string | null } | null>(null); // where this code leads
  const [codeErr, setCodeErr] = useState(''); // invite code the journey list was loaded for
  const [errors, setErrors] = useState<Partial<Record<Key, string>>>({});
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);
  // Journeys open for sign-up (published by a Super Admin). Reload when the invite code changes institution.
  useEffect(() => {
    let live = true;
    const q = journeyCode ? `?inviteCode=${encodeURIComponent(journeyCode)}` : '';
    api<{ journeys: JourneyOption[]; institution?: { name: string; code: string | null } | null }>(`/api/v1/register/journeys${q}`, { method: 'GET' })
      .then(r => { if (!live) return; setHome(r.institution ?? null); setCodeErr(''); setJourneys(r.journeys); setF(p => ({ ...p, journeySlug: r.journeys.some(j => j.slug === p.journeySlug) ? p.journeySlug : (r.journeys.find(j => j.isDefault) ?? r.journeys[0])?.slug ?? '' })); })
      .catch((e: unknown) => { if (!live) return; setJourneys([]); setHome(null); setCodeErr(e instanceof ApiError && e.status === 400 ? e.message : ''); });
    return () => { live = false; };
  }, [journeyCode]);
  const age = youngestAge(f.birthYear);
  const minor = age !== null && age >= 13 && age < 18;

  const set = (k: Key) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setF(p => ({ ...p, [k]: v }));
    if (errors[k]) setErrors(p => { const n = { ...p }; delete n[k]; return n; });
  };

  const focusFirst = (errs: Partial<Record<Key, string>>) => {
    const k = ORDER.find(x => errs[x]);
    if (k) requestAnimationFrame(() => formRef.current?.querySelector<HTMLInputElement>(`#${k}`)?.focus());
  };

  const [dupAsk, setDupAsk] = useState(false); const [dupOk, setDupOk] = useState(false); // "You may already have an account" (docs/IDENTITY_DEDUP_RESEARCH.md)
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setMsg('');
    const local = validate(f, !!domainKey && !f.journeySlug);
    if (domainKey && f.journeySlug && !f.trackAck && /-critical$/.test(f.journeySlug)) local.trackAck = 'Tick the box to confirm the rules for the Critical track.';
    if (Object.keys(local).length) { setErrors(local); setMsg('Please fix the highlighted fields.'); focusFirst(local); return; }
    setErrors({}); setBusy(true);
    try {
      await api('/api/v1/register', {
        body: {
          name: f.name.trim(), email: f.email.trim(), password: f.password, birthYear: Number(f.birthYear),
          inviteCode: f.inviteCode.trim(), guardianEmail: minor ? f.guardianEmail.trim() : '', journeySlug: f.journeySlug, acceptTerms: f.acceptTerms, trackAck: f.trackAck, confirmNewAccount: dupOk || undefined,
        },
      });
      router.push(`/login?registered=1&email=${encodeURIComponent(f.email.trim())}`);
    } catch (err) {
      const a = err instanceof ApiError ? err : new ApiError(0, 'UNKNOWN', 'Something went wrong. Please try again.');
      const fe = (a.details || {}) as Partial<Record<Key, string>>;
      setDupAsk(a.code === 'POSSIBLE_DUPLICATE');
      setErrors(fe); focusFirst(fe);
      setMsg(a.status === 409 ? a.message : a.requestId ? `${a.message} (Reference: ${a.requestId.slice(0, 8)})` : a.message);
      setBusy(false);
    }
  };

  const field = (k: Key, label: string, opts: { type?: string; hint?: string; ac?: string; inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']; required?: boolean; extra?: React.ReactNode } = {}) => (
    <div>
      <label className="field-label" htmlFor={k}><Tv v={label} />{opts.required !== false && <span aria-hidden="true" style={{ color: 'var(--danger)' }}> *</span>}</label>
      <div style={{ position: 'relative' }}>
        <input className="input" id={k} name={k} type={opts.type || 'text'} autoComplete={opts.ac} inputMode={opts.inputMode}
          value={String(f[k])} onChange={set(k)} required={opts.required !== false} disabled={busy}
          aria-invalid={!!errors[k]} aria-describedby={errors[k] || opts.hint ? `${k}-h` : undefined}
          style={errors[k] ? { borderColor: 'var(--danger)', ...(opts.extra ? { paddingRight: 64 } : {}) } : opts.extra ? { paddingRight: 64 } : undefined} />
        <Tv v={opts.extra} />
      </div>
      {errors[k] ? <div className="field-err" id={`${k}-h`} role="alert">{errors[k]}</div> : opts.hint ? <div className="field-hint" id={`${k}-h`}><Tv v={opts.hint} /></div> : null}
    </div>
  );

  return (
    <AuthCard title={t('Create your account')} subtitle="Free to start. Choose your journey; Level 1 opens immediately.">
      <form ref={formRef} className="stack gap-16" onSubmit={submit} noValidate aria-busy={busy}>
        {field('name', 'Full name', { ac: 'name' })}
        {field('email', 'Email', { type: 'email', ac: 'email', inputMode: 'email' })}
        {field('password', 'Password', {
          type: showPw ? 'text' : 'password', ac: 'new-password', hint: 'At least 10 characters, with a letter and a number.',
          extra: <button type="button" className="link small" onClick={() => setShowPw(s => !s)} aria-controls="password" aria-pressed={showPw}
            style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontWeight: 700 }}>{showPw ? <Tr>Hide</Tr> : <Tr>Show</Tr>}</button>,
        })}
        {field('birthYear', 'Year of birth', { type: 'text', inputMode: 'numeric', ac: 'bday-year', hint: 'Used only to apply age-appropriate safety settings.' })}
        {minor && field('guardianEmail', 'Parent or guardian email', { type: 'email', ac: 'off', inputMode: 'email', hint: 'Required for learners under 18. Community features unlock after consent.' })}
        <div onBlur={() => { const c = f.inviteCode.trim(); if (c !== journeyCode && (c === '' || c.length >= 4)) setJourneyCode(c); }}>
          {field('inviteCode', 'Institution code', { required: false, ac: 'off', hint: 'AIHUB joins AI Accelerator Hub. If your skill centre, college or company gave you a code (e.g. SLNHRD) or a batch invite code, type it instead. An admin can move you later.' })}
          {codeErr ? <p className="small" role="alert" style={{ color: 'var(--danger, #b42318)', margin: '4px 0 0' }}><Tv v={codeErr} /></p>
            : home ? <p className="small muted" role="status" style={{ margin: '4px 0 0' }}><Tr>You&apos;ll join</Tr>: <b><Tv v={home.name} /></b>{home.code ? <> · <span className="kbd-code">{home.code}</span></> : null}</p> : null}
        </div>
        {journeys && journeys.length > 0 && (
          <fieldset style={{ border: 0, padding: 0, margin: 0 }} aria-describedby={errors.journeySlug ? 'journeySlug-h' : undefined}>
            <legend className="field-label"><Tr>Choose your journey</Tr></legend>
            <div className="stack gap-8" id="journeySlug">
              {(() => {
                const pick = (slug: string) => { setF(p => ({ ...p, journeySlug: slug })); if (errors.journeySlug) setErrors(p => { const n = { ...p }; delete n.journeySlug; return n; }); };
                const domainJourneys = journeys.filter(j => j.config?.family === DOMAIN_FAMILY);
                const general = journeys.filter(j => j.config?.family !== DOMAIN_FAMILY);
                // One entry per industry domain; a domain with tracks has one journey per track (the Hard track names the domain).
                const byDomain = new Map<string, JourneyOption[]>();
                for (const j of domainJourneys) byDomain.set(j.config!.domain, [...(byDomain.get(j.config!.domain) ?? []), j]);
                const domains = [...byDomain.entries()].map(([key, list]) => ({ key, list, main: list.find(j => !j.config!.track || j.config!.track === 'hard') ?? list[0], tracked: list.some(j => j.config!.track) }))
                  .sort((a, b) => a.main.config!.name.localeCompare(b.main.config!.name));
                const current = domains.find(d => d.key === domainKey) ?? domains.find(d => d.list.some(j => j.slug === f.journeySlug));
                const domainActive = !!current && (current.list.some(j => j.slug === f.journeySlug) || (current.tracked && f.journeySlug === ''));
                const chooseDomain = (key: string) => { const d = domains.find(x => x.key === key); if (!d) return; setDomainKey(key); setF(p => ({ ...p, trackAck: false })); pick(d.tracked ? '' : d.main.slug); };
                return (<>
                  {general.map(j => (
                    <label key={j.slug} className="card card-pad" style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer', borderColor: f.journeySlug === j.slug ? 'var(--gold, currentColor)' : undefined }}>
                      <input type="radio" name="journeySlug" value={j.slug} checked={f.journeySlug === j.slug && !domainActive} disabled={busy} style={{ marginTop: 3, flex: 'none' }} onChange={() => { setDomainKey(''); pick(j.slug); }} />
                      <span><b><Tv v={j.title} /></b>{j.isDefault && <span className="badge badge-gold" style={{ marginLeft: 8 }}><Tr>Recommended</Tr></span>}
                        <span className="small text-2" style={{ display: 'block' }}>{j.description || `${j.levels} levels`}</span></span>
                    </label>
                  ))}
                  {domains.length > 0 && (
                    <div className="card card-pad" style={{ display: 'flex', gap: 10, alignItems: 'flex-start', borderColor: domainActive ? 'var(--gold, currentColor)' : undefined }}>
                      <input type="radio" name="journeySlug" value="domain" aria-label={t('Data Analytics by industry domain')} checked={domainActive} disabled={busy} style={{ marginTop: 3, flex: 'none' }} onChange={() => chooseDomain((current ?? domains[0]).key)} />
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <b><Tr>Data Analytics by industry domain</Tr></b><span className="badge badge-info" style={{ marginLeft: 8 }}>{domains.length} <Tr>domains</Tr></span>
                        <span className="small text-2" style={{ display: 'block' }}><Tr>45 days on one real enterprise problem from your industry: Databricks, Unity Catalog, bronze/silver/gold, Power BI, ML and go-live.</Tr></span>
                        <label className="field-label" htmlFor="domainSelect" style={{ marginTop: 10 }}><Tr>Your industry domain</Tr></label>
                        <select id="domainSelect" className="select" value={domainActive ? current!.key : ''} disabled={busy} onChange={e => e.target.value && chooseDomain(e.target.value)}>
                          {!domainActive && <option value="">{t('Choose a domain…')}</option>}
                          {domains.map(d => <option key={d.key} value={d.key}>{d.main.config!.name} — {d.tracked ? t('4 tracks: Easy to Critical') : d.main.config!.problem}</option>)}
                        </select>
                        {domainActive && !current!.tracked && <span className="small text-2" style={{ display: 'block', marginTop: 6 }}><Tv v={current!.main.description} /></span>}
                        {domainActive && current!.tracked && (
                          <TrackPicker domain={current!.key} options={current!.list.map(j => ({ slug: j.slug, track: j.config!.track ?? 'hard' }))} value={f.journeySlug} disabled={busy}
                            onPick={slug => { setF(p => ({ ...p, journeySlug: slug, trackAck: false })); setErrors(p => { const n = { ...p }; delete n.journeySlug; delete n.trackAck; return n; }); }}
                            ack={f.trackAck} onAck={v => { setF(p => ({ ...p, trackAck: v })); setErrors(p => { const n = { ...p }; delete n.trackAck; return n; }); }}
                            error={errors.journeySlug || errors.trackAck} />
                        )}
                      </span>
                    </div>
                  )}
                </>);
              })()}
            </div>
            {errors.journeySlug && !domainKey ? <div className="field-err" id="journeySlug-h" role="alert"><Tv v={errors.journeySlug} /></div> : <div className="field-hint">{domainKey ? <Tr>Your track can change until Module 1 is complete; your points are always kept.</Tr> : <Tr>You can ask an admin to switch you later; your progress is kept.</Tr>}</div>}
          </fieldset>
        )}
        <div>
          <label className="small" htmlFor="acceptTerms" style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer' }}>
            <input id="acceptTerms" type="checkbox" checked={f.acceptTerms} onChange={set('acceptTerms')} disabled={busy}
              aria-invalid={!!errors.acceptTerms} aria-describedby={errors.acceptTerms ? 'acceptTerms-h' : undefined} style={{ marginTop: 3, flex: 'none', width: 16, height: 16 }} />
            <span><Tr>I agree to the terms and the privacy notice. My data is used to run my learning journey and is never sold.</Tr></span>
          </label>
          {errors.acceptTerms && <div className="field-err" id="acceptTerms-h" role="alert"><Tv v={errors.acceptTerms} /></div>}
        </div>
        {msg && <p className="field-err" role="alert" aria-live="assertive" style={{ marginTop: 0 }}><Tv v={msg} /></p>}
        {dupAsk && !dupOk && <p className="small"><Link href="/login"><Tr>Sign in</Tr></Link> · <Link href="/forgot-password"><Tr>Reset password</Tr></Link> · <button type="button" className="btn btn-text btn-sm" onClick={() => { setDupOk(true); setDupAsk(false); setMsg('Thanks. Submit the form again to continue.'); }}><Tr>This is not me</Tr></button></p>}
        <button className="btn btn-gold btn-block" type="submit" disabled={busy}>{busy ? <Tr>Creating account…</Tr> : <Tr>Create account</Tr>}</button>
        <p className="small text-2"><Tr>Already have an account?</Tr> <Link className="link" href="/login"><Tr>Sign in</Tr></Link></p>
      </form>
    </AuthCard>
  );
}
