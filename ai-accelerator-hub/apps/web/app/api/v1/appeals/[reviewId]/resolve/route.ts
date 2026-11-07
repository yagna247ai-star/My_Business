import { NextRequest } from 'next/server';
import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requirePerm } from '@/lib/server/context';
import { resolveAppeal } from '@/lib/domain/review';
const schema = z.object({ outcome: z.enum(['upheld', 'overturned']) });
export const POST = route(async (req: NextRequest, p) => resolveAppeal(await requirePerm('cohort:manage'), p.reviewId, (await body(req, schema)).outcome));
