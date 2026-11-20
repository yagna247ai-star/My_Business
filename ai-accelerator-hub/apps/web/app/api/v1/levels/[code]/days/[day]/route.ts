import { NextRequest } from 'next/server';
import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requirePerm } from '@/lib/server/context';
import { completeDay, skipDay } from '@/lib/domain/journey';
// A day page: done (every step ticked + a screenshot) or skipped (no points, can be finished later).
const schema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('done'), steps: z.array(z.boolean()).max(20), fileId: z.string().max(40) }),
  z.object({ action: z.literal('skip') }),
]);
export const POST = route(async (req: NextRequest, p) => {
  const ctx = await requirePerm('learn:self');
  const b = await body(req, schema);
  return b.action === 'skip' ? skipDay(ctx, p.code, Number(p.day)) : completeDay(ctx, p.code, Number(p.day), b);
}, { limit: { name: 'activity', max: 60, windowMs: 60_000 } });
