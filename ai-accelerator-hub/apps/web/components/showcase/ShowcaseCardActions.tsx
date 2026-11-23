'use client';
/** Under a showcase card: the author removes their project; anyone else can report it. No browser dialogs. */
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Flag, Trash2 } from 'lucide-react';
import { api, ApiError } from '@/lib/client/api';
import { useT } from '@/components/i18n/I18nProvider';

export function ShowcaseCardActions({ id, mine, reported }: { id: string; mine: boolean; reported: boolean }) {
  const router = useRouter(); const t = useT();
  const [mode, setMode] = useState<'idle' | 'confirm' | 'report' | 'done'>(reported ? 'done' : 'idle');
  const [reason, setReason] = useState(''); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const send = async (action: 'remove' | 'report') => {
    setBusy(true); setErr('');
    try { await api(`/api/v1/showcase/${id}`, { body: { action, reason: action === 'report' ? reason : undefined } }); if (action === 'remove') router.refresh(); else setMode('done'); }
    catch (e) { setErr((e as ApiError).message); } finally { setBusy(false); }
  };
  if (mine) return mode === 'confirm'
    ? <div className="row gap-8 wrap small" style={{ alignItems: 'center' }}><span>{t('Remove this project from the showcase?')}</span><button type="button" className="btn btn-sm btn-danger" disabled={busy} onClick={() => send('remove')}>{t('Yes, remove')}</button><button type="button" className="btn btn-sm btn-ghost" onClick={() => setMode('idle')}>{t('Cancel')}</button>{err && <span className="field-err">{err}</span>}</div>
    : <button type="button" className="btn btn-sm btn-ghost" onClick={() => setMode('confirm')}><Trash2 size={14} aria-hidden="true" />{t('Remove')}</button>;
  if (mode === 'done') return <span className="muted xs">{t('Reported. A moderator will look at it.')}</span>;
  if (mode === 'report') return (
    <div className="stack gap-6" style={{ width: '100%' }}>
      <label className="small" htmlFor={`rep-${id}`}>{t('What is wrong with this project?')}</label>
      <textarea id={`rep-${id}`} className="textarea" rows={2} value={reason} onChange={e => setReason(e.target.value)} placeholder={t('For example: the link asks for access, or it is not the learner’s own work')} />
      {err && <span className="field-err" role="alert">{err}</span>}
      <div className="row gap-8"><button type="button" className="btn btn-sm btn-outline" disabled={busy || reason.trim().length < 5} onClick={() => send('report')}>{t('Send report')}</button><button type="button" className="btn btn-sm btn-ghost" onClick={() => setMode('idle')}>{t('Cancel')}</button></div>
    </div>);
  return <button type="button" className="btn btn-sm btn-ghost" onClick={() => setMode('report')}><Flag size={14} aria-hidden="true" />{t('Report')}</button>;
}
