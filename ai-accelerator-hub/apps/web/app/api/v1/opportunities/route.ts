import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requireCtx, requirePerm } from '@/lib/server/context';
import { listOpportunities, postOpportunity } from '@/lib/domain/talent';

const schema = z.object({ orgName: z.string().max(120), title: z.string().max(140), kind: z.string().max(20), description: z.string().max(8000), skillsWanted: z.array(z.string().max(40)).max(15) });

export const GET = route(async () => listOpportunities(await requireCtx()));
export const POST = route(async req => postOpportunity(await requirePerm('talent:post'), await body(req, schema)));
