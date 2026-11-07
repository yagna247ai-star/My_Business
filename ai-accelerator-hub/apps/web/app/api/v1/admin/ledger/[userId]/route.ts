import { NextRequest } from 'next/server';
import { route } from '@/lib/server/http';
import { requirePerm } from '@/lib/server/context';
import { prisma } from '@/lib/prisma';
import { verifyChain } from '@/lib/domain/xp';
import { notFound } from '@/lib/server/errors';
import { audit } from '@/lib/server/audit';
export const GET = route(async (_r: NextRequest, p) => { const c = await requirePerm('ledger:verify'); const m = await prisma.membership.findUnique({ where: { tenantId_userId: { tenantId: c.tenantId, userId: p.userId } } }); if (!m) throw notFound('Member not found in this institution.'); const r = await verifyChain(c.tenantId, p.userId); await audit(prisma, { tenantId: c.tenantId, actorUserId: c.userId, action: 'ledger.verified', resourceType: 'User', resourceId: p.userId, after: { ok: r.ok, total: r.total } }); return r; });
