// docs/FEED_ENGAGEMENT_SPEC.md AC-9: the asker accepts a reply.
import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { acceptAnswer } from '@/lib/domain/feed';

const schema = z.object({ commentId: z.string().min(1).max(40) });
export const POST = route(async (req, p) => acceptAnswer(await requireCtx(), p.postId, (await body(req, schema)).commentId), { limit: { name: 'feed-accept', max: 20, windowMs: 60_000 } });
