import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requirePerm } from '@/lib/server/context';
import { setHackathonStatus, STATUSES } from '@/lib/domain/hackathon';

const schema = z.object({ status: z.enum(STATUSES) });

export const POST = route(async (req, p) => setHackathonStatus(await requirePerm('cohort:manage'), p.id, (await body(req, schema)).status));
