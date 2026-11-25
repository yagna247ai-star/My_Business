/** Ranks page data: City / State / Everyone boards from real XP, with movement since yesterday. */
import { prisma } from '@/lib/prisma';
import type { Ctx } from '@/lib/server/context';
import { pick, RANKS } from './insights';
import { loadRankPoints } from './rankPointsDb';
import { rankBoard, cityScope, stateOf, type RankRow, type Scope } from './ranksCore';

export type Tab = 'city' | 'state' | 'all' | 'cohort';

/** Every ranking uses the one points rule (docs/RANKS_UNIFIED_SPEC.md); levelIds narrows it to one level. */
export async function ranks(ctx: Ctx, tab: Tab = 'city', levelIds?: string[] | null) {
  const since = new Date(Date.now() - 24 * 3600e3);

  const members = await prisma.membership.findMany({
    where: { tenantId: ctx.tenantId, status: 'active', role: { code: { in: ['learner', 'team_lead'] } } },
    include: { user: { select: { id: true, name: true, area: true, avatarUrl: true } } },
  });
  const ids = members.map(m => m.userId);
  // Points: every XP the learner earned in this institution (all journeys), so every learner can be ranked.
  const [now, before, settings, approved, enrollments] = await Promise.all([
    loadRankPoints(ctx.tenantId, ids, { levelIds }),
    loadRankPoints(ctx.tenantId, ids, { levelIds, before: since }),
    prisma.userSetting.findMany({ where: { tenantId: ctx.tenantId, userId: { in: ids } } }),
    prisma.progress.groupBy({ by: ['userId', 'enrollmentId'], where: { tenantId: ctx.tenantId, userId: { in: ids }, state: 'approved' }, _count: { _all: true } }),
    prisma.enrollment.findMany({ where: { tenantId: ctx.tenantId, userId: { in: ids } }, select: { id: true, journey: { select: { _count: { select: { levels: true } } } } } }),
  ]);

  const levelsIn = new Map(enrollments.map(e => [e.id, e.journey._count.levels]));
  const priv = new Set(settings.filter(s => s.leaderboardVisibility === 'private' || s.ageBand === 'minor').map(s => s.userId));
  // Journey Finisher: every level of one of their journeys approved.
  const finished = new Set(approved.filter(a => (levelsIn.get(a.enrollmentId) ?? 0) > 0 && a._count._all >= levelsIn.get(a.enrollmentId)!).map(a => a.userId));

  const rows: RankRow[] = members.map(m => {
    const points = now.get(m.userId)?.points || 0;
    return { userId: m.userId, name: m.user.name, area: m.user.area, xp: points, prevXp: before.get(m.userId)?.points || 0, reachedAt: now.get(m.userId)?.reachedAt, prevReachedAt: before.get(m.userId)?.reachedAt, private: priv.has(m.userId),
      avatarUrl: m.user.avatarUrl, finisher: finished.has(m.userId), level: pick(RANKS, points).name };
  });

  const myCity = members.find(m => m.userId === ctx.userId)?.user.area?.trim() || null;
  const counts: Record<string, number> = {};
  for (const r of rows) if (r.xp > 0 && r.area) counts[r.area.trim()] = (counts[r.area.trim()] || 0) + 1;
  const myState = stateOf(myCity);

  let scope: Scope;
  if (tab === 'all') scope = { kind: 'all', name: 'Everyone' };
  else if (tab === 'cohort') scope = { kind: 'all', name: ctx.cohortId ? 'My cohort' : 'Everyone' };
  else if (tab === 'state') scope = myState ? { kind: 'state', name: myState } : { kind: 'all', name: 'Everyone' };
  else scope = myCity ? cityScope(myCity, counts) : { kind: 'all', name: 'Everyone' };

  const cohortIds = tab === 'cohort' && ctx.cohortId ? new Set(members.filter(m => m.cohortId === ctx.cohortId).map(m => m.userId)) : null;
  const inScope = rows.filter(r => cohortIds ? cohortIds.has(r.userId) : scope.kind === 'all' ? true : scope.kind === 'city' ? r.area?.trim() === scope.name : stateOf(r.area) === scope.name);
  const board = rankBoard(inScope, ctx.userId, 25);
  return {
    tab, scope, city: myCity, state: myState, board,
    note: tab === 'city' && myCity && scope.kind !== 'city' ? `${myCity} has fewer than 10 ranked learners, so you are ranked across ${scope.name}.` : null,
  };
}
