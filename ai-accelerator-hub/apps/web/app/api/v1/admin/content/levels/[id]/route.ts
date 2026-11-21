import { NextRequest } from 'next/server';
import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { setLevelPublished } from '@/lib/domain/contentReview';
// Super Admin: publish or unpublish one level.
const schema = z.object({ published: z.boolean() });
export const PATCH = route(async (req: NextRequest, p) => setLevelPublished(await requireCtx(), p.id, (await body(req, schema)).published));
