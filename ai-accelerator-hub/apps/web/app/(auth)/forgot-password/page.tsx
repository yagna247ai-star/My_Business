'use client';
// Forgot password, step 1 (docs/FORGOT_PASSWORD_SPEC.md). The reply is the same whether or not the account exists.
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { AuthCard } from '@/components/auth/AuthCard';
import { useT } from '@/components/i18n/I18nProvider';
import { Tv } from '@/components/i18n/Tv';
import { api, ApiError } from '@/lib/client/api';

function ForgotForm() {
  const sp = useSearchParams(); const t = useT();
  const [email, setEmail] = useState(() => sp.get('email') || '');
  const [busy, setBusy] = useState(false); const [done, setDone] = useState(''); const [error, setError] = useState('');
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError('');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) { setError(t('Enter a valid email address.')); return; }
    setBusy(true);
    try { const r = await api<{ message: string }>('/api/v1/auth/forgot-password', { method: 'POST', body: { email: email.trim() } }); setDone(r.message); }
    catch (err) { setError((err as ApiError).message || t('Could not reach the server. Check your internet connection and try again.')); }
    finally { setBusy(false); }
  };
  return (
    <AuthCard title={t('Forgot your password?')} subtitle={t('Enter the email you signed up with and we will email you a link to set a new password.')}>
      {done ? (
        <div className="stack gap-16">
          <p className="small" role="status" style={{ background: 'var(--success-tint)', color: 'var(--success)', padding: '10px 12px', borderRadius: 12, fontWeight: 600 }}><Tv v={done} /></p>
          <p className="small text-2">{t('No email after a few minutes? Check your spam folder, or try again.')}</p>
          <Link className="btn btn-gold btn-block" href="/login">{t('Back to sign in')}</Link>
        </div>
      ) : (
        <form className="stack gap-16" onSubmit={submit} noValidate aria-busy={busy}>
          <div><label className="field-label" htmlFor="email">{t('Email')}</label><input className="input" id="email" name="email" type="email" inputMode="email" autoComplete="email" required autoFocus disabled={busy} value={email} onChange={e => setEmail(e.target.value)} /></div>
          {error && <p className="field-err" role="alert" aria-live="assertive" style={{ marginTop: 0 }}><Tv v={error} /></p>}
          <button className="btn btn-gold btn-block" type="submit" disabled={busy}>{t(busy ? 'Sending…' : 'Send reset link')}</button>
          <p className="small text-2"><Link className="link" href="/login">{t('Back to sign in')}</Link></p>
        </form>
      )}
    </AuthCard>
  );
}
export default function ForgotPasswordPage() { return <Suspense><ForgotForm /></Suspense>; }
