'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/client/api';

type Profile = { headline: string; skills: string[]; openTo: string[]; visibility: string };
type Opp = { id: string; orgName: string; title: string; kind: string; description: string; skillsWanted: string[]; status: string; mine: boolean };
type App = { id: string; state: string; coverNote: string; createdAt: string | Date; opportunity: { id: string; orgName: string; title: string; kind: string; status: string }; consentedAt: string };
const OPEN = ['internships', 'jobs', 'freelance', 'mentorship'];

export function CareerPanels({ profile, opportunities, applications, minor = false }: { profile: Profile; opportunities: Opp[]; applications: App[]; minor?: boolean }) {
  const router = useRouter();
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [headline, setHeadline] = useState(profile.headline);
  const [skills, setSkills] = useState(profile.skills.join(', '));
  const [openTo, setOpenTo] = useState<string[]>(profile.openTo);
  const [visibility, setVisibility] = useState(profile.visibility);
  const [covers, setCovers] = useState<Record<string, string>>({});
  const call = async (fn: () => Promise<unknown>, ok: string) => { setErr(''); setMsg(''); try { await fn(); setMsg(ok); router.refresh(); } catch (e) { setErr((e as ApiError).message); } };
  const toggle = (v: string) => setOpenTo(o => o.includes(v) ? o.filter(x => x !== v) : [...o, v]);
  return (<div style={{ display: 'grid', gap: 18, marginTop: 18 }}>
    {err && <p className="callout warn small" role="alert">{err}</p>}
    {msg && <p className="callout ok small" role="status">{msg}</p>}
    {minor && <p className="callout info small" role="note">Because you are under 18, your skill profile stays private to you, and job and internship applications open when you turn 18. Your levels, badges and portfolio still count. Ask your institution about supervised programmes.</p>}
    <section className="card card-pad" aria-labelledby="prof"><h2 className="h3" id="prof">Skill profile</h2>
      {minor ? <p className="desc">Only you can see this. Use it to track the skills you are building.</p> : <p className="desc">Private by default. “Within organisation” shares with placement staff; “Public” needs explicit cross-organisation consent in Settings → Privacy{profile.visibility === 'public' ? '' : ', and stays off until you opt in'}.</p>}
      <form onSubmit={e => { e.preventDefault(); call(() => api('/api/v1/talent/profile', { method: 'PUT', body: { headline, skills: skills.split(',').map(s => s.trim()).filter(Boolean), openTo: minor ? [] : openTo, visibility: minor ? 'private' : visibility } }), 'Profile saved.'); }} style={{ display: 'grid', gap: 10, marginTop: 10 }}>
        <div><label className="field-label" htmlFor="headline">Headline</label><input id="headline" className="input" value={headline} onChange={e => setHeadline(e.target.value)} maxLength={120} placeholder="Aspiring RAG engineer — Level 6" /></div>
        <div><label className="field-label" htmlFor="skills">Skills (comma separated, max 20)</label><input id="skills" className="input" value={skills} onChange={e => setSkills(e.target.value)} placeholder="Python, RAG, n8n" /></div>
        {!minor && <><div><span className="field-label" id="openTo">Open to</span><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }} role="group" aria-labelledby="openTo">{OPEN.map(o => <button key={o} type="button" className={`btn btn-sm ${openTo.includes(o) ? 'btn-gold' : 'btn-outline'}`} aria-pressed={openTo.includes(o)} onClick={() => toggle(o)}>{o}</button>)}</div></div>
        <div><label className="field-label" htmlFor="vis">Who can find me</label><select id="vis" className="input" value={visibility} onChange={e => setVisibility(e.target.value)}><option value="private">Only me (default)</option><option value="tenant">Placement staff in my organisation</option><option value="public">Public + explicit cross-org consent</option></select></div></>}
        <div><button className="btn btn-gold btn-sm" type="submit">Save profile</button></div>
      </form>
    </section>
    {!minor && <><section className="card card-pad" aria-labelledby="opps"><h2 className="h3" id="opps">Open opportunities</h2>
      {opportunities.filter(o => o.status === 'open').map(o => <article key={o.id} className="set-row" style={{ display: 'block' }}>
        <div className="row between"><b>{o.title}</b><span className="muted small">{o.kind} · {o.orgName}</span></div>
        <p className="desc">{o.description}</p>
        {o.skillsWanted.length > 0 && <p className="small">Wants: {o.skillsWanted.join(', ')}</p>}
        <form onSubmit={e => { e.preventDefault(); const c = covers[o.id] || ''; call(() => api(`/api/v1/opportunities/${o.id}/apply`, { body: { coverNote: c } }), 'Applied. Your profile is shared with this organisation only.'); }} style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <label className="sr-only" htmlFor={`c-${o.id}`}>Why you fit (at least 30 characters)</label>
          <input id={`c-${o.id}`} className="input" style={{ flex: 1 }} value={covers[o.id] || ''} onChange={e => setCovers(c => ({ ...c, [o.id]: e.target.value }))} placeholder="Why you fit (30+ characters)" maxLength={2000} required />
          <button className="btn btn-outline btn-sm" type="submit">Apply</button>
        </form>
      </article>)}
      {opportunities.filter(o => o.status === 'open').length === 0 && <p className="desc" style={{ marginTop: 10 }}>No open roles right now. Finish more levels — placement staff notice verified work.</p>}
    </section>
    <section className="card card-pad" aria-labelledby="apps"><h2 className="h3" id="apps">My applications</h2>
      {applications.length === 0 && <p className="desc">Nothing applied yet.</p>}
      <ul style={{ listStyle: 'none', padding: 0, margin: '10px 0 0', display: 'grid', gap: 8 }}>
        {applications.map(a => <li key={a.id} className="set-row"><div><b>{a.opportunity.title}</b><p>{a.opportunity.orgName} · {a.state} · shared with consent on {new Date(a.consentedAt).toLocaleDateString('en-IN')}</p></div>
          {(a.state === 'applied' || a.state === 'shortlisted') && <button type="button" className="btn btn-outline btn-sm" onClick={() => call(() => api(`/api/v1/applications/${a.id}/state`, { body: { state: 'withdrawn' } }), 'Application withdrawn.')}>Withdraw</button>}</li>)}
      </ul>
    </section></>}
  </div>);
}
