import { NextRequest } from 'next/server';
import { route, body } from '@/lib/server/http';
import { requirePerm } from '@/lib/server/context';
import { adultSchema, confirmAdult } from '@/lib/domain/childSafety';
/** Move a learner who has turned 18 to the adult age band (child safety policy §10.1). */
export const POST = route(async (req: NextRequest, p) => { const c = await requirePerm('members:manage'); const b = await body(req, adultSchema); return confirmAdult(c, p.userId, b); });
