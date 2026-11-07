import { route } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { prisma } from '@/lib/prisma';
export const GET = route(async () => { await requireCtx(); return { items: await prisma.libraryResource.findMany({ orderBy: [{ levelIdx: 'asc' }, { fullName: 'asc' }] }) }; });
