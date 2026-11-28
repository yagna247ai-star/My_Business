'use client';
/** Settings → Profile: my emails (docs/IDENTITY_DEDUP_SPEC.md §5). Add one (confirmed by link), remove a secondary, choose the main one. */
import { useEffect, useState } from 'react';
import { Mail } from 'lucide-react';
import { api, ApiError } from '@/lib/client/api';
import { useT } from '@/components/i18n/I18nProvider';
import { Tv } from '@/components/i18n/Tv';

type E = { id: string; email: string; isPrimary: boolean; pending: boolean };

export function EmailsCard({ initial }: { initial: E[] }) {
  const t = useT();
  const [rows, setRows] = useState(initial); const [email, setEmail] = useState(''); const [busy, setBusy] = useState(false); const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  const reload = async () => setRows(await api<E[]>('/api/v1/settings/emails'));
  const run = async (fn: () => Promise<unknown>, ok: string) => {
    if (busy) return; setBusy(true); setErr(''); setMsg('');
    try { await fn(); await reload(); setMsg(ok); } catch (x) { setErr((x as ApiError).message); } finally { setBusy(false); }
  };
  // The emailed link opens this page with ?verifyEmail=<token>: confirm it once, then clean the address bar.
  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('verifyEmail');
    if (!token) return;
    window.history.replaceState(null, '', window.location.pathname);
    void run(() => api('/api/v1/settings/emails/verify', { method: 'POST', body: { token } }), 'Email confirmed. You can sign in with it now.');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <section className="card card-pad stack gap-12" aria-labelledby="emailsT">
      <h2 className="h3" id="emailsT"><Mail size={18} aria-hidden="true" /> {t('My emails')}</h2>
      <ul className="stack gap-8" style={{ margin: 0, paddingLeft: 0, listStyle: 'none' }}>
        {rows.map(r => (
          <li key={r.id} className="row gap-8 wrap small" style={{ alignItems: 'center' }}>
            <span>{r.email}</span>
            {r.isPrimary && <span className="badge">{t('Main')}</span>}
            {r.pending && <span className="muted">{t('Waiting for you to confirm')}</span>}
            {!r.isPrimary && !r.pending && <button className="btn btn-text btn-sm" type="button" disabled={busy} onClick={() => run(() => api(`/api/v1/settings/emails/${r.id}/primary`, { method: 'POST' }), 'Main email changed.')}>{t('Make main')}</button>}
            {!r.isPrimary && <button className="btn btn-text btn-sm" type="button" disabled={busy} onClick={() => run(() => api(`/api/v1/settings/emails/${r.id}`, { method: 'DELETE' }), 'Email removed.')}>{t('Remove')}</button>}
          </li>
        ))}
      </ul>
      <form className="row gap-8 wrap" onSubmit={e => { e.preventDefault(); void run(async () => { await api('/api/v1/settings/emails', { method: 'POST', body: { email } }); setEmail(''); }, 'We sent a confirmation link to that email. It works for 24 hours.'); }}>
        <input className="input" type="email" style={{ maxWidth: 280 }} aria-label={t('Add another email')} placeholder={t('Add another email')} maxLength={254} value={email} onChange={e => setEmail(e.target.value)} />
        <button className="btn btn-soft btn-sm" type="submit" disabled={busy || !email.includes('@')}>{t('Add email')}</button>
      </form>
      <p className="muted xs">{t('You can sign in and reset your password with any confirmed email. Only your main email is shown to others.')}</p>
      {msg && <p className="callout ok small" role="status"><Tv v={msg} /></p>}
      {err && <p className="field-err" role="alert"><Tv v={err} /></p>}
    </section>
  );
}
