import { route } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { joinTeam } from '@/lib/domain/hackathon';

export const POST = route(async (_r, p) => joinTeam(await requireCtx(), p.id, p.teamId));
