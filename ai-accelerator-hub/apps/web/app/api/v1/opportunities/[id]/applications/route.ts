import { route } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { postingApplications, closeOpportunity } from '@/lib/domain/talent';

export const GET = route(async (_r, p) => postingApplications(await requireCtx(), p.id));
export const POST = route(async (_r, p) => closeOpportunity(await requireCtx(), p.id));
