import { NextRequest } from 'next/server';
import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requirePerm } from '@/lib/server/context';
import { decideTrackChange } from '@/lib/domain/journeyTracks';
// The learner applies a track change made by staff, choosing to keep their Module 1 work or restart Module 1.
const schema = z.object({ mode: z.enum(['continue', 'restart']), ack: z.boolean().optional() });
export const POST = route(async (req: NextRequest, p) => decideTrackChange(await requirePerm('learn:self'), p.id, await body(req, schema)), { limit: { name: 'track-change', max: 10, windowMs: 60 * 60_000 } });
