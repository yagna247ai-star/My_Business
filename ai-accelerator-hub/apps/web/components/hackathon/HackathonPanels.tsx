'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/client/api';
import { Tr } from '@/components/i18n/Tr';
import { useT } from '@/components/i18n/I18nProvider';
import { Tv } from '@/components/i18n/Tv';

type Team = { id: string; name: string; role?: string; members: number; entry: { state: string; title: string } | null } | null;
type Task = { entryId: string; team: string; title: string; repoUrl: string | null; deployedUrl: string | null; reflection: string | null; done: boolean };
type Props = { id: string; slug: string; status: string; myTeam: Team; peerTasks: Task[]; result: { placements: { entryId: string; place: number }[]; note: string | null } | null; canJudge: boolean };

export function HackathonPanels({ id, status, myTeam, peerTasks, result, canJudge }: Props) {
  const t = useT();
  const router = useRouter();
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [repo, setRepo] = useState('');
  const [reflection, setReflection] = useState('');
  const [scores, setScores] = useState<Record<string, Record<string, number>>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const call = async (fn: () => Promise<unknown>, ok: string) => { setErr(''); setMsg(''); try { await fn(); setMsg(ok); router.refresh(); } catch (e) { setErr((e as ApiError).message); } };
  const setScore = (entryId: string, dim: string, v: number) => setScores(s => ({ ...s, [entryId]: { problem: 3, build: 3, teamwork: 3, ...(s[entryId] || {}), [dim]: v } }));
  return (<div style={{ marginTop: 18, display: 'grid', gap: 18 }}>
    {err && <p className="callout warn small" role="alert"><Tv v={err} /></p>}
    {msg && <p className="callout ok small" role="status"><Tv v={msg} /></p>}
    <section className="card card-pad" aria-labelledby="tm"><h2 className="h3" id="tm"><Tr>My team</Tr></h2>
      {!myTeam && (status === 'open' || status === 'building' || status === 'submit')
        ? <form onSubmit={e => { e.preventDefault(); call(() => api(`/api/v1/hackathons/${id}/teams`, { body: { name } }), 'Team created. Invite teammates from your cohort — teams are 3 to 5.'); }} style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <label className="sr-only" htmlFor="teamName"><Tr>Team name</Tr></label>
          <input id="teamName" className="input" style={{ flex: 1 }} value={name} onChange={e => setName(e.target.value)} placeholder={t('Team name (3–40 characters)')} minLength={3} maxLength={40} required />
          <button className="btn btn-gold btn-sm" type="submit"><Tr>Create team</Tr></button>
        </form>
        : null}
      {myTeam && <p className="desc" style={{ marginTop: 10 }}><b>{myTeam.name}</b> · <Tv v={myTeam.members} /> <Tr>members · entry:</Tr> {myTeam.entry?.state || <Tr>draft</Tr>}</p>}
      {!myTeam && !['open', 'building', 'submit'].includes(status) && <p className="desc" style={{ marginTop: 10 }}><Tr>Team formation is closed for this hackathon.</Tr></p>}
    </section>
    {myTeam && status === 'submit' && <section className="card card-pad" aria-labelledby="sub"><h2 className="h3" id="sub"><Tr>Submit entry</Tr></h2>
      <form onSubmit={e => { e.preventDefault(); call(() => api(`/api/v1/hackathons/${id}/submit`, { body: { title, repoUrl: repo, reflectionMd: reflection } }), 'Entry submitted. Good luck.'); }} style={{ display: 'grid', gap: 10, marginTop: 10 }}>
        <div><label className="field-label" htmlFor="entryTitle"><Tr>Project title</Tr></label><input id="entryTitle" className="input" value={title} onChange={e => setTitle(e.target.value)} required /></div>
        <div><label className="field-label" htmlFor="entryRepo"><Tr>GitHub repository URL</Tr></label><input id="entryRepo" className="input" type="url" value={repo} onChange={e => setRepo(e.target.value)} placeholder={t('https://github.com/…')} required /></div>
        <div><label className="field-label" htmlFor="entryRef"><Tr>Reflection (50+ words)</Tr></label><textarea id="entryRef" className="textarea" rows={3} value={reflection} onChange={e => setReflection(e.target.value)} required /></div>
        <div><button className="btn btn-gold btn-sm" type="submit"><Tr>Submit entry</Tr></button></div>
      </form>
    </section>}
    {peerTasks.length > 0 && <section className="card card-pad" aria-labelledby="peer"><h2 className="h3" id="peer"><Tr>Peer reviews assigned to you</Tr></h2>
      <p className="desc"><Tr>Structured feedback only — peer scores never decide winners. Judges decide.</Tr></p>
      {peerTasks.map(t => <article key={t.entryId} style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 10, marginTop: 10 }}>
        <b><Tv v={t.team} /></b> — {t.title || <Tr>Untitled entry</Tr>}
        {t.repoUrl && <div><a href={t.repoUrl} target="_blank" rel="noopener noreferrer nofollow"><Tr>Repo ↗</Tr></a></div>}
        {t.reflection && <p className="desc"><Tv v={t.reflection} /></p>}
        {t.done ? <p className="callout ok small"><Tr>Submitted. Thank you.</Tr></p> : <form onSubmit={e => { e.preventDefault(); const s = { problem: 3, build: 3, teamwork: 3, ...(scores[t.entryId] || {}) }; call(() => api(`/api/v1/hackathons/${id}/peer-reviews`, { body: { entryId: t.entryId, scores: s, comment: comments[t.entryId] || '' } }), 'Peer review submitted.'); }} style={{ display: 'grid', gap: 8, marginTop: 8 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>{['problem', 'build', 'teamwork'].map(d => <label key={d}><Tv v={d} /> <select value={(scores[t.entryId] || { problem: 3, build: 3, teamwork: 3 })[d]} onChange={e => setScore(t.entryId, d, Number(e.target.value))} aria-label={`${d} score 1 to 5`}>{[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}</select></label>)}</div>
          <label><Tr>Feedback (20+ characters)</Tr><textarea className="input" rows={2} value={comments[t.entryId] || ''} onChange={e => setComments(c => ({ ...c, [t.entryId]: e.target.value }))} required /></label>
          <div><button className="btn btn-outline btn-sm" type="submit"><Tr>Send peer review</Tr></button></div>
        </form>}
      </article>)}
    </section>}
    {result && <section className="card card-pad" aria-labelledby="res"><h2 className="h3" id="res"><Tr>Results</Tr></h2><p className="desc">{result.note || <Tr>Judging is complete.</Tr>}</p></section>}
    {canJudge && status === 'review' && <section className="card card-pad" aria-labelledby="judge"><h2 className="h3" id="judge"><Tr>Judge</Tr></h2><p className="desc"><Tr>Decide in the review queue after reading proofs and peer notes. Placements run 1..N with no ties.</Tr></p></section>}
  </div>);
}
