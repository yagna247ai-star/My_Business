import Link from "next/link";
import { ROLES, TRACKS } from "@/lib/catalog";

export default function Home() {
  return (
    <main>
      <header className="top">
        <div>
          <h1>Architect Interview Prep Simulator</h1>
          <p className="muted">TestGorilla-style assessments + AI-style conversational mock interviews for 5–25 yrs experience.</p>
        </div>
        <nav>
          <Link href="/" className="active">Home</Link>
          <Link href="/assessment">Assessment</Link>
          <Link href="/mock">Mock Interview</Link>
          <Link href="/results">Results</Link>
        </nav>
      </header>

      <div className="grid grid-2">
        <section className="card">
          <h2>Assessment mode</h2>
          <p>Timed, role/track-specific questions (MCQ, scenario, design/coding prompts) with structured rubric-based scoring and competency report.</p>
          <div className="row" style={{marginTop:12}}>
            <Link className="btn" href="/assessment">Start assessment</Link>
            <Link className="btn secondary" href="/results">View past reports</Link>
          </div>
        </section>
        <section className="card">
          <h2>Conversational mock interview</h2>
          <p>Live interview flow with interviewer prompts and follow-ups by role and experience track. Get per-answer notes and a final feedback summary.</p>
          <div className="row" style={{marginTop:12}}>
            <Link className="btn" href="/mock">Start mock interview</Link>
          </div>
        </section>
      </div>

      <section className="card" style={{marginTop:16}}>
        <h3>Coverage (MVP)</h3>
        <div className="grid grid-2">
          <div>
            <h4>Roles</h4>
            {ROLES.map(r => (
              <div key={r.id} style={{marginBottom:10}}>
                <strong>{r.name}</strong>
                <div>{r.focus.map(f => <span className="pill" key={f}>{f}</span>)}</div>
              </div>
            ))}
          </div>
          <div>
            <h4>Experience tracks</h4>
            {TRACKS.map(t => (
              <div key={t.id} style={{marginBottom:10}}>
                <strong>{t.name}</strong> <span className="muted">({t.years})</span>
                <p className="small" style={{margin:"4px 0 0"}}>{t.expectation}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
