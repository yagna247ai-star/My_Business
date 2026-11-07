import { NextRequest } from 'next/server';
import { route } from '@/lib/server/http';
import { requirePerm } from '@/lib/server/context';
import { auditLog } from '@/lib/domain/admin';
export const GET = route(async (req: NextRequest) => ({ entries: await auditLog(await requirePerm('audit:read'), (req.nextUrl.searchParams.get('q') || '').slice(0, 60)) }));
