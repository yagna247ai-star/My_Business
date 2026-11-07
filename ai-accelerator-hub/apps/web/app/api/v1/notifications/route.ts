import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { prisma } from '@/lib/prisma';
import { listNotifications } from '@/lib/server/audit';
export const GET = route(async () => { const c = await requireCtx(); return { items: await listNotifications(c.tenantId, c.userId, 40) }; });
const schema = z.object({ ids: z.array(z.string().max(40)).max(100).optional(), all: z.boolean().optional() });
export const PATCH = route(async req => { const c = await requireCtx(); const b = await body(req, schema); await prisma.notification.updateMany({ where: { tenantId: c.tenantId, userId: c.userId, ...(b.all ? {} : { id: { in: b.ids || [] } }) }, data: { state: 'read' } }); return { ok: true }; });
