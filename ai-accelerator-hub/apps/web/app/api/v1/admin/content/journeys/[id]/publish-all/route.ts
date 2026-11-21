import { route } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { publishAllLevels } from '@/lib/domain/contentReview';
// Super Admin: publish every level of a journey that is still a draft.
export const POST = route(async (_req, p) => publishAllLevels(await requireCtx(), p.id));
