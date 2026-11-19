/** Audit trail (append-only) and in-app notifications. Both are tenant-scoped. */
import { prisma } from '@/lib/prisma';
import type { Prisma, PrismaClient } from '@prisma/client';

type Tx = PrismaClient | Prisma.TransactionClient;

export async function audit(tx: Tx, a: { tenantId: string; actorUserId?: string | null; action: string; resourceType: string; resourceId?: string | null; before?: unknown; after?: unknown; ip?: string | null }) {
  await tx.auditLog.create({ data: { tenantId: a.tenantId, actorUserId: a.actorUserId ?? null, action: a.action, resourceType: a.resourceType, resourceId: a.resourceId ?? null, before: a.before === undefined ? null : JSON.stringify(a.before), after: a.after === undefined ? null : JSON.stringify(a.after), ip: a.ip ?? null } });
}

export type NotifPayload = { title: string; body?: string; href?: string; tone?: 'ok' | 'warn' | 'gold' | 'info' };
export async function notify(tx: Tx, tenantId: string, userId: string, template: string, payload: NotifPayload) {
  await tx.notification.create({ data: { tenantId, userId, template, payload: JSON.stringify(payload), channel: 'in_app', state: 'sent', sentAt: new Date() } });
}

/**
 * The same notification to many people in ONE insert. Use inside transactions instead of a `for … await notify()`
 * loop: one round trip per recipient made submit transactions exceed Prisma's 5 s limit as reviewer lists grew.
 * Duplicate recipients get one notification.
 */
export async function notifyMany(tx: Tx, tenantId: string, userIds: string[], template: string, payload: NotifPayload) {
  const ids = [...new Set(userIds)];
  if (!ids.length) return;
  const now = new Date(); const body = JSON.stringify(payload);
  await tx.notification.createMany({ data: ids.map(userId => ({ tenantId, userId, template, payload: body, channel: 'in_app', state: 'sent', sentAt: now })) });
}

export async function listNotifications(tenantId: string, userId: string, take = 30) {
  const rows = await prisma.notification.findMany({ where: { tenantId, userId, channel: 'in_app' }, orderBy: { createdAt: 'desc' }, take });
  return rows.map(r => ({ id: r.id, template: r.template, read: r.state === 'read', at: r.createdAt, ...(JSON.parse(r.payload || '{}') as NotifPayload) }));
}
