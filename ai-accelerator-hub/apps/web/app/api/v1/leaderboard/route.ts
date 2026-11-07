import { NextRequest } from 'next/server';
import { route } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { leaderboard } from '@/lib/domain/insights';
export const GET = route(async (req: NextRequest) => leaderboard(await requireCtx(), req.nextUrl.searchParams.get('scope') === 'tenant' ? 'tenant' : 'cohort'));
