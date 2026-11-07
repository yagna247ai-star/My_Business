import { route, body } from '@/lib/server/http';
import { requirePerm } from '@/lib/server/context';
import { verifyRun, verifySchema } from '@/lib/domain/agentLab';

export const POST = route(async (req, p) => verifyRun(await requirePerm('review:decide'), p.id, await body(req, verifySchema)), { limit: { name: 'lab-verify', max: 60, windowMs: 60_000 } });
