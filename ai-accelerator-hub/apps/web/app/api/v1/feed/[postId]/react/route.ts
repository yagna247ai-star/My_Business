import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { toggleReaction } from '@/lib/domain/feed';

const schema = z.object({ kind: z.string().max(20) });

export const POST = route(async (req, p) => toggleReaction(await requireCtx(), p.postId, (await body(req, schema)).kind));
