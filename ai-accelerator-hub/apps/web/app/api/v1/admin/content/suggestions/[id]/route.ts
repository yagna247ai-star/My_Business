import { NextRequest } from 'next/server';
import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { setSuggestionState } from '@/lib/domain/contentReview';
// Mark a suggestion done (content improved), won't change, or reopen it.
const schema = z.object({ state: z.enum(['open', 'done', 'wontfix']), note: z.string().max(1000).optional() });
export const PATCH = route(async (req: NextRequest, p) => { const b = await body(req, schema); return setSuggestionState(await requireCtx(), p.id, b.state, b.note); });
