import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { setApplicationState } from '@/lib/domain/talent';

const schema = z.object({ state: z.enum(['shortlisted', 'rejected', 'withdrawn']) });

export const POST = route(async (req, p) => setApplicationState(await requireCtx(), p.appId, (await body(req, schema)).state));
