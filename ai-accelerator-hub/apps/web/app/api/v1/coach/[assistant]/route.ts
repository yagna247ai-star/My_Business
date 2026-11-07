import { NextRequest } from 'next/server';
import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requirePerm } from '@/lib/server/context';
import { ask, history } from '@/lib/ai/coach';
export const GET = route(async (_r: NextRequest, p) => ({ messages: await history(await requirePerm('ai:use'), p.assistant) }));
const schema = z.object({ message: z.string().max(4000), context: z.object({ levelCode: z.string().max(40).optional(), activityIdx: z.number().int().optional(), lab: z.object({ runId: z.string().max(40), stepId: z.string().max(20) }).optional() }).optional() });
export const POST = route(async (req: NextRequest, p) => { const b = await body(req, schema); return ask(await requirePerm('ai:use'), { assistantCode: p.assistant, ...b }); });
