'use client';
import { TECHNIQUE, type TechniqueId } from '@/lib/domain/promptTechniques';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X } from 'lucide-react';
import { api, ApiError } from '@/lib/client/api';
import { REVIEW_QUESTIONS, scoreReview, PASS_MARK, type Answer, type ReviewAnswers, type CheckItem } from '@/lib/domain/proofScore';
import { ScoreRow } from '@/components/learn/ProofCheck';

type Item = { id: string; learner: string; agentName: string; os: string; attempts: number; versionOutput: string | null; promptBefore: string | null; promptAfter: string | null; resultSummary: string | null; screenshotId: string | null; steps: Record<string, { data: any }>; autoChecks: { items?: CheckItem[]; total?: number; gatesOk?: boolean; acknowledged?: string[] } & Record<string, unknown> | null };
const CHECK_LABEL: Record<string, string> = { versionMatches: 'Version output matches the agent', noSecretsFound: 'No secret keys found in text', promptStructured: 'Prompt is complete', screenshotImage: 'Screenshot is an image', screenshotScan: 'Virus scan' };

export function LabVerifier({ items, canDecide }: { items: Item[]; canDecide: boolean }) {
  const router = useRouter();
  const [note, setNote] = useState<Record<string, string>>({}); const [err, setErr] = useState<Record<string, string>>({}); const [busy, setBusy] = useState('');
  const [ans, setAns] = useState<Record<string, Partial<ReviewAnswers>>>({});
  const decide = async (id: string) => {
    setBusy(id); setErr(e => ({ ...e, [id]: '' }));
    try { await api(`/api/v1/agent-lab/${id}/verify`, { body: { answers: ans[id], note: note[id] || '' } }); router.refresh(); }
    catch (e) { setErr(x => ({ ...x, [id]: (e as ApiError).message })); } finally { setBusy(''); }
  };
  if (!items.length) return <div className="card empty"><h2 className="h3">Nothing to verify</h2><p className="text-2" style={{ marginTop: 6 }}>Agent Lab proofs appear here when learners submit them.</p></div>;
  return (<div className="stack gap-20">{items.map(it => (
    <article key={it.id} className="card card-pad stack gap-12" aria-labelledby={`l-${it.id}`}>
      <div className="row between wrap gap-8"><h2 className="h3" id={`l-${it.id}`}>{it.learner} · {it.agentName}</h2><span className="badge badge-neutral">{it.os} · attempt {it.attempts}</span></div>
      {it.autoChecks?.items ? <details open><summary className="small bold" style={{ cursor: 'pointer' }}>Automatic checks: {it.autoChecks.total}/60{it.autoChecks.acknowledged?.length ? ` · learner submitted anyway despite ${it.autoChecks.acknowledged.join(', ')}` : ''}</summary><div>{it.autoChecks.items.map(x => <ScoreRow key={x.id} x={x} />)}</div></details>
        : it.autoChecks && <ul className="checklist">{Object.entries(it.autoChecks).map(([k, v]) => { const ok = v === true || v === 'clean'; return <li key={k}>{ok ? <Check size={16} aria-hidden="true" /> : <X size={16} aria-hidden="true" style={{ color: 'var(--danger)' }} />}<span>{CHECK_LABEL[k] || k}: <b>{String(v)}</b></span></li>; })}</ul>}
      <p className="muted xs">Automatic checks score up to 60. You answer three questions about the screenshot (up to 40). The outcome is calculated: verified at {PASS_MARK}/100 with every must-pass check.</p>
      <div className="grid2" style={{ gap: 12 }}>
        <div className="stack gap-8"><b className="small">Version output</b>{it.steps.install?.data?.methodLabel && <span className="muted xs">Method: {it.steps.install.data.methodLabel}{it.steps.install.data.nodeVersion ? ` · node -v: ${it.steps.install.data.nodeVersion}` : ''}</span>}<pre className="card card-pad small" style={{ whiteSpace: 'pre-wrap' }}>{it.versionOutput}</pre>
          <b className="small">First prompt</b><pre className="card card-pad small" style={{ whiteSpace: 'pre-wrap' }}>{it.promptBefore}</pre>
          <b className="small">Built prompt · {TECHNIQUE[(it.steps.prompt?.data?.technique as TechniqueId) || 'single_shot']?.name || 'Single-shot'}{it.steps.prompt?.data?.spotted != null && ' · attack spotted ✓'}</b><pre className="card card-pad small" style={{ whiteSpace: 'pre-wrap' }}>{it.promptAfter}</pre></div>
        <div className="stack gap-8"><b className="small">Screenshot</b>{it.screenshotId ? <a href={`/api/v1/files/${it.screenshotId}?inline=1`} target="_blank" rel="noopener noreferrer"><img src={`/api/v1/files/${it.screenshotId}?inline=1`} alt={`Screenshot submitted by ${it.learner}`} style={{ maxWidth: '100%', borderRadius: 8, border: '1px solid var(--border)' }} /></a> : <p className="muted small">None</p>}
          <b className="small">What the agent produced</b><p className="text-2 small">{it.resultSummary}</p>
          <b className="small">How the learner checked it</b><p className="text-2 small">{it.steps.result?.data?.verified}</p></div>
      </div>
      {canDecide && (() => { const a = ans[it.id] || {}; const done = REVIEW_QUESTIONS.every(q => a[q.key]); const sc = done ? scoreReview(it.autoChecks?.total ?? 0, it.autoChecks?.gatesOk ?? false, a as ReviewAnswers) : null; return <><fieldset className="stack gap-10" style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 12 }}><legend className="small bold">Your review of the screenshot</legend>
        {REVIEW_QUESTIONS.map(q => <div key={q.key} className="stack gap-4"><span className="small"><b>{q.id}</b> {q.label} <span className="muted">({q.max} pts{q.key === 'noSensitiveData' ? ', must be Yes' : q.key === 'agentRunning' ? ', must not be No' : ''})</span></span>
          <span className="row gap-12" role="radiogroup" aria-label={q.label}>{(['yes', 'partly', 'no'] as Answer[]).map(v => <label key={v} className="row gap-6 small"><input type="radio" name={`${it.id}-${q.key}`} checked={a[q.key] === v} onChange={() => setAns(x => ({ ...x, [it.id]: { ...x[it.id], [q.key]: v } }))} />{v === 'yes' ? 'Yes' : v === 'partly' ? 'Partly' : 'No'}</label>)}</span></div>)}
        {sc && <p className={`callout ${sc.pass ? 'ok' : 'warn'} small`} style={{ margin: 0 }} role="status"><b>{sc.total}/100 → {sc.pass ? `Verified, +${sc.xp} XP` : 'Needs changes'}</b>{!sc.pass && <> · {sc.reasons.join(' ')}</>}</p>}
      </fieldset>
      <label className="stack gap-8"><span className="bold small">Note to the learner</span><textarea className="input" rows={2} value={note[it.id] || ''} onChange={e => setNote({ ...note, [it.id]: e.target.value })} placeholder="What you checked, and exactly what to fix if anything" /></label>
        {err[it.id] && <p className="field-err" role="alert">{err[it.id]}</p>}
        <div className="row gap-12"><button className="btn btn-gold" type="button" disabled={busy === it.id || !done} onClick={() => decide(it.id)}>{sc ? (sc.pass ? 'Submit review: Verify' : 'Submit review: Ask for changes') : 'Answer all three questions'}</button></div></>; })()}
    </article>))}</div>);
}
