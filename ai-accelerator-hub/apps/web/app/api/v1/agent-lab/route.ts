import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requirePerm } from '@/lib/server/context';
import { labOverview, startRun } from '@/lib/domain/agentLab';

export const GET = route(async () => labOverview(await requirePerm('learn:self')));
const schema = z.object({ agent: z.enum(['claude_code', 'codex_cli', 'opencode', 'kilo_code']), os: z.enum(['macos', 'windows', 'linux']) });
export const POST = route(async req => startRun(await requirePerm('learn:self'), await body(req, schema)), { limit: { name: 'lab-start', max: 20, windowMs: 60_000 } });
