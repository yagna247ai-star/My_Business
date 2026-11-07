import { NextRequest } from 'next/server';
import { route } from '@/lib/server/http';
import { handleWebhook } from '@/lib/payments/razorpay';
// Signature-verified server-to-server endpoint: no CSRF check (no browser), no session.
export const POST = route(async (req: NextRequest) => handleWebhook(await req.text(), req.headers.get('x-razorpay-signature'), req.headers.get('x-razorpay-event-id')), { csrf: false, limit: { name: 'rzp-webhook', max: 300, windowMs: 60_000 } });
