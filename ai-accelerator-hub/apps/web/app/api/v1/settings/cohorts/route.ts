import { NextRequest } from 'next/server';
import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { createCohortAdmin, listCohortsAdmin } from '@/lib/domain/settingsAdmin';
export const GET = route(async () => ({ cohorts: await listCohortsAdmin(await requireCtx()) }));
const schema = z.object({ name: z.string().max(120), startDate: z.string().max(40).nullable().optional(), endDate: z.string().max(40).nullable().optional(), maxSize: z.number().int().nullable().optional() });
export const POST = route(async (req: NextRequest) => createCohortAdmin(await requireCtx(), await body(req, schema)));
