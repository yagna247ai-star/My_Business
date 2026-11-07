import { NextRequest } from 'next/server';
import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { listFeed, createPost } from '@/lib/domain/feed';

const schema = z.object({ kind: z.string().max(20), body: z.string().max(2000), levelCode: z.string().max(20).optional(), linkUrl: z.string().max(500).optional() });

export const GET = route(async (req: NextRequest) => listFeed(await requireCtx(), 20, req.nextUrl.searchParams.get('cursor') || undefined));
export const POST = route(async req => createPost(await requireCtx(), await body(req, schema)));
