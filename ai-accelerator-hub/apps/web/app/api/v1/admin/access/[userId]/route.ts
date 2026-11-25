// docs/SUPER_ADMIN_CONTROL_SPEC.md §3.6: per-person permissions (Super Admin only).
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { getAccess, setAccess } from '@/lib/domain/adminControl';
const schema = z.object({ levels: z.record(z.string().max(40), z.enum(['none', 'view', 'manage'])).optional(), modes: z.record(z.string().max(40), z.enum(['grant', 'revoke', 'role'])).optional() }).refine(b => b.levels || b.modes, 'Choose the access to save.');
export const GET = route(async (_req: NextRequest, p) => getAccess(await requireCtx(), p.userId));
export const PUT = route(async (req: NextRequest, p) => setAccess(await requireCtx(), p.userId, await body(req, schema)));
