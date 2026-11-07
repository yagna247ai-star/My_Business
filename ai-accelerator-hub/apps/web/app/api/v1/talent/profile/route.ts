import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { myProfile, upsertProfile } from '@/lib/domain/talent';

const schema = z.object({ headline: z.string().max(120), skills: z.array(z.string().max(40)).max(20), openTo: z.array(z.string().max(20)).max(4), visibility: z.string().max(20) });

export const GET = route(async () => myProfile(await requireCtx()));
export const PUT = route(async req => upsertProfile(await requireCtx(), await body(req, schema)));
