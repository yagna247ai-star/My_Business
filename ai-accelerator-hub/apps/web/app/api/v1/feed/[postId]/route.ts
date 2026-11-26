// docs/FEED_ENGAGEMENT_SPEC.md AC-3: authors edit or delete their own post (moderators may delete).
import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { deletePost, updatePost } from '@/lib/domain/feed';

const schema = z.object({ body: z.string().max(2000) });
export const PATCH = route(async (req, p) => updatePost(await requireCtx(), p.postId, (await body(req, schema)).body), { limit: { name: 'feed-edit', max: 20, windowMs: 60_000 } });
export const DELETE = route(async (_req, p) => deletePost(await requireCtx(), p.postId), { limit: { name: 'feed-delete', max: 20, windowMs: 60_000 } });
