import { route } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { myApplications } from '@/lib/domain/talent';

export const GET = route(async () => myApplications(await requireCtx()));
