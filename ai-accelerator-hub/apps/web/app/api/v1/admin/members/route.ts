import { route } from '@/lib/server/http';
import { requirePerm } from '@/lib/server/context';
import { listMembers } from '@/lib/domain/admin';
export const GET = route(async () => ({ members: await listMembers(await requirePerm('members:read')) }));
