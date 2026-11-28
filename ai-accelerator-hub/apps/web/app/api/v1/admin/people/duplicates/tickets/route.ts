// docs/IDENTITY_DEDUP_SPEC.md §3.12: send a duplicate group to the Super Admin queue.
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { createTicket } from '@/lib/domain/identity';
const schema = z.object({ primaryId: z.string().max(40), secondaryIds: z.array(z.string().max(40)).min(1).max(20), note: z.string().max(500).optional() });
export const POST = route(async (req: NextRequest) => createTicket(await requireCtx(), await body(req, schema)), { limit: { name: 'admin-merge-ticket', max: 20, windowMs: 60_000 } });
