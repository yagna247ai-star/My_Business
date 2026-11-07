'use client';
/**
 * "Stuck on this step?" (docs/AGENT_LAB_GET_UNSTUCK_SPEC.md §2):
 * ① error gallery for this step · ② deterministic fix finder (in the browser, no AI) · ③ AI coach or a mentor.
 */
import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Bot, CheckCircle2, LifeBuoy, Search, Send, UserRound } from 'lucide-react';
import { api, ApiError } from '@/lib/client/api';
import type { GuideStep, OS } from '@/lib/domain/setupGuide';
import { diagnose, errorsFor, type KnownError } from '@/lib/domain/troubleshoot';
import type { AgentCode } from '@/lib/domain/personalise';
import { TermBlock } from './SetupGuide';

type Help = { id: string; stepId: string; stepTitle: string; errorText: string; state: string; createdAt: string; messages: { id: string; role: string; body: string; at: string; author: string }[] };
const STATE_LABEL: Record<string, string> = { open: 'Waiting for a mentor', answered: 'Mentor replied', resolved: 'Resolved' };

export function ErrorCard({ e, highlight = false, os }: { e: KnownError; highlight?: boolean; os: OS }) {
  const sh = os === 'windows' ? 'ps' : 'sh';
  const host = (u: string) => { try { return new URL(u).hostname; } catch { return u; } };
  return (<article className={`err-card${highlight ? ' hit' : ''}`} aria-label={e.title}>
    <b className="small row gap-8" style={{ alignItems: 'center' }}><AlertTriangle size={15} aria-hidden="true" />{e.title}</b>
    <div className="guide-term err"><div className="term-bar"><span>What you might see{e.provenance === 'observed' && e.observedWith ? ` · observed with ${e.observedWith}` : ''}</span></div><pre>{e.looksLike}</pre></div>
    <p className="small" style={{ margin: '8px 0 4px' }}><b>Why:</b> {e.cause}</p>
    <ol className="small" style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 6 }}>{e.fix.map((f, i) => <li key={i}>{f.text}{f.cmd && <TermBlock text={f.cmd} shell={f.shell || sh} />}</li>)}</ol>
    <p className="muted xs" style={{ margin: '6px 0 0', textAlign: 'right' }}>Source: {e.source.map((u, i) => <a key={u} className="link" href={u} target="_blank" rel="noopener noreferrer">{i ? ', ' : ''}{host(u)}</a>)}</p>
  </article>);
}

export function StuckPanel({ runId, step, os, agent, method }: { runId: string; step: GuideStep; os: OS; agent: AgentCode; method: string }) {
  const scope = { kind: step.kind, os, agent, method };
  const gallery = useMemo(() => errorsFor(scope), [step.kind, os, agent, method]); // eslint-disable-line react-hooks/exhaustive-deps
  const [text, setText] = useState(''); const [hits, setHits] = useState<KnownError[] | null>(null);
  const [ai, setAi] = useState(''); const [aiErr, setAiErr] = useState(''); const [busy, setBusy] = useState<'' | 'ai' | 'mentor' | 'reply'>('');
  const [reqs, setReqs] = useState<Help[]>([]); const [err, setErr] = useState(''); const [reply, setReply] = useState<Record<string, string>>({});
  const load = () => api<{ requests: Help[] }>(`/api/v1/help?runId=${encodeURIComponent(runId)}`).then(r => setReqs(r.requests.filter(x => x.stepId === step.id))).catch(() => {});
  useEffect(() => { load(); }, [runId, step.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const find = () => setHits(diagnose(text, scope));
  const askAi = async () => {
    setBusy('ai'); setAi(''); setAiErr('');
    try { const r = await api<{ reply: string; redactions: number }>('/api/v1/coach/code-mentor', { body: { message: `I'm stuck on "${step.title}". My terminal shows:\n${text}`, context: { lab: { runId, stepId: step.id } } } }); setAi((r.redactions ? 'I removed personal data or a secret from your message first.\n\n' : '') + r.reply); }
    catch (e) { const a = e as ApiError; setAiErr(a.code === 'AI_NOT_CONFIGURED' ? 'AI help isn’t switched on for your institution yet. Ask a mentor below — a person will reply here.' : a.message); }
    finally { setBusy(''); }
  };
  const askMentor = async () => {
    setBusy('mentor'); setErr('');
    try { await api('/api/v1/help', { body: { runId, stepId: step.id, text } }); setText(''); setHits(null); await load(); }
    catch (e) { const a = e as ApiError; setErr(a.details?.text || a.message); } finally { setBusy(''); }
  };
  const send = async (id: string) => {
    setBusy('reply'); setErr('');
    try { await api(`/api/v1/help/${id}/messages`, { body: { body: reply[id] || '' } }); setReply(r => ({ ...r, [id]: '' })); await load(); }
    catch (e) { const a = e as ApiError; setErr(a.details?.body || a.message); } finally { setBusy(''); }
  };
  const resolve = async (id: string) => { try { await api(`/api/v1/help/${id}/resolve`, { body: {} }); await load(); } catch (e) { setErr((e as ApiError).message); } };

  return (<div className="stuck stack gap-12">
    {gallery.length > 0 && <section aria-label="Common problems at this step" className="stack gap-8">
      <b className="small">① Common problems at this step</b>
      <span className="muted xs">Tap a problem to see what it looks like and how to fix it.</span>
      {gallery.map(e => <details key={e.id} className="err-row"><summary className="small">{e.title}</summary><ErrorCard e={e} os={os} highlight={!!hits?.some(h => h.id === e.id)} /></details>)}
    </section>}
    <section aria-label="Find a fix" className="stack gap-8">
      <b className="small">{gallery.length ? '②' : '①'} Paste what your terminal shows</b>
      <span className="muted xs">Copy the last lines of the error. Don’t paste passwords or API keys — we remove personal data and keys before anything is sent.</span>
      <textarea className="input" rows={4} value={text} onChange={e => { setText(e.target.value); setHits(null); }} placeholder="npm error code E404 …" aria-label="Error output" style={{ fontFamily: 'ui-monospace,SFMono-Regular,Menlo,Consolas,monospace', fontSize: 13 }} />
      <div className="row gap-8 wrap"><button className="btn btn-gold btn-sm" type="button" disabled={text.trim().length < 3} onClick={find}><Search size={14} />Find a fix</button></div>
      {hits && (hits.length
        ? <div className="stack gap-8" role="status"><p className="callout ok small" style={{ margin: 0 }}><CheckCircle2 size={16} aria-hidden="true" />We recognise this error. Try the fix below{hits.length > 1 ? 's in order' : ''}.</p>{hits.map(e => <ErrorCard key={e.id} e={e} os={os} highlight />)}</div>
        : <p className="callout info small" role="status" style={{ margin: 0 }}>We don’t recognise this error yet. Ask the AI coach or a mentor below — your step and computer details are included automatically.</p>)}
    </section>
    <section aria-label="Ask for help" className="stack gap-8">
      <b className="small">{gallery.length ? '③' : '②'} Still stuck?</b>
      <div className="row gap-8 wrap">
        <button className="btn btn-outline btn-sm" type="button" disabled={text.trim().length < 10 || !!busy} onClick={askAi}><Bot size={14} />{busy === 'ai' ? 'Asking…' : 'Ask the AI coach'}</button>
        <button className="btn btn-outline btn-sm" type="button" disabled={text.trim().length < 10 || !!busy} onClick={askMentor}><UserRound size={14} />{busy === 'mentor' ? 'Sending…' : 'Ask a mentor'}</button>
        {text.trim().length < 10 && <span className="muted xs">Paste your error above first (at least 10 characters).</span>}
      </div>
      {aiErr && <p className="callout warn small" role="status" style={{ margin: 0 }}>{aiErr}</p>}
      {ai && <div className="msg ai small" style={{ whiteSpace: 'pre-wrap' }} role="status"><b className="row gap-6" style={{ alignItems: 'center' }}><Bot size={14} aria-hidden="true" />AI coach</b>{ai}<p className="muted xs" style={{ margin: '6px 0 0' }}>AI can be wrong. Check each step worked before the next one.</p></div>}
      {err && <p className="field-err" role="alert">{err}</p>}
    </section>
    {reqs.length > 0 && <section aria-label="Your help requests for this step" className="stack gap-8">
      <b className="small row gap-6" style={{ alignItems: 'center' }}><LifeBuoy size={14} aria-hidden="true" />Your help requests for this step</b>
      {reqs.map(r => <article key={r.id} className="help-thread">
        <div className="row between wrap gap-8"><span className={`badge ${r.state === 'answered' ? 'badge-success' : r.state === 'resolved' ? 'badge-neutral' : 'badge-gold'}`}>{STATE_LABEL[r.state] || r.state}</span><span className="muted xs">{new Date(r.createdAt).toLocaleString('en-IN')}</span></div>
        <div className="guide-term output"><div className="term-bar"><span>You sent</span></div><pre>{r.errorText}</pre></div>
        {r.messages.map(m => <div key={m.id} className={`msg ${m.role === 'staff' ? 'ai' : 'me'} small`} style={{ whiteSpace: 'pre-wrap' }}><b>{m.author}</b><br />{m.body}</div>)}
        {r.state !== 'resolved' && <div className="row gap-8 wrap">
          <input className="input" style={{ flex: 1, minWidth: 180 }} value={reply[r.id] || ''} onChange={e => setReply(x => ({ ...x, [r.id]: e.target.value }))} placeholder="Add a reply or what you tried…" aria-label="Reply" maxLength={2000} />
          <button className="btn btn-soft btn-sm" type="button" disabled={!(reply[r.id] || '').trim() || !!busy} onClick={() => send(r.id)}><Send size={14} />Send</button>
          <button className="btn btn-text btn-sm" type="button" onClick={() => resolve(r.id)}>It’s fixed — mark resolved</button>
        </div>}
      </article>)}
    </section>}
  </div>);
}
