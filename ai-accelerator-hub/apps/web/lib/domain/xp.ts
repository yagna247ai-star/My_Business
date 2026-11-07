/**
 * XP ledger — append-only, server-authoritative, idempotent, SHA-256 hash-chained.
 * Amounts always come from server configuration (Activity.xpReward, badge.xpBonus, rubric split),
 * never from the client. Call inside the same transaction as the action that earns the XP.
 */
import crypto from 'crypto';
import type { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '@/lib/prisma';

type Tx = PrismaClient | Prisma.TransactionClient;
export type Award = { tenantId: string; userId: string; amount: number; source: string; idempotencyKey: string; levelId?: string | null; activityId?: string | null; metadata?: Record<string, unknown> };

const rowHashOf = (e: { prevHash: string | null; tenantId: string; userId: string; amount: number; source: string; idempotencyKey: string; createdAt: Date }) =>
  crypto.createHash('sha256').update(JSON.stringify([e.prevHash || 'GENESIS', e.tenantId, e.userId, e.amount, e.source, e.idempotencyKey, e.createdAt.toISOString()])).digest('hex');

export async function awardXp(tx: Tx, a: Award): Promise<{ awarded: boolean; amount: number }> {
  if (!Number.isInteger(a.amount) || a.amount <= 0 || a.amount > 1000) throw new Error('XP amount outside server bounds');
  const existing = await tx.xpLedger.findUnique({ where: { idempotencyKey: a.idempotencyKey } });
  if (existing) return { awarded: false, amount: 0 };
  const last = await tx.xpLedger.findFirst({ where: { tenantId: a.tenantId, userId: a.userId }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] });
  const now = Date.now();
  const createdAt = new Date(last && last.createdAt.getTime() >= now ? last.createdAt.getTime() + 1 : now); // strictly increasing per user
  const prevHash = last?.rowHash || null;
  const rowHash = rowHashOf({ prevHash, tenantId: a.tenantId, userId: a.userId, amount: a.amount, source: a.source, idempotencyKey: a.idempotencyKey, createdAt });
  await tx.xpLedger.create({ data: { tenantId: a.tenantId, userId: a.userId, amount: a.amount, source: a.source, idempotencyKey: a.idempotencyKey, levelId: a.levelId ?? null, activityId: a.activityId ?? null, prevHash, rowHash, createdAt, metadata: a.metadata ? JSON.stringify(a.metadata) : null } });
  return { awarded: true, amount: a.amount };
}

export async function totalXp(tenantId: string, userId: string, tx: Tx = prisma) {
  const agg = await tx.xpLedger.aggregate({ where: { tenantId, userId }, _sum: { amount: true } });
  return agg._sum.amount || 0;
}

export async function verifyChain(tenantId: string, userId: string, tx: Tx = prisma) {
  const rows = await tx.xpLedger.findMany({ where: { tenantId, userId }, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] });
  let prev: string | null = null;
  for (const r of rows) {
    if ((r.prevHash || null) !== prev || r.rowHash !== rowHashOf({ ...r, prevHash: prev })) return { ok: false as const, total: rows.length, brokenAt: r.id };
    prev = r.rowHash;
  }
  return { ok: true as const, total: rows.length, head: prev };
}

export async function ledger(tenantId: string, userId: string, take = 100) {
  return prisma.xpLedger.findMany({ where: { tenantId, userId }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take });
}
