// docs/FEED_ENGAGEMENT_SPEC.md AC-3: authors edit or delete their own reply (moderators may delete).
import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { deleteComment, updateComment } from '@/lib/domain/feed';

const schema = z.object({ body: z.string().max(1000) });
export const PATCH = route(async (req, p) => updateComment(await requireCtx(), p.commentId, (await body(req, schema)).body), { limit: { name: 'feed-reply-edit', max: 30, windowMs: 60_000 } });
export const DELETE = route(async (_req, p) => deleteComment(await requireCtx(), p.commentId), { limit: { name: 'feed-reply-delete', max: 30, windowMs: 60_000 } });
