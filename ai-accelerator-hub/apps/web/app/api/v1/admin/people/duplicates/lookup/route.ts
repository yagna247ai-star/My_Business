// docs/IDENTITY_DEDUP_SPEC.md §3.23: find two accounts by email so any pair can be merged (permission checked in the domain).
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { lookupPair } from '@/lib/domain/identity';
const schema = z.object({ emailA: z.string().trim().email().max(254), emailB: z.string().trim().email().max(254) });
export const POST = route(async (req: NextRequest) => { const b = await body(req, schema); return lookupPair(await requireCtx(), b.emailA, b.emailB); }, { limit: { name: 'admin-merge-lookup', max: 30, windowMs: 60_000 } });
