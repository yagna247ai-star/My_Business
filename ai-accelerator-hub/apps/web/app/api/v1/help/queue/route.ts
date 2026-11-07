import { NextRequest } from 'next/server';
import { route } from '@/lib/server/http';
import { requirePerm } from '@/lib/server/context';
import { helpQueue } from '@/lib/domain/help';
export const GET = route(async (req: NextRequest) => ({ requests: await helpQueue(await requirePerm('review:read'), req.nextUrl.searchParams.get('state') === 'resolved' ? 'resolved' : 'active') }));
