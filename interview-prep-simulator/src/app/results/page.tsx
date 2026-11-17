"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { roleById, trackById } from "@/lib/catalog";
import { loadResults } from "@/lib/scoring";

export default function ResultsPage() {
  const [results, setResults] = useState<any[]>([]);
  useEffect(() => { setResults(loadResults()); }, []);

  return (
    <main>
      <header className="top">
        <div><h1>Results & reports</h1><p className="muted">Recent assessment and mock interview reports stored locally in your browser.</p></div>
        <nav><Link href="/">Home</Link><Link href="/assessment">Assessment</Link><Link href="/mock">Mock Interview</Link><Link href="/results" className="active">Results</Link></nav>
      </header>

      {!results.length ? (
        <section className="card"><p>No results yet. Run an <Link href="/assessment">assessment</Link> or <Link href="/mock">mock interview</Link>.</p></section>
      ) : (
        <div className="grid">
          {results.map((r) => (
            <section className="card" key={r.id}>
              <div className="row" style={{justifyContent:"space-between"}}>
                <div>
                  <strong>{roleById(r.role)?.name || r.role}</strong> · <span className="muted">{trackById(r.track)?.name || r.track}</span>
                  <div className="small muted">{new Date(r.completedAt).toLocaleString()} · {r.mode === "mock" ? "Mock interview" : "Assessment"}</div>
                </div>
                <div className="kpi">{r.score?.total ?? 0}</div>
              </div>
              <div className="grid grid-3" style={{marginTop:10}}>
                <div><div className="muted small">Depth</div><strong>{r.score?.depth ?? 0}</strong></div>
                <div><div className="muted small">Trade-offs</div><strong>{r.score?.tradeoffs ?? 0}</strong></div>
                <div><div className="muted small">Communication</div><strong>{r.score?.communication ?? 0}</strong></div>
              </div>
              <hr />
              <div className="grid grid-2">
                <div>
                  <div className="muted small">Strengths</div>
                  <ul>{(r.strengths||[]).map((s:string,i:number)=><li key={i}>{s}</li>)}</ul>
                </div>
                <div>
                  <div className="muted small">Improve next</div>
                  <ul>{(r.improvements||[]).map((s:string,i:number)=><li key={i}>{s}</li>)}</ul>
                </div>
              </div>
              {r.score?.byCompetency && (
                <details style={{marginTop:8}}>
                  <summary className="muted small">Competency breakdown</summary>
                  <table className="table"><tbody>
                    {Object.entries(r.score.byCompetency).map(([k,v]: any)=>(<tr key={k}><td>{k}</td><td>{v}/100</td></tr>))}
                  </tbody></table>
                </details>
              )}
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
