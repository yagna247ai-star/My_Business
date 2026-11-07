import { NextRequest } from 'next/server';
import { route, body } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { createHelpRequest, createSchema, myHelpRequests } from '@/lib/domain/help';
/** Learner help requests from Agent Lab steps (docs/AGENT_LAB_GET_UNSTUCK_SPEC.md §5). */
export const GET = route(async (req: NextRequest) => ({ requests: await myHelpRequests(await requireCtx(), req.nextUrl.searchParams.get('runId') || undefined) }));
export const POST = route(async (req: NextRequest) => { const c = await requireCtx(); return createHelpRequest(c, await body(req, createSchema)); });
