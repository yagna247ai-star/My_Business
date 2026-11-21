import Link from 'next/link';
import { requireCtx } from '@/lib/server/context';
import { listHackathons } from '@/lib/domain/hackathon';
import { guarded } from '@/lib/server/page';
import { Tr } from '@/components/i18n/Tr';
import { Tv } from '@/components/i18n/Tv';

export const metadata = { title: 'Hackathons' };
async function Hackathons() {
  const ctx = await requireCtx();
  const hs = await listHackathons(ctx);
  return (<>
    <section className="ph ph-plain"><h1 id="pageTitle"><Tr>Weekend hackathons</Tr></h1><p className="desc"><Tr>Mon–Fri prep · Saturday workshop · Sunday 4-hour build · judged with peer review.</Tr></p></section>
    <div className="track-grid" style={{ marginTop: 18 }}>
      {hs.length === 0 && <article className="card card-pad"><h2 className="h3"><Tr>No hackathons yet</Tr></h2><p className="desc"><Tr>Your cohort team will announce the next one here.</Tr></p></article>}
      {hs.map(h => <article key={h.id} className="card card-pad"><h2 className="h3"><Tv v={h.title} /></h2><p className="desc"><Tr>Status:</Tr> <Tv v={h.status} /> · <Tv v={h.entries} /> {h.entries === 1 ? <Tr>team</Tr> : <Tr>teams</Tr>} <Tr>entered</Tr></p><Link className="btn btn-outline btn-sm" style={{ marginTop: 10 }} href={`/hackathons/${h.slug}`}><Tr>Open brief →</Tr></Link></article>)}
    </div>
  </>);
}

export default guarded(Hackathons);
