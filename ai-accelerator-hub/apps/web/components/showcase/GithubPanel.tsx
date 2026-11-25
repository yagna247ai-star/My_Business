'use client';
/** The project's GitHub home (docs/SHOWCASE_GITHUB_SPEC.md): username, map a repo, create one with README + docs, clone, contribute. */
import Link from 'next/link';
import { useState } from 'react';
import { Copy, Github, Link2, Plus, UserPlus } from 'lucide-react';
import { api } from '@/lib/client/api';
import { useRun } from '@/components/settings/ui';

type Repo = { id: string; url: string; fullName: string | null; createdByApp: boolean; linkStatus: string };
type P = {
  id: string; mine: boolean; canEdit: boolean; repos: Repo[];
  viewer: { github: string | null; connected: boolean; contributing: boolean };
  createTarget: 'org' | 'own' | 'none'; orgName: string | null; connectAvailable: boolean;
};
type GhRepo = { fullName: string; url: string; private: boolean; description: string | null };

export function GithubPanel({ p, flash }: { p: P; flash: string | null }) {
  const r = useRun();
  const [user, setUser] = useState(p.viewer.github ?? ''); const [repos, setRepos] = useState<GhRepo[] | null>(null); const [pick, setPick] = useState('');
  const [copied, setCopied] = useState('');
  const gh = p.repos.find(x => x.fullName);
  const clone = gh ? `git clone https://github.com/${gh.fullName}.git` : '';
  const copy = async (t: string) => { try { await navigator.clipboard.writeText(t); setCopied(t); setTimeout(() => setCopied(''), 2000); } catch { /* clipboard blocked: the text is visible to copy by hand */ } };
  const loadRepos = () => r.run(async () => { const out = await api<{ repos: GhRepo[] }>('/api/v1/github/repos'); setRepos(out.repos); setPick(out.repos.find(x => !x.private)?.fullName ?? ''); }, 'Repositories loaded.');
  return (
    <section className="card card-pad stack gap-12" aria-labelledby="ghT">
      <h2 className="h3" id="ghT"><Github size={18} aria-hidden="true" /> GitHub</h2>
      {flash === 'connected' && <p className="callout ok small" role="status">GitHub connected.</p>}
      {flash === 'failed' && <p className="callout warn small" role="alert">Connecting GitHub did not finish. Try again.</p>}
      <r.Status />

      {gh ? <div className="stack gap-8">
        <a className="btn btn-gold" href={gh.url} target="_blank" rel="noopener noreferrer"><Github size={14} /> {gh.fullName}</a>
        <label className="field-label" htmlFor="clone">Check it out in VS Code</label>
        <div className="row gap-8"><input id="clone" className="input" readOnly value={clone} style={{ fontFamily: 'var(--font-mono)' }} /><button className="btn btn-soft btn-sm" type="button" onClick={() => copy(clone)} aria-label="Copy clone command"><Copy size={14} />{copied === clone ? 'Copied' : 'Copy'}</button></div>
        <p className="muted xs">VS Code → Source Control → Clone Repository → paste. Then fill <code>docs/01-problem.md</code> … <code>06-demo-and-links.md</code>, commit and push. <Link className="link" href="/showcase/github-guide#clone">Step-by-step</Link></p>
        {gh.createdByApp && p.mine && p.createTarget === 'org' && <p className="callout info small">GitHub emailed you an invitation to be admin of this repo. Accept it (github.com/notifications) before you clone.</p>}
      </div> : p.mine ? <p className="muted small">This project has no GitHub repository yet. Pick one of the options below.</p> : <p className="muted small">No GitHub repository yet.</p>}

      {(p.mine || !p.viewer.github) && <details open={!p.viewer.github} className="stack gap-8">
        <summary className="bold">1. Your GitHub username</summary>
        <p className="muted xs">No account yet? <Link className="link" href="/showcase/github-guide">Follow the GitHub guide</Link> (account, two-factor, token, VS Code), then come back.</p>
        <form className="row gap-8" onSubmit={e => { e.preventDefault(); r.run(() => api('/api/v1/github/username', { method: 'PUT', body: { username: user } }), 'GitHub username saved.'); }}>
          <input className="input" aria-label="GitHub username" placeholder="your-username" maxLength={39} value={user} onChange={e => setUser(e.target.value)} />
          <button className="btn btn-soft btn-sm" type="submit" disabled={r.busy || !user}>Save</button>
        </form>
        {p.connectAvailable && (p.viewer.connected
          ? <p className="small">Connected to GitHub. <button className="link" type="button" onClick={() => r.run(() => api('/api/v1/github/connect', { method: 'DELETE' }), 'GitHub disconnected.')}>Disconnect</button></p>
          : <a className="btn btn-outline btn-sm" href={`/api/v1/github/connect?back=/showcase/${p.id}`}><Github size={14} />Connect GitHub</a>)}
      </details>}

      {p.mine && !gh?.createdByApp && <details className="stack gap-8" open={!!p.viewer.github && !gh}>
        <summary className="bold">2. Create a repository for this project</summary>
        <p className="muted xs">{p.createTarget === 'org' ? `Created in the institution’s GitHub organisation (${p.orgName}); you are made its admin.` : p.createTarget === 'own' ? 'Created in your own GitHub account.' : 'Connect GitHub first, or ask your admin to set up the institution organisation.'} It comes with a README (your problem, solution, email and clone command), CONTRIBUTING.md, .gitignore, and docs/, src/, data/, notebooks/ folders.</p>
        <button className="btn btn-primary btn-sm" type="button" style={{ alignSelf: 'flex-start' }} disabled={r.busy || p.createTarget === 'none' || (p.createTarget === 'org' && !p.viewer.github)} onClick={() => r.run(() => api('/api/v1/projects/' + p.id + '/create-repo', { method: 'POST' }), 'Repository created with README and docs.')}><Plus size={14} />Create repository</button>
      </details>}

      {p.mine && <details className="stack gap-8">
        <summary className="bold">{gh ? 'Add another existing repository' : 'Or: map a repository you already have'}</summary>
        {!repos ? <button className="btn btn-soft btn-sm" type="button" disabled={r.busy || (!p.viewer.github && !p.viewer.connected)} onClick={loadRepos}><Link2 size={14} />Show my repositories</button>
          : repos.length === 0 ? <p className="muted small">No repositories found on your account. Create one above, or on GitHub (New repository → Public → Add a README).</p>
          : <form className="row gap-8 wrap" onSubmit={e => { e.preventDefault(); r.run(() => api(`/api/v1/projects/${p.id}/repos`, { method: 'POST', body: { fullName: pick } }), 'Repository added to the project.'); }}>
            <select className="select" aria-label="Repository" value={pick} onChange={e => setPick(e.target.value)}>{repos.map(x => <option key={x.fullName} value={x.fullName} disabled={x.private}>{x.fullName}{x.private ? ' (private: make public first)' : ''}</option>)}</select>
            <button className="btn btn-primary btn-sm" type="submit" disabled={r.busy || !pick}>Add to project</button>
          </form>}
      </details>}

      {!p.mine && gh && <div className="stack gap-8">
        <p className="small">Want to help build this? You get write access to the repository (your GitHub username is needed).</p>
        <button className="btn btn-outline btn-sm" type="button" style={{ alignSelf: 'flex-start' }} disabled={r.busy || p.viewer.contributing || !p.viewer.github} onClick={() => r.run(async () => { const out = await api<{ invited: boolean; message: string; fork?: string }>(`/api/v1/projects/${p.id}/contribute`, { method: 'POST' }); if (!out.invited && out.fork) window.open(out.fork, '_blank', 'noopener'); }, 'Done. Check your GitHub email for the invitation.')}><UserPlus size={14} />{p.viewer.contributing ? 'You are a contributor' : 'Contribute'}</button>
      </div>}
    </section>
  );
}
