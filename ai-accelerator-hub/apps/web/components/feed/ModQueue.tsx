'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/client/api';
import { Tr } from '@/components/i18n/Tr';
import { useT } from '@/components/i18n/I18nProvider';
import { Tv } from '@/components/i18n/Tv';

type Item = { id: string; targetType: string; reason: string; reporter: string; createdAt: string | Date; target: { body: string; author: string; state: string } | null };

export function ModQueue({ initial }: { initial: Item[] }) {
  const t = useT();
  const router = useRouter();
  const [err, setErr] = useState('');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const act = async (id: string, action: 'hide' | 'remove' | 'dismiss') => {
    setErr('');
    try { await api(`/api/v1/moderation/reports/${id}/resolve`, { body: { action, note: notes[id] || '' } }); router.refresh(); }
    catch (e) { setErr((e as ApiError).message); }
  };
  return (<div style={{ display: 'grid', gap: 12, marginTop: 18 }}>
    {err && <p className="callout warn small" role="alert"><Tv v={err} /></p>}
    {initial.length === 0 && <p className="desc"><Tr>Queue is clear. Nothing reported.</Tr></p>}
    {initial.map(r => <article key={r.id} className="card card-pad" aria-labelledby={`r-${r.id}`}>
      <div className="row between"><b id={`r-${r.id}`}><Tv v={r.targetType} /> <Tr>reported by</Tr> <Tv v={r.reporter} /></b><span className="muted small">{new Date(r.createdAt).toLocaleString('en-IN')}</span></div>
      <p style={{ marginTop: 8 }}><b><Tr>Reason:</Tr></b> <Tv v={r.reason} /></p>
      {r.target ? <p className="desc" style={{ marginTop: 6 }}><b><Tv v={r.target.author} /></b> <Tr>wrote:</Tr> {r.target.body.slice(0, 500)} <span className="muted">(<Tv v={r.target.state} />)</span></p> : <p className="callout warn small" style={{ marginTop: 6 }}><Tr>Target already removed.</Tr></p>}
      <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
        <input className="input" style={{ flex: 1, minWidth: 200 }} value={notes[r.id] || ''} onChange={e => setNotes(n => ({ ...n, [r.id]: e.target.value }))} placeholder={t('Note to reporter (optional)')} aria-label={`Note for report ${r.id}`} />
        <button type="button" className="btn btn-outline btn-sm" onClick={() => act(r.id, 'hide')}><Tr>Hide</Tr></button>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => act(r.id, 'remove')}><Tr>Remove</Tr></button>
        <button type="button" className="btn btn-gold btn-sm" onClick={() => act(r.id, 'dismiss')}><Tr>Dismiss</Tr></button>
      </div>
    </article>)}
  </div>);
}
