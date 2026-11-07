import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requirePerm } from '@/lib/server/context';
import { prisma } from '@/lib/prisma';
import { recoverStreak } from '@/lib/domain/streak';
import { badRequest } from '@/lib/server/errors';
const schema = z.object({ answer: z.number().int() });
export const POST = route(async req => { const c = await requirePerm('learn:self'); const { answer } = await body(req, schema); const r = await prisma.$transaction(tx => recoverStreak(tx, c.tenantId, c.userId, answer)); if (!r.ok) throw badRequest(r.reason === 'wrong_answer' ? 'Not quite — try again.' : 'There is no paused streak to recover.'); return r; });
