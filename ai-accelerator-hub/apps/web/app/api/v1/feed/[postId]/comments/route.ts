import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { listComments, createComment } from '@/lib/domain/feed';

const schema = z.object({ body: z.string().max(1000) });

export const GET = route(async (_r, p) => listComments(await requireCtx(), p.postId));
export const POST = route(async (req, p) => createComment(await requireCtx(), p.postId, (await body(req, schema)).body));
