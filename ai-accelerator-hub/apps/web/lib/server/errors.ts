/** Typed application errors. Route handlers map these to HTTP responses; anything else becomes a generic 500. */
export class AppError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: unknown) { super(message); }
}
export const unauthorized = (m = 'Sign in to continue.') => new AppError(401, 'UNAUTHORIZED', m);
export const forbidden = (m = 'You do not have permission to do that.') => new AppError(403, 'FORBIDDEN', m);
export const notFound = (m = 'Not found.') => new AppError(404, 'NOT_FOUND', m);
export const badRequest = (m: string, details?: unknown) => new AppError(400, 'BAD_REQUEST', m, details);
export const conflict = (m: string) => new AppError(409, 'CONFLICT', m);
export const tooMany = (m = 'Too many requests. Please wait a moment.') => new AppError(429, 'RATE_LIMITED', m);
export const notConfigured = (feature: string, m: string) => new AppError(503, `${feature}_NOT_CONFIGURED`, m);
