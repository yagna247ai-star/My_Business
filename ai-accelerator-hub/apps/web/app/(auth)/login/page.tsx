'use client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Suspense, useState } from 'react';
import { AuthCard } from '@/components/auth/AuthCard';
import { useT } from '@/components/i18n/I18nProvider';
import { Tv } from '@/components/i18n/Tv';

/** Only same-site paths: "?next=https://evil.example" or "//evil.example" must never redirect off-site. */
function safeNext(raw: string | null) {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return '/dashboard';
  return raw;
}

function LoginForm() {
  const router = useRouter(); const sp = useSearchParams(); const t = useT();
  const [email, setEmail] = useState(() => sp.get('email') || ''); const [password, setPassword] = useState('');
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [showPw, setShowPw] = useState(false);
  const registered = !!sp.get('registered'); const reset = !!sp.get('reset');
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError('');
    if (!email.trim() || !password) { setError(t('Enter your email and password.')); return; }
    setBusy(true);
    try {
      const r = await signIn('credentials', { email: email.trim(), password, redirect: false });
      if (!r || r.error) { setError(t('That email and password do not match, or the account is temporarily locked after too many attempts. Try again in 15 minutes.')); setBusy(false); return; }
      router.replace(safeNext(sp.get('next'))); router.refresh();
    } catch {
      setError(t('Could not reach the server. Check your internet connection and try again.'));
      setBusy(false);
    }
  };
  return (
    <AuthCard title={t('Sign in')} subtitle={t(registered ? 'Your account is ready. Sign in to start Level 1.' : 'Welcome back.')}>
      <form className="stack gap-16" onSubmit={submit} noValidate aria-busy={busy}>
        {registered && <p className="small" role="status" style={{ background: 'var(--success-tint)', color: 'var(--success)', padding: '10px 12px', borderRadius: 12, fontWeight: 600 }}>{t('Account created. Sign in with the password you just chose.')}</p>}
        {reset && <p className="small" role="status" style={{ background: 'var(--success-tint)', color: 'var(--success)', padding: '10px 12px', borderRadius: 12, fontWeight: 600 }}>{t('Password changed. Sign in with your new password.')}</p>}
        <div><label className="field-label" htmlFor="email">{t('Email')}</label><input className="input" id="email" name="email" type="email" inputMode="email" autoComplete="email" required disabled={busy} value={email} onChange={e => setEmail(e.target.value)} /></div>
        <div>
          <label className="field-label" htmlFor="password">{t('Password')}</label>
          <div style={{ position: 'relative' }}>
            <input className="input" id="password" name="password" type={showPw ? 'text' : 'password'} autoComplete="current-password" required disabled={busy} autoFocus={registered} value={password} onChange={e => setPassword(e.target.value)} style={{ paddingRight: 64 }} />
            <button type="button" className="link small" onClick={() => setShowPw(s => !s)} aria-controls="password" aria-pressed={showPw} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontWeight: 700 }}>{t(showPw ? 'Hide' : 'Show')}</button>
          </div>
          <p className="small" style={{ marginTop: 6, textAlign: 'right' }}><Link className="link" href={email.trim() ? `/forgot-password?email=${encodeURIComponent(email.trim())}` : '/forgot-password'}>{t('Forgot password?')}</Link></p>
        </div>
        {error && <p className="field-err" role="alert" aria-live="assertive" style={{ marginTop: 0 }}><Tv v={error} /></p>}
        <button className="btn btn-gold btn-block" type="submit" disabled={busy}>{t(busy ? 'Signing in…' : 'Sign in')}</button>
        <p className="small text-2">{t('New here?')} <Link className="link" href="/register">{t('Create an account')}</Link></p>
      </form>
    </AuthCard>
  );
}
export default function LoginPage() { return <Suspense><LoginForm /></Suspense>; }
