import { NextRequest } from 'next/server';
import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { setMaterialProgress } from '@/lib/domain/dayMaterials';
const schema = z.object({ studied: z.boolean().optional(), practised: z.boolean().optional() });
export const POST = route(async (req: NextRequest, p) => setMaterialProgress(await requireCtx(), p.id, await body(req, schema)));
