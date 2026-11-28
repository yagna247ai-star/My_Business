// docs/IDENTITY_DEDUP_SPEC.md §3.18: remove one of my own secondary emails (my decision, no verification).
import { NextRequest } from 'next/server';
import { route } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { removeEmail } from '@/lib/domain/emails';
export const DELETE = route(async (_req: NextRequest, p) => removeEmail(await requireCtx(), p.id), { limit: { name: 'email-remove', max: 20, windowMs: 3_600_000 } });
