import { route } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { badRequest } from '@/lib/server/errors';
import { getProfile, saveProfile } from '@/lib/domain/profile';

export const GET = route(async () => ({ profile: await getProfile(await requireCtx()) }));
export const PUT = route(async req => {
  let raw: unknown; try { raw = await req.json(); } catch { throw badRequest('Send a JSON body.'); }
  return saveProfile(await requireCtx(), raw);
}, { limit: { name: 'profile', max: 20, windowMs: 60_000 } });
