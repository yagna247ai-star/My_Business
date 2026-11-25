import { NextRequest } from 'next/server';
import { route } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { recheckProjectLinks } from '@/lib/domain/showcase';
export const POST = route(async (_req: NextRequest, p) => recheckProjectLinks(await requireCtx(), p.id), { limit: { name: 'showcase-recheck', max: 30, windowMs: 60_000 } });
