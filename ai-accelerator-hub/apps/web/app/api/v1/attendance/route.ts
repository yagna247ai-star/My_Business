// docs/COHORT_WEEK_SPEC.md AC-7: a learner checks in to a class block ("I attended").
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requirePerm } from '@/lib/server/context';
import { learnerCheckIn } from '@/lib/domain/cohortWeek';

const schema = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), block: z.string().min(1).max(20) });
export const POST = route(async (req: NextRequest) => learnerCheckIn(await requirePerm('learn:self'), await body(req, schema)), { limit: { name: 'attendance-checkin', max: 30, windowMs: 60_000 } });
