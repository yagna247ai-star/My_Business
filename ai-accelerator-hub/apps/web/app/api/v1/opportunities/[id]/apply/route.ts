import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { applyToOpportunity } from '@/lib/domain/talent';

const schema = z.object({ coverNote: z.string().max(2000) });

export const POST = route(async (req, p) => applyToOpportunity(await requireCtx(), p.id, (await body(req, schema)).coverNote));
