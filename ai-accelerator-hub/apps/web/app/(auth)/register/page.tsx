'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AuthCard } from '@/components/auth/AuthCard';
import { api, ApiError } from '@/lib/client/api';

export default function RegisterPage() {
  const router = useRouter();
  const [f, setF] = useState({ name: '', email: '', password: '', birthYear: '', inviteCode: '', guardianEmail: '', acceptTerms: false });
  const [errors, setErrors] = useState<Record<string, string>>({}); const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false);
  const age = f.birthYear ? new Date().getFullYear() - Number(f.birthYear) : null;
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErrors({}); setMsg(''); setBusy(true);
    try { await api('/api/v1/register', { body: { ...f, birthYear: Number(f.birthYear) } }); router.push('/login?registered=1'); }
    catch (err) { const a = err as ApiError; setMsg(a.message); if (a.details) setErrors(a.details); }
    finally { setBusy(false); }
  };
  const field = (k: keyof typeof f, label: string, type = 'text', hint?: string, ac?: string) => (
    <div><label className="field-label" htmlFor={k}>{label}</label><input className="input" id={k} type={type} autoComplete={ac} value={String(f[k])} onChange={set(k)} aria-invalid={!!errors[k]} aria-describedby={`${k}-h`} />{errors[k] ? <div className="field-err" id={`${k}-h`}>{errors[k]}</div> : hint ? <div className="field-hint" id={`${k}-h`}>{hint}</div> : null}</div>
  );
  return (
    <AuthCard title="Create your account" subtitle="Free to start. Level 1 — AI Explorer — opens immediately.">
      <form className="stack gap-16" onSubmit={submit} noValidate>
        {field('name', 'Full name', 'text', undefined, 'name')}
        {field('email', 'Email', 'email', undefined, 'email')}
        {field('password', 'Password', 'password', 'At least 10 characters, with a letter and a number.', 'new-password')}
        {field('birthYear', 'Year of birth', 'number', 'Used only to apply age-appropriate safety settings.')}
        {age !== null && age < 18 && age >= 13 && field('guardianEmail', 'Parent or guardian email', 'email', 'Required for learners under 18. Community features unlock after consent.')}
        {field('inviteCode', 'Institution invite code (optional)', 'text', 'Joining through your college or company? Enter the code they gave you.')}
        <label className="row gap-12 small" style={{ alignItems: 'flex-start' }}><input type="checkbox" checked={f.acceptTerms} onChange={set('acceptTerms')} style={{ marginTop: 3 }} /><span>I agree to the terms and the privacy notice. My data is used to run my learning journey and is never sold.</span></label>
        {msg && <p className="field-err" role="alert">{msg}</p>}
        <button className="btn btn-gold btn-block" type="submit" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
        <p className="small text-2">Already have an account? <Link className="link" href="/login">Sign in</Link></p>
      </form>
    </AuthCard>
  );
}
