import { NextRequest } from 'next/server';
import { route } from '@/lib/server/http';
import { requirePerm } from '@/lib/server/context';
import { discoverTalent } from '@/lib/domain/talent';

export const GET = route(async (req: NextRequest) => discoverTalent(await requirePerm('talent:discover'), {
  skills: (req.nextUrl.searchParams.get('skills') || '').split(',').filter(Boolean),
  trackCode: req.nextUrl.searchParams.get('track') || undefined,
}));
