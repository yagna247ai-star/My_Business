// docs/COHORT_WEEK_SPEC.md AC-1: save a cohort's class calendar (cohort:manage; the body is checked by calendarSchema).
import { NextRequest } from 'next/server';
import { route, body } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { calendarSchema } from '@/lib/domain/cohortCalendar';
import { saveCalendar } from '@/lib/domain/cohortWeek';

export const PUT = route(async (req: NextRequest, p) => saveCalendar(await requireCtx(), p.id, await body(req, calendarSchema)), { limit: { name: 'cohort-calendar', max: 30, windowMs: 60_000 } });
