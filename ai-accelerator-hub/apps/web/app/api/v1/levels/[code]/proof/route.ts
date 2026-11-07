import { NextRequest } from 'next/server';
import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requirePerm } from '@/lib/server/context';
import { submitProof } from '@/lib/domain/journey';
const schema = z.object({ evidenceUrl: z.string().max(2048), demoUrl: z.string().max(2048).optional().or(z.literal('')), reflection: z.string().max(10000), checklist: z.array(z.boolean()).max(10) });
export const POST = route(async (req: NextRequest, p) => { const b = await body(req, schema); return submitProof(await requirePerm('learn:self'), p.code, { ...b, demoUrl: b.demoUrl || undefined }); }, { limit: { name: 'proof', max: 10, windowMs: 60_000 } });
