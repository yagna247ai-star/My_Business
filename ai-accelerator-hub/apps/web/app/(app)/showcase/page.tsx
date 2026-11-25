import Link from 'next/link';
import { EyeOff, ExternalLink, Settings2, Star, Github, Plus, BookOpen, Mail, AlertTriangle } from 'lucide-react';
import { requireCtx, hasPerm } from '@/lib/server/context';
import { canModerate, listShowcase, publishable } from '@/lib/domain/showcase';
import { ShowcaseCardActions } from '@/components/showcase/ShowcaseCardActions';
import { ShowcasePublish } from '@/components/learn/ShowcasePublish';
import { guarded } from '@/lib/server/page';
import { Tr } from '@/components/i18n/Tr';
import { Tv } from '@/components/i18n/Tv';

export const metadata = { title: 'Showcase' };
const STAGE: Record<string, string> = { defined: 'Defined', building: 'Building', reviewed: 'Reviewed' };
async function Showcase() {
  const ctx = await requireCtx();
  const [items, mine] = await Promise.all([listShowcase(ctx), hasPerm(ctx, 'learn:self') ? publishable(ctx) : Promise.resolve([])]);
  return (<>
    <section className="ph ph-navy"><div style={{ position: 'relative' }}><span className="eyebrow"><Tr>Showcase</Tr></span><h1 id="pageTitle"><span className="hl">{items.length}</span> {items.length === 1 ? <Tr>project</Tr> : <Tr>projects</Tr>} <Tr>from</Tr> {ctx.tenantName}</h1><p className="desc"><Tr>Define your project, give it a GitHub home with a ready README, and share it. Projects marked Reviewed passed review against a published rubric.</Tr></p>
      <div className="row gap-8 wrap" style={{ marginTop: 10 }}>
        <Link className="btn btn-gold btn-sm" href="/showcase/new"><Plus size={14} aria-hidden="true" /><Tr>Define a project</Tr></Link>
        <Link className="btn btn-cream btn-sm" href="/showcase/github-guide"><BookOpen size={14} aria-hidden="true" /><Tr>New to GitHub? Start here</Tr></Link>
        {canModerate(ctx) && <Link className="btn btn-cream btn-sm" href="/admin/showcase"><Settings2 size={14} aria-hidden="true" /><Tr>Manage showcase</Tr></Link>}
      </div></div></section>
    <ShowcasePublish items={mine} />
    {items.length ? <div className="grid2">{items.map(p => (
      <article key={p.id} className="card proj lift" aria-labelledby={`p-${p.id}`}>
        <div className="proj-body"><div className="row gap-8 wrap">{p.featured && <span className="badge badge-gold"><Star size={12} aria-hidden="true" /> <Tr>Featured</Tr></span>}<span className={`badge ${p.stage === 'reviewed' ? 'badge-success' : p.stage === 'building' ? 'badge-info' : 'badge-neutral'}`}><Tv v={STAGE[p.stage] ?? 'Defined'} /></span>{p.mine && <span className="badge badge-neutral"><Tr>Yours</Tr></span>}{p.hidden && <span className="badge badge-neutral"><EyeOff size={12} aria-hidden="true" /> <Tr>Hidden by a moderator</Tr></span>}</div>
          {p.hidden && p.hiddenNote && <p className="callout warn small" style={{ margin: '8px 0 0' }}><Tr>Only you can see it. Reason:</Tr> <Tv v={p.hiddenNote} /></p>}
          <h2 className="proj-title" style={{ fontSize: 18 }} id={`p-${p.id}`}><Link href={`/showcase/${p.id}`} style={{ color: 'inherit' }}><Tv v={p.title} /></Link></h2>
          <div className="proj-meta"><span><Tv v={p.author} /></span>{p.authorEmail && <a className="link" href={`mailto:${p.authorEmail}`}><Mail size={12} aria-hidden="true" /> {p.authorEmail}</a>}<span>{new Date(p.at).toLocaleDateString('en-IN')}</span></div>
          <p className="proj-desc" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}><Tv v={p.description ?? ''} /></p>
          {p.tech.length > 0 && <div className="row gap-4 wrap" style={{ margin: '6px 0' }}>{p.tech.slice(0, 6).map(t => <span key={t} className="badge badge-neutral">{t}</span>)}</div>}
          {(p.mine || canModerate(ctx)) && (p.linkStatus === 'private' || p.linkStatus === 'broken') && <p className="callout warn small" style={{ margin: '6px 0' }}><AlertTriangle size={14} aria-hidden="true" /> <Tr>This link does not open for others. Share it as “Anyone with the link can view”.</Tr></p>}
          <div className="proj-actions row gap-8 wrap" style={{ alignItems: 'center' }}>
            {p.github && <a className="btn btn-gold" href={p.github.url} target="_blank" rel="noopener noreferrer nofollow"><Github size={14} aria-hidden="true" /> {p.github.fullName}</a>}
            {!p.github && p.link && <a className="btn btn-gold" href={p.link} target="_blank" rel="noopener noreferrer nofollow"><Tr>Open project</Tr> <ExternalLink size={14} /></a>}
            <Link className="btn btn-soft btn-sm" href={`/showcase/${p.id}`}><Tr>Details</Tr></Link>
            <ShowcaseCardActions id={p.id} mine={p.mine} reported={p.reported} />
          </div>
        </div>
      </article>))}</div>
      : <div className="card empty"><h2 className="h3"><Tr>No projects yet</Tr></h2><p className="text-2" style={{ marginTop: 6 }}><Tr>Be the first: define your project and give it a GitHub home.</Tr></p></div>}
  </>);
}

export default guarded(Showcase);
