'use client';
// Forgot password, step 2 (docs/FORGOT_PASSWORD_SPEC.md): choose a new password using the emailed link.
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { AuthCard } from '@/components/auth/AuthCard';
import { useT } from '@/components/i18n/I18nProvider';
import { Tv } from '@/components/i18n/Tv';
import { api, ApiError } from '@/lib/client/api';

function ResetForm() {
  const router = useRouter(); const sp = useSearchParams(); const t = useT();
  const token = sp.get('token') || '';
  const [pw, setPw] = useState(''); const [pw2, setPw2] = useState(''); const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [badLink, setBadLink] = useState(!token);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError('');
    if (pw !== pw2) { setError(t('The two passwords do not match.')); return; }
    setBusy(true);
    try {
      await api('/api/v1/auth/reset-password', { method: 'POST', body: { token, password: pw } });
      router.replace('/login?reset=1');
    } catch (err) {
      const e = err as ApiError;
      if (/invalid or has expired/i.test(e.message || '')) setBadLink(true); else setError(e.message || t('Could not reach the server. Check your internet connection and try again.'));
      setBusy(false);
    }
  };
  if (badLink) return (
    <AuthCard title={t('Link expired')} subtitle={t('This reset link is invalid or has expired. Request a new one.')}>
      <Link className="btn btn-gold btn-block" href="/forgot-password">{t('Send a new link')}</Link>
    </AuthCard>
  );
  return (
    <AuthCard title={t('Set a new password')} subtitle={t('Use at least 10 characters, with a letter and a number.')}>
      <form className="stack gap-16" onSubmit={submit} noValidate aria-busy={busy}>
        <div>
          <label className="field-label" htmlFor="password">{t('New password')}</label>
          <div style={{ position: 'relative' }}>
            <input className="input" id="password" type={show ? 'text' : 'password'} autoComplete="new-password" required minLength={10} maxLength={200} autoFocus disabled={busy} value={pw} onChange={e => setPw(e.target.value)} style={{ paddingRight: 64 }} />
            <button type="button" className="link small" onClick={() => setShow(s => !s)} aria-controls="password" aria-pressed={show} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontWeight: 700 }}>{t(show ? 'Hide' : 'Show')}</button>
          </div>
        </div>
        <div><label className="field-label" htmlFor="password2">{t('Confirm new password')}</label><input className="input" id="password2" type={show ? 'text' : 'password'} autoComplete="new-password" required disabled={busy} value={pw2} onChange={e => setPw2(e.target.value)} /></div>
        {error && <p className="field-err" role="alert" aria-live="assertive" style={{ marginTop: 0 }}><Tv v={error} /></p>}
        <button className="btn btn-gold btn-block" type="submit" disabled={busy}>{t(busy ? 'Saving…' : 'Set new password')}</button>
      </form>
    </AuthCard>
  );
}
export default function ResetPasswordPage() { return <Suspense><ResetForm /></Suspense>; }
