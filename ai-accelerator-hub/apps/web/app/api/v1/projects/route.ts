// docs/SHOWCASE_GITHUB_SPEC.md §3.1: define a showcase project.
import { NextRequest } from 'next/server';
import { route } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { defineProject } from '@/lib/domain/projects';
export const POST = route(async (req: NextRequest) => defineProject(await requireCtx(), await req.json().catch(() => ({}))), { limit: { name: 'project-define', max: 20, windowMs: 60_000 } });
