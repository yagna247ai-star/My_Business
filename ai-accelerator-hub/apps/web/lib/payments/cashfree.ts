/**
 * Cashfree Payments adapter (India). Hosted checkout: the server creates the order with the secret key;
 * the browser only receives the payment session id. Access is granted only from a verified webhook.
 *
 * Env: CASHFREE_APP_ID, CASHFREE_SECRET_KEY, CASHFREE_WEBHOOK_SECRET (the client secret is used to sign webhooks),
 *      CASHFREE_ENV=sandbox|production (default sandbox).
 */
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import type { Ctx } from '@/lib/server/context';
import { badRequest, notConfigured, notFound, AppError } from '@/lib/server/errors';
import { audit } from '@/lib/server/audit';

const GST_RATE = 0.18;

export const cashfreeConfigured = () => !!(process.env.CASHFREE_APP_ID && process.env.CASHFREE_SECRET_KEY);
const baseUrl = () => (process.env.CASHFREE_ENV === 'production' ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg');

/** Cashfree signs webhooks as base64(HMAC_SHA256(timestamp + rawBody, secret)) in x-webhook-signature. */
export function verifyCashfreeSignature(rawBody: string, timestamp: string | null, signature: string | null, secret: string) {
  if (!signature || !timestamp) return false;
  const expected = crypto.createHmac('sha256', secret).update(timestamp + rawBody).digest('base64');
  const a = Buffer.from(expected), b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function createCashfreeOrder(ctx: Ctx, planSlug: string, fetchImpl: typeof fetch = fetch) {
  const plan = await prisma.plan.findUnique({ where: { slug: planSlug } });
  if (!plan || (plan.tenantId && plan.tenantId !== ctx.tenantId)) throw notFound('Plan not found.');
  if (plan.amountPaise <= 0) throw badRequest('This plan is free — nothing to pay.');
  const user = await prisma.user.findUnique({ where: { id: ctx.userId }, select: { email: true, name: true } });
  const settings = await prisma.userSetting.findUnique({ where: { tenantId_userId: { tenantId: ctx.tenantId, userId: ctx.userId } } });
  if (settings?.ageBand === 'minor') throw badRequest('Purchases for learners under 18 must be made by a guardian or the institution.');
  if (!cashfreeConfigured()) throw notConfigured('PAYMENTS', 'Online payments are not enabled yet. Contact your institution for enrolment.');

  const orderId = `ord_${crypto.randomBytes(9).toString('hex')}`;
  const res = await fetchImpl(`${baseUrl()}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json', 'x-api-version': '2023-08-01',
      'x-client-id': process.env.CASHFREE_APP_ID!, 'x-client-secret': process.env.CASHFREE_SECRET_KEY!,
    },
    body: JSON.stringify({
      order_id: orderId,
      order_amount: plan.amountPaise / 100,
      order_currency: plan.currency,
      customer_details: { customer_id: ctx.userId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 50) || 'learner', customer_email: user?.email, customer_name: user?.name ?? 'Learner', customer_phone: '9999999999' },
      order_tags: { tenantId: ctx.tenantId, userId: ctx.userId, plan: plan.slug },
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new AppError(502, 'PAYMENT_PROVIDER_ERROR', 'The payment provider did not accept the order. Please try again.');
  const cf = await res.json() as { order_id: string; payment_session_id: string; order_amount: number; order_currency: string };

  const order = await prisma.$transaction(async tx => {
    // Stored in the shared Order table; razorpayOrderId holds the provider's order id for any gateway.
    const o = await tx.order.create({ data: { tenantId: ctx.tenantId, userId: ctx.userId, razorpayOrderId: cf.order_id, amountPaise: Math.round(cf.order_amount * 100), currency: cf.order_currency, status: 'created', items: JSON.stringify({ planSlug: plan.slug, gateway: 'cashfree' }) } });
    await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'payment.order_created', resourceType: 'Order', resourceId: o.id, after: { plan: plan.slug, gateway: 'cashfree' } });
    return o;
  });
  return { orderId: order.id, providerOrderId: cf.order_id, paymentSessionId: cf.payment_session_id, amount: order.amountPaise, currency: order.currency, environment: process.env.CASHFREE_ENV === 'production' ? 'production' : 'sandbox' };
}

type CfWebhook = { type: string; data: { order?: { order_id: string }; payment?: { cf_payment_id: string | number; payment_amount: number; payment_method?: unknown; payment_status?: string } } };

export async function handleCashfreeWebhook(rawBody: string, timestamp: string | null, signature: string | null) {
  const secret = process.env.CASHFREE_WEBHOOK_SECRET;
  if (!secret) throw notConfigured('PAYMENTS', 'Cashfree webhook secret not configured.');
  if (!verifyCashfreeSignature(rawBody, timestamp, signature, secret)) throw new AppError(401, 'BAD_SIGNATURE', 'Invalid signature.');
  let evt: CfWebhook; try { evt = JSON.parse(rawBody); } catch { throw badRequest('Invalid JSON.'); }
  if (evt.type !== 'PAYMENT_SUCCESS_WEBHOOK') return { ok: true, ignored: true };
  const providerOrderId = evt.data.order?.order_id, pay = evt.data.payment;
  if (!providerOrderId || !pay) throw badRequest('Malformed event.');

  return prisma.$transaction(async tx => {
    const order = await tx.order.findUnique({ where: { razorpayOrderId: providerOrderId } });
    if (!order) return { ok: true, ignored: true };
    const amount = Math.round(pay.payment_amount * 100);
    if (amount !== order.amountPaise) {
      await audit(tx, { tenantId: order.tenantId, action: 'payment.amount_mismatch', resourceType: 'Order', resourceId: order.id, after: { expected: order.amountPaise, got: amount, gateway: 'cashfree' } });
      return { ok: true, flagged: 'amount_mismatch' };
    }
    if (order.status === 'paid') return { ok: true, duplicate: true };
    const paymentId = String(pay.cf_payment_id);
    await tx.order.update({ where: { id: order.id }, data: { status: 'paid' } });
    await tx.payment.upsert({ where: { razorpayPaymentId: paymentId }, update: {}, create: { orderId: order.id, tenantId: order.tenantId, razorpayPaymentId: paymentId, method: typeof pay.payment_method === 'string' ? pay.payment_method : null, amountPaise: amount, feePaise: 0, status: 'captured' } });
    const gst = Math.round(amount * GST_RATE / (1 + GST_RATE));
    const seq = (await tx.invoice.count({ where: { tenantId: order.tenantId } })) + 1;
    await tx.invoice.create({ data: { tenantId: order.tenantId, userId: order.userId, orderId: order.id, amountPaise: amount, gstAmount: gst, invoiceNo: `AIH-${new Date().getFullYear()}-${String(seq).padStart(5, '0')}-${order.id.slice(0, 6).toUpperCase()}` } });
    await audit(tx, { tenantId: order.tenantId, action: 'payment.captured', resourceType: 'Order', resourceId: order.id, after: { amountPaise: amount, gateway: 'cashfree' } });
    return { ok: true, settled: true };
  });
}
