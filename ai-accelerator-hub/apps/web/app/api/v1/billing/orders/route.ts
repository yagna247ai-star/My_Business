import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requirePerm } from '@/lib/server/context';
import { createPaymentOrder } from '@/lib/payments/gateway';
const schema = z.object({ planSlug: z.string().max(60) });
export const POST = route(async req => createPaymentOrder(await requirePerm('billing:self'), (await body(req, schema)).planSlug), { limit: { name: 'order', max: 10, windowMs: 60_000 } });
