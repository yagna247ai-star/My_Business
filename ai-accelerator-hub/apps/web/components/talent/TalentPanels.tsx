'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/client/api';

type Levels = { course: string; done: number; total: number; finished: string }[];
type Cand = { id: string; name: string; headline: string; skills: string[]; openTo: string[]; tenant: string; crossTenant: boolean; matchedSkills: string[]; levels?: Levels };
/** Finished levels, approved by reviewers (docs/PROFILE_LEVELS_SPEC.md AC-4). */
const Verified = ({ levels }: { levels?: Levels }) => <>{(levels ?? []).map(l => <p key={l.course} className="small"><b>{l.course}: {l.done} of {l.total} levels finished</b>{l.finished && <> · Verified: {l.finished}</>}</p>)}</>;
type Opp = { id: string; orgName: string; title: string; kind: string; description: string; skillsWanted: string[]; status: string; applications?: number; mine: boolean };
type Applicant = { id: string; state: string; coverNote: string; applicant: string; headline: string; skills: string[]; levels?: Levels };

export function TalentPanels({ mine, canPost }: { mine: Opp[]; canPost: boolean }) {
  const router = useRouter();
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [q, setQ] = useState('');
  const [cands, setCands] = useState<Cand[] | null>(null);
  const [orgName, setOrgName] = useState('');
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState('internship');
  const [desc, setDesc] = useState('');
  const [wanted, setWanted] = useState('');
  const [apps, setApps] = useState<Record<string, Applicant[]>>({});
  const call = async (fn: () => Promise<unknown>, ok: string) => { setErr(''); setMsg(''); try { await fn(); setMsg(ok); router.refresh(); } catch (e) { setErr((e as ApiError).message); } };
  const search = async () => { setErr(''); setMsg(''); try { const d = await api<Cand[]>(`/api/v1/talent/discover?skills=${encodeURIComponent(q)}`); setCands(d); setMsg(`Found ${d.length} opted-in ${d.length === 1 ? 'profile' : 'profiles'}.`); } catch (e) { setErr((e as ApiError).message); } };
  return (<div style={{ display: 'grid', gap: 18, marginTop: 18 }}>
    {err && <p className="callout warn small" role="alert">{err}</p>}
    {msg && <p className="callout ok small" role="status">{typeof msg === 'string' ? msg : ''}</p>}
    <section className="card card-pad" aria-labelledby="search"><h2 className="h3" id="search">Discover talent</h2>
      <p className="desc">Only learners who opted in appear. Each match shows why (shared skills).</p>
      <form onSubmit={e => { e.preventDefault(); search(); }} style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <label className="sr-only" htmlFor="skills">Skills, comma separated</label>
        <input id="skills" className="input" style={{ flex: 1 }} value={q} onChange={e => setQ(e.target.value)} placeholder="Skills, comma separated — e.g. Python, RAG" />
        <button className="btn btn-gold btn-sm" type="submit">Search</button>
      </form>
      {cands && (cands.length === 0 ? <p className="desc" style={{ marginTop: 10 }}>No opted-in profiles match. Try fewer skills.</p> : <ul style={{ listStyle: 'none', padding: 0, margin: '10px 0 0', display: 'grid', gap: 8 }}>
        {cands.map(c => <li key={c.id} className="set-row"><div><b>{c.name}</b>{c.crossTenant && <span className="muted small"> · {c.tenant} (cross-org, consented)</span>}<p>{c.headline || 'No headline yet'}</p><p className="small">Skills: {c.skills.join(', ') || '—'} · Open to: {c.openTo.join(', ') || '—'}</p>{c.matchedSkills.length > 0 && <p className="small">Matched: {c.matchedSkills.join(', ')}</p>}<Verified levels={c.levels} /></div></li>)}
      </ul>)}
    </section>
    {canPost && <section className="card card-pad" aria-labelledby="post"><h2 className="h3" id="post">Post an opportunity</h2>
      <form onSubmit={e => { e.preventDefault(); call(() => api('/api/v1/opportunities', { body: { orgName, title, kind, description: desc, skillsWanted: wanted.split(',').map(s => s.trim()).filter(Boolean) } }), 'Opportunity posted.'); setOrgName(''); setTitle(''); setDesc(''); setWanted(''); }} style={{ display: 'grid', gap: 10, marginTop: 10 }}>
        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <div><label className="field-label" htmlFor="org">Organisation</label><input id="org" className="input" value={orgName} onChange={e => setOrgName(e.target.value)} maxLength={120} required /></div>
          <div><label className="field-label" htmlFor="kind">Kind</label><select id="kind" className="input" value={kind} onChange={e => setKind(e.target.value)}><option value="internship">Internship</option><option value="job">Job</option><option value="project">Project</option><option value="sponsorship">Sponsorship</option></select></div>
        </div>
        <div><label className="field-label" htmlFor="oppTitle">Title</label><input id="oppTitle" className="input" value={title} onChange={e => setTitle(e.target.value)} maxLength={140} required /></div>
        <div><label className="field-label" htmlFor="oppDesc">Description (50+ characters)</label><textarea id="oppDesc" className="textarea" rows={4} value={desc} onChange={e => setDesc(e.target.value)} maxLength={8000} required /></div>
        <div><label className="field-label" htmlFor="wanted">Skills wanted (comma separated)</label><input id="wanted" className="input" value={wanted} onChange={e => setWanted(e.target.value)} placeholder="Python, communication" /></div>
        <div><button className="btn btn-gold btn-sm" type="submit">Post opportunity</button></div>
      </form>
    </section>}
    {canPost && mine.length > 0 && <section className="card card-pad" aria-labelledby="mine"><h2 className="h3" id="mine">My postings & applicants</h2>
      {mine.map(o => <article key={o.id} style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 10, marginTop: 10 }}>
        <div className="row between"><b>{o.title}</b><span className="muted small">{o.status} · {o.applications ?? 0} applicants</span></div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => call(async () => { const d = await api<Applicant[]>(`/api/v1/opportunities/${o.id}/applications`); setApps(a => ({ ...a, [o.id]: d })); }, 'Applicants loaded.')}>View applicants</button>
          {o.status === 'open' && <button type="button" className="btn btn-outline btn-sm" onClick={() => call(() => api(`/api/v1/opportunities/${o.id}/applications`, { method: 'POST' }), 'Opportunity closed.')}>Close</button>}
        </div>
        {(apps[o.id] || []).map(a => <div key={a.id} className="set-row"><div><b>{a.applicant}</b><p>{a.headline}</p><p className="small">Skills: {a.skills.join(', ') || '—'}</p><Verified levels={a.levels} /><p className="desc">“{a.coverNote}”</p><p className="small">State: {a.state}</p></div>
          {(a.state === 'applied' || a.state === 'shortlisted') && <div style={{ display: 'flex', gap: 6 }}>{a.state === 'applied' && <button type="button" className="btn btn-outline btn-sm" onClick={() => call(() => api(`/api/v1/applications/${a.id}/state`, { body: { state: 'shortlisted' } }), 'Shortlisted.')}>Shortlist</button>}<button type="button" className="btn btn-outline btn-sm" onClick={() => call(() => api(`/api/v1/applications/${a.id}/state`, { body: { state: 'rejected' } }), 'Rejected.')}>Reject</button></div>}</div>)}
      </article>)}
    </section>}
  </div>);
}
