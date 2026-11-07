import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requirePerm } from '@/lib/server/context';
import { nudge } from '@/lib/domain/admin';
const schema = z.object({ userId: z.string().max(40), message: z.string().max(500) });
export const POST = route(async req => { const b = await body(req, schema); return nudge(await requirePerm('members:read'), b.userId, b.message); });
