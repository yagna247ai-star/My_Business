'use client';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { CheckCircle2, RefreshCw, Sparkles } from 'lucide-react';
import { api, ApiError } from '@/lib/client/api';

type Dim = { key: string; name: string; weight: number; l1?: string; l3?: string; l5?: string };
export function ReviewScorer({ id, dims, threshold, bossMin, checks, canDecide }: { id: string; dims: Dim[]; threshold: number; bossMin: number; checks: { key: string; suggestion: number; evidence: string }[]; canDecide: boolean }) {
  const router = useRouter();
  const [scores, setScores] = useState<Record<string, number>>({}); const [fb, setFb] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false); const [confirm, setConfirm] = useState<'' | 'approved' | 'needs_changes'>('');
  const complete = dims.every(d => scores[d.key]);
  const avg = useMemo(() => Math.round(dims.reduce((a, d) => a + (scores[d.key] || 0) * d.weight, 0) * 100) / 100, [scores, dims]);
  const pass = complete && avg >= threshold && (scores.boss ?? bossMin) >= bossMin;
  const sug = Object.fromEntries(checks.map(c => [c.key, c]));
  const decide = async (verdict: 'approved' | 'needs_changes') => {
    if (confirm !== verdict) { setConfirm(verdict); return; }
    setBusy(true); setErr('');
    try { await api(`/api/v1/reviews/${id}/decision`, { body: { verdict, scores, feedback: fb } }); router.push('/review'); router.refresh(); }
    catch (e) { setErr((e as ApiError).message); setConfirm(''); } finally { setBusy(false); }
  };
  return (<section className="card card-pad stack gap-16" aria-labelledby="sc">
    <div className="row between wrap gap-8"><h2 className="h3" id="sc">Score on the rubric</h2>{canDecide && <button className="btn btn-soft btn-sm" type="button" onClick={() => setScores(Object.fromEntries(checks.map(c => [c.key, c.suggestion])))}><Sparkles size={14} />Start from automated suggestions</button>}</div>
    <div className="rubric">{dims.map(d => (
      <div key={d.key} className="rdim"><div className="rdim-head"><b>{d.name} <span className="muted small">· {Math.round(d.weight * 100)}%</span></b>{sug[d.key] && <span className="ai-sugg" title={sug[d.key].evidence}>suggests {sug[d.key].suggestion}</span>}</div>
        {sug[d.key] && <p className="muted xs" style={{ marginTop: 4 }}>{sug[d.key].evidence}</p>}
        <div className="rdim-levels"><span>1 · {d.l1}</span><span>3 · {d.l3}</span><span>5 · {d.l5}</span></div>
        <div className="score-row" role="radiogroup" aria-label={`${d.name} score`}>{[1, 2, 3, 4, 5].map(v => <button key={v} type="button" role="radio" aria-checked={scores[d.key] === v} disabled={!canDecide} onClick={() => { setScores({ ...scores, [d.key]: v }); setConfirm(''); }}>{v}</button>)}</div>
      </div>))}
    </div>
    <div className={`verdict ${complete ? (pass ? 'pass' : 'fail') : ''}`} aria-live="polite"><span className="big">{complete ? avg.toFixed(2) : '—'}</span><div><b>{!complete ? 'Score every area' : pass ? 'Meets the bar' : 'Below the bar'}</b><p className="small text-2">Pass rule: weighted average ≥ {threshold.toFixed(1)} and Boss ≥ {bossMin}.</p></div></div>
    {canDecide && <>
      <div><label className="field-label" htmlFor="fb">Feedback to the learner</label><textarea className="textarea" id="fb" rows={4} value={fb} onChange={e => setFb(e.target.value)} placeholder="What is strong, and the one change that would raise the score." /><div className="field-hint">Required when requesting changes (20+ characters). Shown to the learner word for word.</div></div>
      {err && <p className="field-err" role="alert">{err}</p>}
      <div className="row gap-12 wrap">
        <button className="btn btn-gold" type="button" disabled={!pass || busy} onClick={() => decide('approved')}><CheckCircle2 size={15} />{confirm === 'approved' ? 'Confirm approval' : 'Approve'}</button>
        <button className="btn btn-outline" type="button" disabled={!complete || busy} onClick={() => decide('needs_changes')}><RefreshCw size={15} />{confirm === 'needs_changes' ? 'Confirm: request changes' : 'Request changes'}</button>
      </div>
      <p className="muted xs">Decisions are recorded in the audit log and the learner is notified. Approval awards XP through the ledger and unlocks the next level.</p>
    </>}
  </section>);
}
