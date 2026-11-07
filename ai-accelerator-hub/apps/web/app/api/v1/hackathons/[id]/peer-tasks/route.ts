import { route } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { peerTasks } from '@/lib/domain/hackathon';

export const GET = route(async (_r, p) => peerTasks(await requireCtx(), p.id));
