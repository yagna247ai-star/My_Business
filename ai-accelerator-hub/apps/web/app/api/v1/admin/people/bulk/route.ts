import { NextRequest } from 'next/server';
import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { bulkPeople } from '@/lib/domain/adminControl';
import { BULK_ACTIONS } from '@/lib/domain/adminControlCore';
const schema = z.object({ userIds: z.array(z.string().max(40)).min(1, 'Select at least one person.').max(500, 'Select at most 500 people at a time.'), action: z.enum(BULK_ACTIONS), value: z.string().max(60).optional() });
export const maxDuration = 300;
export const POST = route(async (req: NextRequest) => bulkPeople(await requireCtx(), await body(req, schema)), { limit: { name: 'admin-bulk', max: 20, windowMs: 60_000 } });
