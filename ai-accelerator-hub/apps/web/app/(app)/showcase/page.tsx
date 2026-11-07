import { ExternalLink } from 'lucide-react';
import { requireCtx, hasPerm } from '@/lib/server/context';
import { listShowcase, publishable } from '@/lib/domain/showcase';
import { ShowcasePublish } from '@/components/learn/ShowcasePublish';
import { guarded } from '@/lib/server/page';

export const metadata = { title: 'Showcase' };
async function Showcase() {
  const ctx = await requireCtx();
  const [items, mine] = await Promise.all([listShowcase(ctx), hasPerm(ctx, 'learn:self') ? publishable(ctx) : Promise.resolve([])]);
  return (<>
    <section className="ph ph-navy"><div style={{ position: 'relative' }}><span className="eyebrow">Showcase</span><h1 id="pageTitle"><span className="hl">{items.length}</span> {items.length === 1 ? 'project' : 'projects'} from {ctx.tenantName}</h1><p className="desc">Every project here passed a human review against a published rubric, and was shared by its author by choice.</p></div></section>
    <ShowcasePublish items={mine} />
    {items.length ? <div className="grid2">{items.map(p => (
      <article key={p.id} className="card proj lift" aria-labelledby={`p-${p.id}`}>
        <div className="proj-body"><div className="row gap-8 wrap"><span className="badge badge-success">Reviewed</span>{p.mine && <span className="badge badge-gold">Yours</span>}</div>
          <h2 className="proj-title" style={{ fontSize: 18 }} id={`p-${p.id}`}>{p.title}</h2>
          <div className="proj-meta"><span>{p.author}</span><span>{new Date(p.at).toLocaleDateString('en-IN')}</span></div>
          <p className="proj-desc">{p.description}</p>
          {p.link && <div className="proj-actions"><a className="btn btn-gold" href={p.link} target="_blank" rel="noopener noreferrer nofollow">Open project <ExternalLink size={14} /></a></div>}
        </div>
      </article>))}</div>
      : <div className="card empty"><h2 className="h3">No projects yet</h2><p className="text-2" style={{ marginTop: 6 }}>Projects appear here when learners publish reviewer-approved work.</p></div>}
  </>);
}

export default guarded(Showcase);
