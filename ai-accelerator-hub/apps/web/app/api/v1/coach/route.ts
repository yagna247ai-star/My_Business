import { route } from '@/lib/server/http';
import { requirePerm } from '@/lib/server/context';
import { coachStatus } from '@/lib/ai/coach';
export const GET = route(async () => coachStatus(await requirePerm('ai:use')));
