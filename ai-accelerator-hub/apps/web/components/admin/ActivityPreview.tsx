/**
 * An activity as a reviewer needs to see it: everything the learner sees, plus what they never see
 * (correct answers, Boss right moves, explanations, pass rules), clearly marked.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { CheckCircle2, Circle } from 'lucide-react';

const KIND: Record<string, string> = { briefing: 'Mission briefing', learn: 'Learn and quiz', explore: 'Explore a repository', build: 'Build with AI', proof: 'Submit proof', boss: 'Boss challenge', screenshot: 'Screenshot evidence', dataset: 'Dataset check', unauthored: 'Not written yet' };

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="stack gap-8" style={{ marginTop: 14 }}><h4 className="section-label" style={{ margin: 0 }}>{title}</h4>{children}</section>
);
const Answer = ({ ok, children }: { ok: boolean; children: React.ReactNode }) => (
  <li className="row gap-8 small" style={{ alignItems: 'flex-start', padding: '4px 8px', borderRadius: 8, background: ok ? 'var(--success-tint)' : undefined, fontWeight: ok ? 600 : 400 }}>
    {ok ? <CheckCircle2 size={15} style={{ color: 'var(--success)', flex: 'none', marginTop: 2 }} aria-label="Correct answer" /> : <Circle size={15} style={{ flex: 'none', marginTop: 2, opacity: 0.4 }} aria-hidden="true" />}<span>{children}</span>
  </li>
);
const List = ({ items }: { items?: string[] }) => items?.length ? <ul className="small" style={{ margin: 0, paddingLeft: 20, listStyle: 'disc', lineHeight: 1.6 }}>{items.map((x, i) => <li key={i}>{x}</li>)}</ul> : <p className="muted small" style={{ margin: 0 }}>None</p>;
const Question = ({ n, q }: { n?: number; q: any }) => (
  <div className="card card-pad" style={{ padding: 12 }}>
    <b className="small">{n ? `${n}. ` : ''}{q.q}</b>
    <ul className="stack gap-4" style={{ listStyle: 'none', padding: 0, margin: '8px 0 0' }}>{(q.options ?? []).map((o: string, i: number) => <Answer key={i} ok={i === q.answer}>{o}</Answer>)}</ul>
    {q.why && <p className="muted xs" style={{ margin: '8px 0 0' }}><b>Explanation shown to the learner:</b> {q.why}</p>}
  </div>
);

export function ActivityPreview({ a }: { a: { idx: number; title: string; xp: number; config: any } }) {
  const c = a.config ?? {};
  return (
    <div>
      <div className="row gap-8 wrap" style={{ alignItems: 'center' }}>
        <span className="badge badge-neutral">{KIND[c.kind] ?? c.kind ?? 'Unknown'}</span><span className="badge badge-gold">{a.xp} XP</span>
        {c.estMinutes && <span className="muted xs">About {c.estMinutes} min</span>}{c.draft && <span className="badge badge-neutral">Marked draft in the source</span>}
      </div>
      {c.kind === 'briefing' && <>
        <Section title="Problem"><p className="small" style={{ margin: 0 }}>{c.problem}</p></Section>
        <Section title="Objective and expected outcome"><p className="small" style={{ margin: 0 }}><b>Objective:</b> {c.objective}</p><p className="small" style={{ margin: 0 }}><b>Outcome:</b> {c.outcome}</p></Section>
        <Section title="Evaluated on"><List items={c.criteria} /></Section>
        {c.check && <Section title="Check question"><Question q={c.check} /></Section>}
      </>}
      {c.kind === 'learn' && <>
        <Section title={`Lessons (${c.lessons?.length ?? 0})`}>{(c.lessons ?? []).map((l: any, i: number) => <details key={i} className="card card-pad" style={{ padding: 12 }} open={i === 0}><summary className="small bold" style={{ cursor: 'pointer' }}>{l.title} <span className="muted xs">· {l.minutes} min</span></summary><p className="small" style={{ margin: '8px 0 0', lineHeight: 1.6 }}>{l.body}</p></details>)}</Section>
        <Section title={`Quiz · pass at ${c.passPct ?? 60}%`}>{(c.quiz ?? []).map((q: any, i: number) => <Question key={i} n={i + 1} q={q} />)}</Section>
      </>}
      {c.kind === 'explore' && <>
        <Section title="Repository"><p className="small" style={{ margin: 0 }}><b>{c.repo?.fullName}</b> · {c.repo?.description} · <a className="link" href={c.repo?.url} target="_blank" rel="noopener noreferrer">open</a></p></Section>
        <Section title="Task"><p className="small" style={{ margin: 0 }}>{c.task}</p></Section>
        <Section title={`Questions · pass with ${c.passMin} right`}>{(c.questions ?? []).map((q: any, i: number) => <Question key={i} n={i + 1} q={q} />)}</Section>
      </>}
      {c.kind === 'build' && <>
        <Section title="Fields the learner fills in">{(c.fields ?? []).map((f: any) => <div key={f.key} className="small"><b>{f.label}</b><div className="muted xs">Example shown: {f.hint}</div></div>)}</Section>
        <Section title="AI tools offered"><p className="small" style={{ margin: 0 }}>{(c.tools ?? []).join(', ')}</p></Section>
        <Section title="How answers are checked"><p className="small" style={{ margin: 0 }}>Each answer must be a real, relevant answer in the learner’s own words (no word counts); personal data is blocked. When an AI provider is available it also flags off-topic answers.</p></Section>
      </>}
      {c.kind === 'proof' && <>
        <Section title="Evidence accepted"><List items={c.evidenceTypes} /></Section>
        <Section title="Checklist the learner confirms"><List items={c.checklist} /></Section>
      </>}
      {c.kind === 'screenshot' && <>
        <Section title="The screenshot should show"><List items={c.shows} /></Section>
        <Section title="Checklist"><List items={c.checklist} /></Section>
        <Section title="Rule"><p className="small" style={{ margin: 0 }}>At least {c.minWidth}×{c.minHeight} pixels, the learner’s own upload.</p></Section>
      </>}
      {c.kind === 'dataset' && <>
        <Section title="Instructions"><p className="small" style={{ margin: 0 }}>{c.instructions}</p></Section>
        <Section title={`Dataset “${c.schema?.name}” · at least ${c.schema?.minRows} rows`}>
          <div className="table-wrap"><table className="tbl"><thead><tr><th>Column</th><th>Type</th><th>Rule</th></tr></thead><tbody>{(c.schema?.columns ?? []).map((col: any) => <tr key={col.name}><td className="mono small">{col.name}{col.key ? ' (key)' : ''}</td><td className="small">{col.type}</td><td className="small">{col.values ? col.values.join(', ') : col.min !== undefined ? `${col.min} to ${col.max}` : col.required === false ? 'optional' : 'required'}</td></tr>)}</tbody></table></div>
        </Section>
      </>}
      {c.kind === 'boss' && <>
        <Section title="Introduction"><p className="small" style={{ margin: 0 }}>{c.intro}</p></Section>
        <Section title={`Scenarios · ${c.attempts} attempts`}>{(c.scenarios ?? []).map((s: any, i: number) => (
          <div key={i} className="card card-pad" style={{ padding: 12 }}><b className="small">{i + 1}. {s.s}</b>
            <ul className="stack gap-4" style={{ listStyle: 'none', padding: 0, margin: '8px 0 0' }}>{(c.choices ?? []).map((ch: string, j: number) => <Answer key={j} ok={(s.correct ?? []).includes(j)}>{ch}</Answer>)}</ul></div>
        ))}</Section>
      </>}
      {(!c.kind || !KIND[c.kind]) && <Section title="Raw configuration"><pre className="mono xs" style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{JSON.stringify(c, null, 2)}</pre></Section>}
    </div>
  );
}
