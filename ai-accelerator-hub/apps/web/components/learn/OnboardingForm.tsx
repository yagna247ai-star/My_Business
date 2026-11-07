'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Check } from 'lucide-react';
import { api, ApiError } from '@/lib/client/api';
import type { Answers, Plan } from '@/lib/domain/personalise';

type Opt<T extends string | number> = { v: T; l: string; d?: string };
const ROLE: Opt<Answers['role']>[] = [
  { v: 'school_student', l: 'School student', d: 'Learning at school, maybe coding as a hobby' },
  { v: 'college_student', l: 'College student', d: 'Preparing for a career or placements' },
  { v: 'working_professional', l: 'Working professional', d: 'Software engineer, architect, engineer or other role' },
  { v: 'builder', l: 'I want to build something with AI', d: 'An app, a tool or an automation' },
  { v: 'business_owner', l: 'I run a business', d: 'Shop, service, agency or startup' },
];
const PROF: Opt<NonNullable<Answers['profession']>>[] = [{ v: 'software_engineer', l: 'Software engineer' }, { v: 'architect', l: 'Architect (software or solutions)' }, { v: 'other_engineer', l: 'Other engineer (data, QA, DevOps, hardware…)' }, { v: 'non_engineering', l: 'Non-engineering role' }];
const COMFORT: Opt<Answers['codingComfort']>[] = [{ v: 'none', l: 'I have never coded' }, { v: 'basic', l: 'I can read and change simple code' }, { v: 'daily', l: 'I code most days' }];
const GOAL: Opt<Answers['goal']>[] = [{ v: 'learn_fundamentals', l: 'Understand AI properly' }, { v: 'get_job', l: 'Get a job or internship' }, { v: 'upskill_at_work', l: 'Use AI better at work' }, { v: 'build_product', l: 'Build a product' }, { v: 'automate_business', l: 'Automate my work or business' }, { v: 'start_ai_business', l: 'Start an AI business or service' }];
const HOURS: Opt<Answers['hoursPerWeek']>[] = [{ v: 2, l: 'About 2 hours' }, { v: 5, l: 'About 5 hours' }, { v: 10, l: 'About 10 hours' }, { v: 15, l: '15 hours or more' }];
const OS: Opt<Answers['os']>[] = [{ v: 'macos', l: 'macOS' }, { v: 'windows', l: 'Windows' }, { v: 'linux', l: 'Linux' }, { v: 'chromebook', l: 'Chromebook' }, { v: 'unsure', l: 'Not sure' }];
const STYLE: Opt<Answers['learningStyle']>[] = [{ v: 'watch', l: 'Watch a demo first' }, { v: 'read', l: 'Read first' }, { v: 'do', l: 'Try it first' }];

function Choice<T extends string | number>({ name, legend, opts, value, onChange }: { name: string; legend: string; opts: Opt<T>[]; value: T | undefined; onChange: (v: T) => void }) {
  return (<fieldset className="q" style={{ border: 0 }}><legend className="bold">{legend}</legend>
    {opts.map(o => <label key={String(o.v)} className="opt"><input type="radio" name={name} checked={value === o.v} onChange={() => onChange(o.v)} /><span>{o.l}{o.d && <span className="muted xs" style={{ display: 'block' }}>{o.d}</span>}</span></label>)}
  </fieldset>);
}

export function OnboardingForm({ initial, initialPlan, minor }: { initial: Partial<Answers> | null; initialPlan: Plan | null; minor: boolean }) {
  const router = useRouter();
  const [a, setA] = useState<Partial<Answers>>(initial || {});
  const [plan, setPlan] = useState<Plan | null>(initialPlan);
  const [editing, setEditing] = useState(!initialPlan);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const set = <K extends keyof Answers>(k: K, v: Answers[K]) => setA(x => ({ ...x, [k]: v }));
  const ready = a.role && a.codingComfort && a.goal && a.hoursPerWeek && a.os && a.learningStyle && (a.role !== 'working_professional' || a.profession);
  const save = async () => { setBusy(true); setErr(''); try { const r = await api<{ plan: Plan }>('/api/v1/profile', { method: 'PUT', body: a }); setPlan(r.plan); setEditing(false); router.refresh(); } catch (e) { setErr((e as ApiError).message); } finally { setBusy(false); } };

  if (plan && !editing) return (
    <section className="card card-pad stack gap-16" aria-labelledby="planT">
      <div><span className="badge badge-gold">{plan.label}</span><h2 className="h2" id="planT" style={{ marginTop: 8 }}>{plan.headline}</h2></div>
      <div className="grid2" style={{ gap: 14 }}>
        <div className="kv"><span>Mode</span><span>{plan.mode}</span></div>
        <div className="kv"><span>Pace</span><span>{plan.pace.note}</span></div>
      </div>
      <div><h3 className="h3" style={{ marginBottom: 8 }}>Levels we will put extra focus on</h3><ul className="checklist">{plan.emphasis.map(e => <li key={e.levelIdx}><Check size={16} aria-hidden="true" /><span><b>Level {e.levelIdx}</b> — {e.why}</span></li>)}</ul><p className="muted xs" style={{ marginTop: 6 }}>Every level still unlocks only when you pass it. Your path changes examples and support, not the bar.</p></div>
      <div><h3 className="h3" style={{ marginBottom: 8 }}>Your AI agent options</h3><ul className="checklist">{plan.agents.map(g => <li key={g.code}><span className="badge badge-neutral">{g.rank}</span><span><b>{g.name}</b> — {g.why}{!g.allowed && <span className="field-err" style={{ display: 'block' }}>{g.blockedReason}</span>}</span></li>)}</ul></div>
      <ul className="checklist">{plan.support.map(x => <li key={x}><Check size={16} aria-hidden="true" /><span>{x}</span></li>)}</ul>
      <div className="row gap-12 wrap"><Link className="btn btn-gold" href="/levels/L01_AI_EXPLORER">Start Level 1 <ArrowRight size={15} /></Link><Link className="btn btn-outline" href="/agent-lab">Set up your AI agent</Link><button className="btn btn-text" type="button" onClick={() => setEditing(true)}>Change my answers</button></div>
    </section>
  );

  return (
    <section className="card card-pad stack gap-16" aria-labelledby="obT">
      <h2 className="h3" id="obT">Tell us about you — 2 minutes</h2>
      <p className="text-2 small">Your answers choose the examples, demos, questions, pace and AI tools you see. You can change them any time. Do not include phone numbers or emails.</p>
      {minor && <p className="callout info small">You are under 18, so we keep you private by default and recommend free tools that need no payment card.</p>}
      <Choice name="role" legend="Which describes you best?" opts={ROLE} value={a.role} onChange={v => set('role', v)} />
      {a.role === 'school_student' && <label className="row gap-12"><input type="checkbox" checked={!!a.pythonHobby} onChange={e => set('pythonHobby', e.target.checked)} />I am learning Python (or another language) as a hobby</label>}
      {a.role === 'working_professional' && <Choice name="prof" legend="What kind of work do you do?" opts={PROF} value={a.profession} onChange={v => set('profession', v)} />}
      <Choice name="comfort" legend="How comfortable are you with code?" opts={COMFORT} value={a.codingComfort} onChange={v => set('codingComfort', v)} />
      <Choice name="goal" legend="What do you most want from this journey?" opts={GOAL} value={a.goal} onChange={v => set('goal', v)} />
      <Choice name="hours" legend="How much time can you give each week?" opts={HOURS} value={a.hoursPerWeek} onChange={v => set('hoursPerWeek', v)} />
      <Choice name="os" legend="Which computer will you use?" opts={OS} value={a.os} onChange={v => set('os', v)} />
      <Choice name="style" legend="How do you like to learn?" opts={STYLE} value={a.learningStyle} onChange={v => set('learningStyle', v)} />
      <label className="stack gap-8"><span className="bold">Your field or interest (optional)</span><input className="input" maxLength={80} placeholder="e.g. cricket, healthcare, tiffin service, fintech" value={a.domain || ''} onChange={e => set('domain', e.target.value)} /></label>
      <label className="stack gap-8"><span className="bold">Your context card (optional)</span><span className="muted xs">One short page about you that the AI coach reads first, so every chat starts already knowing you: what you do, what you want to build, how you like explanations.</span><textarea className="input" rows={4} maxLength={1200} value={a.contextCard || ''} onChange={e => set('contextCard', e.target.value)} /></label>
      {err && <p className="field-err" role="alert">{err}</p>}
      <div className="row gap-12"><button className="btn btn-gold" type="button" disabled={!ready || busy} onClick={save}>{busy ? 'Saving…' : 'Build my path'}</button>{initialPlan && <button className="btn btn-text" type="button" onClick={() => setEditing(false)}>Cancel</button>}</div>
    </section>
  );
}
