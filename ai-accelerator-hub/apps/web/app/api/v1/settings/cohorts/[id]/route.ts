import { NextRequest } from 'next/server';
import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { deleteCohortAdmin, updateCohortAdmin } from '@/lib/domain/settingsAdmin';
const schema = z.object({ name: z.string().max(120), startDate: z.string().max(40).nullable().optional(), endDate: z.string().max(40).nullable().optional(), maxSize: z.number().int().nullable().optional(), regenerateInvite: z.boolean().optional() }).partial();
export const PATCH = route(async (req: NextRequest, p) => updateCohortAdmin(await requireCtx(), p.id, await body(req, schema)));
export const DELETE = route(async (_req: NextRequest, p) => deleteCohortAdmin(await requireCtx(), p.id));
