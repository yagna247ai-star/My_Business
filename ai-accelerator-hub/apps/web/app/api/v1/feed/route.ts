import { NextRequest } from 'next/server';
import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { listFeed, createPost } from '@/lib/domain/feed';
import { asTab } from '@/lib/domain/feedCore';

const schema = z.object({ kind: z.string().max(20), body: z.string().max(2000), levelCode: z.string().max(20).optional(), linkUrl: z.string().max(500).optional(), day: z.number().int().min(1).max(400).optional() });

// docs/FEED_ENGAGEMENT_SPEC.md: tabs, a focused post (?post=), stable cursors; posting is rate limited (AC-1).
export const GET = route(async (req: NextRequest) => { const q = req.nextUrl.searchParams; return listFeed(await requireCtx(), 20, q.get('cursor') || undefined, { tab: asTab(q.get('tab')), postId: q.get('post') || undefined }); });
export const POST = route(async req => createPost(await requireCtx(), await body(req, schema)), { limit: { name: 'feed-post', max: 8, windowMs: 10 * 60_000 } });
