import { route } from '@/lib/server/http';
import { requirePerm } from '@/lib/server/context';
import { moderationQueue } from '@/lib/domain/feed';

export const GET = route(async () => moderationQueue(await requirePerm('community:moderate')));
