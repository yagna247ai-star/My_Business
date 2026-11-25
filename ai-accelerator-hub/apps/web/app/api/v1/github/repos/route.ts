import { route } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { myGithubRepos } from '@/lib/domain/projects';
export const GET = route(async () => myGithubRepos(await requireCtx()), { limit: { name: 'github-repos', max: 20, windowMs: 60_000 } });
