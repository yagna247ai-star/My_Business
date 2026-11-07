import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requireCtx, requirePerm } from '@/lib/server/context';
import { listHackathons, createHackathon } from '@/lib/domain/hackathon';

const schema = z.object({ slug: z.string().max(40), title: z.string().max(120), briefMd: z.string().max(20000).optional(), cohortId: z.string().max(40).optional(), maxTeamSize: z.number().int().optional(), rubricCode: z.string().max(40).optional() });

export const GET = route(async () => listHackathons(await requireCtx()));
export const POST = route(async req => createHackathon(await requirePerm('cohort:manage'), await body(req, schema)));
