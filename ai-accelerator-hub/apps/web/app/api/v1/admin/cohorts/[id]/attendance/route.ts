// docs/COHORT_WEEK_SPEC.md AC-3: a mentor marks a learner present / absent / excused for a class block (or clears it).
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { mentorMark } from '@/lib/domain/cohortWeek';

const schema = z.object({ userId: z.string().min(1).max(40), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), block: z.string().min(1).max(20), status: z.enum(['present', 'absent', 'excused', 'clear']) });
export const POST = route(async (req: NextRequest, p) => mentorMark(await requireCtx(), p.id, await body(req, schema)), { limit: { name: 'attendance-mark', max: 240, windowMs: 60_000 } });
