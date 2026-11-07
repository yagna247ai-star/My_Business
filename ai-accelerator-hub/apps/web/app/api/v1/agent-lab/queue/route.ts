import { route } from '@/lib/server/http';
import { requirePerm } from '@/lib/server/context';
import { labQueue } from '@/lib/domain/agentLab';

export const GET = route(async () => ({ items: await labQueue(await requirePerm('review:read')) }));
