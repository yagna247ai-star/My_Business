"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { QUESTIONS } from "@/data/questions";
import { ROLES, TRACKS } from "@/lib/catalog";
import { aggregateScore, saveResult, scoreQuestion } from "@/lib/scoring";
import { Answer, Question } from "@/lib/types";

type Msg = { from: "ai" | "user"; text: string };

function pick(role: string, track: string, n = 5): Question[] {
  const pool = QUESTIONS.filter(q => q.role === role && q.track === track);
  const scenario = pool.filter(q=>q.type!=="mcq");
  const rest = pool.filter(q=>q.type==="mcq");
  return [...scenario, ...rest].slice(0, n);
}

export default function MockPage() {
  const [role, setRole] = useState<string>(ROLES[0].id);
  const [track, setTrack] = useState<string>(TRACKS[0].id);
  const [started, setStarted] = useState(false);
  const [qs, setQs] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState<any>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:"smooth"}); }, [msgs]);

  function start() {
    const selected = pick(role, track, 5);
    setQs(selected); setIdx(0); setAnswers([]); setDone(false); setResult(null);
    const intro = `Hi, I'll be your interviewer for ${ROLES.find(r=>r.id===role)?.name} (${TRACKS.find(t=>t.id===track)?.years}). I'll ask ${selected.length} questions with follow-ups on depth and trade-offs. Let's begin.`;
    setMsgs([{from:"ai", text:intro}, {from:"ai", text:`Q1: ${selected[0].prompt}`}]);
    setStarted(true);
  }

  function send() {
    if (!input.trim() || done || !qs[idx]) return;
    const q = qs[idx];
    const userText = input.trim();
    const a: Answer = { questionId: q.id, response: userText, timeSpentSec: Math.round(q.timeLimitSec*0.7) };
    const per = scoreQuestion(q, a);
    const follow = per.score >= 75
      ? "Good coverage. Follow-up: what metrics or failure modes would you monitor in production?"
      : "Follow-up: can you add key trade-offs, edge cases, and how you'd validate this in production?";
    const note = per.score >= 75 ? "Interviewer note: strong answer." : "Interviewer note: needs more depth/trade-offs.";
    const nextIdx = idx + 1;
    const newAnswers = [...answers, a];
    const newMsgs: Msg[] = [...msgs, {from:"user", text:userText}, {from:"ai", text:note + " " + follow}];
    if (nextIdx < qs.length) {
      newMsgs.push({from:"ai", text:`Q${nextIdx+1}: ${qs[nextIdx].prompt}`});
      setMsgs(newMsgs); setAnswers(newAnswers); setIdx(nextIdx); setInput("");
    } else {
      const agg = aggregateScore(qs, newAnswers);
      const res = { id:`mock_${Date.now()}`, role, track, mode:"mock", answers:newAnswers, score:agg.score, feedback:agg.feedback, strengths:agg.strengths, improvements:agg.improvements, completedAt:new Date().toISOString() };
      saveResult(res);
      newMsgs.push({from:"ai", text:`Thanks — that's the end of the mock interview. Overall score: ${agg.score.total}/100. Open Results for full feedback.`});
      setMsgs(newMsgs); setAnswers(newAnswers); setDone(true); setResult(res); setInput("");
    }
  }

  return (
    <main>
      <header className="top">
        <div><h1>Conversational mock interview</h1><p className="muted">Role/track-based interviewer flow with follow-ups and rubric feedback.</p></div>
        <nav><Link href="/">Home</Link><Link href="/assessment">Assessment</Link><Link href="/mock" className="active">Mock Interview</Link><Link href="/results">Results</Link></nav>
      </header>

      {!started ? (
        <section className="card">
          <h2>Configure mock interview</h2>
          <div className="grid grid-2">
            <div><label>Role</label><select value={role} onChange={e=>setRole(e.target.value)}>{ROLES.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select></div>
            <div><label>Experience track</label><select value={track} onChange={e=>setTrack(e.target.value)}>{TRACKS.map(t=><option key={t.id} value={t.id}>{t.name} ({t.years})</option>)}</select></div>
          </div>
          <div className="row" style={{marginTop:12}}><button className="btn" onClick={start}>Start interview</button></div>
        </section>
      ) : (
        <section className="card">
          <div className="row" style={{justifyContent:"space-between"}}>
            <div><span className="pill">{ROLES.find(r=>r.id===role)?.name}</span><span className="pill">{TRACKS.find(t=>t.id===track)?.name}</span></div>
            <div className="muted small">{done ? "Completed" : `Question ${Math.min(idx+1, qs.length)} / ${qs.length}`}</div>
          </div>
          <div className="chat" style={{marginTop:12, maxHeight:420, overflow:"auto", paddingRight:4}}>
            {msgs.map((m,i)=>(<div key={i} className={`bubble ${m.from}`}>{m.text}</div>))}
            <div ref={endRef} />
          </div>
          {!done ? (
            <div style={{marginTop:12}}>
              <label>Your response</label>
              <textarea value={input} onChange={e=>setInput(e.target.value)} placeholder="Answer with approach, trade-offs, and examples..." />
              <div className="row" style={{marginTop:8, justifyContent:"space-between"}}>
                <span className="small muted">Tip: include assumptions, NFRs, risks, and metrics.</span>
                <button className="btn" onClick={send} disabled={!input.trim()}>Send answer</button>
              </div>
            </div>
          ) : (
            <div style={{marginTop:12}} className="row">
              <Link className="btn" href="/results">View full report</Link>
              <button className="btn secondary" onClick={()=>{setStarted(false);}}>New mock interview</button>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
