import { NextRequest } from 'next/server';
import { route } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { projectDetail, updateProject } from '@/lib/domain/projects';
export const GET = route(async (_req: NextRequest, p) => projectDetail(await requireCtx(), p.id));
export const PATCH = route(async (req: NextRequest, p) => updateProject(await requireCtx(), p.id, await req.json().catch(() => ({}))), { limit: { name: 'project-edit', max: 30, windowMs: 60_000 } });
