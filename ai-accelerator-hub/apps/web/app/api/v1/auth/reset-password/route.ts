// Forgot password, step 2 (docs/FORGOT_PASSWORD_SPEC.md): set a new password with the emailed link.
import { NextRequest } from 'next/server';
import { route, body, clientIp } from '@/lib/server/http';
import { resetSchema } from '@/lib/domain/passwordResetCore';
import { resetPassword } from '@/lib/domain/passwordReset';
export const POST = route(async (req: NextRequest) => { const b = await body(req, resetSchema); return resetPassword(b.token, b.password, clientIp(req)); }, { limit: { name: 'reset-password', max: 10, windowMs: 15 * 60_000 } });
