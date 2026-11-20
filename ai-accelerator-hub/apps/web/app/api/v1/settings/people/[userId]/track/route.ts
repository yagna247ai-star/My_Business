import { NextRequest } from 'next/server';
import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { learnerTrack, requestTrackChange } from '@/lib/domain/journeyTracks';
// Staff view and change a learner's track (roles allowed in Settings → Learning tracks; only until Module 1 is complete).
const schema = z.object({ level: z.enum(['easy', 'intermediate', 'hard', 'critical']), reason: z.string().max(500).optional() });
export const GET = route(async (_req: NextRequest, p) => ({ track: await learnerTrack(await requireCtx(), p.userId) }));
export const POST = route(async (req: NextRequest, p) => requestTrackChange(await requireCtx(), p.userId, await body(req, schema)), { limit: { name: 'track-change-staff', max: 60, windowMs: 60 * 60_000 } });
