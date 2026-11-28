// docs/IDENTITY_DEDUP_SPEC.md §3.19: make one of my confirmed emails the main one.
import { NextRequest } from 'next/server';
import { route } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { makePrimaryEmail } from '@/lib/domain/emails';
export const POST = route(async (_req: NextRequest, p) => makePrimaryEmail(await requireCtx(), p.id), { limit: { name: 'email-primary', max: 10, windowMs: 3_600_000 } });
