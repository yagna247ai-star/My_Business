'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/client/api';

type Item = { id: string; targetType: string; reason: string; reporter: string; createdAt: string | Date; target: { body: string; author: string; state: string } | null };

export function ModQueue({ initial }: { initial: Item[] }) {
  const router = useRouter();
  const [err, setErr] = useState('');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const act = async (id: string, action: 'hide' | 'remove' | 'dismiss') => {
    setErr('');
    try { await api(`/api/v1/moderation/reports/${id}/resolve`, { body: { action, note: notes[id] || '' } }); router.refresh(); }
    catch (e) { setErr((e as ApiError).message); }
  };
  return (<div style={{ display: 'grid', gap: 12, marginTop: 18 }}>
    {err && <p className="callout warn small" role="alert">{err}</p>}
    {initial.length === 0 && <p className="desc">Queue is clear. Nothing reported.</p>}
    {initial.map(r => <article key={r.id} className="card card-pad" aria-labelledby={`r-${r.id}`}>
      <div className="row between"><b id={`r-${r.id}`}>{r.targetType} reported by {r.reporter}</b><span className="muted small">{new Date(r.createdAt).toLocaleString('en-IN')}</span></div>
      <p style={{ marginTop: 8 }}><b>Reason:</b> {r.reason}</p>
      {r.target ? <p className="desc" style={{ marginTop: 6 }}><b>{r.target.author}</b> wrote: {r.target.body.slice(0, 500)} <span className="muted">({r.target.state})</span></p> : <p className="callout warn small" style={{ marginTop: 6 }}>Target already removed.</p>}
      <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
        <input className="input" style={{ flex: 1, minWidth: 200 }} value={notes[r.id] || ''} onChange={e => setNotes(n => ({ ...n, [r.id]: e.target.value }))} placeholder="Note to reporter (optional)" aria-label={`Note for report ${r.id}`} />
        <button type="button" className="btn btn-outline btn-sm" onClick={() => act(r.id, 'hide')}>Hide</button>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => act(r.id, 'remove')}>Remove</button>
        <button type="button" className="btn btn-gold btn-sm" onClick={() => act(r.id, 'dismiss')}>Dismiss</button>
      </div>
    </article>)}
  </div>);
}
