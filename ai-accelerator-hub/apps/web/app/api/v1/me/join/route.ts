// An existing account joins an institution with its code, then switches to it.
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { joinWithCode } from '@/lib/domain/institutions';
import { signTenant } from '@/lib/domain/institutionsCore';
const schema = z.object({ code: z.string().trim().max(40) });
export const POST = route(async (req: NextRequest) => {
  const r = await joinWithCode(await requireCtx(), (await body(req, schema)).code);
  const res = NextResponse.json({ ok: true, tenantId: r.tenantId });
  res.cookies.set('aih_tenant', signTenant(r.tenantId, process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || 'dev-only-insecure-secret-not-for-production-use'), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 30 * 86400 });
  return res;
}, { limit: { name: 'join-code', max: 10, windowMs: 15 * 60_000 } });
