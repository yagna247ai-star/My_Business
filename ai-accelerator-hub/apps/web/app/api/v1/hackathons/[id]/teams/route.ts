import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { createTeam } from '@/lib/domain/hackathon';

const schema = z.object({ name: z.string().max(40) });

export const POST = route(async (req, p) => createTeam(await requireCtx(), p.id, (await body(req, schema)).name));
