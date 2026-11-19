/** Area standings for a journey: crowns for the top 3 per area, global ranking, and the final-fight bracket. */
import { prisma } from '@/lib/prisma';
import type { Ctx } from '@/lib/server/context';
import { runBracket } from './points';
import { toEntries, areaBoard, type StandingRow } from './standingsCore';

const JOURNEY = 'data-analytics-journey';
// The final challenge (the journey's last level) decides each bracket match.

export async function areaStandings(ctx: Ctx, levelCode?: string) {
  const mine = await prisma.enrollment.findFirst({ where: { tenantId: ctx.tenantId, userId: ctx.userId, state: 'active' }, select: { journeyId: true } });
  const journey = await prisma.journey.findFirst({ where: mine ? { id: mine.journeyId } : { tenantId: ctx.tenantId, slug: JOURNEY }, include: { levels: { orderBy: { idx: 'asc' }, select: { id: true, code: true, title: true, idx: true } } } });
  if (!journey) return null;
  const level = journey.levels.find(l => l.code === levelCode) ?? null;
  const levelIds = level ? [level.id] : journey.levels.map(l => l.id);

  const members = await prisma.membership.findMany({
    where: { tenantId: ctx.tenantId, status: 'active', role: { code: { in: ['learner', 'team_lead'] } } },
    include: { user: { select: { id: true, name: true, area: true } } },
  });
  const ids = members.map(m => m.userId);
  const [sums, finals, settings] = await Promise.all([
    prisma.xpLedger.groupBy({ by: ['userId'], where: { tenantId: ctx.tenantId, userId: { in: ids }, levelId: { in: levelIds } }, _sum: { amount: true } }),
    prisma.xpLedger.groupBy({ by: ['userId'], where: { tenantId: ctx.tenantId, userId: { in: ids }, levelId: journey.levels[journey.levels.length - 1]?.id ?? '-' }, _sum: { amount: true } }),
    prisma.userSetting.findMany({ where: { tenantId: ctx.tenantId, userId: { in: ids } } }),
  ]);
  const priv = new Set(settings.filter(s => s.leaderboardVisibility === 'private' || s.ageBand === 'minor').map(s => s.userId));
  const xpBy = new Map(sums.map(s => [s.userId, s._sum.amount || 0]));
  const finalBy = new Map(finals.map(s => [s.userId, s._sum.amount || 0]));

  const rows: StandingRow[] = members.map(m => ({ userId: m.userId, name: m.user.name, area: m.user.area, xp: xpBy.get(m.userId) || 0, private: priv.has(m.userId) }));
  const board = areaBoard(toEntries(rows, ctx.userId));

  // Final fight: the top 8 by points, seeded best-vs-worst, each match decided by the final-challenge score.
  const field = board.global.slice(0, 8);
  const bracket = field.length >= 2 ? runBracket(field, id => finalBy.get(id) || 0) : null;
  const strip = <T extends { userId: string; me: boolean }>(e: T) => ({ ...e, userId: e.me ? e.userId : '' }); // never send others' ids

  return {
    journey: { title: journey.title, levels: journey.levels.map(l => ({ code: l.code, title: l.title, idx: l.idx })) },
    level: level ? { code: level.code, title: level.title, idx: level.idx } : null,
    areas: board.areas.map(a => ({ ...a, top: a.top.map(strip) })),
    global: board.global.slice(0, 20).map((g, i) => ({ ...strip(g), pos: i + 1 })),
    me: board.global.findIndex(g => g.me) + 1 || null,
    bracket: bracket && {
      rounds: bracket.rounds.map(r => r.map(m => ({ a: m.a.name, b: m.b?.name ?? null, scoreA: m.scoreA, scoreB: m.scoreB, aWon: m.winner.userId === m.a.userId }))),
      champion: bracket.champion.name,
    },
  };
}
