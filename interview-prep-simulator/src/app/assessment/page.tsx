"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { QUESTIONS } from "@/data/questions";
import { ROLES, TRACKS } from "@/lib/catalog";
import { aggregateScore, saveResult } from "@/lib/scoring";
import { Answer, Question } from "@/lib/types";

function pickQuestions(role: string, track: string, count = 6): Question[] {
  return QUESTIONS.filter(q => q.role === role && q.track === track).slice(0, count);
}

export default function AssessmentPage() {
  const [role, setRole] = useState(ROLES[0].id);
  const [track, setTrack] = useState(TRACKS[0].id);
  const [started, setStarted] = useState(false);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [done, setDone] = useState(false);
  const [result, setResult] = useState<any>(null);

  const qs = useMemo(() => pickQuestions(role, track, 6), [role, track]);
  const q = qs[idx];

  function updateAnswer(patch: Partial<Answer>) {
    if (!q) return;
    setAnswers(prev => {
      const prevAns = prev[q.id];
      const next: Answer = {
        questionId: q.id,
        response: patch.response ?? prevAns?.response ?? "",
        selectedIndex: patch.selectedIndex ?? prevAns?.selectedIndex,
        timeSpentSec: patch.timeSpentSec ?? prevAns?.timeSpentSec ?? Math.round(q.timeLimitSec * 0.7),
      };
      return { ...prev, [q.id]: next };
    });
  }

  function submit() {
    const ans = qs.map(qu => answers[qu.id] || { questionId: qu.id, response: "", timeSpentSec: qu.timeLimitSec });
    const agg = aggregateScore(qs, ans);
    const res = { id: `assess_${Date.now()}`, role, track, mode: "assessment", answers: ans, score: agg.score, feedback: agg.feedback, strengths: agg.strengths, improvements: agg.improvements, completedAt: new Date().toISOString() };
    saveResult(res);
    setResult(res);
    setDone(true);
  }

  const progress = qs.length ? Math.round(((idx + (done ? 1 : 0)) / qs.length) * 100) : 0;

  return (
    <main>
      <header className="top">
        <div><h1>Assessment mode</h1><p className="muted">Timed, curated questions with rubric-based scoring.</p></div>
        <nav><Link href="/">Home</Link><Link href="/assessment" className="active">Assessment</Link><Link href="/mock">Mock Interview</Link><Link href="/results">Results</Link></nav>
      </header>

      {!started ? (
        <section className="card">
          <h2>Configure assessment</h2>
          <div className="grid grid-2">
            <div>
              <label>Role</label>
              <select value={role} onChange={e=>setRole(e.target.value)}>{ROLES.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select>
            </div>
            <div>
              <label>Experience track</label>
              <select value={track} onChange={e=>setTrack(e.target.value)}>{TRACKS.map(t=><option key={t.id} value={t.id}>{t.name} ({t.years})</option>)}</select>
            </div>
          </div>
          <p className="small muted" style={{marginTop:12}}>Includes 6 curated questions for the selected role/track (MCQ, scenario, design prompts). Time guidance shown per question.</p>
          <div className="row" style={{marginTop:12}}>
            <button className="btn" onClick={()=>{setStarted(true); setIdx(0); setAnswers({}); setDone(false); setResult(null);}}>Begin assessment</button>
          </div>
        </section>
      ) : !done ? (
        <section className="card">
          <div className="row" style={{justifyContent:"space-between"}}>
            <div><span className="pill">{q.type.toUpperCase()}</span><span className="pill">{q.competency}</span><span className="pill">~{Math.round(q.timeLimitSec/60)} min</span></div>
            <div className="muted small">Question {idx+1} / {qs.length}</div>
          </div>
          <div className="progress" style={{margin:"12px 0"}}><span style={{width:`${progress}%`}} /></div>
          <h3>{q.prompt}</h3>
          {q.type === "mcq" ? (
            <div>
              {q.options?.map((opt,i)=>(
                <div key={i} className={`option ${answers[q.id]?.selectedIndex===i?"selected":""}`} onClick={()=>updateAnswer({selectedIndex:i, response:opt})}>
                  {opt}
                </div>
              ))}
            </div>
          ) : (
            <div>
              <label>Your answer (cover approach, trade-offs, metrics/NFRs as relevant)</label>
              <textarea value={answers[q.id]?.response||""} onChange={e=>updateAnswer({response:e.target.value})} placeholder="Type your structured answer..." />
            </div>
          )}
          <div className="row" style={{marginTop:12, justifyContent:"space-between"}}>
            <button className="btn secondary" disabled={idx===0} onClick={()=>setIdx(i=>i-1)}>Back</button>
            <div className="row">
              {idx < qs.length-1 ? (
                <button className="btn" onClick={()=>setIdx(i=>i+1)}>Next</button>
              ) : (
                <button className="btn" onClick={submit}>Submit & score</button>
              )}
            </div>
          </div>
        </section>
      ) : (
        <Report result={result} />
      )}
    </main>
  );
}

function Report({ result }: { result: any }) {
  if (!result) return null;
  const s = result.score;
  return (
    <section className="card">
      <h2>Assessment report</h2>
      <div className="grid grid-3">
        <div className="card"><div className="muted small">Overall</div><div className="kpi">{s.total}</div></div>
        <div className="card"><div className="muted small">Depth</div><div className="kpi">{s.depth}</div></div>
        <div className="card"><div className="muted small">Trade-offs & NFRs</div><div className="kpi">{s.tradeoffs}</div></div>
      </div>
      <div className="grid grid-2" style={{marginTop:12}}>
        <div className="card">
          <h3>Competency breakdown</h3>
          <table className="table"><tbody>
            {Object.entries(s.byCompetency).map(([k,v]: any)=>(
              <tr key={k}><td>{k}</td><td><strong>{v}</strong>/100</td></tr>
            ))}
          </tbody></table>
        </div>
        <div className="card">
          <h3>Strengths</h3>
          <ul>{result.strengths.map((x:string,i:number)=><li key={i}>{x}</li>)}</ul>
          <h3>Improve next</h3>
          <ul>{result.improvements.map((x:string,i:number)=><li key={i}>{x}</li>)}</ul>
        </div>
      </div>
      <div className="card" style={{marginTop:12}}>
        <h3>Feedback notes</h3>
        <ul>{result.feedback.map((f:string,i:number)=><li key={i} className="small">{f}</li>)}</ul>
      </div>
      <div className="row" style={{marginTop:12}}>
        <Link className="btn" href="/results">Open results history</Link>
        <Link className="btn secondary" href="/assessment">Run another</Link>
      </div>
    </section>
  );
}
