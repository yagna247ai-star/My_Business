import { route } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { hackathonBoard } from '@/lib/domain/hackathon';

export const GET = route(async (_r, p) => hackathonBoard(await requireCtx(), p.id));
