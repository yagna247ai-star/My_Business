'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { AuthCard } from '@/components/auth/AuthCard';
import { api, ApiError } from '@/lib/client/api';

type Form = { name: string; email: string; password: string; birthYear: string; inviteCode: string; guardianEmail: string; journeySlug: string; acceptTerms: boolean };
type JourneyOption = { slug: string; title: string; description: string | null; levels: number; isDefault: boolean };
type Key = keyof Form;
const THIS_YEAR = new Date().getFullYear();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Same rule as the server (lib/domain/account.ts): only the year is known, so assume the youngest possible age. */
function youngestAge(birthYear: string): number | null {
  const y = Number(birthYear);
  if (!birthYear || !Number.isInteger(y) || y < 1920 || y > THIS_YEAR) return null;
  return THIS_YEAR - y - 1;
}

function validate(f: Form): Partial<Record<Key, string>> {
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
  if (!f.acceptTerms) e.acceptTerms = 'Accept the terms and privacy notice to continue.';
  return e;
}

const ORDER: Key[] = ['name', 'email', 'password', 'birthYear', 'guardianEmail', 'inviteCode', 'journeySlug', 'acceptTerms'];

export default function RegisterPage() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [f, setF] = useState<Form>({ name: '', email: '', password: '', birthYear: '', inviteCode: '', guardianEmail: '', journeySlug: '', acceptTerms: false });
  const [journeys, setJourneys] = useState<JourneyOption[] | null>(null);
  const [journeyCode, setJourneyCode] = useState(''); // invite code the journey list was loaded for
  const [errors, setErrors] = useState<Partial<Record<Key, string>>>({});
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);
  // Journeys open for sign-up (published by a Super Admin). Reload when the invite code changes institution.
  useEffect(() => {
    let live = true;
    const q = journeyCode ? `?inviteCode=${encodeURIComponent(journeyCode)}` : '';
    api<{ journeys: JourneyOption[] }>(`/api/v1/register/journeys${q}`, { method: 'GET' })
      .then(r => { if (!live) return; setJourneys(r.journeys); setF(p => ({ ...p, journeySlug: r.journeys.some(j => j.slug === p.journeySlug) ? p.journeySlug : (r.journeys.find(j => j.isDefault) ?? r.journeys[0])?.slug ?? '' })); })
      .catch(() => { if (live) setJourneys([]); });
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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setMsg('');
    const local = validate(f);
    if (Object.keys(local).length) { setErrors(local); setMsg('Please fix the highlighted fields.'); focusFirst(local); return; }
    setErrors({}); setBusy(true);
    try {
      await api('/api/v1/register', {
        body: {
          name: f.name.trim(), email: f.email.trim(), password: f.password, birthYear: Number(f.birthYear),
          inviteCode: f.inviteCode.trim(), guardianEmail: minor ? f.guardianEmail.trim() : '', journeySlug: f.journeySlug, acceptTerms: f.acceptTerms,
        },
      });
      router.push(`/login?registered=1&email=${encodeURIComponent(f.email.trim())}`);
    } catch (err) {
      const a = err instanceof ApiError ? err : new ApiError(0, 'UNKNOWN', 'Something went wrong. Please try again.');
      const fe = (a.details || {}) as Partial<Record<Key, string>>;
      setErrors(fe); focusFirst(fe);
      setMsg(a.status === 409 ? a.message : a.requestId ? `${a.message} (Reference: ${a.requestId.slice(0, 8)})` : a.message);
      setBusy(false);
    }
  };

  const field = (k: Key, label: string, opts: { type?: string; hint?: string; ac?: string; inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']; required?: boolean; extra?: React.ReactNode } = {}) => (
    <div>
      <label className="field-label" htmlFor={k}>{label}{opts.required !== false && <span aria-hidden="true" style={{ color: 'var(--danger)' }}> *</span>}</label>
      <div style={{ position: 'relative' }}>
        <input className="input" id={k} name={k} type={opts.type || 'text'} autoComplete={opts.ac} inputMode={opts.inputMode}
          value={String(f[k])} onChange={set(k)} required={opts.required !== false} disabled={busy}
          aria-invalid={!!errors[k]} aria-describedby={errors[k] || opts.hint ? `${k}-h` : undefined}
          style={errors[k] ? { borderColor: 'var(--danger)', ...(opts.extra ? { paddingRight: 64 } : {}) } : opts.extra ? { paddingRight: 64 } : undefined} />
        {opts.extra}
      </div>
      {errors[k] ? <div className="field-err" id={`${k}-h`} role="alert">{errors[k]}</div> : opts.hint ? <div className="field-hint" id={`${k}-h`}>{opts.hint}</div> : null}
    </div>
  );

  return (
    <AuthCard title="Create your account" subtitle="Free to start. Choose your journey; Level 1 opens immediately.">
      <form ref={formRef} className="stack gap-16" onSubmit={submit} noValidate aria-busy={busy}>
        {field('name', 'Full name', { ac: 'name' })}
        {field('email', 'Email', { type: 'email', ac: 'email', inputMode: 'email' })}
        {field('password', 'Password', {
          type: showPw ? 'text' : 'password', ac: 'new-password', hint: 'At least 10 characters, with a letter and a number.',
          extra: <button type="button" className="link small" onClick={() => setShowPw(s => !s)} aria-controls="password" aria-pressed={showPw}
            style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontWeight: 700 }}>{showPw ? 'Hide' : 'Show'}</button>,
        })}
        {field('birthYear', 'Year of birth', { type: 'text', inputMode: 'numeric', ac: 'bday-year', hint: 'Used only to apply age-appropriate safety settings.' })}
        {minor && field('guardianEmail', 'Parent or guardian email', { type: 'email', ac: 'off', inputMode: 'email', hint: 'Required for learners under 18. Community features unlock after consent.' })}
        <div onBlur={() => { const c = f.inviteCode.trim(); if (c !== journeyCode && (c === '' || c.length >= 4)) setJourneyCode(c); }}>
          {field('inviteCode', 'Institution invite code', { required: false, ac: 'off', hint: 'Optional. Joining through your college or company? Enter the code they gave you.' })}
        </div>
        {journeys && journeys.length > 0 && (
          <fieldset style={{ border: 0, padding: 0, margin: 0 }} aria-describedby={errors.journeySlug ? 'journeySlug-h' : undefined}>
            <legend className="field-label">Choose your journey</legend>
            <div className="stack gap-8" id="journeySlug">
              {journeys.map(j => (
                <label key={j.slug} className="card card-pad" style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer', borderColor: f.journeySlug === j.slug ? 'var(--gold, currentColor)' : undefined }}>
                  <input type="radio" name="journeySlug" value={j.slug} checked={f.journeySlug === j.slug} disabled={busy} style={{ marginTop: 3, flex: 'none' }}
                    onChange={() => { setF(p => ({ ...p, journeySlug: j.slug })); if (errors.journeySlug) setErrors(p => { const n = { ...p }; delete n.journeySlug; return n; }); }} />
                  <span><b>{j.title}</b>{j.isDefault && <span className="badge badge-gold" style={{ marginLeft: 8 }}>Recommended</span>}
                    <span className="small text-2" style={{ display: 'block' }}>{j.description || `${j.levels} levels`}</span></span>
                </label>
              ))}
            </div>
            {errors.journeySlug ? <div className="field-err" id="journeySlug-h" role="alert">{errors.journeySlug}</div> : <div className="field-hint">You can ask an admin to switch you later; your progress is kept.</div>}
          </fieldset>
        )}
        <div>
          <label className="small" htmlFor="acceptTerms" style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer' }}>
            <input id="acceptTerms" type="checkbox" checked={f.acceptTerms} onChange={set('acceptTerms')} disabled={busy}
              aria-invalid={!!errors.acceptTerms} aria-describedby={errors.acceptTerms ? 'acceptTerms-h' : undefined} style={{ marginTop: 3, flex: 'none', width: 16, height: 16 }} />
            <span>I agree to the terms and the privacy notice. My data is used to run my learning journey and is never sold.</span>
          </label>
          {errors.acceptTerms && <div className="field-err" id="acceptTerms-h" role="alert">{errors.acceptTerms}</div>}
        </div>
        {msg && <p className="field-err" role="alert" aria-live="assertive" style={{ marginTop: 0 }}>{msg}</p>}
        <button className="btn btn-gold btn-block" type="submit" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
        <p className="small text-2">Already have an account? <Link className="link" href="/login">Sign in</Link></p>
      </form>
    </AuthCard>
  );
}
