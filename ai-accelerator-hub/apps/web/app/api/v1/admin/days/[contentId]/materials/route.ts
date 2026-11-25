// docs/DAY_MATERIALS_SPEC.md: staff list and add a day's materials.
import { NextRequest } from 'next/server';
import { route } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { addMaterial, staffMaterials } from '@/lib/domain/dayMaterials';
export const GET = route(async (_req: NextRequest, p) => staffMaterials(await requireCtx(), p.contentId));
export const POST = route(async (req: NextRequest, p) => addMaterial(await requireCtx(), p.contentId, await req.json().catch(() => ({}))), { limit: { name: 'material-add', max: 60, windowMs: 60_000 } });
