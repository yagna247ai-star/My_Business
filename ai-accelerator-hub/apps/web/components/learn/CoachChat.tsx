'use client';
import { useEffect, useRef, useState } from 'react';
import { Send, AlertTriangle } from 'lucide-react';
import { api, ApiError } from '@/lib/client/api';
import { Tr } from '@/components/i18n/Tr';
import { useT } from '@/components/i18n/I18nProvider';
import { Tv } from '@/components/i18n/Tv';

type Msg = { role: string; text: string };
export function CoachChat({ assistants, configured, creditsLeft, context, prompts, compact }: { assistants: { code: string; name: string }[]; configured: boolean; creditsLeft: number; context?: { levelCode?: string; activityIdx?: number; day?: number }; /** One-tap starter questions. */ prompts?: string[]; /** Side panel: assistants as a select, shorter log. */ compact?: boolean }) {
  const t = useT();
  const [coach, setCoach] = useState((compact && assistants.find(a => a.code === 'concept-explainer')?.code) || assistants[0]?.code || 'concept-explainer');
  const [msgs, setMsgs] = useState<Msg[]>([]); const [draft, setDraft] = useState(''); const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [credits, setCredits] = useState(creditsLeft);
  const log = useRef<HTMLDivElement>(null);
  useEffect(() => { api<{ messages: Msg[] }>(`/api/v1/coach/${coach}`).then(r => setMsgs(r.messages)).catch(() => setMsgs([])); }, [coach]);
  useEffect(() => { log.current?.scrollTo({ top: log.current.scrollHeight }); }, [msgs]);
  const send = async (text?: string) => {
    const m = (text ?? draft).trim(); if (!m || busy) return; setBusy(true); setErr(''); setMsgs(x => [...x, { role: 'user', text: m }]); setDraft('');
    try { const r = await api<{ reply: string; redactions: number }>(`/api/v1/coach/${coach}`, { body: { message: m, context } }); setMsgs(x => [...x, { role: 'assistant', text: (r.redactions ? 'I removed personal data or a secret from your message before sending it.\n\n' : '') + r.reply }]); setCredits(c => Math.max(0, c - 1)); }
    catch (e) { setErr((e as ApiError).message); setMsgs(x => x.slice(0, -1)); setDraft(m); }
    finally { setBusy(false); }
  };
  return (
    <div className="stack gap-16">
      {compact ? assistants.length > 1 && <label className="small stack" style={{ gap: 4 }}><span className="muted xs"><Tr>Assistant</Tr></span><select className="select" value={coach} onChange={e => setCoach(e.target.value)}>{assistants.map(a => <option key={a.code} value={a.code}>{a.name}</option>)}</select></label>
        : <div className="coach-pick" role="radiogroup" aria-label={t('Choose an assistant')}>{assistants.map(a => <button key={a.code} className="seg-opt" type="button" role="radio" aria-checked={coach === a.code} onClick={() => setCoach(a.code)}><span><b>{a.name}</b></span></button>)}</div>}
      {!configured && <div className="callout warn" role="status"><AlertTriangle size={18} /><div><b><Tr>AI coaches are not switched on for your institution yet</Tr></b><Tr>An administrator needs to add an AI provider key on the server. Until then, ask your mentor or your cohort — nothing you type here is sent anywhere.</Tr></div></div>}
      <div className="row between small">{!compact && <span className="muted"><Tr>Conversations are private to you. Messages are scanned and personal data or secrets are removed before sending.</Tr></span>}<span className="muted"><Tv v={credits} /> <Tr>credits left</Tr></span></div>
      {prompts?.length ? <div className="row gap-8 wrap">{prompts.map(q => <button key={q} type="button" className="btn btn-outline btn-sm chip-q" disabled={!configured || busy} onClick={() => send(q)}><Tv v={q} /></button>)}</div> : null}
      <div ref={log} className={`msgs ${msgs.length ? '' : 'is-empty'}`} style={compact ? { maxHeight: 360, minHeight: 160 } : undefined} role="log" aria-live="polite" aria-label={t('Conversation')}>{msgs.length ? msgs.map((m, i) => <div key={i} className={`msg ${m.role === 'user' ? 'me' : 'ai'}`}><Tv v={m.text} /></div>) : <p className="muted small"><Tr>Ask about a concept, a step in your level, or your career path.</Tr></p>}</div>
      {err && <p className="field-err" role="alert"><Tv v={err} /></p>}
      <form className="chat-comp" onSubmit={e => { e.preventDefault(); void send(); }}>
        <label className="sr-only" htmlFor="coachIn"><Tr>Message</Tr></label>
        <textarea id="coachIn" className="textarea" rows={1} value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(); } }} placeholder={configured ? t('Ask a question…') : compact ? t('Not switched on yet') : t('AI coaches are not configured yet')} disabled={!configured} />
        <button className="sq send" type="submit" aria-label={t('Send')} disabled={!configured || busy || !draft.trim()}><Send size={18} /></button>
      </form>
    </div>
  );
}
