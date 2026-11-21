import { NextRequest } from 'next/server';
import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { addSuggestion } from '@/lib/domain/contentReview';
// A reviewer's suggestion on a level, a day lesson or an activity.
const schema = z.object({ levelId: z.string().max(40), target: z.string().max(20), body: z.string().max(4000) });
export const POST = route(async (req: NextRequest) => addSuggestion(await requireCtx(), await body(req, schema)), { limit: { name: 'suggestion', max: 120, windowMs: 60 * 60_000 } });
