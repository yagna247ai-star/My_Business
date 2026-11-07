import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { openAppeal } from '@/lib/domain/review';
const schema = z.object({ reviewId: z.string().max(40), note: z.string().max(3000) });
export const POST = route(async req => { const b = await body(req, schema); return openAppeal(await requireCtx(), b.reviewId, b.note); });
