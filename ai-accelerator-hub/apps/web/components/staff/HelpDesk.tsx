'use client';
/** Staff help desk for Agent Lab "Get unstuck" requests (docs/AGENT_LAB_GET_UNSTUCK_SPEC.md §5). */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send } from 'lucide-react';
import { api, ApiError } from '@/lib/client/api';
import { KNOWN_ERRORS } from '@/lib/domain/troubleshoot';
import { AGENTS } from '@/lib/domain/setupGuide';
import { ErrorCard } from '@/components/learn/StuckPanel';
import type { AgentCode } from '@/lib/domain/personalise';

type Item = { id: string; learner: string; agent: string | null; os: string | null; method: string | null; stepTitle: string; errorText: string; matchedIds: string[]; state: string; createdAt: string; messages: { id: string; role: string; body: string; at: string; author: string }[] };
const OS_LABEL: Record<string, string> = { macos: 'macOS', windows: 'Windows', linux: 'Linux' };

export function HelpDesk({ items, canReply }: { items: Item[]; canReply: boolean }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Record<string, string>>({}); const [err, setErr] = useState(''); const [busy, setBusy] = useState('');
  const act = async (id: string, fn: () => Promise<unknown>) => { setBusy(id); setErr(''); try { await fn(); router.refresh(); return true; } catch (e) { setErr((e as ApiError).message); return false; } finally { setBusy(''); } };
  if (!items.length) return <div className="card empty"><p>No help requests here. Learners can ask from any Agent Lab step.</p></div>;
  return (<div className="stack gap-16">
    {err && <p className="callout warn small" role="alert">{err}</p>}
    {items.map(r => { const os = (r.os || 'macos') as 'macos'; const matched = KNOWN_ERRORS.filter(e => r.matchedIds.includes(e.id)); return (
      <article key={r.id} className="card card-pad stack gap-12" aria-label={`Help request from ${r.learner}`}>
        <div className="row between wrap gap-8"><div><b>{r.learner}</b> <span className="muted small">· {r.agent ? AGENTS[r.agent as AgentCode]?.name || r.agent : 'Agent Lab'} on {OS_LABEL[r.os || ''] || r.os}{r.method ? ` · method ${r.method}` : ''}</span></div>
          <span className={`badge ${r.state === 'open' ? 'badge-gold' : r.state === 'answered' ? 'badge-success' : 'badge-neutral'}`}>{r.state}</span></div>
        <p className="small" style={{ margin: 0 }}>Stuck on: <b>{r.stepTitle}</b> <span className="muted xs">· {new Date(r.createdAt).toLocaleString('en-IN')}</span></p>
        <div className="guide-term err"><div className="term-bar"><span>What the learner pasted (personal data removed)</span></div><pre>{r.errorText}</pre></div>
        {matched.length > 0 && <details><summary className="small bold" style={{ cursor: 'pointer' }}>Known fixes that match ({matched.length}) — the learner was shown these</summary><div className="stack gap-8" style={{ marginTop: 8 }}>{matched.map(e => <ErrorCard key={e.id} e={e} os={os} />)}</div></details>}
        {r.messages.map(m => <div key={m.id} className={`msg ${m.role === 'staff' ? 'ai' : 'me'} small`} style={{ whiteSpace: 'pre-wrap' }}><b>{m.role === 'staff' ? m.author : r.learner}</b><br />{m.body}</div>)}
        {canReply && r.state !== 'resolved' && <div className="stack gap-8">
          <textarea className="input" rows={3} value={draft[r.id] || ''} onChange={e => setDraft(d => ({ ...d, [r.id]: e.target.value }))} placeholder="Reply with the next step to try. One command per step, and how to check it worked." aria-label={`Reply to ${r.learner}`} maxLength={2000} />
          <div className="row gap-8"><button className="btn btn-gold btn-sm" type="button" disabled={!(draft[r.id] || '').trim() || busy === r.id} onClick={() => act(r.id, () => api(`/api/v1/help/${r.id}/messages`, { body: { body: draft[r.id] } })).then(ok => { if (ok) setDraft(d => ({ ...d, [r.id]: '' })); })}><Send size={14} />Send reply</button>
            <button className="btn btn-text btn-sm" type="button" disabled={busy === r.id} onClick={() => act(r.id, () => api(`/api/v1/help/${r.id}/resolve`, { body: {} }))}>Mark resolved</button></div>
        </div>}
      </article>); })}
  </div>);
}
