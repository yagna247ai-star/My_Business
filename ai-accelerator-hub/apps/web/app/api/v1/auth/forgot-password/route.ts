// Forgot password, step 1 (docs/FORGOT_PASSWORD_SPEC.md). Same answer for every email; 5 requests / 15 min per address.
import { NextRequest } from 'next/server';
import { route, body, clientIp } from '@/lib/server/http';
import { forgotSchema } from '@/lib/domain/passwordResetCore';
import { requestPasswordReset } from '@/lib/domain/passwordReset';
export const POST = route(async (req: NextRequest) => requestPasswordReset((await body(req, forgotSchema)).email, clientIp(req)), { limit: { name: 'forgot-password', max: 5, windowMs: 15 * 60_000 } });
