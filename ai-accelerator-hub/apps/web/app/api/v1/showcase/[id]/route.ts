import { NextRequest } from 'next/server';
import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { moderate, report, unpublish } from '@/lib/domain/showcase';

// Author: remove own project. Any member: report. Moderators: remove (with reason), feature, hide (with reason), show, dismiss reports.
export const DELETE = route(async (_r: NextRequest, p) => unpublish(await requireCtx(), p.id));
const schema = z.object({ action: z.enum(['remove', 'report', 'feature', 'unfeature', 'hide', 'show', 'dismiss_reports']), reason: z.string().max(500).optional() });
export const POST = route(async (req: NextRequest, p) => {
  const ctx = await requireCtx(); const b = await body(req, schema);
  if (b.action === 'remove') return unpublish(ctx, p.id, b.reason);
  if (b.action === 'report') return report(ctx, p.id, b.reason);
  return moderate(ctx, p.id, b.action, b.reason);
}, { limit: { name: 'showcase', max: 30, windowMs: 60_000 } });
