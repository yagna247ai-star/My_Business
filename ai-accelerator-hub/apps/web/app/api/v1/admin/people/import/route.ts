import { NextRequest } from 'next/server';
import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { importPeople } from '@/lib/domain/adminControl';
const schema = z.object({ csv: z.string().min(1, 'Choose a CSV file.').max(1_000_000, 'The file is larger than 1 MB.'), dryRun: z.boolean().default(true) });
export const maxDuration = 300;
export const POST = route(async (req: NextRequest) => { const b = await body(req, schema); return importPeople(await requireCtx(), b.csv, b.dryRun); }, { limit: { name: 'admin-import', max: 20, windowMs: 60_000 } });
