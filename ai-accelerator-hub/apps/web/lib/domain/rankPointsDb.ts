/** Loads ledger rows for the one points rule (docs/RANKS_UNIFIED_SPEC.md). Every ranking calls this. */
import { prisma } from '@/lib/prisma';
import { rankPoints } from './pointsRule';

export async function loadRankPoints(tenantId: string, userIds: string[], opts: { levelIds?: string[] | null; before?: Date } = {}) {
  if (!userIds.length) return new Map<string, { points: number; reachedAt: Date }>();
  const rows = await prisma.xpLedger.findMany({
    where: { tenantId, userId: { in: userIds }, levelId: opts.levelIds?.length ? { in: opts.levelIds } : { not: null }, ...(opts.before ? { createdAt: { lt: opts.before } } : {}) },
    select: { userId: true, amount: true, levelId: true, createdAt: true },
  });
  return rankPoints(rows, opts.levelIds);
}
