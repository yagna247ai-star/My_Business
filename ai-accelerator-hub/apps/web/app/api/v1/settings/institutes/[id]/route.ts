import { NextRequest } from 'next/server';
import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { deleteInstitute, updateInstitute } from '@/lib/domain/settingsAdmin';
const schema = z.object({ name: z.string().max(120).optional(), slug: z.string().max(40).optional(), plan: z.enum(['free', 'pro', 'enterprise']).optional(), status: z.enum(['active', 'suspended']).optional(), contactEmail: z.string().max(200).optional(), phone: z.string().max(200).optional(), website: z.string().max(200).optional(), city: z.string().max(200).optional(), about: z.string().max(1000).optional() });
export const PATCH = route(async (req: NextRequest, p) => updateInstitute(await requireCtx(), p.id, await body(req, schema)));
export const DELETE = route(async (_req: NextRequest, p) => deleteInstitute(await requireCtx(), p.id));
