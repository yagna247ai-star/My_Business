import { NextRequest } from 'next/server';
import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requirePerm } from '@/lib/server/context';
import { completeStep } from '@/lib/domain/journey';
// One guided step: checked against its rule (answer, pasted output or screenshot), or skipped.
const schema = z.object({ answer: z.string().max(4000).optional(), paste: z.string().max(20000).optional(), fileId: z.string().max(40).optional(), skip: z.boolean().optional() });
export const POST = route(async (req: NextRequest, p) => completeStep(await requirePerm('learn:self'), p.code, Number(p.day), Number(p.i), await body(req, schema)), { limit: { name: 'activity', max: 120, windowMs: 60_000 } });
