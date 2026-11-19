'use client';
import { useState } from 'react';

type CohortOpt = { id: string; name: string };

/** Builder for a hackathon: title, brief, team size and the cohort it belongs to. */
export function HackathonBuilder({ cohorts }: { cohorts: CohortOpt[] }) {
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [briefMd, setBriefMd] = useState('');
  const [cohortId, setCohortId] = useState('');
  const [maxTeamSize, setMaxTeamSize] = useState(4);
  const [rubricCode, setRubricCode] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null); setErr(false);
    try {
      const r = await fetch('/api/v1/hackathons', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slug, title, briefMd: briefMd || undefined, cohortId: cohortId || undefined, maxTeamSize, rubricCode: rubricCode || undefined }),
      });
      const j = await r.json();
      if (!r.ok) { setErr(true); setMsg(j?.error?.message || 'Could not create the hackathon.'); return; }
      setMsg(`Created "${title}" as a draft. Open it to set the status when teams can start.`);
      setSlug(''); setTitle(''); setBriefMd('');
    } catch {
      setErr(true); setMsg('Network error. Nothing was saved.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card card-pad stack gap-12" aria-label="Hackathon builder">
      <label className="stack gap-4"><span className="bold">Hackathon title</span>
        <input className="input" value={title} onChange={e => { setTitle(e.target.value); if (!slug) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)); }} maxLength={120} required />
      </label>
      <label className="stack gap-4"><span className="bold">Web address (slug)</span>
        <input className="input" value={slug} onChange={e => setSlug(e.target.value.toLowerCase())} maxLength={40} required />
        <span className="muted xs">3–40 lowercase letters, numbers or dashes.</span>
      </label>
      <label className="stack gap-4"><span className="bold">Brief (what teams build)</span>
        <textarea className="input" value={briefMd} onChange={e => setBriefMd(e.target.value)} rows={6} maxLength={20000} />
      </label>
      <div className="row gap-12 wrap">
        <label className="stack gap-4"><span className="bold">Cohort</span>
          <select className="input" value={cohortId} onChange={e => setCohortId(e.target.value)}>
            <option value="">All cohorts in this institution</option>
            {cohorts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label className="stack gap-4"><span className="bold">Max team size</span>
          <input className="input" type="number" min={1} max={8} value={maxTeamSize} onChange={e => setMaxTeamSize(Number(e.target.value))} style={{ width: 110 }} />
        </label>
        <label className="stack gap-4"><span className="bold">Rubric code (optional)</span>
          <input className="input" value={rubricCode} onChange={e => setRubricCode(e.target.value)} maxLength={40} />
        </label>
      </div>
      <div className="row gap-12 wrap" style={{ alignItems: 'center' }}>
        <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? 'Creating…' : 'Create hackathon'}</button>
        {msg && <span className="small" role={err ? 'alert' : 'status'} style={err ? { color: '#b42318' } : undefined}>{msg}</span>}
      </div>
    </form>
  );
}
