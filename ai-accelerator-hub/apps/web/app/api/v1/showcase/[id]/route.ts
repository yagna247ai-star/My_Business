import { NextRequest } from 'next/server';
import { route } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { unpublish } from '@/lib/domain/showcase';
export const DELETE = route(async (_r: NextRequest, p) => unpublish(await requireCtx(), p.id));
