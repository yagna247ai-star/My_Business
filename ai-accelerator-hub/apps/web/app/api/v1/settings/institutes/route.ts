import { NextRequest } from 'next/server';
import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { createInstitute, listInstitutes } from '@/lib/domain/settingsAdmin';
export const GET = route(async () => ({ institutes: await listInstitutes(await requireCtx()) }));
const schema = z.object({ name: z.string().max(120), slug: z.string().max(40).optional(), plan: z.enum(['free', 'pro', 'enterprise']).optional(), adminEmail: z.string().max(254).optional(), contactEmail: z.string().max(200).optional(), phone: z.string().max(200).optional(), website: z.string().max(200).optional(), city: z.string().max(200).optional(), about: z.string().max(1000).optional() });
export const POST = route(async (req: NextRequest) => createInstitute(await requireCtx(), await body(req, schema)));
