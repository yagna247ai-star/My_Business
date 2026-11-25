// docs/SUPER_ADMIN_CONTROL_SPEC.md §3.1–3.2: set a password, email a reset link, or force a change at next sign-in.
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { route, body } from '@/lib/server/http';
import { requireCtx } from '@/lib/server/context';
import { adminSetPassword, forcePasswordChange, sendAdminResetLink } from '@/lib/domain/adminControl';
const schema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('set'), password: z.string().max(200), mustChange: z.boolean().optional() }),
  z.object({ action: z.literal('reset_link') }),
  z.object({ action: z.literal('force'), on: z.boolean() }),
]);
export const POST = route(async (req: NextRequest, p) => {
  const ctx = await requireCtx(); const b = await body(req, schema);
  if (b.action === 'set') return adminSetPassword(ctx, p.userId, { password: b.password, mustChange: b.mustChange });
  if (b.action === 'force') return forcePasswordChange(ctx, p.userId, b.on);
  return sendAdminResetLink(ctx, p.userId);
}, { limit: { name: 'admin-password', max: 60, windowMs: 60_000 } });
