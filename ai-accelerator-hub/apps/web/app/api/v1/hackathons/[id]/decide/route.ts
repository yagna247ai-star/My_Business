import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requirePerm } from '@/lib/server/context';
import { decideHackathon } from '@/lib/domain/hackathon';

const schema = z.object({ placements: z.array(z.object({ entryId: z.string().max(40), place: z.number().int() })).max(50), note: z.string().max(2000).optional() });

export const POST = route(async (req, p) => { const b = await body(req, schema); return decideHackathon(await requirePerm('review:decide'), p.id, b.placements, b.note); });
