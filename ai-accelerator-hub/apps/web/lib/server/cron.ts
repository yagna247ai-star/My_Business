import type { NextRequest } from 'next/server';

/** Vercel cron calls carry "Authorization: Bearer $CRON_SECRET". In production the secret is required. */
export function cronAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== 'production';
  return req.headers.get('authorization') === `Bearer ${secret}`;
}
