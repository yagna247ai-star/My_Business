import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requireCtx, requirePerm } from '@/lib/server/context';
import { listShowcase, publish, publishable } from '@/lib/domain/showcase';
export const GET = route(async () => { const c = await requireCtx(); return { items: await listShowcase(c), mine: c.role === 'learner' || c.role === 'team_lead' ? await publishable(c) : [] }; });
const schema = z.object({ submissionId: z.string().max(40), title: z.string().max(200), description: z.string().max(2000) });
export const POST = route(async req => publish(await requirePerm('learn:self'), await body(req, schema)), { limit: { name: 'showcase', max: 10, windowMs: 60_000 } });
