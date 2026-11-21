'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ExternalLink, ShieldAlert } from 'lucide-react';
import { api, ApiError } from '@/lib/client/api';
import type { AgentInfo } from '@/lib/domain/agentLab';
import { buildGuide, type InstallMethod } from '@/lib/domain/setupGuide';
import { SetupGuide } from './SetupGuide';
import { StuckPanel } from './StuckPanel';
import { ScreenshotInput, type Shot } from './ScreenshotInput';
import { ProofCheck, ProofResult } from './ProofCheck';
import { PromptStudio } from './PromptStudio';
import type { Plan } from '@/lib/domain/personalise';
import { Tr } from '@/components/i18n/Tr';
import { useT } from '@/components/i18n/I18nProvider';
import { Tv } from '@/components/i18n/Tv';

type Run = { id: string; agent: string; os: string; state: string; steps: Record<string, { at: string; data: any }>; attempts: number; reviewNote: string | null; xpAwarded: number; screenshotId: string | null; screenshot?: { width: number | null; height: number | null } | null; versionOutput?: string | null; resultSummary?: string | null; proofScore?: number | null; reviewScores?: any; autoChecks?: any };
type Props = { verifiedOn: string; agents: AgentInfo[]; plan: Plan | null; runs: Run[]; promptParts: readonly { key: string; label: string; hint: string; min: number }[]; keyQuiz: { q: string; options: string[] }; xp: number; os: string | null };
const STEP_LABEL = { prepare: 'Get ready', install: 'Install', connect: 'Sign in safely', prompt: 'Build your prompt', result: 'Result & screenshot' } as const;
type Step = keyof typeof STEP_LABEL;
const STEPS = Object.keys(STEP_LABEL) as Step[];
const STATE: Record<string, string> = { in_progress: 'In progress', submitted: 'With a reviewer', verified: 'Verified', needs_changes: 'Needs changes' };

function useBusy() { const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [fe, setFe] = useState<Record<string, string>>({}); return { busy, err, fe, run: async (fn: () => Promise<void>) => { setBusy(true); setErr(''); setFe({}); try { await fn(); } catch (e) { const a = e as ApiError; setErr(a.message); if (a.details) setFe(a.details); } finally { setBusy(false); } } }; }
const Err = ({ m }: { m?: string }) => (m ? <p className="field-err" role="alert"><Tv v={m} /></p> : null);

export function AgentLab(p: Props) {
  const router = useRouter();
  const ranked = useMemo(() => {
    if (!p.plan) return p.agents.map(a => ({ a, allowed: true, why: '', blocked: '' }));
    return p.plan.agents.map(g => ({ a: p.agents.find(x => x.code === g.code)!, allowed: g.allowed, why: g.why, blocked: g.blockedReason || '' }));
  }, [p.agents, p.plan]);
  const [runs, setRuns] = useState(p.runs);
  const [pick, setPick] = useState<string>(runs[0]?.agent || ranked.find(r => r.allowed)?.a.code || 'kilo_code');
  const defaultOs = (p.os && ['macos', 'windows', 'linux'].includes(p.os) ? p.os : 'macos') as 'macos' | 'windows' | 'linux';
  const [os, setOs] = useState<'macos' | 'windows' | 'linux'>(defaultOs);
  const run = runs.find(r => r.agent === pick) || null;
  const info = p.agents.find(a => a.code === pick)!;
  const b = useBusy();
  const upsert = (r: Run) => setRuns(rs => [...rs.filter(x => x.id !== r.id), r]);
  const start = () => b.run(async () => { upsert(await api<Run>('/api/v1/agent-lab', { body: { agent: pick, os } })); });

  return (<div className="stack gap-20">
    {!p.plan && <p className="callout info small"><Tr>Tell us about yourself first and we will recommend the agent that fits you.</Tr> <Link className="link" href="/onboarding"><Tr>Build my path</Tr></Link></p>}
    <section className="card card-pad" aria-labelledby="pickT">
      <h2 className="h3" id="pickT"><Tr>1. Choose your AI agent</Tr></h2>
      <p className="muted xs" style={{ marginTop: 4 }}><Tr>Setup facts checked against each vendor’s documentation on</Tr> <Tv v={p.verifiedOn} /><Tr>. Commands can change — the source links are always the final word.</Tr></p>
      <div className="grid2" style={{ gap: 12, marginTop: 12 }}>{ranked.map(({ a, allowed, why, blocked }, i) => {
        const r = runs.find(x => x.agent === a.code);
        return (<label key={a.code} className={`card card-pad opt ${pick === a.code ? 'correct' : ''}`} style={{ alignItems: 'flex-start', opacity: allowed ? 1 : 0.6 }}>
          <input type="radio" name="agent" checked={pick === a.code} disabled={!allowed && !r} onChange={() => setPick(a.code)} />
          <span className="stack gap-8"><span className="row gap-8 wrap"><b>{a.name}</b>{p.plan && i === 0 && <span className="badge badge-gold"><Tr>Best fit for you</Tr></span>}<span className="badge badge-neutral"><Tv v={a.licence} /></span>{r && <span className="badge badge-success">{STATE[r.state]}</span>}</span>
            <span className="text-2 small">{why || a.surfaces}</span><span className="muted xs"><Tv v={a.access} /></span>{!allowed && <span className="field-err"><Tv v={blocked} /></span>}</span>
        </label>);
      })}</div>
      {!run && <div className="row gap-12 wrap" style={{ marginTop: 14 }}>
        <label className="row gap-8 small"><Tr>Your computer</Tr><select className="select" style={{ width: 'auto' }} value={os} onChange={e => setOs(e.target.value as typeof os)}><option value="macos">macOS</option><option value="windows">Windows</option><option value="linux">Linux</option></select></label>
        <button className="btn btn-gold" type="button" disabled={b.busy || !ranked.find(r => r.a.code === pick)?.allowed} onClick={start}><Tr>Start the</Tr> {info.name} <Tr>lab</Tr></button>
      </div>}
      <Err m={b.err} />
    </section>
    {run && <RunPanel key={run.id} run={run} info={info} plan={p.plan} keyQuiz={p.keyQuiz} xp={p.xp} onChange={r => { upsert(r); router.refresh(); }} />}
  </div>);
}

function RunPanel({ run, info, plan, keyQuiz, xp, onChange }: { run: Run; info: AgentInfo; plan: Plan | null; keyQuiz: Props['keyQuiz']; xp: number; onChange: (r: Run) => void }) {
  const t = useT();
  const firstOpen = STEPS.find(s => !run.steps[s]) || 'result';
  const [cur, setCur] = useState<Step>(firstOpen);
  const locked = run.state === 'submitted' || run.state === 'verified';
  const b = useBusy();
  const save = (step: Step, data: unknown) => b.run(async () => { const r = await api<Run>(`/api/v1/agent-lab/${run.id}/step`, { body: { step, data } }); onChange(r); const n = STEPS[STEPS.indexOf(step) + 1]; if (n) setCur(n); });
  const allDone = STEPS.every(s => run.steps[s]);
  return (<section className="card card-pad stack gap-16" aria-labelledby="runT">
    <div className="row between wrap gap-8"><h2 className="h3" id="runT"><Tr>2. Set up</Tr> {info.name} <Tr>on</Tr> {run.os === 'macos' ? <Tr>macOS</Tr> : run.os === 'windows' ? <Tr>Windows</Tr> : <Tr>Linux</Tr>}</h2><span className="badge badge-gold">+{xp} <Tr>XP when a reviewer verifies</Tr></span></div>
    {(run.state === 'needs_changes' || run.state === 'verified') && (run.reviewScores
      ? <ProofResult state={run.state} score={run.proofScore ?? null} auto={run.autoChecks} review={run.reviewScores} note={run.reviewNote} xp={run.xpAwarded} />
      : run.reviewNote && <p className={`callout ${run.state === 'verified' ? 'ok' : 'warn'} small`}><b><Tr>Reviewer:</Tr></b> <Tv v={run.reviewNote} /></p>)}
    {run.state === 'submitted' && <p className="callout info small"><Tr>Your proof is with a reviewer. You will get a notification.</Tr></p>}
    <ol className="stepper" aria-label={t('Lab steps')}>{STEPS.map(s => <li key={s} className={`step ${run.steps[s] ? 'completed' : s === cur ? 'available' : ''}`} aria-current={s === cur ? 'step' : undefined}><button type="button" onClick={() => setCur(s)} disabled={STEPS.indexOf(s) > 0 && !run.steps[STEPS[STEPS.indexOf(s) - 1]]}><span className="sn"><i>{run.steps[s] ? '✓' : STEPS.indexOf(s) + 1}</i></span><span className="st">{STEP_LABEL[s]}</span></button></li>)}</ol>
    <fieldset disabled={locked || b.busy} style={{ border: 0, padding: 0, margin: 0 }}>
      {cur === 'prepare' && <Prepare plan={plan} saved={run.steps.prepare?.data?.checked} onSave={d => save('prepare', d)} fe={b.fe} />}
      {cur === 'install' && <Install info={info} runId={run.id} os={run.os as 'macos'} saved={run.steps.install?.data} savedOut={run.versionOutput || ''} onSave={d => save('install', d)} fe={b.fe} />}
      {cur === 'connect' && <Connect info={info} quiz={keyQuiz} done={!!run.steps.connect?.data?.quizOk} onSave={d => save('connect', d)} fe={b.fe} />}
      {cur === 'prompt' && <PromptStudio saved={run.steps.prompt?.data} persona={plan?.persona} busy={b.busy} onSave={d => save('prompt', d)} fe={b.fe} />}
      {cur === 'result' && <Result runId={run.id} info={info} savedShot={run.screenshotId} savedMeta={run.screenshot || null} savedSummary={run.resultSummary || ''} savedVerified={run.steps.result?.data?.verified || ''} onSave={d => save('result', d)} fe={b.fe} />}
    </fieldset>
    <Err m={b.err} />
    {allDone && !locked && <ProofCheck runId={run.id} refreshKey={`${JSON.stringify(run.steps)}|${run.screenshotId}|${run.state}`} onGoto={s => { setCur(s); document.getElementById('runT')?.scrollIntoView({ behavior: 'smooth' }); }} onSubmitted={r => onChange(r as Run)} />}
    <p className="muted xs"><Tr>Sources:</Tr> {info.source.map((u, i) => <a key={u} className="link" href={u} target="_blank" rel="noopener noreferrer">{i ? ', ' : ''}<Tv v={new URL(u).hostname} /></a>)}</p>
  </section>);
}

function Prepare({ plan, saved, onSave, fe }: { plan: Plan | null; saved?: string[]; onSave: (d: unknown) => void; fe: Record<string, string> }) {
  const items = plan?.readiness || [{ id: 'laptop', label: 'Laptop charged and online' }, { id: 'notes', label: 'A notes app open' }];
  const [c, setC] = useState<string[]>(saved || []);
  return (<div className="stack gap-12"><p className="text-2"><Tr>Get ready before you start</Tr>{plan ? <Tr>— this list is based on your profile</Tr> : ''}.</p>
    <ul className="checklist">{items.map(i => <li key={i.id}><label className="row gap-12"><input type="checkbox" checked={c.includes(i.id)} onChange={e => setC(e.target.checked ? [...c, i.id] : c.filter(x => x !== i.id))} /><span><Tv v={i.label} />{i.hint && <span className="muted xs" style={{ display: 'block' }}><Tv v={i.hint} /></span>}</span></label></li>)}</ul>
    <Err m={fe.checked} /><div><button className="btn btn-gold" type="button" onClick={() => onSave({ checked: c })}><Tr>I’m ready</Tr></button></div></div>);
}

const NEED_LABEL = { node: 'Needs Node.js + npm', brew: 'Needs Homebrew', vscode: 'Needs VS Code' } as const;

function Install({ info, runId, os, saved, savedOut, onSave, fe }: { info: AgentInfo; runId: string; os: 'macos' | 'windows' | 'linux'; saved?: { method?: string; nodeVersion?: string }; savedOut: string; onSave: (d: unknown) => void; fe: Record<string, string> }) {
  const methods: InstallMethod[] = info.install[os] || [];
  const [method, setMethod] = useState(saved?.method && methods.some(m => m.id === saved.method) ? saved.method : methods[0]?.id || '');
  const [out, setOut] = useState(savedOut); const [node, setNode] = useState(saved?.nodeVersion || '');
  const m = methods.find(x => x.id === method);
  const steps = useMemo(() => buildGuide(info.code, os, method), [info.code, os, method]);
  const needsNode = !!m?.needs.includes('node');
  return (<div className="stack gap-16">
    <div className="stack gap-8"><p className="text-2" style={{ margin: 0 }}><b><Tr>A. Pick one way to install.</Tr></b> <Tr>The guide below changes to show every step for your choice, including anything you need to install first.</Tr></p>
      {methods.map(x => <label key={x.id} className={`opt ${method === x.id ? 'correct' : ''}`} style={{ alignItems: 'flex-start' }}><input type="radio" name="method" checked={method === x.id} onChange={() => setMethod(x.id)} /><span className="stack gap-4"><b className="small"><Tv v={x.label} /></b><span className="row gap-6 wrap">{x.needs.length === 0 ? <span className="badge badge-success"><Tr>No extra tools needed</Tr></span> : x.needs.map(n => <span key={n} className="badge badge-neutral">{NEED_LABEL[n]}{n === 'node' && x.minNode ? ` ${x.minNode}+` : ''}</span>)}</span></span></label>)}
      <Err m={fe.method} /></div>
    <div className="stack gap-8"><p className="text-2" style={{ margin: 0 }}><b><Tr>B. Follow these steps on your own computer.</Tr></b> <Tr>Tick each one as you finish it.</Tr></p>
      <SetupGuide steps={steps} storageKey={`agentlab:${runId}:${method}`} os={os} stuck={s => <StuckPanel runId={runId} step={s} os={os} agent={info.code} method={method} />} /></div>
    <div className="stack gap-12" style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}><p className="text-2" style={{ margin: 0 }}><b><Tr>C. Paste your proof.</Tr></b> <Tr>We check it matches what a working install prints.</Tr></p>
      {needsNode && <label className="stack gap-8"><span className="bold small"><Tr>What did</Tr> <code>node -v</code> <Tr>print?</Tr></span><input className="input" value={node} onChange={e => setNode(e.target.value)} placeholder="v24.22.2" maxLength={40} /><Err m={fe.nodeVersion} /></label>}
      <label className="stack gap-8"><span className="bold small"><Tr>Check it worked</Tr></span><span className="muted xs"><Tv v={m?.check.how} /></span><textarea className="input" rows={2} value={out} onChange={e => setOut(e.target.value)} placeholder={m?.check.sample || 'Paste the result here'} /></label>
      <Err m={fe.versionOutput} /><div><button className="btn btn-gold" type="button" disabled={!out.trim() || (needsNode && !node.trim())} onClick={() => onSave({ method, versionOutput: out, ...(needsNode ? { nodeVersion: node } : {}) })}><Tr>Save install</Tr></button></div></div>
  </div>);
}

function Connect({ info, quiz, done, onSave, fe }: { info: AgentInfo; quiz: Props['keyQuiz']; done: boolean; onSave: (d: unknown) => void; fe: Record<string, string> }) {
  const [q, setQ] = useState<number | null>(done ? 1 : null); const [ok, setOk] = useState(done);
  return (<div className="stack gap-12">
    <p className="text-2"><b><Tr>Access:</Tr></b> <Tv v={info.access} />{info.freeOption ? ` Free option: ${info.freeOption}` : ''}</p>
    <p className="callout warn small"><ShieldAlert size={16} aria-hidden="true" /> <span><Tv v={info.safety} /> <Tr>An API key is like a recharge code: anyone who has it can spend your money.</Tr></span></p>
    <fieldset className="q" style={{ border: 0 }}><legend><Tv v={quiz.q} /></legend>{quiz.options.map((o, i) => <label key={i} className="opt"><input type="radio" name="kq" checked={q === i} onChange={() => setQ(i)} /><Tv v={o} /></label>)}</fieldset>
    <Err m={fe.quiz} />
    <label className="row gap-12 small"><input type="checkbox" checked={ok} onChange={e => setOk(e.target.checked)} /><Tr>I signed in on my own computer and did not paste any key on this website.</Tr></label>
    <div><button className="btn btn-gold" type="button" disabled={q === null || !ok} onClick={() => onSave({ quiz: q, noKeyShared: true })}><Tr>Save</Tr></button></div></div>);
}


function Result({ runId, info, savedShot, savedMeta, savedSummary, savedVerified, onSave, fe }: { runId: string; info: AgentInfo; savedShot: string | null; savedMeta: { width: number | null; height: number | null } | null; savedSummary: string; savedVerified: string; onSave: (d: unknown) => void; fe: Record<string, string> }) {
  const [summary, setSummary] = useState(savedSummary); const [verified, setVerified] = useState(savedVerified);
  const [shot, setShot] = useState<Shot | null>(savedShot ? { id: savedShot, name: 'Your saved screenshot', width: savedMeta?.width ?? null, height: savedMeta?.height ?? null, preview: `/api/v1/files/${savedShot}?inline=1` } : null);
  const ready = !!shot && summary.trim().length > 0 && verified.trim().length > 0;
  return (<div className="stack gap-12">
    <p className="text-2"><Tr>Paste the prompt you built into</Tr> {info.name}<Tr>, let it work, then show us what happened.</Tr></p>
    <label className="stack gap-8"><span className="row between gap-8"><span className="bold small"><Tr>What did the agent produce?</Tr></span></span><span className="muted xs"><Tr>Files, code, a plan, an answer: describe what you got.</Tr></span><textarea className="input" rows={4} value={summary} onChange={e => setSummary(e.target.value)} /></label><Err m={fe.summary} />
    <label className="stack gap-8"><span className="row between gap-8"><span className="bold small"><Tr>How did you check it worked?</Tr></span></span><span className="muted xs"><Tr>Ran it, opened it, tested it, compared with what you asked.</Tr></span><textarea className="input" rows={3} value={verified} onChange={e => setVerified(e.target.value)} /></label><Err m={fe.verified} />
    <div className="stack gap-8"><span className="bold small"><Tr>Screenshot of the result</Tr></span><span className="muted xs"><Tr>It should show</Tr> {info.name} <Tr>itself and the result you described. Your reviewer checks this.</Tr></span>
      <ScreenshotInput runId={runId} value={shot} onChange={setShot} error={fe.screenshotId} /></div>
    <div><button className="btn btn-gold" type="button" disabled={!ready} onClick={() => onSave({ summary, verified, screenshotId: shot!.id })}><Tr>Save result</Tr></button>{!ready && <span className="muted xs" style={{ marginLeft: 8 }}>{!shot ? <Tr>Add your screenshot.</Tr> : <Tr>Add a little more to the write-up.</Tr>}</span>}</div>
    <p className="muted xs"><Tr>Need help?</Tr> <Link className="link" href="/coach"><Tr>Ask an AI coach</Tr></Link> <Tr>or your mentor.</Tr> <a className="link" href={info.source[0]} target="_blank" rel="noopener noreferrer"><Tr>Official setup guide</Tr> <ExternalLink size={12} /></a></p></div>);
}
