'use client';
/**
 * Proof check before submitting, and the score breakdown after review (docs/AGENT_LAB_PROOF_SCORING_SPEC.md §5–§6).
 * Every item says what is wrong, why it matters and how to fix it; gate failures block, others need an acknowledgement.
 */
import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, CircleX, LifeBuoy, RotateCcw } from 'lucide-react';
import { api, ApiError } from '@/lib/client/api';
import type { CheckItem } from '@/lib/domain/proofScore';
import { Tr } from '@/components/i18n/Tr';
import { useT } from '@/components/i18n/I18nProvider';
import { Tv } from '@/components/i18n/Tv';

type Pre = { items: CheckItem[]; total: number; max: number; gatesOk: boolean; needsAck: boolean; missingSteps: string[]; passMark: number; reviewerMax: number };
type Step = 'prepare' | 'install' | 'connect' | 'prompt' | 'result';
const STEP_NAME: Record<string, string> = { install: 'Install', prompt: 'Simplify your prompt', result: 'Result & screenshot' };

export function ScoreRow({ x, onGoto }: { x: CheckItem; onGoto?: (s: Step) => void }) {
  const full = x.points >= x.max;
  return (<div className="proof-row">
    <span aria-hidden="true">{full ? <CheckCircle2 size={20} style={{ color: 'var(--success)' }} /> : x.gateFailed ? <CircleX size={20} style={{ color: 'var(--danger)' }} /> : <AlertTriangle size={20} style={{ color: 'var(--gold-ink)' }} />}</span>
    <div className="stack gap-4"><b className="small">{x.id} · <Tv v={x.label} />{x.gate && <span className="badge badge-neutral" style={{ marginLeft: 6 }}><Tr>Must pass</Tr></span>}</b>
      <span className="small text-2"><Tv v={x.detail} /></span>
      {!full && <><span className="small"><b><Tr>Why it matters:</Tr></b> <Tv v={x.why} /></span><span className="small"><b><Tr>How to fix:</Tr></b> <Tv v={x.fix} /></span>
        {onGoto && <span className="row gap-8 wrap"><button type="button" className="btn btn-soft btn-sm" onClick={() => onGoto(x.step)}><Tr>Go to</Tr> {STEP_NAME[x.step]}</button>{x.step === 'install' && <button type="button" className="btn btn-text btn-sm" onClick={() => onGoto('install')}><LifeBuoy size={14} /><Tr>Get help (open “Stuck on this step?”)</Tr></button>}</span>}</>}
    </div>
    <span className="pts small"><Tv v={x.points} />/{x.max}</span>
  </div>);
}

export function ProofCheck({ runId, refreshKey, onGoto, onSubmitted }: { runId: string; refreshKey: string; onGoto: (s: Step) => void; onSubmitted: (r: unknown) => void }) {
  const [pre, setPre] = useState<Pre | null>(null); const [ack, setAck] = useState(false); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const load = () => api<Pre>(`/api/v1/agent-lab/${runId}/precheck`).then(setPre).catch(e => setErr((e as ApiError).message));
  useEffect(() => { setAck(false); load(); }, [runId, refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!pre) return err ? <p className="field-err" role="alert"><Tv v={err} /></p> : <p className="muted small"><Tr>Checking your proof…</Tr></p>;
  const best = pre.total + pre.reviewerMax;
  const submit = async () => { setBusy(true); setErr(''); try { onSubmitted(await api(`/api/v1/agent-lab/${runId}/submit`, { body: { acknowledge: ack } })); } catch (e) { setErr((e as ApiError).message); } finally { setBusy(false); } };
  return (<section className="card card-pad stack gap-12" aria-labelledby="pcT" style={{ background: 'var(--surface-2)' }}>
    <div className="row between wrap gap-8"><h3 className="h3" id="pcT" style={{ margin: 0 }}><Tr>Proof check</Tr></h3><b className="small">{pre.total}/{pre.max} <Tr>automatic points · a reviewer adds up to</Tr> <Tv v={pre.reviewerMax} /></b></div>
    <div className="proof-meter" role="img" aria-label={`Automatic score ${pre.total} of ${pre.max}; pass mark ${pre.passMark} of 100`}><span style={{ width: `${pre.total}%` }} /><i style={{ left: `${pre.passMark}%` }} /></div>
    <p className="muted xs" style={{ margin: 0 }}><Tr>You need</Tr> <b><Tv v={pre.passMark} />/100</b> <Tr>and every “Must pass” check to be verified. XP = 40 × your score ÷ 100. Your best possible score now:</Tr> <b>{best}</b>.</p>
    <div>{pre.items.map(x => <ScoreRow key={x.id} x={x} onGoto={onGoto} />)}</div>
    {pre.missingSteps.length > 0 && <p className="callout info small" style={{ margin: 0 }}><Tr>Finish these steps first:</Tr> {pre.missingSteps.join(', ')}.</p>}
    {!pre.gatesOk && <p className="callout warn small" style={{ margin: 0 }}><CircleX size={16} aria-hidden="true" /><Tr>A “Must pass” check failed. Fix it and the check updates automatically — you can retry as many times as you need.</Tr></p>}
    {pre.gatesOk && best < pre.passMark && <p className="callout warn small" style={{ margin: 0 }}><AlertTriangle size={16} aria-hidden="true" /><Tr>Even with full reviewer points this would score</Tr> {best}<Tr>/100, below</Tr> <Tv v={pre.passMark} /><Tr>. Fixing the items above first will save you a round of review.</Tr></p>}
    {pre.gatesOk && pre.needsAck && !pre.missingSteps.length && <label className="row gap-8 small" style={{ alignItems: 'flex-start' }}><input type="checkbox" checked={ack} onChange={e => setAck(e.target.checked)} /><span><Tr>I understand the items above lower my score and may lead to “Needs changes”. I want to submit anyway.</Tr></span></label>}
    {err && <p className="field-err" role="alert"><Tv v={err} /></p>}
    <div className="row gap-8 wrap">
      <button className="btn btn-outline btn-sm" type="button" onClick={load}><RotateCcw size={14} /><Tr>Re-check</Tr></button>
      <button className="btn btn-gold" type="button" disabled={busy || !pre.gatesOk || pre.missingSteps.length > 0 || (pre.needsAck && !ack)} onClick={submit}>{pre.needsAck ? <Tr>Submit anyway</Tr> : <Tr>Submit for verification</Tr>}</button>
    </div>
  </section>);
}

type Review = { answers: Record<string, string>; items: { id: string; label: string; max: number; answer: string; points: number }[]; reasons: string[] };
export function ProofResult({ state, score, auto, review, note, xp }: { state: string; score: number | null; auto: { items?: CheckItem[] } | null; review: Review | null; note: string | null; xp: number }) {
  const t = useT();
  if (score === null || !review) return null;
  const ok = state === 'verified';
  return (<section className={`callout ${ok ? 'ok' : 'warn'}`} style={{ display: 'block' }} aria-label={t('Review result')}>
    <b>{ok ? `Verified · ${score}/100${xp ? ` · +${xp} XP` : ''}` : `Needs changes · ${score}/100`}</b>
    {!ok && review.reasons.length > 0 && <ul className="small" style={{ margin: '6px 0', paddingLeft: 18 }}>{review.reasons.map(r => <li key={r}><Tv v={r} /></li>)}</ul>}
    {note && <p className="small" style={{ margin: '6px 0' }}><b><Tr>Reviewer:</Tr></b> <Tv v={note} /></p>}
    <details><summary className="small" style={{ cursor: 'pointer' }}><Tr>See the full score</Tr></summary>
      <div style={{ marginTop: 6 }}>{(auto?.items || []).map(x => <ScoreRow key={x.id} x={x} />)}
        {review.items.map(x => <div key={x.id} className="proof-row"><span aria-hidden="true">{x.points >= x.max ? <CheckCircle2 size={20} style={{ color: 'var(--success)' }} /> : <AlertTriangle size={20} style={{ color: 'var(--gold-ink)' }} />}</span><span className="small"><b>{x.id} <Tr>· Reviewer:</Tr></b> <Tv v={x.label} /> — <b><Tv v={x.answer} /></b></span><span className="pts small"><Tv v={x.points} />/{x.max}</span></div>)}</div></details>
    {!ok && <p className="small" style={{ margin: '6px 0 0' }}><Tr>Fix the items above (the proof check below shows what is left), then submit again. There is no limit on attempts.</Tr></p>}
  </section>);
}
