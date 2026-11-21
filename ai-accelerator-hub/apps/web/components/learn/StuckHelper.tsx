'use client';
import { useState } from 'react';
import { api, ApiError } from '@/lib/client/api';
import { Tr } from '@/components/i18n/Tr';
import { useT } from '@/components/i18n/I18nProvider';
import { Tv } from '@/components/i18n/Tv';

type Result = { step: 'ask_tried' | 'hint' | 'escalate' | 'fallback'; reply: string; hints: string[] };

/** "Stuck? Get a hint": asks what you tried, then one hint at a time, then a mentor after three hints. */
export function StuckHelper({ code }: { code: string }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [tried, setTried] = useState('');
  const [hints, setHints] = useState<string[]>([]);
  const [res, setRes] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const ask = async () => {
    setBusy(true); setErr('');
    try {
      const r = await api<Result>(`/api/v1/levels/${code}/stuck`, { body: { question, tried, hints }, timeoutMs: 90_000 });
      setRes(r); setHints(r.hints);
    } catch (e) { setErr((e as ApiError).message); } finally { setBusy(false); }
  };

  if (!open) return <button type="button" className="btn btn-soft btn-sm" onClick={() => setOpen(true)}><Tr>Stuck? Get a hint</Tr></button>;
  return (
    <section className="card" aria-label={t('Stuck helper')} style={{ padding: 14, marginTop: 12 }}>
      <h3 className="h4" style={{ marginBottom: 6 }}><Tr>Stuck helper</Tr></h3>
      <p className="muted small" style={{ marginBottom: 10 }}><Tr>One hint at a time, never the full answer. After</Tr> {3} <Tr>hints, a mentor takes over. Do not type personal data.</Tr></p>
      <label className="field"><span><Tr>What are you stuck on?</Tr></span>
        <textarea className="input" rows={2} value={question} maxLength={1000} onChange={e => setQuestion(e.target.value)} /></label>
      <label className="field" style={{ marginTop: 8 }}><span><Tr>What have you tried?</Tr></span>
        <textarea className="input" rows={2} value={tried} maxLength={1000} onChange={e => setTried(e.target.value)} /></label>
      <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
        <button type="button" className="btn btn-primary btn-sm" disabled={busy || question.trim().length < 5} onClick={ask}>{hints.length ? <Tr>Next hint</Tr> : <Tr>Get a hint</Tr>}</button>
        <span className="muted small"><Tr>Hints used:</Tr> {hints.length} <Tr>of 3</Tr></span>
      </div>
      {err && <p className="callout danger small" role="alert" style={{ marginTop: 10 }}><Tv v={err} /></p>}
      {hints.length > 0 && <ol style={{ marginTop: 10, paddingLeft: 18 }}>{hints.map((h, i) => <li key={i} style={{ marginBottom: 4 }}><Tv v={h} /></li>)}</ol>}
      {res && res.step !== 'hint' && <p className={`callout ${res.step === 'fallback' ? 'warn' : 'info'} small`} role="status" style={{ marginTop: 10 }}><Tv v={res.reply} /></p>}
    </section>
  );
}
