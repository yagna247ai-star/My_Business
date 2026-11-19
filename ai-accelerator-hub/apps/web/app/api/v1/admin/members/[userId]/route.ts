import { NextRequest } from 'next/server';
import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requirePerm } from '@/lib/server/context';
import { changeRole, setMemberStatus } from '@/lib/domain/admin';
import { setMemberJourney } from '@/lib/domain/journeyAccess';
const schema = z.object({ role: z.string().max(40).optional(), status: z.enum(['active', 'suspended']).optional(), journeyId: z.string().min(1).max(40).optional() });
export const PATCH = route(async (req: NextRequest, p) => { const c = await requirePerm('members:manage'); const b = await body(req, schema); if (b.role) await changeRole(c, p.userId, b.role); if (b.status) await setMemberStatus(c, p.userId, b.status); if (b.journeyId) await setMemberJourney(c, p.userId, b.journeyId); return { ok: true }; });
