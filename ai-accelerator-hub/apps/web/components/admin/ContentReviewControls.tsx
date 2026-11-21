'use client';
/** Content review controls: publish/unpublish (Super Admin), publish all drafts, and the suggestions panel. */
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CheckCircle2, MessageSquarePlus, RotateCcw, XCircle } from 'lucide-react';
import { api, ApiError } from '@/lib/client/api';

export function PublishToggle({ levelId, published, canPublish }: { levelId: string; published: boolean; canPublish: boolean }) {
  const router = useRouter(); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  if (!canPublish) return <span className={`badge ${published ? 'badge-success' : 'badge-neutral'}`}>{published ? 'Published' : 'Draft'}</span>;
  const go = async () => {
    if (published && !window.confirm('Unpublish this level? Learners who reach it will see only its day lessons until you publish it again.')) return;
    setBusy(true); setErr('');
    try { await api(`/api/v1/admin/content/levels/${levelId}`, { method: 'PATCH', body: { published: !published } }); router.refresh(); }
    catch (e) { setErr((e as ApiError).message); } finally { setBusy(false); }
  };
  return (
    <span className="row gap-8" style={{ alignItems: 'center' }}>
      <span className={`badge ${published ? 'badge-success' : 'badge-neutral'}`}>{published ? 'Published' : 'Draft'}</span>
      <button type="button" className={`btn btn-sm ${published ? 'btn-ghost' : 'btn-gold'}`} disabled={busy} onClick={go}>{busy ? 'Saving…' : published ? 'Unpublish' : 'Publish'}</button>
      {err && <span className="field-err small" role="alert">{err}</span>}
    </span>
  );
}

export function PublishAll({ journeyId, drafts }: { journeyId: string; drafts: number }) {
  const router = useRouter(); const [busy, setBusy] = useState(false); const [msg, setMsg] = useState('');
  if (!drafts) return <span className="badge badge-success">All levels published</span>;
  const go = async () => {
    if (!window.confirm(`Publish all ${drafts} draft level${drafts === 1 ? '' : 's'}? Learners who reach them will see their activities at once.`)) return;
    setBusy(true);
    try { const r = await api<{ published: number }>(`/api/v1/admin/content/journeys/${journeyId}/publish-all`, { method: 'POST', body: {} }); setMsg(`${r.published} published.`); router.refresh(); }
    catch (e) { setMsg((e as ApiError).message); } finally { setBusy(false); }
  };
  return <span className="row gap-8" style={{ alignItems: 'center' }}><button type="button" className="btn btn-gold btn-sm" disabled={busy} onClick={go}>{busy ? 'Publishing…' : `Publish all ${drafts} drafts`}</button>{msg && <span className="small" role="status">{msg}</span>}</span>;
}

type S = { id: string; target: string; body: string; state: 'open' | 'done' | 'wontfix'; author: string; createdAt: string; resolvedBy: string | null; resolvedNote: string | null; resolvedAt: string | null };
const when = (iso: string) => new Date(iso).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

/** Suggestions for what is open on screen (a day, an activity or the whole level), and a box to add one. */
export function SuggestionsPanel({ levelId, target, targetName, items }: { levelId: string; target: string; targetName: string; items: S[] }) {
  const router = useRouter();
  const [text, setText] = useState(''); const [busy, setBusy] = useState(''); const [err, setErr] = useState('');
  const mine = items.filter(s => s.target === target);
  const open = mine.filter(s => s.state === 'open'), closed = mine.filter(s => s.state !== 'open');
  const add = async () => {
    setBusy('add'); setErr('');
    try { await api('/api/v1/admin/content/suggestions', { body: { levelId, target, body: text } }); setText(''); router.refresh(); }
    catch (e) { setErr((e as ApiError).message); } finally { setBusy(''); }
  };
  const set = async (id: string, state: S['state']) => {
    setBusy(id);
    try { await api(`/api/v1/admin/content/suggestions/${id}`, { method: 'PATCH', body: { state } }); router.refresh(); }
    catch (e) { setErr((e as ApiError).message); } finally { setBusy(''); }
  };
  return (
    <aside className="card card-pad stack gap-12" aria-labelledby="sugT" style={{ position: 'sticky', top: 80 }}>
      <h3 className="h3" id="sugT" style={{ margin: 0 }}>Suggestions · {targetName}</h3>
      <div className="stack gap-8">
        <label className="field-label" htmlFor="sugBody">Suggest an improvement</label>
        <textarea id="sugBody" className="textarea" rows={4} value={text} onChange={e => setText(e.target.value)} placeholder="What should change, and why? For example: the KPI formula in step 3 divides by the wrong total; use school days, not calendar days." disabled={busy === 'add'} />
        {err && <p className="field-err" role="alert">{err}</p>}
        <div><button type="button" className="btn btn-gold btn-sm" disabled={!text.trim() || busy === 'add'} onClick={add}><MessageSquarePlus size={15} aria-hidden="true" />{busy === 'add' ? 'Saving…' : 'Add suggestion'}</button></div>
      </div>
      <div className="stack gap-8">
        <b className="small">Open ({open.length})</b>
        {open.length === 0 && <p className="muted small" style={{ margin: 0 }}>No open suggestions here.</p>}
        {open.map(s => (
          <div key={s.id} className="card card-pad" style={{ padding: 10 }}>
            <p className="small" style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{s.body}</p>
            <p className="muted xs" style={{ margin: '6px 0' }}>{s.author} · {when(s.createdAt)}</p>
            <div className="row gap-8 wrap">
              <button type="button" className="btn btn-outline btn-sm" disabled={busy === s.id} onClick={() => set(s.id, 'done')}><CheckCircle2 size={14} aria-hidden="true" />Done</button>
              <button type="button" className="btn btn-ghost btn-sm" disabled={busy === s.id} onClick={() => set(s.id, 'wontfix')}><XCircle size={14} aria-hidden="true" />Won’t change</button>
            </div>
          </div>
        ))}
      </div>
      {closed.length > 0 && <details><summary className="small" style={{ cursor: 'pointer' }}>Resolved ({closed.length})</summary>
        <div className="stack gap-8" style={{ marginTop: 8 }}>{closed.map(s => (
          <div key={s.id} className="card card-pad" style={{ padding: 10, opacity: 0.85 }}>
            <span className={`badge ${s.state === 'done' ? 'badge-success' : 'badge-neutral'}`}>{s.state === 'done' ? 'Done' : 'Won’t change'}</span>
            <p className="small" style={{ margin: '6px 0 0', whiteSpace: 'pre-wrap' }}>{s.body}</p>
            {s.resolvedNote && <p className="small" style={{ margin: '4px 0 0' }}><b>Note:</b> {s.resolvedNote}</p>}
            <p className="muted xs" style={{ margin: '6px 0' }}>{s.author} · {when(s.createdAt)}{s.resolvedBy ? ` · resolved by ${s.resolvedBy}${s.resolvedAt ? `, ${when(s.resolvedAt)}` : ''}` : ''}</p>
            <button type="button" className="btn btn-text btn-sm" disabled={busy === s.id} onClick={() => set(s.id, 'open')}><RotateCcw size={14} aria-hidden="true" />Reopen</button>
          </div>
        ))}</div>
      </details>}
    </aside>
  );
}
