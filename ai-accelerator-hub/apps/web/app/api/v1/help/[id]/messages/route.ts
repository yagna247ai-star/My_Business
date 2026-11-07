import { NextRequest } from 'next/server';
import { route, body } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { messageSchema, replyHelp } from '@/lib/domain/help';
export const POST = route(async (req: NextRequest, p) => { const c = await requireCtx(); return replyHelp(c, p.id, await body(req, messageSchema)); });
