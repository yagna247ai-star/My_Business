import { route } from '@/lib/server/http';
import { requirePerm } from '@/lib/server/context';
import { reviewQueue } from '@/lib/domain/review';
export const GET = route(async () => reviewQueue(await requirePerm('review:read')));
