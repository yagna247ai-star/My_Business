// docs/REGISTRATION_HOME_SPEC.md AC-4: make this institution the home for new learners without a code (it takes AIHUB). Super Admin only.
import { NextRequest } from 'next/server';
import { route } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { makeDefaultHome } from '@/lib/domain/institutions';

export const POST = route(async (_req: NextRequest, p) => makeDefaultHome(await requireCtx(), p.id), { limit: { name: 'institute-default', max: 10, windowMs: 60_000 } });
