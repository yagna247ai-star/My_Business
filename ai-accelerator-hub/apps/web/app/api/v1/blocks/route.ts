import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { setBlock } from '@/lib/domain/feed';

const schema = z.object({ userId: z.string().max(40), blocked: z.boolean() });

export const POST = route(async req => { const b = await body(req, schema); return setBlock(await requireCtx(), b.userId, b.blocked); });
