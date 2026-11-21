'use client';
/** Browser → API helper. Same-origin JSON, typed errors, timeouts, readable messages for every failure mode. */
/** Set by I18nProvider: every error message (and field message) is shown in the page's language when a translation exists. */
let translate: (s: string) => string = s => s;
export const setApiTranslator = (fn: (s: string) => string) => { translate = fn; };
/** Marks a fixed message for the translation key list (identity at runtime). */
const msg = (s: string) => s;

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: Record<string, string>, public requestId?: string) {
    super(translate(message));
    if (details) this.details = Object.fromEntries(Object.entries(details).map(([k, v]) => [k, translate(v)]));
  }
}

type ErrBody = { error?: { code?: string; message?: string; details?: unknown; requestId?: string } };

/** Accepts the flat { field: message } map, and the older Zod `flatten()` shape { fieldErrors: { field: [msg] } }. */
function toFieldMap(d: unknown): Record<string, string> | undefined {
  if (!d || typeof d !== 'object' || Array.isArray(d)) return undefined;
  const src = 'fieldErrors' in d ? (d as { fieldErrors: Record<string, unknown> }).fieldErrors : (d as Record<string, unknown>);
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(src || {})) {
    const m = Array.isArray(v) ? v[0] : v;
    if (typeof m === 'string' && m) out[k] = m;
  }
  return Object.keys(out).length ? out : undefined;
}

const STATUS_MESSAGE: Record<number, string> = {
  401: msg('Your session has ended. Please sign in again.'),
  403: msg('You do not have permission to do that.'),
  404: msg('We could not find that.'),
  413: msg('That is too large to upload.'),
  429: msg('Too many attempts. Please wait a minute and try again.'),
  502: msg('The server is restarting. Please try again in a moment.'),
  503: msg('This service is temporarily unavailable. Please try again shortly.'),
  504: msg('The server took too long to respond. Please try again.'),
};

export async function api<T = unknown>(path: string, opts: { method?: string; body?: unknown; timeoutMs?: number; signal?: AbortSignal } = {}): Promise<T> {
  const hasBody = opts.body !== undefined;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(new DOMException('timeout', 'TimeoutError')), opts.timeoutMs ?? 30_000);
  opts.signal?.addEventListener('abort', () => ctrl.abort(opts.signal?.reason), { once: true });
  let res: Response;
  try {
    res = await fetch(path, {
      method: opts.method || (hasBody ? 'POST' : 'GET'),
      headers: { accept: 'application/json', ...(hasBody ? { 'content-type': 'application/json' } : {}) },
      body: hasBody ? JSON.stringify(opts.body) : undefined,
      credentials: 'same-origin', cache: 'no-store', signal: ctrl.signal,
    });
  } catch (e) {
    const timedOut = (e as Error)?.name === 'TimeoutError' || ctrl.signal.reason?.name === 'TimeoutError';
    if (opts.signal?.aborted) throw e;
    throw new ApiError(0, timedOut ? 'TIMEOUT' : 'NETWORK', timedOut ? msg('The request took too long. Check your connection and try again.') : msg('Could not reach the server. Check your internet connection and try again.'));
  } finally { clearTimeout(timer); }

  const text = await res.text();
  let data: unknown = undefined;
  if (text) { try { data = JSON.parse(text); } catch { /* HTML error page from a proxy / crash */ } }

  if (!res.ok) {
    const e = (data as ErrBody | undefined)?.error || {};
    const msg = e.message || STATUS_MESSAGE[res.status] || (res.status >= 500 ? 'Something went wrong on our side. Please try again in a moment.' : 'That request could not be completed.');
    throw new ApiError(res.status, e.code || `HTTP_${res.status}`, msg, toFieldMap(e.details), e.requestId || res.headers.get('x-request-id') || undefined);
  }
  if (text && data === undefined) throw new ApiError(res.status, 'BAD_RESPONSE', msg('The server sent an unexpected response. Please refresh and try again.'));
  return (data ?? {}) as T;
}
