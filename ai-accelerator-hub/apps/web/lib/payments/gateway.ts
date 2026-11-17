/**
 * Payment gateway switch. Select one with PAYMENT_PROVIDER=razorpay (default) or cashfree.
 * Each gateway keeps its own order creation and webhook verification; both write the same Order, Payment and Invoice rows.
 */
import type { Ctx } from '@/lib/server/context';
import { paymentsConfigured as razorpayConfigured, createOrder as razorpayCreateOrder } from '@/lib/payments/razorpay';
import { cashfreeConfigured, createCashfreeOrder } from '@/lib/payments/cashfree';

export type PaymentGateway = 'razorpay' | 'cashfree';

export const activeGateway = (): PaymentGateway => (process.env.PAYMENT_PROVIDER?.trim().toLowerCase() === 'cashfree' ? 'cashfree' : 'razorpay');

export const paymentsConfigured = () => (activeGateway() === 'cashfree' ? cashfreeConfigured() : razorpayConfigured());

export const createPaymentOrder = (ctx: Ctx, planSlug: string) =>
  activeGateway() === 'cashfree' ? createCashfreeOrder(ctx, planSlug) : razorpayCreateOrder(ctx, planSlug);
