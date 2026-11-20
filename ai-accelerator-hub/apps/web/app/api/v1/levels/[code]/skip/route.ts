import { NextRequest } from 'next/server';
import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requirePerm } from '@/lib/server/context';
import { skipActivity } from '@/lib/domain/journey';
// Skip an activity for now: no points, the next one opens, and it can still be done later.
const schema = z.object({ idx: z.number().int().min(1).max(6) });
export const POST = route(async (req: NextRequest, p) => skipActivity(await requirePerm('learn:self'), p.code, (await body(req, schema)).idx), { limit: { name: 'activity', max: 60, windowMs: 60_000 } });
