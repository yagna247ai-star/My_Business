import { route } from '@/lib/server/http';
import { journeysForSignup } from '@/lib/domain/account';
import { institutionPreview } from '@/lib/domain/institutions';

/**
 * Public: journeys open for sign-up (published only), default first. `?inviteCode=` uses that institution's journeys.
 * docs/REGISTRATION_HOME_SPEC.md AC-3: also the institution the code leads to, so the form can say "You'll join …".
 */
export const GET = route(async req => {
  const code = req.nextUrl.searchParams.get('inviteCode')?.trim().slice(0, 40) || undefined;
  const [journeys, institution] = await Promise.all([journeysForSignup(code), institutionPreview(code)]);
  return { journeys: journeys.map(({ id: _id, ...j }) => j), institution: institution ? { name: institution.name, code: institution.code } : null };
}, { limit: { name: 'register-journeys', max: 60, windowMs: 15 * 60_000 } });
