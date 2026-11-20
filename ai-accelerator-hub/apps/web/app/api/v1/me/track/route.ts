import { NextRequest } from 'next/server';
import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requirePerm } from '@/lib/server/context';
import { myTrack, changeOwnTrack } from '@/lib/domain/journeyTracks';
// The learner's track. Changing it is allowed only until Module 1 is complete.
const schema = z.object({ level: z.enum(['easy', 'intermediate', 'hard', 'critical']), mode: z.enum(['continue', 'restart']), ack: z.boolean().optional() });
export const GET = route(async () => ({ track: await myTrack(await requirePerm('learn:self')) }));
export const POST = route(async (req: NextRequest) => changeOwnTrack(await requirePerm('learn:self'), await body(req, schema)), { limit: { name: 'track-change', max: 10, windowMs: 60 * 60_000 } });
