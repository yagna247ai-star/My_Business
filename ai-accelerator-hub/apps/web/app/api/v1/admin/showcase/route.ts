import { route } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { adminShowcase } from '@/lib/domain/showcase';
export const GET = route(async () => ({ items: await adminShowcase(await requireCtx()) }));
