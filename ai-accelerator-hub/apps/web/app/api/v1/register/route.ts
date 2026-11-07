import { route, body, rateLimit } from '@/lib/server/http';
import { register, registerSchema } from '@/lib/domain/account';
// Per address: sized for a whole class registering from one school connection. Per email: stops repeated tries.
export const POST = route(async req => { const b = await body(req, registerSchema); rateLimit(`register-email:${String(b.email).toLowerCase()}`, 5, 15 * 60_000); return register(b); }, { limit: { name: 'register', max: 60, windowMs: 15 * 60_000 } });
