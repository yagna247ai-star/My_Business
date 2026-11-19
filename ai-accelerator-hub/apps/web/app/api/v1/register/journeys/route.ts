import { route } from '@/lib/server/http';
import { journeysForSignup } from '@/lib/domain/account';

/** Public: journeys open for sign-up (published only), default first. `?inviteCode=` uses that institution's journeys. */
export const GET = route(async req => {
  const code = req.nextUrl.searchParams.get('inviteCode')?.trim().slice(0, 40) || undefined;
  return { journeys: (await journeysForSignup(code)).map(({ id: _id, ...j }) => j) };
}, { limit: { name: 'register-journeys', max: 60, windowMs: 15 * 60_000 } });
