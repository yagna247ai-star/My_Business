import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { submitEntry } from '@/lib/domain/hackathon';

const schema = z.object({ title: z.string().max(120), repoUrl: z.string().max(500), deployedUrl: z.string().max(500).optional(), reflectionMd: z.string().max(10000) });

export const POST = route(async (req, p) => submitEntry(await requireCtx(), p.id, await body(req, schema)));
