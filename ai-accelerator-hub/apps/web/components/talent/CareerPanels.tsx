'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/client/api';
import { Tr } from '@/components/i18n/Tr';
import { useT } from '@/components/i18n/I18nProvider';
import { Tv } from '@/components/i18n/Tv';

type Profile = { headline: string; skills: string[]; openTo: string[]; visibility: string };
type Opp = { id: string; orgName: string; title: string; kind: string; description: string; skillsWanted: string[]; status: string; mine: boolean };
type App = { id: string; state: string; coverNote: string; createdAt: string | Date; opportunity: { id: string; orgName: string; title: string; kind: string; status: string }; consentedAt: string };
const OPEN = ['internships', 'jobs', 'freelance', 'mentorship'];

export function CareerPanels({ profile, opportunities, applications, minor = false }: { profile: Profile; opportunities: Opp[]; applications: App[]; minor?: boolean }) {
  const t = useT();
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
    {err && <p className="callout warn small" role="alert"><Tv v={err} /></p>}
    {msg && <p className="callout ok small" role="status"><Tv v={msg} /></p>}
    {minor && <p className="callout info small" role="note"><Tr>Because you are under 18, your skill profile stays private to you, and job and internship applications open when you turn 18. Your levels, badges and portfolio still count. Ask your institution about supervised programmes.</Tr></p>}
    <section className="card card-pad" aria-labelledby="prof"><h2 className="h3" id="prof"><Tr>Skill profile</Tr></h2>
      {minor ? <p className="desc"><Tr>Only you can see this. Use it to track the skills you are building.</Tr></p> : <p className="desc"><Tr>Private by default. “Within organisation” shares with placement staff; “Public” needs explicit cross-organisation consent in Settings → Privacy</Tr>{profile.visibility === 'public' ? '' : <Tr>, and stays off until you opt in</Tr>}.</p>}
      <form onSubmit={e => { e.preventDefault(); call(() => api('/api/v1/talent/profile', { method: 'PUT', body: { headline, skills: skills.split(',').map(s => s.trim()).filter(Boolean), openTo: minor ? [] : openTo, visibility: minor ? 'private' : visibility } }), 'Profile saved.'); }} style={{ display: 'grid', gap: 10, marginTop: 10 }}>
        <div><label className="field-label" htmlFor="headline"><Tr>Headline</Tr></label><input id="headline" className="input" value={headline} onChange={e => setHeadline(e.target.value)} maxLength={120} placeholder={t('Aspiring RAG engineer — Level 6')} /></div>
        <div><label className="field-label" htmlFor="skills"><Tr>Skills (comma separated, max 20)</Tr></label><input id="skills" className="input" value={skills} onChange={e => setSkills(e.target.value)} placeholder={t('Python, RAG, n8n')} /></div>
        {!minor && <><div><span className="field-label" id="openTo"><Tr>Open to</Tr></span><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }} role="group" aria-labelledby="openTo">{OPEN.map(o => <button key={o} type="button" className={`btn btn-sm ${openTo.includes(o) ? 'btn-gold' : 'btn-outline'}`} aria-pressed={openTo.includes(o)} onClick={() => toggle(o)}><Tv v={o} /></button>)}</div></div>
        <div><label className="field-label" htmlFor="vis"><Tr>Who can find me</Tr></label><select id="vis" className="input" value={visibility} onChange={e => setVisibility(e.target.value)}><option value="private">{t('Only me (default)')}</option><option value="tenant">{t('Placement staff in my organisation')}</option><option value="public">{t('Public + explicit cross-org consent')}</option></select></div></>}
        <div><button className="btn btn-gold btn-sm" type="submit"><Tr>Save profile</Tr></button></div>
      </form>
    </section>
    {!minor && <><section className="card card-pad" aria-labelledby="opps"><h2 className="h3" id="opps"><Tr>Open opportunities</Tr></h2>
      {opportunities.filter(o => o.status === 'open').map(o => <article key={o.id} className="set-row" style={{ display: 'block' }}>
        <div className="row between"><b><Tv v={o.title} /></b><span className="muted small"><Tv v={o.kind} /> · <Tv v={o.orgName} /></span></div>
        <p className="desc"><Tv v={o.description} /></p>
        {o.skillsWanted.length > 0 && <p className="small"><Tr>Wants:</Tr> {o.skillsWanted.join(', ')}</p>}
        <form onSubmit={e => { e.preventDefault(); const c = covers[o.id] || ''; call(() => api(`/api/v1/opportunities/${o.id}/apply`, { body: { coverNote: c } }), 'Applied. Your profile is shared with this organisation only.'); }} style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <label className="sr-only" htmlFor={`c-${o.id}`}><Tr>Why you fit (at least 30 characters)</Tr></label>
          <input id={`c-${o.id}`} className="input" style={{ flex: 1 }} value={covers[o.id] || ''} onChange={e => setCovers(c => ({ ...c, [o.id]: e.target.value }))} placeholder={t('Why you fit (30+ characters)')} maxLength={2000} required />
          <button className="btn btn-outline btn-sm" type="submit"><Tr>Apply</Tr></button>
        </form>
      </article>)}
      {opportunities.filter(o => o.status === 'open').length === 0 && <p className="desc" style={{ marginTop: 10 }}><Tr>No open roles right now. Finish more levels — placement staff notice verified work.</Tr></p>}
    </section>
    <section className="card card-pad" aria-labelledby="apps"><h2 className="h3" id="apps"><Tr>My applications</Tr></h2>
      {applications.length === 0 && <p className="desc"><Tr>Nothing applied yet.</Tr></p>}
      <ul style={{ listStyle: 'none', padding: 0, margin: '10px 0 0', display: 'grid', gap: 8 }}>
        {applications.map(a => <li key={a.id} className="set-row"><div><b><Tv v={a.opportunity.title} /></b><p><Tv v={a.opportunity.orgName} /> · <Tv v={a.state} /> <Tr>· shared with consent on</Tr> {new Date(a.consentedAt).toLocaleDateString('en-IN')}</p></div>
          {(a.state === 'applied' || a.state === 'shortlisted') && <button type="button" className="btn btn-outline btn-sm" onClick={() => call(() => api(`/api/v1/applications/${a.id}/state`, { body: { state: 'withdrawn' } }), 'Application withdrawn.')}><Tr>Withdraw</Tr></button>}</li>)}
      </ul>
    </section></>}
  </div>);
}
