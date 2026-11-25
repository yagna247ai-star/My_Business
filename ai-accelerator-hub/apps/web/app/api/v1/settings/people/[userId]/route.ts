import { NextRequest } from 'next/server';
import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { removePerson, updatePerson } from '@/lib/domain/settingsAdmin';
import { areaSchema } from '@/lib/domain/areas';
const schema = z.object({ name: z.string().max(100).optional(), role: z.string().max(40).optional(), status: z.enum(['active', 'suspended']).optional(), cohortId: z.string().max(40).nullable().optional(), area: areaSchema.optional() });
export const PATCH = route(async (req: NextRequest, p) => updatePerson(await requireCtx(), p.userId, await body(req, schema)));
export const DELETE = route(async (_req: NextRequest, p) => removePerson(await requireCtx(), p.userId));
