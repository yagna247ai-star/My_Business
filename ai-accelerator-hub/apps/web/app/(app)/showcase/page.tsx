import { ExternalLink } from 'lucide-react';
import { requireCtx, hasPerm } from '@/lib/server/context';
import { listShowcase, publishable } from '@/lib/domain/showcase';
import { ShowcasePublish } from '@/components/learn/ShowcasePublish';
import { guarded } from '@/lib/server/page';
import { Tr } from '@/components/i18n/Tr';
import { Tv } from '@/components/i18n/Tv';

export const metadata = { title: 'Showcase' };
async function Showcase() {
  const ctx = await requireCtx();
  const [items, mine] = await Promise.all([listShowcase(ctx), hasPerm(ctx, 'learn:self') ? publishable(ctx) : Promise.resolve([])]);
  return (<>
    <section className="ph ph-navy"><div style={{ position: 'relative' }}><span className="eyebrow"><Tr>Showcase</Tr></span><h1 id="pageTitle"><span className="hl">{items.length}</span> {items.length === 1 ? <Tr>project</Tr> : <Tr>projects</Tr>} <Tr>from</Tr> {ctx.tenantName}</h1><p className="desc"><Tr>Every project here passed a human review against a published rubric, and was shared by its author by choice.</Tr></p></div></section>
    <ShowcasePublish items={mine} />
    {items.length ? <div className="grid2">{items.map(p => (
      <article key={p.id} className="card proj lift" aria-labelledby={`p-${p.id}`}>
        <div className="proj-body"><div className="row gap-8 wrap"><span className="badge badge-success"><Tr>Reviewed</Tr></span>{p.mine && <span className="badge badge-gold"><Tr>Yours</Tr></span>}</div>
          <h2 className="proj-title" style={{ fontSize: 18 }} id={`p-${p.id}`}><Tv v={p.title} /></h2>
          <div className="proj-meta"><span><Tv v={p.author} /></span><span>{new Date(p.at).toLocaleDateString('en-IN')}</span></div>
          <p className="proj-desc"><Tv v={p.description} /></p>
          {p.link && <div className="proj-actions"><a className="btn btn-gold" href={p.link} target="_blank" rel="noopener noreferrer nofollow"><Tr>Open project</Tr> <ExternalLink size={14} /></a></div>}
        </div>
      </article>))}</div>
      : <div className="card empty"><h2 className="h3"><Tr>No projects yet</Tr></h2><p className="text-2" style={{ marginTop: 6 }}><Tr>Projects appear here when learners publish reviewer-approved work.</Tr></p></div>}
  </>);
}

export default guarded(Showcase);
