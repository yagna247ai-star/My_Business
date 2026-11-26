// docs/INSTITUTION_SHARING_SPEC.md AC-3: put this cohort (calendar and sessions) in every active institution. Super Admin only.
import { NextRequest } from 'next/server';
import { route } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { shareCohort } from '@/lib/domain/sharing';

export const POST = route(async (_req: NextRequest, p) => shareCohort(await requireCtx(), p.id), { limit: { name: 'cohort-share', max: 10, windowMs: 60_000 } });
