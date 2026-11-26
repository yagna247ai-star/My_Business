// docs/INSTITUTION_SHARING_SPEC.md AC-8: copy this course into every active institution that does not run it. Super Admin only.
import { NextRequest } from 'next/server';
import { route } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { shareJourney } from '@/lib/domain/sharing';

export const POST = route(async (_req: NextRequest, p) => shareJourney(await requireCtx(), p.id), { limit: { name: 'journey-share', max: 5, windowMs: 60_000 } });
