import { route } from '@/lib/server/http';
import { requirePerm } from '@/lib/server/context';
import { journeyOverview } from '@/lib/domain/journey';
export const GET = route(async () => journeyOverview(await requirePerm('learn:self')));
