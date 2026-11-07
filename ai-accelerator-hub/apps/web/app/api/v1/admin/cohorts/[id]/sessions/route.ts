import { NextRequest } from 'next/server';
import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { addSession } from '@/lib/domain/admin';
const schema = z.object({ title: z.string().min(3).max(120), kind: z.enum(['workshop', 'hackathon', 'office_hours']), startsAt: z.string().max(40), durationMin: z.number().int().min(15).max(600), liveLink: z.string().max(500).nullable().optional() });
export const POST = route(async (req: NextRequest, p) => addSession(await requireCtx(), p.id, await body(req, schema)));
