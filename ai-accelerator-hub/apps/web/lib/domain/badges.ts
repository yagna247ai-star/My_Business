/** Declarative badges. Conditions are evaluated against server data only; bonuses go through the ledger. */
import type { Prisma, PrismaClient } from '@prisma/client';
import { awardXp, totalXp } from './xp';
import { notify } from '@/lib/server/audit';

type Tx = PrismaClient | Prisma.TransactionClient;
type Cond = { type: 'approved_count'; gte: number } | { type: 'level_approved'; level: string } | { type: 'longest_streak'; gte: number } | { type: 'xp'; gte: number } | { type: 'boss_perfect'; level: string };

export async function evaluateBadges(tx: Tx, tenantId: string, userId: string) {
  const badges = await tx.badge.findMany({ where: { OR: [{ tenantId: null }, { tenantId }] } });
  const have = new Set((await tx.userBadge.findMany({ where: { userId }, select: { badgeId: true } })).map(b => b.badgeId));
  const approved = await tx.progress.findMany({ where: { tenantId, userId, state: 'approved' }, include: { level: { select: { code: true } }, bossProgress: true } });
  const streak = await tx.streak.findUnique({ where: { tenantId_userId: { tenantId, userId } } });
  const approvedSubs = await tx.submission.count({ where: { tenantId, userId, state: 'approved' } });
  const earned: string[] = [];
  for (const b of badges) {
    if (have.has(b.id) || !b.condition) continue;
    let c: Cond; try { c = JSON.parse(b.condition); } catch { continue; }
    const ok =
      c.type === 'approved_count' ? approvedSubs >= c.gte :
      c.type === 'level_approved' ? approved.some(p => p.level.code === c.level) :
      c.type === 'longest_streak' ? (streak?.longestStreak || 0) >= c.gte :
      c.type === 'boss_perfect' ? approved.some(p => p.level.code === c.level && p.bossProgress?.passed && JSON.parse(p.bossProgress.harnessResult || '{}').best === JSON.parse(p.bossProgress.harnessResult || '{}').total) :
      c.type === 'xp' ? (await totalXp(tenantId, userId, tx)) >= c.gte : false;
    if (!ok) continue;
    await tx.userBadge.create({ data: { userId, badgeId: b.id } });
    if (b.xpBonus > 0) await awardXp(tx, { tenantId, userId, amount: b.xpBonus, source: 'badge_bonus', idempotencyKey: `badge:${b.code}:${tenantId}:${userId}`, metadata: { badge: b.code } });
    await notify(tx, tenantId, userId, 'badge_earned', { title: `Badge earned: ${b.name}`, body: b.xpBonus ? `+${b.xpBonus} XP` : undefined, href: '/achievements', tone: 'gold' });
    earned.push(b.code);
  }
  return earned;
}
