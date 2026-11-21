'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowRight, Check, CheckCircle2, Clock, ExternalLink, LifeBuoy, RefreshCw, Target, Upload, Play, SkipForward } from 'lucide-react';
import { api, ApiError } from '@/lib/client/api';
import { FlowerBurst, GapList } from '@/components/learn/ReviewCelebration';
import { StuckHelper } from '@/components/learn/StuckHelper';
import { DatasetCheckPanel, ScreenshotPanel } from '@/components/learn/EvidencePanels';
import { parseGaps } from '@/lib/domain/gaps';
import { useT } from '@/components/i18n/I18nProvider';
import { moveOnText } from '@/lib/domain/levelFlowRules';
import { Tr } from '@/components/i18n/Tr';
import { Tv } from '@/components/i18n/Tv';

export type Act = { id: string; idx: number; code: string; title: string; xp: number; state: string; config: any; data: any; authored: boolean };
export type Review = { id: string; verdict: string; avg: number | null; feedback: string | null; by: string; at: string; scores: Record<string, number>; appeal: string | null };
export type Props = { code: string; idx?: number; isLast?: boolean; title: string; summary: string; xpTotal: number; xpEarned: number; levelState: string; activities: Act[]; latest: { id: string; state: string; submittedAt: string; url: string | null; reviews: Review[] } | null; boss: { attempts: number; max: number; result: any }; rubric: { code: string; threshold: number; bossMin: number; dims: { key: string; name: string; weight: number; l3?: string; l5?: string }[] } | null; initial?: number;
  days?: { day: number; title: string; state: string; xp: number }[]; completion?: { complete: boolean; earned: number; total: number; next: { code: string; title: string } | null; message: string | null } };

const LABEL: Record<string, string> = { completed: 'Done', skipped: 'Skipped', available: 'Open', locked: 'Locked', in_review: 'In review', needs_changes: 'Changes requested' };

export function LevelWorkspace(p: Props) {
  const router = useRouter(); const t = useT();
  const firstOpen = p.activities.find(a => ['available', 'needs_changes', 'in_review'].includes(a.state))?.idx || 1;
  const [cur, setCur] = useState(p.initial && p.activities.find(a => a.idx === p.initial && a.state !== 'locked') ? p.initial : firstOpen);
  const [flash, setFlash] = useState('');
  const done = p.activities.filter(a => a.state === 'completed' || a.state === 'skipped').length;
  const act = p.activities.find(a => a.idx === cur)!;
  const after = (msg: string, goNext = true) => { setFlash(msg); router.refresh(); if (goNext && cur < 6) setTimeout(() => setCur(c => Math.min(6, c + 1)), 50); };
  const [skipping, setSkipping] = useState(false);
  const skip = async () => {
    setSkipping(true);
    try { const r = await api<{ advanced?: { earned: number; total: number; nextTitle: string | null } | null }>(`/api/v1/levels/${p.code}/skip`, { body: { idx: cur } }); after(`${t('Skipped for now: no points for this activity yet. You can come back and finish it any time.')}${r.advanced ? ' ' + moveOnText(t, r.advanced.earned, r.advanced.total, r.advanced.nextTitle) : ''}`); }
    catch (e) { setFlash((e as ApiError).message); }
    finally { setSkipping(false); }
  };
  const canSkip = ['available', 'needs_changes'].includes(act.state) && !(act.idx === 5 && p.latest && ['pending', 'approved'].includes(p.latest.state));
  return (
    <section className="card card-pad" aria-labelledby="pageTitle">
      <div className="lv-head">
        <div className="ring" style={{ ['--p' as string]: Math.round((done / 6) * 100) }} role="img" aria-label={t('{n} of 6 activities complete', { n: done })}><span><Tv v={done} />/6<small>{t('DONE')}</small></span></div>
        <div style={{ minWidth: 0 }}><div className="section-label">{p.code}</div><h1 className="h2" id="pageTitle" style={{ fontSize: 26 }}>{/^Level \d+\s+—/.test(p.title) ? p.title : t('Level {n} — {title}', { n: p.idx ?? 1, title: p.title })}</h1><p className="text-2 small" style={{ marginTop: 4 }}><Tv v={p.summary} /></p></div>
        <div className="row gap-8 wrap lv-head-meta"><span className="badge badge-gold">{p.xpEarned} / {p.xpTotal} XP</span>{p.levelState === 'approved' && <span className="badge badge-success">{t('Approved')}</span>}</div>
      </div>
      {p.levelState === 'approved' && <div style={{ margin: '12px 0' }}><FlowerBurst title={p.title} xp={p.xpEarned} last={p.isLast} /></div>}
      {p.completion?.complete && <div className="callout ok" role="status" style={{ margin: '12px 0', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <CheckCircle2 size={18} /><span style={{ flex: 1, minWidth: 220 }}><b>{t('Level complete.')}</b> {moveOnText(t, p.completion.earned, p.completion.total, p.completion.next?.title ?? null)}</span>
        {p.completion.next && <Link className="btn btn-gold btn-sm" href={`/levels/${p.completion.next.code}`}>{t('Go to {title}', { title: p.completion.next.title })} <ArrowRight size={14} /></Link>}
      </div>}
      {!p.completion?.complete && <p className="muted small" style={{ margin: '8px 0 0' }}>{t('Finish or skip every activity and day below to open the next level. Review never blocks you: skipped work just earns no points until you finish it.')}</p>}
      {p.levelState !== 'approved' && <div style={{ margin: '8px 0 12px' }}><StuckHelper code={p.code} /></div>}
      {p.days && p.days.length > 0 && <nav aria-label={t('Days in this level')} className="row gap-8 wrap" style={{ margin: '0 0 14px' }}>
        {p.days.map(d => <Link key={d.day} href={`/levels/${p.code}/days/${d.day}`} className={`badge ${d.state === 'done' ? 'badge-success' : d.state === 'skipped' ? 'badge-neutral' : 'badge-gold'}`} title={d.title}>{d.state === 'done' ? t('Day {n} · done +{xp}', { n: d.day, xp: d.xp }) : d.state === 'skipped' ? t('Day {n} · skipped', { n: d.day }) : t('Day {n} · to do', { n: d.day })}</Link>)}
      </nav>}
      <ol className="stepper" aria-label={t('Activities')}>
        {p.activities.map(a => (
          <li key={a.idx} className={`step ${a.state}`} aria-current={a.idx === cur ? 'step' : undefined}>
            <button type="button" disabled={a.state === 'locked'} onClick={() => { setCur(a.idx); setFlash(''); }} aria-label={`${t('Activity {n}', { n: a.idx })}: ${a.title}, ${t(LABEL[a.state] || a.state)}`}>
              <span className="sn"><i>{a.state === 'completed' ? '✓' : a.idx}</i>{t(LABEL[a.state] || a.state)}</span><span className="st">{a.title.split(':')[0]}</span>
            </button>
          </li>
        ))}
      </ol>
      {flash && <div className="callout ok" role="status" style={{ marginBottom: 14 }}><CheckCircle2 size={18} /><span><Tv v={flash} /></span></div>}
      <div className="panel-grid">
        <div key={cur}>
          <div className="row between wrap gap-8" style={{ marginBottom: 14 }}>
            <div><div className="section-label">{t('Activity {n}', { n: act.idx })}</div><h2 className="h2"><Tv v={act.title} /></h2></div>
            <span className="badge badge-gold">+{act.xp} XP</span>
          </div>
          {act.config.personalisedFor && act.state !== 'locked' && <p className="callout info small" style={{ marginBottom: 14 }}><Tr>Personalised for your path: the situation, examples and hints match your profile. The pass rules are the same for everyone.</Tr> <Link className="link" href="/onboarding"><Tr>Change my path</Tr></Link></p>}
          {act.state === 'skipped' && <p className="callout info small" style={{ marginBottom: 14 }}><SkipForward size={16} /><span>{t('You skipped this activity. Do it any time below to earn its {xp} points.', { xp: act.xp })}</span></p>}
          {act.state === 'locked' ? <p className="text-2">{t('Finish or skip the previous activity first.')}</p>
            : act.config.kind === 'briefing' ? <Briefing a={act} code={p.code} onDone={after} />
            : act.config.kind === 'learn' ? <Learn a={act} code={p.code} onDone={after} />
            : act.config.kind === 'explore' ? <Explore a={act} code={p.code} onDone={after} />
            : act.config.kind === 'build' ? <Build a={act} code={p.code} onDone={after} />
            : act.config.kind === 'dataset' ? <DatasetCheckPanel a={act} code={p.code} onDone={m => after(m, false)} /* stay: the learner reads the green report, then moves on */ />
            : act.config.kind === 'screenshot' ? <ScreenshotPanel a={act} code={p.code} onDone={after} />
            : act.config.kind === 'proof' ? <Proof a={act} code={p.code} latest={p.latest} onDone={after} />
            : act.config.kind === 'boss' ? <Boss a={act} code={p.code} latest={p.latest} boss={p.boss} rubric={p.rubric} onDone={m => after(m, false)} />
            : <p className="text-2"><Tr>This activity has not been published yet.</Tr></p>}
          {canSkip && <div className="row gap-8 wrap" style={{ marginTop: 16, alignItems: 'center' }}><button className="btn btn-ghost btn-sm" type="button" disabled={skipping} onClick={skip}><SkipForward size={15} />{skipping ? t('Skipping…') : t('Skip for now')}</button><span className="muted xs">{t('You move on now; this activity earns its points when you come back and finish it.')}</span></div>}
        </div>
        <aside className="card aside-card" aria-label={t('Level facts')}>
          <h2 className="section-label" style={{ marginBottom: 6 }}>{t('Level facts')}</h2>
          <div className="kv"><span>{t('Points earned')}</span><span>{t('{a} of {b}', { a: p.xpEarned, b: p.xpTotal })}</span></div>
          <div className="kv"><span>{t('Proof attempts')}</span><span>{p.latest ? p.latest.reviews.length + (p.latest.state === 'pending' ? 1 : 0) || 1 : 0}</span></div>
          <div className="kv"><span>{t('Boss attempts')}</span><span>{t('{a} of {b}', { a: p.boss.attempts, b: p.boss.max })}</span></div>
          {p.rubric && <div className="kv"><span>{t('Review pass rule (for points)')}</span><span><Tr>Avg ≥</Tr> {p.rubric.threshold.toFixed(1)} <Tr>and Boss ≥</Tr> <Tv v={p.rubric.bossMin} /></span></div>}
          <div className="kv"><span>{t('Next level opens')}</span><span>{t('When every activity and day is done or skipped')}</span></div>
          <Link className="btn btn-soft btn-sm btn-block" style={{ marginTop: 14 }} href={`/coach?level=${p.code}&a=${cur}`}><LifeBuoy size={15} />{t('Ask about this step')}</Link>
        </aside>
      </div>
    </section>
  );
}

type PanelProps = { a: Act; code: string; onDone: (msg: string) => void };
async function post(path: string, body: unknown) { return api<any>(path, { body }); }
function useBusy() { const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [fe, setFe] = useState<Record<string, string>>({}); return { busy, err, fe, run: async (fn: () => Promise<void>) => { setBusy(true); setErr(''); setFe({}); try { await fn(); } catch (e) { const a = e as ApiError; setErr(a.message); if (a.details) setFe(a.details); } finally { setBusy(false); } } }; }

export function Briefing({ a, code, onDone }: PanelProps) {
  const c = a.config; const [choice, setChoice] = useState<number | null>(a.data?.choice ?? null); const [res, setRes] = useState<{ correct: boolean; why: string } | null>(null); const b = useBusy();
  return (<div className="stack gap-16">
    <p style={{ fontSize: 16 }}><Tv v={c.problem} /></p>
    <div className="kv"><span><Tr>Objective</Tr></span><span style={{ fontWeight: 500, textAlign: 'left', maxWidth: '60ch' }}><Tv v={c.objective} /></span></div>
    <div className="kv"><span><Tr>Expected outcome</Tr></span><span style={{ fontWeight: 500, textAlign: 'left', maxWidth: '60ch' }}><Tv v={c.outcome} /></span></div>
    <div><h3 className="h3" style={{ marginBottom: 8 }}><Tr>You will be evaluated on</Tr></h3><ul className="checklist">{c.criteria.map((x: string) => <li key={x}><Target size={16} aria-hidden="true" /><span><Tv v={x} /></span></li>)}</ul></div>
    <fieldset className="q" style={{ border: 0 }}><legend><Tv v={c.check.q} /></legend>
      {c.check.options.map((o: string, i: number) => <label key={i} className={`opt ${res && choice === i ? (res.correct ? 'correct' : 'wrong') : ''}`}><input type="radio" name="brief" checked={choice === i} onChange={() => { setChoice(i); setRes(null); }} /><Tv v={o} /></label>)}
      {res && <p className={`q-feedback ${res.correct ? 'ok' : 'no'}`}>{res.correct ? <Tr>Exactly.</Tr> : <Tr>Good try — here is the idea:</Tr>}<Tv v={res.why} /></p>}
    </fieldset>
    {b.err && <p className="field-err" role="alert"><Tv v={b.err} /></p>}
    <div><button className="btn btn-gold" type="button" disabled={choice === null || b.busy} onClick={() => b.run(async () => { const r = await post(`/api/v1/levels/${code}/activities/1`, { choice }); setRes(r); if (r.first) onDone(`Mission briefing complete${r.xp ? ` · +${r.xp} XP` : ''}.`); })}>{a.state === 'completed' ? <Tr>Check answer</Tr> : <Tr>Mark briefing complete</Tr>}</button></div>
  </div>);
}

export function Learn({ a, code, onDone }: PanelProps) {
  const c = a.config; const [ans, setAns] = useState<(number | null)[]>(c.quiz.map(() => null)); const [res, setRes] = useState<{ passed: boolean; score: number; wrong: number[] } | null>(null); const b = useBusy();
  return (<div className="stack gap-16">
    <div className="grid2" style={{ gap: 14 }}>{c.lessons.map((l: any, i: number) => <details key={i} className="card card-pad" open={i === 0}><summary className="bold" style={{ cursor: 'pointer' }}><Tv v={l.title} /> <span className="muted xs">· {l.minutes} <Tr>min read</Tr></span></summary><p className="text-2" style={{ marginTop: 10 }}><Tv v={l.body} /></p></details>)}</div>
    {c.demo && <div className="card card-pad"><h3 className="h3" style={{ marginBottom: 8 }}><Tv v={c.demo.title} /></h3><ol className="text-2" style={{ paddingLeft: 20, display: 'grid', gap: 6 }}>{c.demo.steps.map((x: string) => <li key={x}><Tv v={x} /></li>)}</ol></div>}
    {c.resources?.length > 0 && <div><h3 className="h3" style={{ marginBottom: 8 }}><Tr>Go deeper (verified open resources)</Tr></h3><ul className="checklist">{c.resources.map((r: any) => <li key={r.url}><ExternalLink size={16} aria-hidden="true" /><span><a className="link" href={r.url} target="_blank" rel="noopener noreferrer"><Tv v={r.title} /></a><span className="muted xs" style={{ display: 'block' }}><Tv v={r.description} /> · <Tv v={r.difficulty} /> <Tr>· Licence</Tr> <Tv v={r.license} /> <Tr>· last verified</Tr> <Tv v={r.lastVerified} /></span></span></li>)}</ul></div>}
    <h3 className="h3"><Tr>Check your understanding · pass at</Tr> <Tv v={c.passPct} />%</h3>
    {c.quiz.map((q: any, qi: number) => <fieldset key={qi} className="q" style={{ border: 0 }}><legend>{qi + 1}. <Tv v={q.q} /></legend>{q.options.map((o: string, i: number) => <label key={i} className={`opt ${res && ans[qi] === i ? (res.wrong.includes(qi) ? 'wrong' : 'correct') : ''}`}><input type="radio" name={`q${qi}`} checked={ans[qi] === i} onChange={() => { const n = [...ans]; n[qi] = i; setAns(n); setRes(null); }} /><Tv v={o} /></label>)}</fieldset>)}
    {res && !res.passed && <p className="q-feedback no" role="status">{res.score}<Tr>% — you need</Tr> <Tv v={c.passPct} /><Tr>%. The highlighted answers need another look.</Tr></p>}
    {b.err && <p className="field-err" role="alert"><Tv v={b.err} /></p>}
    <div><button className="btn btn-gold" type="button" disabled={ans.some(x => x === null) || b.busy} onClick={() => b.run(async () => { const r = await post(`/api/v1/levels/${code}/activities/2`, { answers: ans }); setRes(r); if (r.passed) onDone(`Quiz passed with ${r.score}%${r.xp ? ` · +${r.xp} XP` : ''}.`); })}><Tr>Submit answers</Tr></button></div>
  </div>);
}

export function Explore({ a, code, onDone }: PanelProps) {
  const c = a.config; const [ans, setAns] = useState<(number | null)[]>(c.questions.map(() => null)); const [att, setAtt] = useState(false); const [res, setRes] = useState<{ passed: boolean; wrong: number[] } | null>(null); const b = useBusy();
  return (<div className="stack gap-16">
    <div className="card card-pad"><div className="row between wrap gap-8"><div><b><Tv v={c.repo.fullName} /></b><p className="muted small"><Tv v={c.repo.description} /></p></div><a className="btn btn-outline btn-sm" href={c.repo.url} target="_blank" rel="noopener noreferrer"><Tr>Open on GitHub</Tr> <ExternalLink size={14} /></a></div>
      <div className="row gap-8 wrap" style={{ marginTop: 10 }}><span className="badge badge-neutral"><Tv v={c.repo.difficulty} /></span><span className="badge badge-success"><Tr>Licence</Tr> <Tv v={c.repo.license} /></span><span className="badge badge-neutral"><Tr>Verified</Tr> <Tv v={c.repo.lastVerified} /></span></div></div>
    <div><h3 className="h3" style={{ marginBottom: 8 }}><Tr>How the repository is organised</Tr></h3><ul className="checklist">{c.architecture.map((x: string) => <li key={x}><Check size={16} aria-hidden="true" /><span><Tv v={x} /></span></li>)}</ul></div>
    <p className="text-2"><Tv v={c.task} /></p>
    {c.questions.map((q: any, qi: number) => <fieldset key={qi} className="q" style={{ border: 0 }}><legend><Tv v={q.q} /></legend>{q.options.map((o: string, i: number) => <label key={i} className={`opt ${res && ans[qi] === i ? (res.wrong.includes(qi) ? 'wrong' : 'correct') : ''}`}><input type="radio" name={`e${qi}`} checked={ans[qi] === i} onChange={() => { const n = [...ans]; n[qi] = i; setAns(n); setRes(null); }} /><Tv v={o} /></label>)}</fieldset>)}
    <label className="row gap-12 small"><input type="checkbox" checked={att} onChange={e => setAtt(e.target.checked)} /><Tr>I opened the repository and read the Lesson 01 README.</Tr></label>
    {res && !res.passed && <p className="q-feedback no"><Tr>Not yet — re-read Lesson 01 and try again. You need</Tr> <Tv v={c.passMin} /> <Tr>of</Tr> {c.questions.length}.</p>}
    {b.err && <p className="field-err" role="alert"><Tv v={b.err} /></p>}
    <div><button className="btn btn-gold" type="button" disabled={ans.some(x => x === null) || !att || b.busy} onClick={() => b.run(async () => { const r = await post(`/api/v1/levels/${code}/activities/3`, { attested: att, answers: ans }); setRes(r); if (r.passed) onDone(`Explore complete${r.xp ? ` · +${r.xp} XP` : ''}.`); })}><Tr>Check answers</Tr></button></div>
  </div>);
}

export function Build({ a, code, onDone }: PanelProps) {
  const t = useT();
  const c = a.config; const saved = a.data?.brief;
  const [tool, setTool] = useState<string>(saved?.tool || ''); const [fields, setFields] = useState<Record<string, string>>(saved?.fields || {}); const [its, setIts] = useState<{ prompt: string; output: string; change: string }[]>(saved?.iterations || Array.from({ length: c.iterations }, () => ({ prompt: '', output: '', change: '' })));
  const b = useBusy();
  const setIt = (i: number, k: 'prompt' | 'output' | 'change', v: string) => setIts(x => x.map((it, j) => (j === i ? { ...it, [k]: v } : it)));
  return (<div className="stack gap-16">
    <p className="text-2"><Tr>Pick a real problem you have seen (not the tiffin example). Test one AI tool on it, three times, improving your prompt each time. Write honestly about what went wrong — reviewers reward that.</Tr></p>
    {b.fe.pii && <p className="callout warn" role="alert"><Tv v={b.fe.pii} /></p>}
    <div><label className="field-label" htmlFor="tool"><Tr>AI tool you used</Tr></label><select className="select" id="tool" value={tool} onChange={e => setTool(e.target.value)} aria-invalid={!!b.fe.tool}><option value="">{t('Choose…')}</option>{c.tools.map((t: string) => <option key={t}>{t}</option>)}</select>{b.fe.tool && <div className="field-err"><Tv v={b.fe.tool} /></div>}</div>
    {c.fields.map((f: any) => <div key={f.key}><label className="field-label" htmlFor={f.key}><Tv v={f.label} /></label><textarea className="textarea" id={f.key} rows={3} value={fields[f.key] || ''} onChange={e => setFields({ ...fields, [f.key]: e.target.value })} aria-invalid={!!b.fe[f.key]} aria-describedby={`${f.key}-h`} /><div className={b.fe[f.key] ? 'field-err' : 'field-hint'} id={`${f.key}-h`}>{b.fe[f.key] || `${f.hint}`}</div></div>)}
    {its.map((it, i) => (
      <fieldset key={i} className="card card-pad stack gap-12" style={{ border: '1px solid var(--border)' }}><legend className="bold" style={{ padding: '0 6px' }}><Tr>Prompt iteration</Tr> {i + 1}</legend>
        <div><label className="field-label" htmlFor={`p${i}`}><Tr>Your prompt</Tr></label><textarea className="textarea" id={`p${i}`} rows={2} value={it.prompt} onChange={e => setIt(i, 'prompt', e.target.value)} aria-invalid={!!b.fe[`it${i}.prompt`]} />{b.fe[`it${i}.prompt`] ? <div className="field-err">{b.fe[`it${i}.prompt`]}</div> : null}</div>
        <div><label className="field-label" htmlFor={`o${i}`}><Tr>What the AI returned (summarise)</Tr></label><textarea className="textarea" id={`o${i}`} rows={2} value={it.output} onChange={e => setIt(i, 'output', e.target.value)} aria-invalid={!!b.fe[`it${i}.output`]} />{b.fe[`it${i}.output`] ? <div className="field-err">{b.fe[`it${i}.output`]}</div> : null}</div>
        {i > 0 && <div><label className="field-label" htmlFor={`c${i}`}><Tr>What you changed, and why</Tr></label><textarea className="textarea" id={`c${i}`} rows={2} value={it.change} onChange={e => setIt(i, 'change', e.target.value)} aria-invalid={!!b.fe[`it${i}.change`]} />{b.fe[`it${i}.change`] ? <div className="field-err">{b.fe[`it${i}.change`]}</div> : null}</div>}
      </fieldset>
    ))}
    {b.err && !Object.keys(b.fe).length && <p className="field-err" role="alert"><Tv v={b.err} /></p>}
    <div className="row gap-12 wrap"><button className="btn btn-gold" type="button" disabled={b.busy} onClick={() => b.run(async () => { const res = await post(`/api/v1/levels/${code}/activities/4`, { tool, fields, iterations: its }); onDone(res.first ? `Brief saved · +${res.xp} XP. Next: share it as proof.` : 'Brief updated.'); })}>{a.state === 'completed' ? <Tr>Save changes</Tr> : <Tr>Save my brief</Tr>}</button><span className="muted xs"><Tr>Checked on the server for completeness, iteration quality and personal data. Quality is judged by your reviewer.</Tr></span></div>
  </div>);
}

export function Proof({ a, code, latest, onDone }: PanelProps & { latest: Props['latest'] }) {
  const t = useT();
  const c = a.config; const [url, setUrl] = useState(''); const [demo, setDemo] = useState(''); const [refl, setRefl] = useState(''); const [checks, setChecks] = useState<boolean[]>(c.checklist.map(() => false)); const b = useBusy();
  const fb = latest?.state === 'needs_changes' ? latest.reviews[0] : null;
  if (latest && (latest.state === 'pending' || latest.state === 'approved')) return <div className="callout ok"><CheckCircle2 size={18} /><div><b><Tr>Proof submitted</Tr> {new Date(latest.submittedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</b>{latest.url && <a className="link" href={latest.url} target="_blank" rel="noopener noreferrer">{latest.url}</a>}</div></div>;
  return (<div className="stack gap-16">
    {fb && (parseGaps(fb.feedback).length > 0
      ? <GapList gaps={parseGaps(fb.feedback)} avg={fb.avg} />
      : <div className="callout warn"><RefreshCw size={18} /><div><b><Tr>Changes requested by</Tr> {fb.by} · {fb.avg?.toFixed(2)} / 5</b>“<Tv v={fb.feedback} /><Tr>” — improve your brief or reflection and resubmit. You keep all XP.</Tr></div></div>)}
    <div><label className="field-label" htmlFor="ev"><Tr>Link to your brief (required)</Tr></label><input className="input" id="ev" type="url" placeholder={t('https://docs.google.com/…')} value={url} onChange={e => setUrl(e.target.value)} aria-invalid={!!b.fe.evidenceUrl} />{b.fe.evidenceUrl ? <div className="field-err"><Tv v={b.fe.evidenceUrl} /></div> : <div className="field-hint"><Tr>Accepted:</Tr> {c.evidenceTypes.join(' · ')}<Tr>. Make sure reviewers can view it.</Tr></div>}</div>
    <div><label className="field-label" htmlFor="demo"><Tr>Demo link (optional)</Tr></label><input className="input" id="demo" type="url" value={demo} onChange={e => setDemo(e.target.value)} aria-invalid={!!b.fe.demoUrl} />{b.fe.demoUrl && <div className="field-err"><Tv v={b.fe.demoUrl} /></div>}</div>
    <div><label className="field-label" htmlFor="refl"><Tr>Reflection</Tr></label><textarea className="textarea" id="refl" rows={6} value={refl} onChange={e => setRefl(e.target.value)} placeholder={t('What surprised you about the AI\'s answers? What did you get wrong at first, and what changed your mind?')} aria-invalid={!!b.fe.reflection} />{b.fe.reflection ? <div className="field-err"><Tv v={b.fe.reflection} /></div> : <div className="field-hint"><Tr>What you did, what surprised you, and what you learned, in your own words.</Tr></div>}</div>
    <fieldset style={{ border: 0, padding: 0, margin: 0 }}><legend className="field-label"><Tr>Before you submit</Tr></legend><ul className="checklist">{c.checklist.map((x: string, i: number) => <li key={i}><label><input type="checkbox" checked={checks[i]} onChange={e => setChecks(cs => cs.map((v, j) => (j === i ? e.target.checked : v)))} /><span><Tv v={x} /></span></label></li>)}</ul>{b.fe.checklist && <div className="field-err"><Tv v={b.fe.checklist} /></div>}</fieldset>
    {b.err && !Object.keys(b.fe).length && <p className="field-err" role="alert"><Tv v={b.err} /></p>}
    <div className="row gap-12 wrap"><button className="btn btn-gold" type="button" disabled={b.busy} onClick={() => b.run(async () => { const r = await post(`/api/v1/levels/${code}/proof`, { evidenceUrl: url, demoUrl: demo, reflection: refl, checklist: checks }); onDone(`Proof submitted (attempt ${r.attempt})${r.xp ? ` · +${r.xp} XP` : ''}. A reviewer will score it on the rubric.`); })}><Upload size={15} /><Tr>Submit for review</Tr></button><span className="muted small"><Tr>Checked at once against the published rubric. Every decision is logged, and you can appeal to a mentor.</Tr></span></div>
  </div>);
}

export function Boss({ a, code, latest, boss, rubric, onDone }: { a: Act; code: string; latest: Props['latest']; boss: Props['boss']; rubric: Props['rubric']; onDone: (m: string) => void }) {
  const t = useT();
  const c = a.config; const [ans, setAns] = useState<{ choice: number | null; why: string }[]>(c.scenarios.map(() => ({ choice: null, why: '' }))); const [res, setRes] = useState<any>(null); const b = useBusy();
  const [appeal, setAppeal] = useState(''); const ab = useBusy();
  const decided = latest?.reviews[0];
  const left = boss.max - boss.attempts;
  return (<div className="stack gap-16">
    <section className="card card-pad"><h3 className="h3" style={{ marginBottom: 10 }}><Tr>Review status</Tr></h3>
      <ol className="vtl">
        <li className={latest ? 'done' : ''}><span className="dot">{latest ? <Check size={14} /> : null}</span><div><b><Tr>Proof submitted</Tr></b><p className="muted small">{latest ? new Date(latest.submittedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST' : <Tr>Not submitted yet. Review scores it for points; it never blocks the next level.</Tr>}</p></div></li>
        <li className={latest?.state === 'pending' ? 'now' : latest?.state === 'needs_changes' ? 'warn' : latest?.state === 'approved' ? 'done' : ''}><span className="dot">{latest?.state === 'pending' ? <Clock size={14} /> : latest?.state === 'approved' ? <Check size={14} /> : null}</span><div><b>{latest?.state === 'pending' ? <Tr>Waiting for the boss — reviewed automatically when it is done</Tr> : latest?.state === 'needs_changes' ? <Tr>Changes requested</Tr> : latest?.state === 'approved' ? <Tr>Approved</Tr> : <Tr>Automatic review</Tr>}</b><p className="muted small">{decided ? `${decided.by} · ${decided.avg?.toFixed(2)} / 5` : <Tr>Scored on the published rubric.</Tr>}</p></div></li>
        <li className={a.state === 'completed' ? 'done' : ''}><span className="dot">{a.state === 'completed' ? <Check size={14} /> : null}</span><div><b><Tr>Level complete</Tr></b><p className="muted small"><Tr>The next level opens when every activity and day is done or skipped.</Tr></p></div></li>
      </ol>
    </section>
    {decided && rubric && <section className="card card-pad"><h3 className="h3"><Tr>Rubric scores</Tr></h3><div className="table-wrap" style={{ marginTop: 8 }}><table className="tbl"><thead><tr><th><Tr>Area</Tr></th><th><Tr>Weight</Tr></th><th style={{ textAlign: 'right' }}><Tr>Score</Tr></th></tr></thead><tbody>{rubric.dims.map(d => <tr key={d.key}><td>{d.name}</td><td>{Math.round(d.weight * 100)}%</td><td style={{ textAlign: 'right' }} className="bold">{decided.scores[d.key] ?? '—'}</td></tr>)}</tbody></table></div>{decided.feedback && <p className="text-2" style={{ marginTop: 10 }}>“<Tv v={decided.feedback} />”</p>}
      {decided.appeal ? <p className="muted small" style={{ marginTop: 10 }}><Tr>Appeal status:</Tr> <Tv v={decided.appeal} /></p> : <details style={{ marginTop: 12 }}><summary className="link" style={{ cursor: 'pointer' }}><Tr>Disagree? Request a second human review</Tr></summary><div className="stack gap-8" style={{ marginTop: 8 }}><textarea className="textarea" rows={3} value={appeal} onChange={e => setAppeal(e.target.value)} aria-label={t('Appeal reason')} placeholder={t('Explain which score you think is wrong and point to the evidence.')} />{ab.err && <p className="field-err"><Tv v={ab.err} /></p>}<div><button className="btn btn-outline btn-sm" type="button" disabled={ab.busy} onClick={() => ab.run(async () => { await api('/api/v1/appeals', { body: { reviewId: decided.id, note: appeal } }); onDone('Appeal sent. A different staff member will review it.'); })}><Tr>Send appeal</Tr></button></div></div></details>}
    </section>}
    {latest?.state !== 'approved' && <>
      <h3 className="h3"><Tr>Boss: The Right Tool Trial</Tr></h3><p className="text-2"><Tv v={c.intro} /></p>
      <div className="row gap-8 wrap"><span className="badge badge-neutral">{boss.attempts} <Tr>of</Tr> {boss.max} <Tr>attempts used</Tr></span>{boss.result && <span className={`badge ${boss.result.best === boss.result.total ? 'badge-success' : 'badge-neutral'}`}><Tr>Best</Tr> {boss.result.best}/{boss.result.total}</span>}</div>
      {c.scenarios.map((s: any, i: number) => (
        <fieldset key={i} className="q" style={{ border: 0 }}><legend>{i + 1}. <Tv v={s.s} /></legend>
          <div className="row gap-8 wrap" role="radiogroup" aria-label={t('Best tool')}>{c.choices.map((ch: string, ci: number) => <label key={ci} className={`opt ${res ? (res.results[i].pass ? 'correct' : ans[i].choice === ci ? 'wrong' : '') : ''}`} style={{ marginTop: 0 }}><input type="radio" name={`b${i}`} checked={ans[i].choice === ci} onChange={() => setAns(x => x.map((v, j) => (j === i ? { ...v, choice: ci } : v)))} /><Tv v={ch} /></label>)}</div>
          <input className="input" style={{ marginTop: 8 }} placeholder={t('Why is this the right move?')} value={ans[i].why} onChange={e => setAns(x => x.map((v, j) => (j === i ? { ...v, why: e.target.value } : v)))} aria-label={`Reason for scenario ${i + 1}`} />
          {res && <p className={`q-feedback ${res.results[i].pass ? 'ok' : 'no'}`}><Tv v={res.results[i].reason} /></p>}
        </fieldset>
      ))}
      {b.err && <p className="field-err" role="alert"><Tv v={b.err} /></p>}
      <div className="row gap-12 wrap"><button className="btn btn-ink" type="button" disabled={left <= 0 || b.busy || ans.some(x => x.choice === null)} onClick={() => b.run(async () => { const r = await post(`/api/v1/levels/${code}/boss`, { answers: ans }); setRes(r); onDone(`Boss attempt scored ${r.passed}/${r.total}. Best so far: ${r.best}/${r.total}.`); })}><Play size={15} /><Tr>Run the trial</Tr></button><span className="muted xs">{left > 0 ? `${left} attempt${left === 1 ? '' : 's'} left. Your best result goes to your reviewer.` : <Tr>No attempts left. Your best result counts, and you can move on to the next level.</Tr>}</span></div>
    </>}
    {a.state === 'completed' && <Link className="btn btn-gold" href="/levels"><Tr>Continue your journey</Tr> <ArrowRight size={15} /></Link>}
  </div>);
}
