import { NextRequest } from 'next/server';
import { route } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { requestContribute } from '@/lib/domain/projects';
export const POST = route(async (_req: NextRequest, p) => requestContribute(await requireCtx(), p.id), { limit: { name: 'project-contribute', max: 10, windowMs: 60_000 } });
