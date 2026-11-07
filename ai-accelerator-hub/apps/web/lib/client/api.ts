'use client';
/** Browser → API helper. Same-origin JSON, typed errors. */
export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: Record<string, string>) { super(message); }
}
export async function api<T = unknown>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(path, { method: opts.method || (opts.body ? 'POST' : 'GET'), headers: opts.body ? { 'content-type': 'application/json' } : undefined, body: opts.body ? JSON.stringify(opts.body) : undefined, credentials: 'same-origin', cache: 'no-store' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const e = (data as { error?: { code?: string; message?: string; details?: unknown } }).error || {};
    const details = e.details && typeof e.details === 'object' && !('fieldErrors' in (e.details as object)) ? e.details as Record<string, string> : undefined;
    throw new ApiError(res.status, e.code || 'ERROR', e.message || 'Something went wrong.', details);
  }
  return data as T;
}
