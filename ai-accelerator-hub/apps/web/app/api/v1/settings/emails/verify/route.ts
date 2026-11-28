// docs/IDENTITY_DEDUP_SPEC.md §3.17: confirm a secondary email with the emailed link, signed in to the same account.
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { verifyEmail } from '@/lib/domain/emails';
const schema = z.object({ token: z.string().min(10).max(200) });
export const POST = route(async (req: NextRequest) => verifyEmail(await requireCtx(), (await body(req, schema)).token), { limit: { name: 'email-verify', max: 20, windowMs: 3_600_000 } });
