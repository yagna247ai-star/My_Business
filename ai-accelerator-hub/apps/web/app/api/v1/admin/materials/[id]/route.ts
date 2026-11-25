import { NextRequest } from 'next/server';
import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { deleteMaterial, updateMaterial } from '@/lib/domain/dayMaterials';
import { KINDS } from '@/lib/domain/dayMaterialsCore';
const schema = z.object({ title: z.string().max(120).optional(), url: z.string().max(1000).optional(), kind: z.enum(KINDS).optional(), note: z.string().max(300).optional(), move: z.enum(['up', 'down']).optional() });
export const PATCH = route(async (req: NextRequest, p) => updateMaterial(await requireCtx(), p.id, await body(req, schema)));
export const DELETE = route(async (_req: NextRequest, p) => deleteMaterial(await requireCtx(), p.id));
