/** Ranks page data: City / State / Everyone boards from real XP, with movement since yesterday. */
import { prisma } from '@/lib/prisma';
import type { Ctx } from '@/lib/server/context';
import { pick, RANKS } from './insights';
import { rankBoard, cityScope, stateOf, type RankRow, type Scope } from './ranksCore';

export type Tab = 'city' | 'state' | 'all';

export async function ranks(ctx: Ctx, tab: Tab = 'city') {
  const since = new Date(Date.now() - 24 * 3600e3);

  const members = await prisma.membership.findMany({
    where: { tenantId: ctx.tenantId, status: 'active', role: { code: { in: ['learner', 'team_lead'] } } },
    include: { user: { select: { id: true, name: true, area: true, avatarUrl: true } } },
  });
  const ids = members.map(m => m.userId);
  // Points: every XP the learner earned in this institution (all journeys), so every learner can be ranked.
  const [now, before, settings, approved, enrollments] = await Promise.all([
    prisma.xpLedger.groupBy({ by: ['userId'], where: { tenantId: ctx.tenantId, userId: { in: ids } }, _sum: { amount: true } }),
    prisma.xpLedger.groupBy({ by: ['userId'], where: { tenantId: ctx.tenantId, userId: { in: ids }, createdAt: { lt: since } }, _sum: { amount: true } }),
    prisma.userSetting.findMany({ where: { tenantId: ctx.tenantId, userId: { in: ids } } }),
    prisma.progress.groupBy({ by: ['userId', 'enrollmentId'], where: { tenantId: ctx.tenantId, userId: { in: ids }, state: 'approved' }, _count: { _all: true } }),
    prisma.enrollment.findMany({ where: { tenantId: ctx.tenantId, userId: { in: ids } }, select: { id: true, journey: { select: { _count: { select: { levels: true } } } } } }),
  ]);
  const levelsIn = new Map(enrollments.map(e => [e.id, e.journey._count.levels]));
  const xp = new Map(now.map(s => [s.userId, s._sum.amount || 0]));
  const prev = new Map(before.map(s => [s.userId, s._sum.amount || 0]));
  const priv = new Set(settings.filter(s => s.leaderboardVisibility === 'private' || s.ageBand === 'minor').map(s => s.userId));
  // Journey Finisher: every level of one of their journeys approved.
  const finished = new Set(approved.filter(a => (levelsIn.get(a.enrollmentId) ?? 0) > 0 && a._count._all >= levelsIn.get(a.enrollmentId)!).map(a => a.userId));

  const rows: RankRow[] = members.map(m => {
    const points = xp.get(m.userId) || 0;
    return { userId: m.userId, name: m.user.name, area: m.user.area, xp: points, prevXp: prev.get(m.userId) || 0, private: priv.has(m.userId),
      avatarUrl: m.user.avatarUrl, finisher: finished.has(m.userId), level: pick(RANKS, points).name };
  });

  const myCity = members.find(m => m.userId === ctx.userId)?.user.area?.trim() || null;
  const counts: Record<string, number> = {};
  for (const r of rows) if (r.xp > 0 && r.area) counts[r.area.trim()] = (counts[r.area.trim()] || 0) + 1;
  const myState = stateOf(myCity);

  let scope: Scope;
  if (tab === 'all') scope = { kind: 'all', name: 'Everyone' };
  else if (tab === 'state') scope = myState ? { kind: 'state', name: myState } : { kind: 'all', name: 'Everyone' };
  else scope = myCity ? cityScope(myCity, counts) : { kind: 'all', name: 'Everyone' };

  const inScope = rows.filter(r => scope.kind === 'all' ? true : scope.kind === 'city' ? r.area?.trim() === scope.name : stateOf(r.area) === scope.name);
  const board = rankBoard(inScope, ctx.userId, 25);
  return {
    tab, scope, city: myCity, state: myState, board,
    note: tab === 'city' && myCity && scope.kind !== 'city' ? `${myCity} has fewer than 10 ranked learners, so you are ranked across ${scope.name}.` : null,
  };
}
