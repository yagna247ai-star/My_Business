import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requirePerm } from '@/lib/server/context';
import { createCohort, listCohorts } from '@/lib/domain/admin';
export const GET = route(async () => ({ cohorts: await listCohorts(await requirePerm('cohort:read')) }));
const schema = z.object({ name: z.string().max(120), startDate: z.string().max(40).nullable().optional() });
export const POST = route(async req => createCohort(await requirePerm('cohort:manage'), await body(req, schema)));
