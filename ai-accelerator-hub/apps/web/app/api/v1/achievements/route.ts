import { route } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { prisma } from '@/lib/prisma';
import { ledger, totalXp, verifyChain } from '@/lib/domain/xp';
export const GET = route(async () => { const c = await requireCtx(); const [rows, xp, chain, badges, all] = await Promise.all([ledger(c.tenantId, c.userId), totalXp(c.tenantId, c.userId), verifyChain(c.tenantId, c.userId), prisma.userBadge.findMany({ where: { userId: c.userId } }), prisma.badge.findMany({ orderBy: { xpBonus: 'asc' } })]); const have = new Map(badges.map(b => [b.badgeId, b.earnedAt])); return { xp, chain, ledger: rows.map(r => ({ id: r.id, at: r.createdAt, amount: r.amount, source: r.source, hash: r.rowHash?.slice(0, 12) })), badges: all.map(b => ({ code: b.code, name: b.name, tier: b.tier, xpBonus: b.xpBonus, earnedAt: have.get(b.id) || null })) }; });
