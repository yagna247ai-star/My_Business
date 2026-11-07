import { route } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { requestDeletion } from '@/lib/domain/account';
export const POST = route(async () => requestDeletion(await requireCtx()));
