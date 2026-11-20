import { NextRequest } from 'next/server';
import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requirePerm } from '@/lib/server/context';
import { completeActivity } from '@/lib/domain/journey';
const schema = z.object({ choice: z.number().int().optional(), answers: z.array(z.number().int()).max(20).optional(), attested: z.boolean().optional(), tool: z.string().max(60).optional(), fields: z.record(z.string(), z.string().max(5000)).optional(), iterations: z.array(z.object({ prompt: z.string().max(5000).optional(), output: z.string().max(8000).optional(), change: z.string().max(3000).optional() })).max(5).optional(),
  // Screenshot evidence (domain journeys): the uploaded file and the ticked checklist.
  fileId: z.string().max(40).optional(), checklist: z.array(z.boolean()).max(20).optional() });
export const POST = route(async (req: NextRequest, p) => completeActivity(await requirePerm('learn:self'), p.code, Number(p.idx), await body(req, schema)), { limit: { name: 'activity', max: 60, windowMs: 60_000 } });
