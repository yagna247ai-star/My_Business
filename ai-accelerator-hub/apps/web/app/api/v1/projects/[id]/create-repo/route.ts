// docs/SHOWCASE_GITHUB_SPEC.md §3.4: create the repo with README + docs/ (institution org first, else the learner's account).
import { NextRequest } from 'next/server';
import { route } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { createRepoForProject } from '@/lib/domain/projects';
export const maxDuration = 120;
export const POST = route(async (_req: NextRequest, p) => createRepoForProject(await requireCtx(), p.id), { limit: { name: 'project-create-repo', max: 5, windowMs: 60_000 } });
