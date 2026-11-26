// docs/FEED_ENGAGEMENT_SPEC.md AC-13: staff pin or unpin a post.
import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { setPin } from '@/lib/domain/feed';

const schema = z.object({ pinned: z.boolean() });
export const POST = route(async (req, p) => setPin(await requireCtx(), p.postId, (await body(req, schema)).pinned), { limit: { name: 'feed-pin', max: 30, windowMs: 60_000 } });
