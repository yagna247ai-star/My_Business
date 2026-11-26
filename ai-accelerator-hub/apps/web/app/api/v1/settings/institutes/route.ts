import { NextRequest } from 'next/server';
import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { INSTITUTION_TYPES } from '@/lib/domain/institutionsCore';
import { createInstitute, listInstitutes } from '@/lib/domain/settingsAdmin';
export const GET = route(async () => ({ institutes: await listInstitutes(await requireCtx()) }));
const schema = z.object({ name: z.string().max(120), slug: z.string().max(40).optional(), plan: z.enum(['free', 'pro', 'enterprise']).optional(), adminEmail: z.string().max(254).optional(), contactEmail: z.string().max(200).optional(), phone: z.string().max(200).optional(), website: z.string().max(200).optional(), city: z.string().max(200).optional(), about: z.string().max(1500).optional(), legalName: z.string().max(160).optional(), address: z.string().max(300).optional(), state: z.string().max(80).optional(), pincode: z.string().max(10).optional(), contactName: z.string().max(100).optional(), registrationNo: z.string().max(80).optional(), established: z.string().max(4).optional(), type: z.enum(INSTITUTION_TYPES).optional(), logoUrl: z.string().max(300_000).nullable().optional(), code: z.string().max(20).optional() });
export const POST = route(async (req: NextRequest) => createInstitute(await requireCtx(), await body(req, schema)));
