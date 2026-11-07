import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { reportContent } from '@/lib/domain/feed';

const schema = z.object({ targetType: z.string().max(20), targetId: z.string().max(40), reason: z.string().max(1000) });

export const POST = route(async req => reportContent(await requireCtx(), await body(req, schema)));
