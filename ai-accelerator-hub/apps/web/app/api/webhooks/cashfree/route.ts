import { NextRequest } from 'next/server';
import { route } from '@/lib/server/http';
import { handleCashfreeWebhook } from '@/lib/payments/cashfree';

// Signature-verified server-to-server endpoint: no CSRF check (no browser), no session.
export const POST = route(
  async (req: NextRequest) => handleCashfreeWebhook(await req.text(), req.headers.get('x-webhook-timestamp'), req.headers.get('x-webhook-signature')),
  { csrf: false, limit: { name: 'cashfree-webhook', max: 300, windowMs: 60_000 } },
);
