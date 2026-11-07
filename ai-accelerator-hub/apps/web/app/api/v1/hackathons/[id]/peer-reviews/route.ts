import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { submitPeerReview } from '@/lib/domain/hackathon';

const schema = z.object({ entryId: z.string().max(40), scores: z.object({ problem: z.number().int(), build: z.number().int(), teamwork: z.number().int() }), comment: z.string().max(3000) });

export const POST = route(async req => { const b = await body(req, schema); return submitPeerReview(await requireCtx(), b.entryId, b.scores, b.comment); });
