'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowRight, Check, CheckCircle2, Clock, ExternalLink, LifeBuoy, RefreshCw, Target, Upload, Play } from 'lucide-react';
import { api, ApiError } from '@/lib/client/api';
import { FlowerBurst, GapList } from '@/components/learn/ReviewCelebration';
import { StuckHelper } from '@/components/learn/StuckHelper';
import { parseGaps } from '@/lib/domain/gaps';

type Act = { id: string; idx: number; code: string; title: string; xp: number; state: string; config: any; data: any; authored: boolean };
type Review = { id: string; verdict: string; avg: number | null; feedback: string | null; by: string; at: string; scores: Record<string, number>; appeal: string | null };
type Props = { code: string; idx?: number; isLast?: boolean; title: string; summary: string; xpTotal: number; xpEarned: number; levelState: string; activities: Act[]; latest: { id: string; state: string; submittedAt: string; url: string | null; reviews: Review[] } | null; boss: { attempts: number; max: number; result: any }; rubric: { code: string; threshold: number; bossMin: number; dims: { key: string; name: string; weight: number; l3?: string; l5?: string }[] } | null; initial?: number };

const LABEL: Record<string, string> = { completed: 'Done', available: 'Open', locked: 'Locked', in_review: 'In review', needs_changes: 'Changes requested' };
const wc = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

export function LevelWorkspace(p: Props) {
  const router = useRouter();
  const firstOpen = p.activities.find(a => ['available', 'needs_changes', 'in_review'].includes(a.state))?.idx || 1;
  const [cur, setCur] = useState(p.initial && p.activities.find(a => a.idx === p.initial && a.state !== 'locked') ? p.initial : firstOpen);
  const [flash, setFlash] = useState('');
  const done = p.activities.filter(a => a.state === 'completed').length;
  const act = p.activities.find(a => a.idx === cur)!;
  const after = (msg: string, goNext = true) => { setFlash(msg); router.refresh(); if (goNext && cur < 6) setTimeout(() => setCur(c => Math.min(6, c + 1)), 50); };
  return (
    <section className="card card-pad" aria-labelledby="pageTitle">
      <div className="lv-head">
        <div className="ring" style={{ ['--p' as string]: Math.round((done / 6) * 100) }} role="img" aria-label={`${done} of 6 activities complete`}><span>{done}/6<small>DONE</small></span></div>
        <div style={{ minWidth: 0 }}><div className="section-label">{p.code}</div><h1 className="h2" id="pageTitle" style={{ fontSize: 26 }}>{/^Level \d+\s+—/.test(p.title) ? p.title : `Level ${p.idx ?? 1} — ${p.title}`}</h1><p className="text-2 small" style={{ marginTop: 4 }}>{p.summary}</p></div>
        <div className="row gap-8 wrap lv-head-meta"><span className="badge badge-gold">{p.xpEarned} / {p.xpTotal} XP</span>{p.levelState === 'approved' && <span className="badge badge-success">Approved</span>}</div>
      </div>
      {p.levelState === 'approved' && <div style={{ margin: '12px 0' }}><FlowerBurst title={p.title} xp={p.xpEarned} last={p.isLast} /></div>}
      {p.levelState !== 'approved' && <div style={{ margin: '8px 0 12px' }}><StuckHelper code={p.code} /></div>}
      <ol className="stepper" aria-label="Activities">
        {p.activities.map(a => (
          <li key={a.idx} className={`step ${a.state}`} aria-current={a.idx === cur ? 'step' : undefined}>
            <button type="button" disabled={a.state === 'locked'} onClick={() => { setCur(a.idx); setFlash(''); }} aria-label={`Activity ${a.idx}: ${a.title}, ${LABEL[a.state] || a.state}`}>
              <span className="sn"><i>{a.state === 'completed' ? '✓' : a.idx}</i>{LABEL[a.state] || a.state}</span><span className="st">{a.title.split(':')[0]}</span>
            </button>
          </li>
        ))}
      </ol>
      {flash && <div className="callout ok" role="status" style={{ marginBottom: 14 }}><CheckCircle2 size={18} /><span>{flash}</span></div>}
      <div className="panel-grid">
        <div key={cur}>
          <div className="row between wrap gap-8" style={{ marginBottom: 14 }}>
            <div><div className="section-label">Activity {act.idx}</div><h2 className="h2">{act.title}</h2></div>
            <span className="badge badge-gold">+{act.xp} XP</span>
          </div>
          {act.config.personalisedFor && act.state !== 'locked' && <p className="callout info small" style={{ marginBottom: 14 }}>Personalised for your path: the situation, examples and hints match your profile. The pass rules are the same for everyone. <Link className="link" href="/onboarding">Change my path</Link></p>}
          {act.state === 'locked' ? <p className="text-2">Finish the previous activity first.</p>
            : act.config.kind === 'briefing' ? <Briefing a={act} code={p.code} onDone={after} />
            : act.config.kind === 'learn' ? <Learn a={act} code={p.code} onDone={after} />
            : act.config.kind === 'explore' ? <Explore a={act} code={p.code} onDone={after} />
            : act.config.kind === 'build' ? <Build a={act} code={p.code} onDone={after} />
            : act.config.kind === 'proof' ? <Proof a={act} code={p.code} latest={p.latest} onDone={after} />
            : act.config.kind === 'boss' ? <Boss a={act} code={p.code} latest={p.latest} boss={p.boss} rubric={p.rubric} onDone={m => after(m, false)} />
            : <p className="text-2">This activity has not been published yet.</p>}
        </div>
        <aside className="card aside-card" aria-label="Level facts">
          <h2 className="section-label" style={{ marginBottom: 6 }}>Level facts</h2>
          <div className="kv"><span>XP earned</span><span>{p.xpEarned} of {p.xpTotal}</span></div>
          <div className="kv"><span>Proof attempts</span><span>{p.latest ? p.latest.reviews.length + (p.latest.state === 'pending' ? 1 : 0) || 1 : 0}</span></div>
          <div className="kv"><span>Boss attempts</span><span>{p.boss.attempts} of {p.boss.max}</span></div>
          {p.rubric && <div className="kv"><span>Pass rule</span><span>Avg ≥ {p.rubric.threshold.toFixed(1)} and Boss ≥ {p.rubric.bossMin}</span></div>}
          <Link className="btn btn-soft btn-sm btn-block" style={{ marginTop: 14 }} href={`/coach?level=${p.code}&a=${cur}`}><LifeBuoy size={15} />Ask about this step</Link>
        </aside>
      </div>
    </section>
  );
}

type PanelProps = { a: Act; code: string; onDone: (msg: string) => void };
async function post(path: string, body: unknown) { return api<any>(path, { body }); }
function useBusy() { const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [fe, setFe] = useState<Record<string, string>>({}); return { busy, err, fe, run: async (fn: () => Promise<void>) => { setBusy(true); setErr(''); setFe({}); try { await fn(); } catch (e) { const a = e as ApiError; setErr(a.message); if (a.details) setFe(a.details); } finally { setBusy(false); } } }; }

function Briefing({ a, code, onDone }: PanelProps) {
  const c = a.config; const [choice, setChoice] = useState<number | null>(a.data?.choice ?? null); const [res, setRes] = useState<{ correct: boolean; why: string } | null>(null); const b = useBusy();
  return (<div className="stack gap-16">
    <p style={{ fontSize: 16 }}>{c.problem}</p>
    <div className="kv"><span>Objective</span><span style={{ fontWeight: 500, textAlign: 'left', maxWidth: '60ch' }}>{c.objective}</span></div>
    <div className="kv"><span>Expected outcome</span><span style={{ fontWeight: 500, textAlign: 'left', maxWidth: '60ch' }}>{c.outcome}</span></div>
    <div><h3 className="h3" style={{ marginBottom: 8 }}>You will be evaluated on</h3><ul className="checklist">{c.criteria.map((x: string) => <li key={x}><Target size={16} aria-hidden="true" /><span>{x}</span></li>)}</ul></div>
    <fieldset className="q" style={{ border: 0 }}><legend>{c.check.q}</legend>
      {c.check.options.map((o: string, i: number) => <label key={i} className={`opt ${res && choice === i ? (res.correct ? 'correct' : 'wrong') : ''}`}><input type="radio" name="brief" checked={choice === i} onChange={() => { setChoice(i); setRes(null); }} />{o}</label>)}
      {res && <p className={`q-feedback ${res.correct ? 'ok' : 'no'}`}>{res.correct ? 'Exactly. ' : 'Good try — here is the idea: '}{res.why}</p>}
    </fieldset>
    {b.err && <p className="field-err" role="alert">{b.err}</p>}
    <div><button className="btn btn-gold" type="button" disabled={choice === null || b.busy} onClick={() => b.run(async () => { const r = await post(`/api/v1/levels/${code}/activities/1`, { choice }); setRes(r); if (r.first) onDone(`Mission briefing complete${r.xp ? ` · +${r.xp} XP` : ''}.`); })}>{a.state === 'completed' ? 'Check answer' : 'Mark briefing complete'}</button></div>
  </div>);
}

function Learn({ a, code, onDone }: PanelProps) {
  const c = a.config; const [ans, setAns] = useState<(number | null)[]>(c.quiz.map(() => null)); const [res, setRes] = useState<{ passed: boolean; score: number; wrong: number[] } | null>(null); const b = useBusy();
  return (<div className="stack gap-16">
    <div className="grid2" style={{ gap: 14 }}>{c.lessons.map((l: any, i: number) => <details key={i} className="card card-pad" open={i === 0}><summary className="bold" style={{ cursor: 'pointer' }}>{l.title} <span className="muted xs">· {l.minutes} min read</span></summary><p className="text-2" style={{ marginTop: 10 }}>{l.body}</p></details>)}</div>
    {c.demo && <div className="card card-pad"><h3 className="h3" style={{ marginBottom: 8 }}>{c.demo.title}</h3><ol className="text-2" style={{ paddingLeft: 20, display: 'grid', gap: 6 }}>{c.demo.steps.map((x: string) => <li key={x}>{x}</li>)}</ol></div>}
    {c.resources?.length > 0 && <div><h3 className="h3" style={{ marginBottom: 8 }}>Go deeper (verified open resources)</h3><ul className="checklist">{c.resources.map((r: any) => <li key={r.url}><ExternalLink size={16} aria-hidden="true" /><span><a className="link" href={r.url} target="_blank" rel="noopener noreferrer">{r.title}</a><span className="muted xs" style={{ display: 'block' }}>{r.description} · {r.difficulty} · Licence {r.license} · last verified {r.lastVerified}</span></span></li>)}</ul></div>}
    <h3 className="h3">Check your understanding · pass at {c.passPct}%</h3>
    {c.quiz.map((q: any, qi: number) => <fieldset key={qi} className="q" style={{ border: 0 }}><legend>{qi + 1}. {q.q}</legend>{q.options.map((o: string, i: number) => <label key={i} className={`opt ${res && ans[qi] === i ? (res.wrong.includes(qi) ? 'wrong' : 'correct') : ''}`}><input type="radio" name={`q${qi}`} checked={ans[qi] === i} onChange={() => { const n = [...ans]; n[qi] = i; setAns(n); setRes(null); }} />{o}</label>)}</fieldset>)}
    {res && !res.passed && <p className="q-feedback no" role="status">{res.score}% — you need {c.passPct}%. The highlighted answers need another look.</p>}
    {b.err && <p className="field-err" role="alert">{b.err}</p>}
    <div><button className="btn btn-gold" type="button" disabled={ans.some(x => x === null) || b.busy} onClick={() => b.run(async () => { const r = await post(`/api/v1/levels/${code}/activities/2`, { answers: ans }); setRes(r); if (r.passed) onDone(`Quiz passed with ${r.score}%${r.xp ? ` · +${r.xp} XP` : ''}.`); })}>Submit answers</button></div>
  </div>);
}

function Explore({ a, code, onDone }: PanelProps) {
  const c = a.config; const [ans, setAns] = useState<(number | null)[]>(c.questions.map(() => null)); const [att, setAtt] = useState(false); const [res, setRes] = useState<{ passed: boolean; wrong: number[] } | null>(null); const b = useBusy();
  return (<div className="stack gap-16">
    <div className="card card-pad"><div className="row between wrap gap-8"><div><b>{c.repo.fullName}</b><p className="muted small">{c.repo.description}</p></div><a className="btn btn-outline btn-sm" href={c.repo.url} target="_blank" rel="noopener noreferrer">Open on GitHub <ExternalLink size={14} /></a></div>
      <div className="row gap-8 wrap" style={{ marginTop: 10 }}><span className="badge badge-neutral">{c.repo.difficulty}</span><span className="badge badge-success">Licence {c.repo.license}</span><span className="badge badge-neutral">Verified {c.repo.lastVerified}</span></div></div>
    <div><h3 className="h3" style={{ marginBottom: 8 }}>How the repository is organised</h3><ul className="checklist">{c.architecture.map((x: string) => <li key={x}><Check size={16} aria-hidden="true" /><span>{x}</span></li>)}</ul></div>
    <p className="text-2">{c.task}</p>
    {c.questions.map((q: any, qi: number) => <fieldset key={qi} className="q" style={{ border: 0 }}><legend>{q.q}</legend>{q.options.map((o: string, i: number) => <label key={i} className={`opt ${res && ans[qi] === i ? (res.wrong.includes(qi) ? 'wrong' : 'correct') : ''}`}><input type="radio" name={`e${qi}`} checked={ans[qi] === i} onChange={() => { const n = [...ans]; n[qi] = i; setAns(n); setRes(null); }} />{o}</label>)}</fieldset>)}
    <label className="row gap-12 small"><input type="checkbox" checked={att} onChange={e => setAtt(e.target.checked)} />I opened the repository and read the Lesson 01 README.</label>
    {res && !res.passed && <p className="q-feedback no">Not yet — re-read Lesson 01 and try again. You need {c.passMin} of {c.questions.length}.</p>}
    {b.err && <p className="field-err" role="alert">{b.err}</p>}
    <div><button className="btn btn-gold" type="button" disabled={ans.some(x => x === null) || !att || b.busy} onClick={() => b.run(async () => { const r = await post(`/api/v1/levels/${code}/activities/3`, { attested: att, answers: ans }); setRes(r); if (r.passed) onDone(`Explore complete${r.xp ? ` · +${r.xp} XP` : ''}.`); })}>Check answers</button></div>
  </div>);
}

function Build({ a, code, onDone }: PanelProps) {
  const c = a.config; const saved = a.data?.brief;
  const [tool, setTool] = useState<string>(saved?.tool || ''); const [fields, setFields] = useState<Record<string, string>>(saved?.fields || {}); const [its, setIts] = useState<{ prompt: string; output: string; change: string }[]>(saved?.iterations || Array.from({ length: c.iterations }, () => ({ prompt: '', output: '', change: '' })));
  const b = useBusy();
  const setIt = (i: number, k: 'prompt' | 'output' | 'change', v: string) => setIts(x => x.map((it, j) => (j === i ? { ...it, [k]: v } : it)));
  const r = c.iterationRules;
  return (<div className="stack gap-16">
    <p className="text-2">Pick a real problem you have seen (not the tiffin example). Test one AI tool on it, three times, improving your prompt each time. Write honestly about what went wrong — reviewers reward that.</p>
    {b.fe.pii && <p className="callout warn" role="alert">{b.fe.pii}</p>}
    <div><label className="field-label" htmlFor="tool">AI tool you used</label><select className="select" id="tool" value={tool} onChange={e => setTool(e.target.value)} aria-invalid={!!b.fe.tool}><option value="">Choose…</option>{c.tools.map((t: string) => <option key={t}>{t}</option>)}</select>{b.fe.tool && <div className="field-err">{b.fe.tool}</div>}</div>
    {c.fields.map((f: any) => <div key={f.key}><label className="field-label" htmlFor={f.key}>{f.label}</label><textarea className="textarea" id={f.key} rows={3} value={fields[f.key] || ''} onChange={e => setFields({ ...fields, [f.key]: e.target.value })} aria-invalid={!!b.fe[f.key]} aria-describedby={`${f.key}-h`} /><div className={b.fe[f.key] ? 'field-err' : 'field-hint'} id={`${f.key}-h`}>{b.fe[f.key] || `${f.hint} · ${wc(fields[f.key] || '')}/${f.minWords} words`}</div></div>)}
    {its.map((it, i) => (
      <fieldset key={i} className="card card-pad stack gap-12" style={{ border: '1px solid var(--border)' }}><legend className="bold" style={{ padding: '0 6px' }}>Prompt iteration {i + 1}</legend>
        <div><label className="field-label" htmlFor={`p${i}`}>Your prompt</label><textarea className="textarea" id={`p${i}`} rows={2} value={it.prompt} onChange={e => setIt(i, 'prompt', e.target.value)} aria-invalid={!!b.fe[`it${i}.prompt`]} />{b.fe[`it${i}.prompt`] ? <div className="field-err">{b.fe[`it${i}.prompt`]}</div> : <div className="field-hint">{wc(it.prompt)}/{r.promptMinWords} words</div>}</div>
        <div><label className="field-label" htmlFor={`o${i}`}>What the AI returned (summarise)</label><textarea className="textarea" id={`o${i}`} rows={2} value={it.output} onChange={e => setIt(i, 'output', e.target.value)} aria-invalid={!!b.fe[`it${i}.output`]} />{b.fe[`it${i}.output`] ? <div className="field-err">{b.fe[`it${i}.output`]}</div> : <div className="field-hint">{wc(it.output)}/{r.outputMinWords} words</div>}</div>
        {i > 0 && <div><label className="field-label" htmlFor={`c${i}`}>What you changed, and why</label><textarea className="textarea" id={`c${i}`} rows={2} value={it.change} onChange={e => setIt(i, 'change', e.target.value)} aria-invalid={!!b.fe[`it${i}.change`]} />{b.fe[`it${i}.change`] ? <div className="field-err">{b.fe[`it${i}.change`]}</div> : <div className="field-hint">{wc(it.change)}/{r.changeMinWords} words</div>}</div>}
      </fieldset>
    ))}
    {b.err && !Object.keys(b.fe).length && <p className="field-err" role="alert">{b.err}</p>}
    <div className="row gap-12 wrap"><button className="btn btn-gold" type="button" disabled={b.busy} onClick={() => b.run(async () => { const res = await post(`/api/v1/levels/${code}/activities/4`, { tool, fields, iterations: its }); onDone(res.first ? `Brief saved · +${res.xp} XP. Next: share it as proof.` : 'Brief updated.'); })}>{a.state === 'completed' ? 'Save changes' : 'Save my brief'}</button><span className="muted xs">Checked on the server for completeness, iteration quality and personal data. Quality is judged by your reviewer.</span></div>
  </div>);
}

function Proof({ a, code, latest, onDone }: PanelProps & { latest: Props['latest'] }) {
  const c = a.config; const [url, setUrl] = useState(''); const [demo, setDemo] = useState(''); const [refl, setRefl] = useState(''); const [checks, setChecks] = useState<boolean[]>(c.checklist.map(() => false)); const b = useBusy();
  const fb = latest?.state === 'needs_changes' ? latest.reviews[0] : null;
  if (latest && (latest.state === 'pending' || latest.state === 'approved')) return <div className="callout ok"><CheckCircle2 size={18} /><div><b>Proof submitted {new Date(latest.submittedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</b>{latest.url && <a className="link" href={latest.url} target="_blank" rel="noopener noreferrer">{latest.url}</a>}</div></div>;
  return (<div className="stack gap-16">
    {fb && (parseGaps(fb.feedback).length > 0
      ? <GapList gaps={parseGaps(fb.feedback)} avg={fb.avg} />
      : <div className="callout warn"><RefreshCw size={18} /><div><b>Changes requested by {fb.by} · {fb.avg?.toFixed(2)} / 5</b>“{fb.feedback}” — improve your brief or reflection and resubmit. You keep all XP.</div></div>)}
    <div><label className="field-label" htmlFor="ev">Link to your brief (required)</label><input className="input" id="ev" type="url" placeholder="https://docs.google.com/…" value={url} onChange={e => setUrl(e.target.value)} aria-invalid={!!b.fe.evidenceUrl} />{b.fe.evidenceUrl ? <div className="field-err">{b.fe.evidenceUrl}</div> : <div className="field-hint">Accepted: {c.evidenceTypes.join(' · ')}. Make sure reviewers can view it.</div>}</div>
    <div><label className="field-label" htmlFor="demo">Demo link (optional)</label><input className="input" id="demo" type="url" value={demo} onChange={e => setDemo(e.target.value)} aria-invalid={!!b.fe.demoUrl} />{b.fe.demoUrl && <div className="field-err">{b.fe.demoUrl}</div>}</div>
    <div><label className="field-label" htmlFor="refl">Reflection (at least {c.minWords} words)</label><textarea className="textarea" id="refl" rows={6} value={refl} onChange={e => setRefl(e.target.value)} placeholder="What surprised you about the AI's answers? What did you get wrong at first, and what changed your mind?" aria-invalid={!!b.fe.reflection} />{b.fe.reflection ? <div className="field-err">{b.fe.reflection}</div> : <div className="field-hint"><span className={`wc ${wc(refl) >= c.minWords ? 'ok' : ''}`}>{wc(refl)} / {c.minWords} words</span></div>}</div>
    <fieldset style={{ border: 0, padding: 0, margin: 0 }}><legend className="field-label">Before you submit</legend><ul className="checklist">{c.checklist.map((x: string, i: number) => <li key={i}><label><input type="checkbox" checked={checks[i]} onChange={e => setChecks(cs => cs.map((v, j) => (j === i ? e.target.checked : v)))} /><span>{x}</span></label></li>)}</ul>{b.fe.checklist && <div className="field-err">{b.fe.checklist}</div>}</fieldset>
    {b.err && !Object.keys(b.fe).length && <p className="field-err" role="alert">{b.err}</p>}
    <div className="row gap-12 wrap"><button className="btn btn-gold" type="button" disabled={b.busy} onClick={() => b.run(async () => { const r = await post(`/api/v1/levels/${code}/proof`, { evidenceUrl: url, demoUrl: demo, reflection: refl, checklist: checks }); onDone(`Proof submitted (attempt ${r.attempt})${r.xp ? ` · +${r.xp} XP` : ''}. A reviewer will score it on the rubric.`); })}><Upload size={15} />Submit for review</button><span className="muted small">Checked at once against the published rubric. Every decision is logged, and you can appeal to a mentor.</span></div>
  </div>);
}

function Boss({ a, code, latest, boss, rubric, onDone }: { a: Act; code: string; latest: Props['latest']; boss: Props['boss']; rubric: Props['rubric']; onDone: (m: string) => void }) {
  const c = a.config; const [ans, setAns] = useState<{ choice: number | null; why: string }[]>(c.scenarios.map(() => ({ choice: null, why: '' }))); const [res, setRes] = useState<any>(null); const b = useBusy();
  const [appeal, setAppeal] = useState(''); const ab = useBusy();
  const decided = latest?.reviews[0];
  const left = boss.max - boss.attempts;
  return (<div className="stack gap-16">
    <section className="card card-pad"><h3 className="h3" style={{ marginBottom: 10 }}>Review status</h3>
      <ol className="vtl">
        <li className={latest ? 'done' : ''}><span className="dot">{latest ? <Check size={14} /> : null}</span><div><b>Proof submitted</b><p className="muted small">{latest ? new Date(latest.submittedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST' : 'Submit in activity 5 first.'}</p></div></li>
        <li className={latest?.state === 'pending' ? 'now' : latest?.state === 'needs_changes' ? 'warn' : latest?.state === 'approved' ? 'done' : ''}><span className="dot">{latest?.state === 'pending' ? <Clock size={14} /> : latest?.state === 'approved' ? <Check size={14} /> : null}</span><div><b>{latest?.state === 'pending' ? 'Waiting for the boss — reviewed automatically when it is done' : latest?.state === 'needs_changes' ? 'Changes requested' : latest?.state === 'approved' ? 'Approved' : 'Automatic review'}</b><p className="muted small">{decided ? `${decided.by} · ${decided.avg?.toFixed(2)} / 5` : 'Scored on the published rubric.'}</p></div></li>
        <li className={a.state === 'completed' ? 'done' : ''}><span className="dot">{a.state === 'completed' ? <Check size={14} /> : null}</span><div><b>Level complete</b><p className="muted small">Unlocks the next level.</p></div></li>
      </ol>
    </section>
    {decided && rubric && <section className="card card-pad"><h3 className="h3">Rubric scores</h3><div className="table-wrap" style={{ marginTop: 8 }}><table className="tbl"><thead><tr><th>Area</th><th>Weight</th><th style={{ textAlign: 'right' }}>Score</th></tr></thead><tbody>{rubric.dims.map(d => <tr key={d.key}><td>{d.name}</td><td>{Math.round(d.weight * 100)}%</td><td style={{ textAlign: 'right' }} className="bold">{decided.scores[d.key] ?? '—'}</td></tr>)}</tbody></table></div>{decided.feedback && <p className="text-2" style={{ marginTop: 10 }}>“{decided.feedback}”</p>}
      {decided.appeal ? <p className="muted small" style={{ marginTop: 10 }}>Appeal status: {decided.appeal}</p> : <details style={{ marginTop: 12 }}><summary className="link" style={{ cursor: 'pointer' }}>Disagree? Request a second human review</summary><div className="stack gap-8" style={{ marginTop: 8 }}><textarea className="textarea" rows={3} value={appeal} onChange={e => setAppeal(e.target.value)} aria-label="Appeal reason" placeholder="Explain which score you think is wrong and point to the evidence." />{ab.err && <p className="field-err">{ab.err}</p>}<div><button className="btn btn-outline btn-sm" type="button" disabled={ab.busy} onClick={() => ab.run(async () => { await api('/api/v1/appeals', { body: { reviewId: decided.id, note: appeal } }); onDone('Appeal sent. A different staff member will review it.'); })}>Send appeal</button></div></div></details>}
    </section>}
    {latest && latest.state !== 'approved' && <>
      <h3 className="h3">Boss: The Right Tool Trial</h3><p className="text-2">{c.intro}</p>
      <div className="row gap-8 wrap"><span className="badge badge-neutral">{boss.attempts} of {boss.max} attempts used</span>{boss.result && <span className={`badge ${boss.result.best === boss.result.total ? 'badge-success' : 'badge-neutral'}`}>Best {boss.result.best}/{boss.result.total}</span>}</div>
      {c.scenarios.map((s: any, i: number) => (
        <fieldset key={i} className="q" style={{ border: 0 }}><legend>{i + 1}. {s.s}</legend>
          <div className="row gap-8 wrap" role="radiogroup" aria-label="Best tool">{c.choices.map((ch: string, ci: number) => <label key={ci} className={`opt ${res ? (res.results[i].pass ? 'correct' : ans[i].choice === ci ? 'wrong' : '') : ''}`} style={{ marginTop: 0 }}><input type="radio" name={`b${i}`} checked={ans[i].choice === ci} onChange={() => setAns(x => x.map((v, j) => (j === i ? { ...v, choice: ci } : v)))} />{ch}</label>)}</div>
          <input className="input" style={{ marginTop: 8 }} placeholder={`Why? (at least ${c.minWhyWords} words)`} value={ans[i].why} onChange={e => setAns(x => x.map((v, j) => (j === i ? { ...v, why: e.target.value } : v)))} aria-label={`Reason for scenario ${i + 1}`} />
          {res && <p className={`q-feedback ${res.results[i].pass ? 'ok' : 'no'}`}>{res.results[i].reason}</p>}
        </fieldset>
      ))}
      {b.err && <p className="field-err" role="alert">{b.err}</p>}
      <div className="row gap-12 wrap"><button className="btn btn-ink" type="button" disabled={left <= 0 || b.busy || ans.some(x => x.choice === null)} onClick={() => b.run(async () => { const r = await post(`/api/v1/levels/${code}/boss`, { answers: ans }); setRes(r); onDone(`Boss attempt scored ${r.passed}/${r.total}. Best so far: ${r.best}/${r.total}.`); })}><Play size={15} />Run the trial</button><span className="muted xs">{left > 0 ? `${left} attempt${left === 1 ? '' : 's'} left. Your best result goes to your reviewer.` : 'No attempts left — your best result is with your reviewer.'}</span></div>
    </>}
    {a.state === 'completed' && <Link className="btn btn-gold" href="/levels">Continue your journey <ArrowRight size={15} /></Link>}
  </div>);
}
