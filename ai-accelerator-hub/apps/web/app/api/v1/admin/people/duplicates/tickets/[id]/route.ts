// docs/IDENTITY_DEDUP_SPEC.md §3.12: a Super Admin merges or rejects a ticket (checked in the domain).
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { resolveTicket } from '@/lib/domain/identity';
const schema = z.object({ action: z.enum(['merge', 'reject']), note: z.string().max(500).optional() });
export const maxDuration = 300;
export const POST = route(async (req: NextRequest, p) => resolveTicket(await requireCtx(), p.id, await body(req, schema)), { limit: { name: 'admin-merge-resolve', max: 20, windowMs: 60_000 } });
