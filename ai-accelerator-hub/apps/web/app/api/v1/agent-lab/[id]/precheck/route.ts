import { route } from '@/lib/server/http';
import { requirePerm } from '@/lib/server/context';
import { precheck } from '@/lib/domain/agentLab';

/** Proof scoring spec §5: live automatic proof check for the learner. */
export const GET = route(async (_req, p) => precheck(await requirePerm('learn:self'), p.id));
