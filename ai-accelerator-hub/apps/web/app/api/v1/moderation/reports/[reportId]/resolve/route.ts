import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requirePerm } from '@/lib/server/context';
import { resolveReport } from '@/lib/domain/feed';

const schema = z.object({ action: z.enum(['hide', 'remove', 'dismiss']), note: z.string().max(500).optional() });

export const POST = route(async (req, p) => { const b = await body(req, schema); return resolveReport(await requirePerm('community:moderate'), p.reportId, b.action, b.note); });
