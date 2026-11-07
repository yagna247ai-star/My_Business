'use client';
import { useEffect, useRef, useState } from 'react';
import { Send, AlertTriangle } from 'lucide-react';
import { api, ApiError } from '@/lib/client/api';

type Msg = { role: string; text: string };
export function CoachChat({ assistants, configured, creditsLeft, context }: { assistants: { code: string; name: string }[]; configured: boolean; creditsLeft: number; context?: { levelCode?: string; activityIdx?: number } }) {
  const [coach, setCoach] = useState(assistants[0]?.code || 'concept-explainer');
  const [msgs, setMsgs] = useState<Msg[]>([]); const [draft, setDraft] = useState(''); const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [credits, setCredits] = useState(creditsLeft);
  const log = useRef<HTMLDivElement>(null);
  useEffect(() => { api<{ messages: Msg[] }>(`/api/v1/coach/${coach}`).then(r => setMsgs(r.messages)).catch(() => setMsgs([])); }, [coach]);
  useEffect(() => { log.current?.scrollTo({ top: log.current.scrollHeight }); }, [msgs]);
  const send = async () => {
    const m = draft.trim(); if (!m || busy) return; setBusy(true); setErr(''); setMsgs(x => [...x, { role: 'user', text: m }]); setDraft('');
    try { const r = await api<{ reply: string; redactions: number }>(`/api/v1/coach/${coach}`, { body: { message: m, context } }); setMsgs(x => [...x, { role: 'assistant', text: (r.redactions ? 'I removed personal data or a secret from your message before sending it.\n\n' : '') + r.reply }]); setCredits(c => Math.max(0, c - 1)); }
    catch (e) { setErr((e as ApiError).message); setMsgs(x => x.slice(0, -1)); setDraft(m); }
    finally { setBusy(false); }
  };
  return (
    <div className="stack gap-16">
      <div className="coach-pick" role="radiogroup" aria-label="Choose an assistant">{assistants.map(a => <button key={a.code} className="seg-opt" type="button" role="radio" aria-checked={coach === a.code} onClick={() => setCoach(a.code)}><span><b>{a.name}</b></span></button>)}</div>
      {!configured && <div className="callout warn" role="status"><AlertTriangle size={18} /><div><b>AI coaches are not switched on for your institution yet</b>An administrator needs to add an AI provider key on the server. Until then, ask your mentor or your cohort — nothing you type here is sent anywhere.</div></div>}
      <div className="row between small"><span className="muted">Conversations are private to you. Messages are scanned and personal data or secrets are removed before sending.</span><span className="muted">{credits} credits left</span></div>
      <div ref={log} className={`msgs ${msgs.length ? '' : 'is-empty'}`} role="log" aria-live="polite" aria-label="Conversation">{msgs.length ? msgs.map((m, i) => <div key={i} className={`msg ${m.role === 'user' ? 'me' : 'ai'}`}>{m.text}</div>) : <p className="muted small">Ask about a concept, a step in your level, or your career path.</p>}</div>
      {err && <p className="field-err" role="alert">{err}</p>}
      <form className="chat-comp" onSubmit={e => { e.preventDefault(); send(); }}>
        <label className="sr-only" htmlFor="coachIn">Message</label>
        <textarea id="coachIn" className="textarea" rows={1} value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder={configured ? 'Ask a question…' : 'AI coaches are not configured yet'} disabled={!configured} />
        <button className="sq send" type="submit" aria-label="Send" disabled={!configured || busy || !draft.trim()}><Send size={18} /></button>
      </form>
    </div>
  );
}
