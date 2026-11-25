// docs/SHOWCASE_GITHUB_SPEC.md §3.3: map an existing GitHub repository to the project.
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { attachRepo } from '@/lib/domain/projects';
const schema = z.object({ fullName: z.string().trim().min(3, 'Choose a repository.').max(200) });
export const POST = route(async (req: NextRequest, p) => attachRepo(await requireCtx(), p.id, (await body(req, schema)).fullName), { limit: { name: 'project-repo', max: 20, windowMs: 60_000 } });
