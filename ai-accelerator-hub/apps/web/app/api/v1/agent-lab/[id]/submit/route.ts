import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requirePerm } from '@/lib/server/context';
import { submitRun } from '@/lib/domain/agentLab';

const schema = z.object({ acknowledge: z.boolean().optional() });
export const POST = route(async (req, p) => submitRun(await requirePerm('learn:self'), p.id, await body(req, schema)), { limit: { name: 'lab-submit', max: 10, windowMs: 60_000 } });
