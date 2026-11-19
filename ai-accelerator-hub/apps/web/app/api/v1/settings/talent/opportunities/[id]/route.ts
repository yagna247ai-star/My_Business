import { NextRequest } from 'next/server';
import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { deleteOpportunityAdmin, updateOpportunityAdmin } from '@/lib/domain/settingsAdmin';
const schema = z.object({ orgName: z.string().max(120), title: z.string().max(140), kind: z.enum(['internship', 'job', 'project', 'sponsorship']), description: z.string().max(8000), skillsWanted: z.array(z.string().max(40)).max(30), status: z.enum(['open', 'closed']).optional() }).partial();
export const PATCH = route(async (req: NextRequest, p) => updateOpportunityAdmin(await requireCtx(), p.id, await body(req, schema)));
export const DELETE = route(async (_req: NextRequest, p) => deleteOpportunityAdmin(await requireCtx(), p.id));
