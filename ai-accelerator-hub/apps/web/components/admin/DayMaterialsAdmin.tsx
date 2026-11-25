'use client';
/** Staff: a day's study materials in Content review (docs/DAY_MATERIALS_SPEC.md). Links are checked before saving. */
import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, ExternalLink, Plus, Trash2 } from 'lucide-react';
import { api, ApiError } from '@/lib/client/api';

type M = { id: string; title: string; url: string; kind: string; note: string; linkStatus: string; opened: number };
const KINDS = ['slides', 'doc', 'sheet', 'video', 'folder', 'notebook', 'other'];
const STATUS: Record<string, [string, string]> = { open: ['badge-success', 'Opens for everyone'], private: ['badge-warn', 'Asks for access'], broken: ['badge-warn', 'Not found'], unknown: ['badge-neutral', 'Not checked yet'] };

export function DayMaterialsAdmin({ contentId, day }: { contentId: string; day: number }) {
  const [items, setItems] = useState<M[] | null>(null); const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [msg, setMsg] = useState('');
  const [f, setF] = useState({ title: '', url: '', kind: '', note: '' });
  const load = () => api<M[]>(`/api/v1/admin/days/${contentId}/materials`).then(setItems).catch(e => setErr((e as Error).message));
  useEffect(() => { setItems(null); load(); }, [contentId]); // eslint-disable-line react-hooks/exhaustive-deps
  const run = async (fn: () => Promise<unknown>, ok: string) => { setBusy(true); setErr(''); setMsg(''); try { await fn(); setMsg(ok); await load(); return true; } catch (e) { setErr((e as ApiError).message); return false; } finally { setBusy(false); } };
  return (
    <section className="card card-pad stack gap-12" aria-labelledby={`mat-${contentId}`} style={{ marginTop: 14 }}>
      <h3 className="h4" id={`mat-${contentId}`}>Day {day} materials</h3>
      <p className="muted xs">Drive, Docs, Sheets, Slides, Colab or video links learners open on this day. Each link is checked: it must open for anyone (Share → General access → “Anyone with the link” → Viewer). Docs, Sheets and Slides also get a “Copy to practise” button.</p>
      {msg && <p className="callout ok small" role="status">{msg}</p>}
      {err && <p className="callout warn small" role="alert">{err}</p>}
      {items === null ? <p className="muted small">Loading…</p> : !items.length ? <p className="muted small">No materials yet.</p> : (
        <ol className="stack gap-8" style={{ margin: 0, paddingLeft: 0, listStyle: 'none' }}>{items.map((m, i) => (
          <li key={m.id} className="mat-row">
            <div style={{ minWidth: 0, flex: 1 }}>
              <b>{m.title}</b> <span className="badge badge-neutral xs">{m.kind}</span> <span className={`badge xs ${STATUS[m.linkStatus]?.[0] ?? 'badge-neutral'}`}>{STATUS[m.linkStatus]?.[1] ?? m.linkStatus}</span>
              <div className="muted xs" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.url}</div>
              {m.note && <div className="xs">{m.note}</div>}
              <div className="muted xs">Opened by {m.opened} learner{m.opened === 1 ? '' : 's'}</div>
            </div>
            <div className="row gap-4">
              <a className="btn btn-soft btn-sm" href={m.url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${m.title}`}><ExternalLink size={13} /></a>
              <button className="btn btn-soft btn-sm" type="button" disabled={busy || i === 0} aria-label="Move up" onClick={() => run(() => api(`/api/v1/admin/materials/${m.id}`, { method: 'PATCH', body: { move: 'up' } }), 'Moved.')}><ArrowUp size={13} /></button>
              <button className="btn btn-soft btn-sm" type="button" disabled={busy || i === items.length - 1} aria-label="Move down" onClick={() => run(() => api(`/api/v1/admin/materials/${m.id}`, { method: 'PATCH', body: { move: 'down' } }), 'Moved.')}><ArrowDown size={13} /></button>
              <button className="btn btn-soft btn-sm" type="button" disabled={busy} aria-label={`Remove ${m.title}`} onClick={() => run(() => api(`/api/v1/admin/materials/${m.id}`, { method: 'DELETE' }), 'Removed.')}><Trash2 size={13} /></button>
            </div>
          </li>))}</ol>)}
      {(items?.length ?? 0) < 12 && <form className="stack gap-8" onSubmit={async e => { e.preventDefault(); if (await run(() => api(`/api/v1/admin/days/${contentId}/materials`, { method: 'POST', body: { title: f.title, url: f.url, note: f.note, ...(f.kind ? { kind: f.kind } : {}) } }), 'Material added.')) setF({ title: '', url: '', kind: '', note: '' }); }}>
        <div className="row gap-8 wrap">
          <input className="input" style={{ flex: '1 1 200px' }} required minLength={3} maxLength={120} placeholder="Title, e.g. SQL joins slides" aria-label="Title" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} />
          <input className="input" style={{ flex: '2 1 280px' }} type="url" required maxLength={1000} placeholder="https://drive.google.com/…" aria-label="Link" value={f.url} onChange={e => setF({ ...f, url: e.target.value })} />
          <select className="select" aria-label="Kind" value={f.kind} onChange={e => setF({ ...f, kind: e.target.value })}><option value="">Kind: detect</option>{KINDS.map(k => <option key={k} value={k}>{k}</option>)}</select>
        </div>
        <input className="input" maxLength={300} placeholder="Note for learners (optional), e.g. Practise questions 1–5 in your copy" aria-label="Note" value={f.note} onChange={e => setF({ ...f, note: e.target.value })} />
        <button className="btn btn-primary btn-sm" type="submit" disabled={busy} style={{ alignSelf: 'flex-start' }}><Plus size={14} />{busy ? 'Checking the link…' : 'Add material'}</button>
      </form>}
    </section>
  );
}
