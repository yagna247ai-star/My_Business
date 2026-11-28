// docs/IDENTITY_DEDUP_SPEC.md: report duplicate accounts and merge them. Super Admin only (checked in the domain).
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { duplicateReport, mergeDuplicates } from '@/lib/domain/identity';
const schema = z.object({ primaryId: z.string().max(40).optional(), secondaryIds: z.array(z.string().max(40)).max(20).optional(), auto: z.boolean().optional() });
export const maxDuration = 300;
export const GET = route(async () => duplicateReport(await requireCtx()));
export const POST = route(async (req: NextRequest) => mergeDuplicates(await requireCtx(), await body(req, schema)), { limit: { name: 'admin-merge', max: 10, windowMs: 60_000 } });
