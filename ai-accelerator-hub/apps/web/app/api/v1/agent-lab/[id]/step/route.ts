import { route, body } from '@/lib/server/http';
import { requirePerm } from '@/lib/server/context';
import { saveStep, stepBody } from '@/lib/domain/agentLab';

export const POST = route(async (req, p) => { const b = await body(req, stepBody); return saveStep(await requirePerm('learn:self'), p.id, b.step, b.data); }, { limit: { name: 'lab-step', max: 60, windowMs: 60_000 } });
