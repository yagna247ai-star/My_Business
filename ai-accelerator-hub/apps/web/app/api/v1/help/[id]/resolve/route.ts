import { NextRequest } from 'next/server';
import { route } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { resolveHelp } from '@/lib/domain/help';
export const POST = route(async (_req: NextRequest, p) => resolveHelp(await requireCtx(), p.id));
