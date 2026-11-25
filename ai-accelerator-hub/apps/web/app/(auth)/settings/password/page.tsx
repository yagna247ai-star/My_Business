'use client';
// Change your own password (docs/SUPER_ADMIN_CONTROL_SPEC.md §3.3). Outside the app layout, so a forced change cannot loop.
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useState } from 'react';
import { AuthCard } from '@/components/auth/AuthCard';
import { useT } from '@/components/i18n/I18nProvider';
import { Tv } from '@/components/i18n/Tv';
import { api, ApiError } from '@/lib/client/api';

export default function ChangePasswordPage() {
  const router = useRouter(); const t = useT();
  const [cur, setCur] = useState(''); const [pw, setPw] = useState(''); const [pw2, setPw2] = useState(''); const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [signedOut, setSignedOut] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError('');
    if (pw !== pw2) { setError(t('The two passwords do not match.')); return; }
    setBusy(true);
    try { await api('/api/v1/me/password', { method: 'POST', body: { current: cur, password: pw } }); router.replace('/dashboard'); router.refresh(); }
    catch (err) { const x = err as ApiError; if (x.status === 401) setSignedOut(true); else setError(x.message); setBusy(false); }
  };
  if (signedOut) return <AuthCard title={t('Sign in first')} subtitle={t('Sign in, then choose your new password.')}><Link className="btn btn-gold btn-block" href="/login">{t('Sign in')}</Link></AuthCard>;
  return (
    <AuthCard title={t('Choose a new password')} subtitle={t('Use at least 10 characters, with a letter and a number.')}>
      <form className="stack gap-16" onSubmit={submit} noValidate aria-busy={busy}>
        <div><label className="field-label" htmlFor="current">{t('Current password')}</label><input className="input" id="current" type={show ? 'text' : 'password'} autoComplete="current-password" disabled={busy} value={cur} onChange={e => setCur(e.target.value)} /><p className="muted xs" style={{ marginTop: 4 }}>{t('The password you signed in with. Leave blank if you never set one.')}</p></div>
        <div>
          <label className="field-label" htmlFor="password">{t('New password')}</label>
          <div style={{ position: 'relative' }}>
            <input className="input" id="password" type={show ? 'text' : 'password'} autoComplete="new-password" required minLength={10} maxLength={200} disabled={busy} value={pw} onChange={e => setPw(e.target.value)} style={{ paddingRight: 64 }} />
            <button type="button" className="link small" onClick={() => setShow(s => !s)} aria-pressed={show} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontWeight: 700 }}>{t(show ? 'Hide' : 'Show')}</button>
          </div>
        </div>
        <div><label className="field-label" htmlFor="password2">{t('Confirm new password')}</label><input className="input" id="password2" type={show ? 'text' : 'password'} autoComplete="new-password" required disabled={busy} value={pw2} onChange={e => setPw2(e.target.value)} /></div>
        {error && <p className="field-err" role="alert" aria-live="assertive" style={{ marginTop: 0 }}><Tv v={error} /></p>}
        <button className="btn btn-gold btn-block" type="submit" disabled={busy}>{t(busy ? 'Saving…' : 'Save new password')}</button>
        <p className="small text-2"><button type="button" className="link" onClick={() => signOut({ callbackUrl: '/login' })}>{t('Sign out')}</button></p>
      </form>
    </AuthCard>
  );
}
