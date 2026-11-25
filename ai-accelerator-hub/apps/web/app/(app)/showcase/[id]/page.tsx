import Link from 'next/link';
import { ArrowLeft, ExternalLink, Mail } from 'lucide-react';
import { requireCtx } from '@/lib/server/context';
import { guarded } from '@/lib/server/page';
import { projectDetail } from '@/lib/domain/projects';
import { GithubPanel } from '@/components/showcase/GithubPanel';
import { ProjectForm } from '@/components/showcase/ProjectForm';
import { Tr } from '@/components/i18n/Tr';
import { Tv } from '@/components/i18n/Tv';

export const metadata = { title: 'Project' };
const STAGE: Record<string, string> = { defined: 'Defined', building: 'Building', reviewed: 'Reviewed' };

async function ProjectPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ edit?: string; github?: string }> }) {
  const ctx = await requireCtx();
  const { id } = await params; const sp = await searchParams;
  const p = await projectDetail(ctx, id);
  if (sp.edit && p.canEdit) return (<>
    <Link href={`/showcase/${p.id}`} className="link small"><ArrowLeft size={14} /><Tr>Back to the project</Tr></Link>
    <section className="ph ph-plain"><h1 id="pageTitle"><Tr>Edit project</Tr></h1></section>
    <div style={{ marginTop: 18, maxWidth: 760 }}><ProjectForm initial={{ id: p.id, title: p.title, problem: p.problem, solution: p.solution, tech: p.tech, links: p.links.map(l => ({ url: l.url, label: l.label })) }} /></div>
  </>);
  return (<>
    <Link href="/showcase" className="link small"><ArrowLeft size={14} /><Tr>Back to the showcase</Tr></Link>
    <section className="card card-pad stack gap-8" style={{ marginTop: 12 }} aria-labelledby="pageTitle">
      <div className="row gap-8 wrap"><span className={`badge ${p.stage === 'reviewed' ? 'badge-success' : p.stage === 'building' ? 'badge-info' : 'badge-neutral'}`}><Tv v={STAGE[p.stage] ?? 'Defined'} /></span>{p.hidden && <span className="badge badge-warn"><Tr>Hidden by a moderator</Tr></span>}</div>
      <h1 id="pageTitle" style={{ fontSize: 26, fontWeight: 800 }}><Tv v={p.title} /></h1>
      <p className="muted small"><Tv v={p.author.name} />{p.author.email && <> · <a className="link" href={`mailto:${p.author.email}`}><Mail size={12} aria-hidden="true" /> {p.author.email}</a></>}{p.author.github && <> · <a className="link" href={`https://github.com/${p.author.github}`} target="_blank" rel="noopener noreferrer"><Tv v={`GitHub @${p.author.github}`} /></a></>}</p>
      {p.canEdit && <Link className="btn btn-soft btn-sm" style={{ alignSelf: 'flex-start' }} href={`/showcase/${p.id}?edit=1`}><Tr>Edit definition</Tr></Link>}
    </section>
    <div className="grid2" style={{ gap: 18, marginTop: 18, alignItems: 'start' }}>
      <section className="card card-pad stack gap-12" aria-labelledby="defT">
        <div><h2 className="h4" id="defT"><Tr>The problem</Tr></h2><p style={{ whiteSpace: 'pre-wrap' }}><Tv v={p.problem} /></p></div>
        {p.solution && <div><h2 className="h4"><Tr>The solution</Tr></h2><p style={{ whiteSpace: 'pre-wrap' }}><Tv v={p.solution} /></p></div>}
        {p.tech.length > 0 && <div><h2 className="h4"><Tr>Built with</Tr></h2><div className="row gap-4 wrap">{p.tech.map(t => <span key={t} className="badge badge-neutral">{t}</span>)}</div></div>}
        {p.links.length > 0 && <div><h2 className="h4"><Tr>Links</Tr></h2><ul className="stack gap-4" style={{ margin: 0, paddingLeft: 18 }}>{p.links.map(l => <li key={l.url}><a className="link" href={l.url} target="_blank" rel="noopener noreferrer nofollow">{l.label || l.url} <ExternalLink size={12} /></a>{(l.status === 'private' || l.status === 'broken') && <span className="badge badge-warn" style={{ marginLeft: 6 }}><Tr>may ask for access</Tr></span>}</li>)}</ul></div>}
        {p.contributors.length > 0 && <div><h2 className="h4"><Tr>Contributors</Tr></h2><ul style={{ margin: 0, paddingLeft: 18 }}>{p.contributors.map(c => <li key={c.github} className="small">{c.name} (@{c.github}, {c.permission})</li>)}</ul></div>}
      </section>
      <GithubPanel p={JSON.parse(JSON.stringify(p))} flash={sp.github ?? null} />
    </div>
  </>);
}
export default guarded(ProjectPage);
