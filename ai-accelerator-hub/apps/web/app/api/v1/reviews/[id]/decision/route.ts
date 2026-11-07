import { NextRequest } from 'next/server';
import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requirePerm } from '@/lib/server/context';
import { decide } from '@/lib/domain/review';
const schema = z.object({ verdict: z.enum(['approved', 'needs_changes']), scores: z.record(z.string(), z.number().int().min(1).max(5)), feedback: z.string().max(5000).default('') });
export const POST = route(async (req: NextRequest, p) => { const b = await body(req, schema); return decide(await requirePerm('review:decide'), p.id, b.scores, b.verdict, b.feedback ?? ''); });
