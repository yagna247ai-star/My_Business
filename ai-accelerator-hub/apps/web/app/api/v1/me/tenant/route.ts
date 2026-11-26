// Switch institution (docs/INSTITUTIONS_SPEC.md §3.4): a signed, httpOnly cookie that getCtx honours.
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { canSwitchTo } from '@/lib/domain/institutions';
import { signTenant } from '@/lib/domain/institutionsCore';
const schema = z.object({ tenantId: z.string().min(1).max(40) });
export const POST = route(async (req: NextRequest) => {
  const ctx = await requireCtx(); const { tenantId } = await body(req, schema);
  const t = await canSwitchTo(ctx, tenantId);
  const res = NextResponse.json({ ok: true, tenantId: t.id, name: t.name });
  res.cookies.set('aih_tenant', signTenant(t.id, process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || 'dev-only-insecure-secret-not-for-production-use'), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 30 * 86400 });
  return res;
}, { limit: { name: 'tenant-switch', max: 30, windowMs: 60_000 } });
