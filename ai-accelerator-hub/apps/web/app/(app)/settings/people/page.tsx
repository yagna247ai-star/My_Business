import { prisma } from '@/lib/prisma';
import { requirePerm, hasPerm } from '@/lib/server/context';
import { guarded } from '@/lib/server/page';
import { listMembers } from '@/lib/domain/admin';
import { learnersAtRisk } from '@/lib/domain/insights';
import { journeyAccessOverview } from '@/lib/domain/journeyAccess';
import { ASSIGNABLE, ROLE_LABEL } from '@/lib/server/rbac';
import { PeopleSettings } from '@/components/settings/PeopleSettings';
import { DuplicatesPanel } from '@/components/settings/PeopleAdminTools';

export const metadata = { title: 'People' };

/** The one People screen. /admin/people redirects here. Read-only staff (members:read) can view and nudge. */
async function People({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const ctx = await requirePerm('members:read');
  const canManage = hasPerm(ctx, 'members:manage');
  const { filter } = await searchParams;
  const [members, risk, cohorts, journeys] = await Promise.all([
    listMembers(ctx),
    learnersAtRisk(ctx),
    prisma.cohort.findMany({ where: { tenantId: ctx.tenantId }, select: { id: true, name: true }, orderBy: { createdAt: 'desc' } }),
    ctx.superAdmin ? journeyAccessOverview(ctx) : Promise.resolve(null),
  ]);
  const byId = new Map(risk.map(r => [r.userId, r]));
  const rows = members.map(m => {
    const r = byId.get(m.userId);
    return { ...m, risk: r ? { status: r.streak.status, message: r.streak.message, level: r.level, activitiesDone: r.activitiesDone, lastActive: r.lastActive, needsAttention: r.needsAttention } : undefined };
  });
  return (<>
    <section className="ph ph-plain"><h1 id="pageTitle">People</h1><p className="desc">Everyone in {ctx.tenantName}: progress, streaks and who needs a nudge.{canManage ? ' Add people, change their role, cohort, journey or status, or remove them. Every change is recorded in the audit log.' : ' You can view profiles and send nudges.'}</p></section>
    <div style={{ marginTop: 18 }}>
      <PeopleSettings
        rows={JSON.parse(JSON.stringify(rows))}
        roles={ASSIGNABLE.map(c => ({ code: c, label: ROLE_LABEL[c] }))}
        cohorts={cohorts}
        meId={ctx.userId}
        canManage={canManage}
        isSuper={ctx.superAdmin}
        institutions={ctx.superAdmin ? (await prisma.tenant.findMany({ where: { status: 'active', id: { not: ctx.tenantId } }, select: { id: true, name: true, code: true }, orderBy: { name: 'asc' } })) : []}
        journeys={journeys ? journeys.filter(j => j.published).map(j => ({ id: j.id, title: j.title })) : null}
        initialFilter={filter === 'attention' ? 'attention' : 'all'}
      />
      {canManage && <DuplicatesPanel isSuper={ctx.superAdmin} />}
    </div>
  </>);
}
export default guarded(People);
