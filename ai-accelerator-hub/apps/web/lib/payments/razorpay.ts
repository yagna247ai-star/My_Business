/**
 * Razorpay integration (§22). India-first, hosted checkout: card/UPI data never touches our servers.
 * - Orders are created server-side with the secret key; the browser only receives the order id + public key.
 * - Payment success is NEVER taken from the browser. Only a verified webhook marks an order paid.
 * - Webhooks: HMAC-SHA256 over the raw body with RAZORPAY_WEBHOOK_SECRET, constant-time compare,
 *   deduplicated by event id (razorpay_events.razorpayEventId UNIQUE), processed in one transaction.
 */
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import type { Ctx } from '@/lib/server/context';
import { badRequest, notConfigured, notFound, AppError } from '@/lib/server/errors';
import { audit, notify } from '@/lib/server/audit';

export const paymentsConfigured = () => !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
export const webhookConfigured = () => !!process.env.RAZORPAY_WEBHOOK_SECRET;
const GST_RATE = 0.18; // prices are GST-inclusive

export function verifySignature(rawBody: string, signature: string | null, secret: string) {
  if (!signature || !/^[a-f0-9]{64}$/i.test(signature)) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));
}

export async function listPlans(ctx: Ctx) {
  const plans = await prisma.plan.findMany({ where: { OR: [{ tenantId: null }, { tenantId: ctx.tenantId }] }, orderBy: { amountPaise: 'asc' } });
  const orders = await prisma.order.findMany({ where: { tenantId: ctx.tenantId, userId: ctx.userId }, orderBy: { createdAt: 'desc' }, take: 10 });
  const invoices = await prisma.invoice.findMany({ where: { tenantId: ctx.tenantId, userId: ctx.userId }, orderBy: { createdAt: 'desc' }, take: 10 });
  return { configured: paymentsConfigured(), plans: plans.map(p => ({ slug: p.slug, name: p.name, amountInr: p.amountPaise / 100, interval: p.interval, features: p.features ? JSON.parse(p.features) : null })), orders: orders.map(o => ({ id: o.id, status: o.status, amountInr: o.amountPaise / 100, at: o.createdAt, plan: o.items ? JSON.parse(o.items).planSlug : null })), invoices: invoices.map(i => ({ no: i.invoiceNo, amountInr: i.amountPaise / 100, gstInr: i.gstAmount / 100, at: i.createdAt })) };
}

export async function createOrder(ctx: Ctx, planSlug: string, fetchImpl: typeof fetch = fetch) {
  const plan = await prisma.plan.findUnique({ where: { slug: planSlug } });
  if (!plan || (plan.tenantId && plan.tenantId !== ctx.tenantId)) throw notFound('Plan not found.');
  if (plan.amountPaise <= 0) throw badRequest('This plan is free — nothing to pay.');
  const settings = await prisma.userSetting.findUnique({ where: { tenantId_userId: { tenantId: ctx.tenantId, userId: ctx.userId } } });
  if (settings?.ageBand === 'minor') throw badRequest('Purchases for learners under 18 must be made by a guardian or the institution.'); // §21
  if (!paymentsConfigured()) throw notConfigured('PAYMENTS', 'Online payments are not enabled yet. Contact your institution for enrolment.');
  const receipt = `rcpt_${crypto.randomBytes(6).toString('hex')}`;
  const res = await fetchImpl('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Basic ' + Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64') },
    body: JSON.stringify({ amount: plan.amountPaise, currency: plan.currency, receipt, notes: { tenantId: ctx.tenantId, userId: ctx.userId, plan: plan.slug } }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new AppError(502, 'PAYMENT_PROVIDER_ERROR', 'The payment provider did not accept the order. Please try again.');
  const rz = await res.json() as { id: string; amount: number; currency: string };
  const order = await prisma.$transaction(async tx => {
    const o = await tx.order.create({ data: { tenantId: ctx.tenantId, userId: ctx.userId, razorpayOrderId: rz.id, amountPaise: rz.amount, currency: rz.currency, status: 'created', items: JSON.stringify({ planSlug: plan.slug, receipt }) } });
    await audit(tx, { tenantId: ctx.tenantId, actorUserId: ctx.userId, action: 'payment.order_created', resourceType: 'Order', resourceId: o.id, after: { plan: plan.slug, amountPaise: rz.amount } });
    return o;
  });
  return { orderId: order.id, razorpayOrderId: rz.id, amount: rz.amount, currency: rz.currency, keyId: process.env.RAZORPAY_KEY_ID };
}

type RzEvent = { event: string; payload: { payment?: { entity: { id: string; order_id: string; amount: number; fee?: number; method?: string; status: string } }; order?: { entity: { id: string } } } };

export async function handleWebhook(rawBody: string, signature: string | null, eventId: string | null) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) throw notConfigured('PAYMENTS', 'Webhook secret not configured.');
  if (!verifySignature(rawBody, signature, secret)) throw new AppError(401, 'BAD_SIGNATURE', 'Invalid signature.');
  if (!eventId) throw badRequest('Missing event id.');
  let evt: RzEvent; try { evt = JSON.parse(rawBody); } catch { throw badRequest('Invalid JSON.'); }

  return prisma.$transaction(async tx => {
    const seen = await tx.razorpayEvent.findUnique({ where: { razorpayEventId: eventId } });
    if (seen) return { ok: true, duplicate: true };
    const pay = evt.payload.payment?.entity;
    const order = pay ? await tx.order.findUnique({ where: { razorpayOrderId: pay.order_id } }) : null;
    await tx.razorpayEvent.create({ data: { razorpayEventId: eventId, type: evt.event, payload: rawBody, tenantId: order?.tenantId ?? null, processed: false } });
    if (!pay || !order || !['payment.captured', 'order.paid'].includes(evt.event)) return { ok: true, ignored: true };
    if (pay.amount !== order.amountPaise) {
      await audit(tx, { tenantId: order.tenantId, action: 'payment.amount_mismatch', resourceType: 'Order', resourceId: order.id, after: { expected: order.amountPaise, got: pay.amount } });
      return { ok: true, flagged: 'amount_mismatch' };
    }
    if (order.status !== 'paid') {
      await tx.order.update({ where: { id: order.id }, data: { status: 'paid' } });
      await tx.payment.upsert({ where: { razorpayPaymentId: pay.id }, update: {}, create: { orderId: order.id, tenantId: order.tenantId, razorpayPaymentId: pay.id, method: pay.method || null, amountPaise: pay.amount, feePaise: pay.fee || 0, status: 'captured', capturedAt: new Date() } });
      const gst = Math.round(pay.amount * GST_RATE / (1 + GST_RATE));
      const seq = (await tx.invoice.count({ where: { tenantId: order.tenantId } })) + 1;
      await tx.invoice.create({ data: { tenantId: order.tenantId, userId: order.userId, orderId: order.id, amountPaise: pay.amount, gstAmount: gst, invoiceNo: `AIH-${new Date().getFullYear()}-${String(seq).padStart(5, '0')}-${order.id.slice(-4)}`, payload: JSON.stringify({ taxableValuePaise: pay.amount - gst, gstRate: GST_RATE, gstin: process.env.COMPANY_GSTIN || 'PENDING' }) } });
      const planSlug = order.items ? JSON.parse(order.items).planSlug : null;
      const plan = planSlug ? await tx.plan.findUnique({ where: { slug: planSlug } }) : null;
      const credits = plan?.features ? Number(JSON.parse(plan.features).ai_credits || 0) : 0;
      if (credits > 0) await tx.entitlement.upsert({ where: { userId_tenantId_feature: { userId: order.userId, tenantId: order.tenantId, feature: 'ai_credits' } }, update: { remaining: { increment: credits } }, create: { userId: order.userId, tenantId: order.tenantId, feature: 'ai_credits', remaining: credits } });
      await audit(tx, { tenantId: order.tenantId, action: 'payment.captured', resourceType: 'Order', resourceId: order.id, after: { paymentId: pay.id, amountPaise: pay.amount, gst } });
      await notify(tx, order.tenantId, order.userId, 'payment_succeeded', { title: 'Payment received — thank you', body: `Invoice issued for ₹${(pay.amount / 100).toFixed(2)} (incl. GST).`, href: '/billing', tone: 'ok' });
    }
    await tx.razorpayEvent.update({ where: { razorpayEventId: eventId }, data: { processed: true, processedAt: new Date() } });
    return { ok: true };
  });
}
