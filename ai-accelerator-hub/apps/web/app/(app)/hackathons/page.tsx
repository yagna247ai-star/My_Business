import Link from 'next/link';
import { requireCtx } from '@/lib/server/context';
import { listHackathons } from '@/lib/domain/hackathon';
import { guarded } from '@/lib/server/page';

export const metadata = { title: 'Hackathons' };
async function Hackathons() {
  const ctx = await requireCtx();
  const hs = await listHackathons(ctx);
  return (<>
    <section className="ph ph-plain"><h1 id="pageTitle">Weekend hackathons</h1><p className="desc">Mon–Fri prep · Saturday workshop · Sunday 4-hour build · judged with peer review.</p></section>
    <div className="track-grid" style={{ marginTop: 18 }}>
      {hs.length === 0 && <article className="card card-pad"><h2 className="h3">No hackathons yet</h2><p className="desc">Your cohort team will announce the next one here.</p></article>}
      {hs.map(h => <article key={h.id} className="card card-pad"><h2 className="h3">{h.title}</h2><p className="desc">Status: {h.status} · {h.entries} {h.entries === 1 ? 'team' : 'teams'} entered</p><Link className="btn btn-outline btn-sm" style={{ marginTop: 10 }} href={`/hackathons/${h.slug}`}>Open brief →</Link></article>)}
    </div>
  </>);
}

export default guarded(Hackathons);
