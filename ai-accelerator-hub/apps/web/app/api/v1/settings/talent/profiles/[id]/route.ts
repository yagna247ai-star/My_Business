import { NextRequest } from 'next/server';
import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { deleteTalentProfileAdmin, updateTalentProfileAdmin } from '@/lib/domain/settingsAdmin';
const schema = z.object({ headline: z.string().max(140).optional(), visibility: z.enum(['private', 'tenant', 'public']).optional() });
export const PATCH = route(async (req: NextRequest, p) => updateTalentProfileAdmin(await requireCtx(), p.id, await body(req, schema)));
export const DELETE = route(async (_req: NextRequest, p) => deleteTalentProfileAdmin(await requireCtx(), p.id));
