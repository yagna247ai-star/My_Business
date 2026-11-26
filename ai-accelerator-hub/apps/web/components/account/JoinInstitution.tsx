'use client';
/** Settings → Profile: my institutions, and join another with its code (docs/INSTITUTIONS_SPEC.md scenario 5). */
import { useState } from 'react';
import { Building2 } from 'lucide-react';
import { api, ApiError } from '@/lib/client/api';
import { useT } from '@/components/i18n/I18nProvider';
import { Tv } from '@/components/i18n/Tv';

type H = { institution: string; code: string | null; status: string; joinedAt: string; leftAt: string | null; movedTo: string | null };

export function JoinInstitution({ history }: { history: H[] }) {
  const t = useT();
  const [code, setCode] = useState(''); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const join = async (e: React.FormEvent) => {
    e.preventDefault(); if (busy) return; setBusy(true); setErr('');
    try { await api('/api/v1/me/join', { method: 'POST', body: { code } }); window.location.assign('/dashboard'); }
    catch (x) { setErr((x as ApiError).message); setBusy(false); }
  };
  const d = (s: string) => new Date(s).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
  return (
    <section className="card card-pad stack gap-12" aria-labelledby="instT">
      <h2 className="h3" id="instT"><Building2 size={18} aria-hidden="true" /> {t('My institutions')}</h2>
      <ul className="stack gap-4" style={{ margin: 0, paddingLeft: 18 }}>{history.map((h, i) => <li key={i} className="small"><b><Tv v={h.institution} /></b>{h.code ? ` (${h.code})` : ''} · {h.status === 'active' ? t('member since {d}', { d: d(h.joinedAt) }) : h.status === 'alumni' ? `${t('alumni')} · ${d(h.joinedAt)}–${h.leftAt ? d(h.leftAt) : ''}${h.movedTo ? ` → ${h.movedTo}` : ''}` : <Tv v={h.status} />}</li>)}</ul>
      <form className="row gap-8 wrap" onSubmit={join}>
        <input className="input" style={{ maxWidth: 220, fontFamily: 'var(--font-mono)' }} aria-label={t('Institution code')} placeholder={t('Institution code')} maxLength={40} value={code} onChange={e => setCode(e.target.value.toUpperCase())} />
        <button className="btn btn-soft btn-sm" type="submit" disabled={busy || code.trim().length < 3}>{t(busy ? 'Joining…' : 'Join institution')}</button>
      </form>
      <p className="muted xs">{t('Joining a new institution (for example your employer) keeps your account, points and history. Switch between institutions from the top bar.')}</p>
      {err && <p className="field-err" role="alert"><Tv v={err} /></p>}
    </section>
  );
}
