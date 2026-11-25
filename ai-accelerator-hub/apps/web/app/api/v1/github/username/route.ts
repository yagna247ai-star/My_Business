import { NextRequest } from 'next/server';
import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { setGithubUsername } from '@/lib/domain/projects';
const schema = z.object({ username: z.string().trim().max(60) });
export const PUT = route(async (req: NextRequest) => setGithubUsername(await requireCtx(), (await body(req, schema)).username), { limit: { name: 'github-username', max: 10, windowMs: 60_000 } });
