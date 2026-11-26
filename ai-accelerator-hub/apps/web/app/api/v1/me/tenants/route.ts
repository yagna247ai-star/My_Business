import { route } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { myInstitutions } from '@/lib/domain/institutions';
export const GET = route(async () => myInstitutions(await requireCtx()));
