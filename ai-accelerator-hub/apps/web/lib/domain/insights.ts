/** Dashboard summary, privacy-aware leaderboard, and programme analytics — all computed from real rows. */
import { prisma } from '@/lib/prisma';
import type { Ctx } from '@/lib/server/context';
import { hasPerm } from '@/lib/server/context';
import { forbidden } from '@/lib/server/errors';
import { listNotifications } from '@/lib/server/audit';
import { totalXp } from './xp';
import { istDay, streakView } from './streak';

export const TIERS = [{ name: 'Bronze', min: 0 }, { name: 'Silver', min: 500 }, { name: 'Gold', min: 1500 }, { name: 'Diamond', min: 2970 }];
export const RANKS = [{ name: 'Explorer', min: 0 }, { name: 'Builder', min: 200 }, { name: 'Engineer', min: 800 }, { name: 'Architect', min: 1800 }];
export const pick = <T extends { min: number }>(a: T[], xp: number) => a.reduce((acc, t) => (xp >= t.min ? t : acc), a[0]);
export const nextOf = <T extends { min: number }>(a: T[], xp: number) => a.find(t => t.min > xp) || null;

export async function leaderboard(ctx: Ctx, scope: 'cohort' | 'tenant' = 'cohort', take = 50) {
  const learnerMembers = await prisma.membership.findMany({ where: { tenantId: ctx.tenantId, status: 'active', role: { code: { in: ['learner', 'team_lead'] } }, ...(scope === 'cohort' && ctx.cohortId ? { cohortId: ctx.cohortId } : {}) }, include: { user: { select: { id: true, name: true } } } });
  const ids = learnerMembers.map(m => m.userId);
  const sums = await prisma.xpLedger.groupBy({ by: ['userId'], where: { tenantId: ctx.tenantId, userId: { in: ids } }, _sum: { amount: true } });
  const settings = await prisma.userSetting.findMany({ where: { tenantId: ctx.tenantId, userId: { in: ids } } });
  const streaks = await prisma.streak.findMany({ where: { tenantId: ctx.tenantId, userId: { in: ids } } });
  const priv = new Set(settings.filter(s => s.leaderboardVisibility === 'private' || s.ageBand === 'minor').map(s => s.userId));
  const xpBy = new Map(sums.map(s => [s.userId, s._sum.amount || 0]));
  const stBy = new Map(streaks.map(s => [s.userId, s.currentStreak]));
  const rows = learnerMembers.map(m => ({ userId: m.userId, xp: xpBy.get(m.userId) || 0, streak: stBy.get(m.userId) || 0, me: m.userId === ctx.userId, name: m.userId === ctx.userId ? (m.user.name || 'You') : priv.has(m.userId) ? 'Anonymous learner' : (m.user.name || 'Learner') }))
    .sort((a, b) => b.xp - a.xp || a.name.localeCompare(b.name))
    .map((r, i) => ({ ...r, pos: i + 1, rank: pick(RANKS, r.xp).name, userId: r.me ? r.userId : undefined }));
  return { scope, rows: rows.slice(0, take), me: rows.find(r => r.me) || null, total: rows.length };
}

export async function learnerSummary(ctx: Ctx) {
  const [xp, streak, badges, notes, enrollment] = await Promise.all([
    totalXp(ctx.tenantId, ctx.userId),
    prisma.streak.findUnique({ where: { tenantId_userId: { tenantId: ctx.tenantId, userId: ctx.userId } } }),
    prisma.userBadge.findMany({ where: { userId: ctx.userId }, include: { badge: true }, orderBy: { earnedAt: 'desc' } }),
    listNotifications(ctx.tenantId, ctx.userId, 5),
    prisma.enrollment.findFirst({ where: { tenantId: ctx.tenantId, userId: ctx.userId, state: { in: ['active', 'completed'] } }, orderBy: [{ state: 'asc' }, { updatedAt: 'desc' }], include: { cohort: true, journey: true } }),
  ]);
  const unread = await prisma.notification.count({ where: { tenantId: ctx.tenantId, userId: ctx.userId, channel: 'in_app', state: { not: 'read' } } });
  const sched = enrollment?.cohort?.schedule ? JSON.parse(enrollment.cohort.schedule) : null;
  const upcoming = (sched?.sessions || []).filter((s: { startsAt: string }) => Date.parse(s.startsAt) > Date.now() - 4 * 3600e3).slice(0, 2);
  return { xp, tier: pick(TIERS, xp), nextTier: nextOf(TIERS, xp), rank: pick(RANKS, xp), nextRank: nextOf(RANKS, xp), streak: streakView(streak), badges: badges.map(b => ({ code: b.badge.code, name: b.badge.name, tier: b.badge.tier, at: b.earnedAt })), notifications: notes, unread, cohort: enrollment?.cohort?.name || null, upcoming, today: istDay() };
}

export async function programAnalytics(ctx: Ctx) {
  if (!hasPerm(ctx, 'analytics:read')) throw forbidden();
  const t = ctx.tenantId;
  const l1 = await prisma.level.findFirst({ where: { tenantId: t, idx: 1 }, include: { activities: { orderBy: { idx: 'asc' } } } });
  const enrolled = await prisma.enrollment.count({ where: { tenantId: t } });
  const funnel = l1 ? await Promise.all(l1.activities.map(async a => ({ idx: a.idx, name: a.title.split(':')[0], completed: await prisma.activityProgress.count({ where: { activityId: a.id, state: 'completed' } }) }))) : [];
  const weekAgo = new Date(Date.now() - 7 * 86400e3);
  const activeLearners = (await prisma.xpLedger.groupBy({ by: ['userId'], where: { tenantId: t, createdAt: { gte: weekAgo } } })).length;
  const reviews = await prisma.review.findMany({ where: { submission: { tenantId: t }, isAiReview: false }, include: { submission: { select: { submittedAt: true } } } });
  const turn = reviews.map(r => (r.reviewedAt.getTime() - r.submission.submittedAt.getTime()) / 3600e3).sort((a, b) => a - b);
  const median = turn.length ? turn[Math.floor(turn.length / 2)] : null;
  const pending = await prisma.submission.count({ where: { tenantId: t, state: 'pending' } });
  const approvedLevels = await prisma.progress.count({ where: { tenantId: t, state: 'approved' } });
  const streaks = await prisma.streak.findMany({ where: { tenantId: t } });
  const health = { active: 0, frozen: 0, grace: 0, recovery: 0, new: 0 } as Record<string, number>;
  streaks.forEach(s => { health[streakView(s).status] += 1; });
  const aiCost = await prisma.aiUsageLedger.aggregate({ where: { tenantId: t, period: new Date().toISOString().slice(0, 7) }, _sum: { costMicros: true, tokensIn: true, tokensOut: true } });
  const revenue = await prisma.payment.aggregate({ where: { tenantId: t, status: 'captured' }, _sum: { amountPaise: true } });
  return { enrolled, activeLearners, funnel, medianReviewHours: median, reviewsDone: reviews.length, pending, approvedLevels, streakHealth: health, aiCostUsd: (aiCost._sum.costMicros || 0) / 1e6, aiTokens: (aiCost._sum.tokensIn || 0) + (aiCost._sum.tokensOut || 0), revenueInr: (revenue._sum.amountPaise || 0) / 100 };
}

export async function learnersAtRisk(ctx: Ctx) {
  if (!hasPerm(ctx, 'members:read')) throw forbidden();
  const ms = await prisma.membership.findMany({ where: { tenantId: ctx.tenantId, status: 'active', role: { code: 'learner' } }, include: { user: { select: { id: true, name: true, email: true } } } });
  const streaks = await prisma.streak.findMany({ where: { tenantId: ctx.tenantId, userId: { in: ms.map(m => m.userId) } } });
  const sBy = new Map(streaks.map(s => [s.userId, s]));
  const progress = await prisma.progress.findMany({ where: { tenantId: ctx.tenantId, userId: { in: ms.map(m => m.userId) }, state: { not: 'locked' } }, include: { level: { select: { idx: true, title: true } }, activityProgress: { where: { state: 'completed' } } }, orderBy: { level: { idx: 'desc' } } });
  return ms.map(m => {
    const v = streakView(sBy.get(m.userId) || null); const p = progress.find(x => x.userId === m.userId);
    return { userId: m.userId, name: m.user.name || m.user.email, streak: v, level: p ? `L${p.level.idx} · ${p.level.title}` : '—', activitiesDone: p?.activityProgress.length || 0, lastActive: sBy.get(m.userId)?.lastActiveDate || null, needsAttention: ['grace', 'recovery', 'new'].includes(v.status) };
  }).sort((a, b) => Number(b.needsAttention) - Number(a.needsAttention));
}
