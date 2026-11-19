import { prisma } from '@/lib/prisma';
import { requirePerm } from '@/lib/server/context';
import { listHackathons } from '@/lib/domain/hackathon';
import { guarded } from '@/lib/server/page';
import { HackathonBuilder } from '@/components/admin/HackathonBuilder';

export const metadata = { title: 'Hackathon builder' };
async function Hackathons() {
  const ctx = await requirePerm('cohort:manage');
  const [hs, cohorts] = await Promise.all([
    listHackathons(ctx),
    prisma.cohort.findMany({ where: { tenantId: ctx.tenantId }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
  ]);
  return (<>
    <section className="ph ph-plain"><h1 id="pageTitle">Hackathon builder</h1><p className="desc">Create a hackathon for {ctx.tenantName}. New hackathons start as drafts.</p></section>
    <div className="stack gap-16" style={{ marginTop: 18, maxWidth: 860 }}>
      <section className="card card-pad stack gap-8" aria-labelledby="hl">
        <h2 className="h3" id="hl">Hackathons ({hs.length})</h2>
        {hs.length === 0 && <p className="muted small">None yet.</p>}
        <ul className="checklist">{hs.map(h => <li key={h.id}><span className="bold">{h.title}</span> <span className="muted xs">· {h.status} · {h.entries} entries</span></li>)}</ul>
      </section>
      <HackathonBuilder cohorts={cohorts} />
    </div>
  </>);
}
export default guarded(Hackathons);
