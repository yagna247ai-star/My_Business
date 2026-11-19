import { NextRequest } from 'next/server';
import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { createOpportunityAdmin, listOpportunitiesAdmin } from '@/lib/domain/settingsAdmin';
export const GET = route(async () => ({ opportunities: await listOpportunitiesAdmin(await requireCtx()) }));
const schema = z.object({ orgName: z.string().max(120), title: z.string().max(140), kind: z.enum(['internship', 'job', 'project', 'sponsorship']), description: z.string().max(8000), skillsWanted: z.array(z.string().max(40)).max(30), status: z.enum(['open', 'closed']).optional() });
export const POST = route(async (req: NextRequest) => createOpportunityAdmin(await requireCtx(), await body(req, schema)));
