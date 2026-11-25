import { NextRequest } from 'next/server';
import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { changeOwnPassword } from '@/lib/domain/adminControl';
const schema = z.object({ current: z.string().max(200).default(''), password: z.string().max(200) });
export const POST = route(async (req: NextRequest) => { const b = await body(req, schema); return changeOwnPassword(await requireCtx(), b.current, b.password); }, { limit: { name: 'own-password', max: 5, windowMs: 15 * 60_000 } });
