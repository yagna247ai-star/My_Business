// docs/COHORT_WEEK_SPEC.md AC-1: save a cohort's class calendar (cohort:manage; the body is checked by calendarSchema).
// docs/INSTITUTION_SHARING_SPEC.md AC-5: scope "all" (Super Admin: every institution) or "mine" (this institution only).
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { calendarSchema } from '@/lib/domain/cohortCalendar';
import { saveCalendar } from '@/lib/domain/cohortWeek';

const schema = calendarSchema.and(z.object({ scope: z.enum(['all', 'mine']).optional() }));
export const PUT = route(async (req: NextRequest, p) => { const b = await body(req, schema); return saveCalendar(await requireCtx(), p.id, b, b.scope ?? 'all'); }, { limit: { name: 'cohort-calendar', max: 30, windowMs: 60_000 } });
