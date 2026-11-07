import { NextRequest } from 'next/server';
import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requirePerm } from '@/lib/server/context';
import { runBoss } from '@/lib/domain/journey';
const schema = z.object({ answers: z.array(z.object({ choice: z.number().int(), why: z.string().max(1000) })).max(20) });
export const POST = route(async (req: NextRequest, p) => runBoss(await requirePerm('learn:self'), p.code, (await body(req, schema)).answers), { limit: { name: 'boss', max: 10, windowMs: 60_000 } });
