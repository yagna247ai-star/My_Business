// docs/IDENTITY_DEDUP_SPEC.md §3.16: my emails; add a secondary one (confirmed by an emailed link).
import { NextRequest } from 'next/server';
import { route, body } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { addEmail, addEmailSchema, listEmails } from '@/lib/domain/emails';
export const GET = route(async () => listEmails(await requireCtx()));
export const POST = route(async (req: NextRequest) => addEmail(await requireCtx(), await body(req, addEmailSchema)), { limit: { name: 'email-add', max: 5, windowMs: 3_600_000 } });
