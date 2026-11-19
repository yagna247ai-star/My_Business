import { NextRequest } from 'next/server';
import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { getInstitute, updateInstitute } from '@/lib/domain/settingsAdmin';
export const GET = route(async () => getInstitute(await requireCtx()));
const schema = z.object({ name: z.string().max(120).optional(), contactEmail: z.string().max(200).optional(), phone: z.string().max(200).optional(), website: z.string().max(200).optional(), city: z.string().max(200).optional(), about: z.string().max(1000).optional() });
export const PATCH = route(async (req: NextRequest) => { const c = await requireCtx(); return updateInstitute(c, c.tenantId, await body(req, schema)); });
