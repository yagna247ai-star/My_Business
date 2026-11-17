/**
 * Route-handler wrapper: same-origin (CSRF) check for mutations, rate limiting (per account when
 * signed in, per client address otherwise),
 * typed error mapping, and no internal details in responses.
 */
import { NextRequest, NextResponse } from 'next/server';
import { ZodError, type ZodSchema } from 'zod';
import { AppError, badRequest, forbidden, tooMany } from './errors';

type Handler = (req: NextRequest, params: Record<string, string>) => Promise<unknown>;

/* Fixed-window in-memory limiter. Per instance only — production uses Redis (REDIS_URL) so limits hold across replicas. */
const buckets = new Map<string, { n: number; reset: number }>();
export function rateLimit(key: string, max: number, windowMs: number) {
  const now = Date.now(), b = buckets.get(key);
  if (!b || b.reset < now) { buckets.set(key, { n: 1, reset: now + windowMs }); return; }
  if (++b.n > max) throw tooMany();
}
export const _resetRateLimits = () => buckets.clear();

/**
 * Client address for anonymous rate limits. X-Forwarded-For is attacker-controlled unless a proxy we run
 * appends to it, so it is only read when TRUST_PROXY_HOPS (the number of our proxies) is set, and then
 * we take the entry our outermost proxy added — counting from the right, never the client-supplied left.
 */
export function clientIp(req: NextRequest) {
  const hops = Number(process.env.TRUST_PROXY_HOPS || 0);
  if (hops > 0) {
    const chain = (req.headers.get('x-forwarded-for') || '').split(',').map(x => x.trim()).filter(Boolean);
    const ip = chain[chain.length - hops];
    if (ip) return ip;
  }
  return 'direct';
}

/** Signed-in callers are limited per account, so a class sharing one school IP never shares one limit. */
async function limitKey(req: NextRequest) {
  try {
    const { auth } = await import('@/lib/auth');
    const id = ((await auth())?.user as { id?: string } | undefined)?.id;
    if (id) return `u:${id}`;
  } catch { /* no session available: fall back to address */ }
  return `ip:${clientIp(req)}`;
}

/** Mutations must come from our own origin. Webhooks opt out and verify signatures instead. */
export function assertSameOrigin(req: NextRequest) {
  const origin = req.headers.get('origin');
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  if (!origin) {
    // Non-browser clients (no Origin) must use the Sec-Fetch-Site signal or be same-site fetches.
    const site = req.headers.get('sec-fetch-site');
    if (site && site !== 'same-origin' && site !== 'none') throw forbidden('Cross-site request blocked.');
    return;
  }
  try { if (new URL(origin).host !== host) throw forbidden('Cross-site request blocked.'); }
  catch (e) { if (e instanceof AppError) throw e; throw forbidden('Cross-site request blocked.'); }
}

export function route(handler: Handler, opts: { csrf?: boolean; limit?: { max: number; windowMs: number; name: string } } = {}) {
  return async (req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => {
    try {
      const mutating = !['GET', 'HEAD', 'OPTIONS'].includes(req.method);
      if (mutating && opts.csrf !== false) assertSameOrigin(req);
      if (opts.limit) rateLimit(`${opts.limit.name}:${await limitKey(req)}`, opts.limit.max, opts.limit.windowMs);
      const params = ctx?.params ? await ctx.params : {};
      const out = await handler(req, params);
      if (out instanceof Response) return out;
      return NextResponse.json(out ?? { ok: true });
    } catch (e) {
      if (e instanceof AppError) return NextResponse.json({ error: { code: e.code, message: e.message, details: e.details } }, { status: e.status });
      if (e instanceof ZodError) {
        const details = zodFieldErrors(e);
        const n = Object.keys(details).length;
        return NextResponse.json({ error: { code: 'BAD_REQUEST', message: n === 1 ? Object.values(details)[0] : `Please fix the ${n} highlighted fields.`, details } }, { status: 400 });
      }
      const db = prismaError(e);
      if (db) return NextResponse.json({ error: db.body }, { status: db.status });
      const requestId = req.headers.get('x-request-id') || crypto.randomUUID();
      console.error('[api]', JSON.stringify({ requestId, method: req.method, path: req.nextUrl.pathname }), e);
      return NextResponse.json({ error: { code: 'INTERNAL', message: 'Something went wrong on our side. Please try again in a moment.', requestId } }, { status: 500, headers: { 'x-request-id': requestId } });
    }
  };
}

/**
 * Known database failures → proper HTTP status instead of a generic 500. Matched by name/code so this file
 * does not import Prisma. P2002 = unique constraint (e.g. double-submitted registration), P2025 = record gone.
 */
function prismaError(e: unknown): { status: number; body: { code: string; message: string } } | null {
  const err = e as { name?: string; code?: string } | null;
  if (!err || typeof err !== 'object') return null;
  if (err.name === 'PrismaClientKnownRequestError') {
    if (err.code === 'P2002') return { status: 409, body: { code: 'CONFLICT', message: 'This already exists. If you just submitted, it went through — refresh to check.' } };
    if (err.code === 'P2025') return { status: 404, body: { code: 'NOT_FOUND', message: 'That item no longer exists. Refresh and try again.' } };
    // P1008 timeout, P2024 pool exhausted, P2028 transaction expired, P2034 write conflict: transient, safe to retry.
    if (['P1008', 'P2024', 'P2028', 'P2034'].includes(String(err.code))) {
      console.warn('[api] database busy', err.code);
      return { status: 503, body: { code: 'BUSY', message: 'We are handling a lot of requests right now. Please try again in a few seconds.' } };
    }
  }
  if (err.name === 'PrismaClientInitializationError') {
    console.error('[api] database unavailable', e);
    return { status: 503, body: { code: 'DB_UNAVAILABLE', message: 'The service is temporarily unavailable. Please try again in a moment.' } };
  }
  return null;
}

/** { field: first message } — the shape every form reads (nested paths joined with "."; root errors under "_"). */
export function zodFieldErrors(e: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of e.issues) {
    const k = i.path.length ? i.path.map(String).join('.') : '_';
    if (!(k in out)) out[k] = i.message;
  }
  return out;
}

export async function body<T>(req: NextRequest, schema: ZodSchema<T>): Promise<T> {
  let raw: unknown;
  try { raw = await req.json(); } catch { throw badRequest('Send a JSON body.'); }
  return schema.parse(raw);
}
