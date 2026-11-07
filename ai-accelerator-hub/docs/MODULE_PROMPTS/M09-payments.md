# M09 — Payments & Revenue (BRD-10 · §22 · REQ-PAY-01..03)

## 1. Objective
Ship India-first hybrid revenue: Razorpay primary, tokenized flows, HMAC-verified webhooks, GST-ready.

## 2. Prerequisites
- M01 complete (entitlements attach to tenant/user).
- Read `app/api/billing` + `Order/Payment/Subscription/Entitlement/RazorpayEvent` models.

## 3. Build steps
1. Expose 3 plans (free / cohort-pro / annual) via `GET /api/billing`.
2. Create Orders via Razorpay when keys exist; otherwise labeled mock (TEST MODE).
3. Verify webhooks with HMAC_SHA256 + `razorpay_events` idempotency (dedupe replays).
4. Implement coupons, scholarships, referral discounts, refunds, GST invoices, reconciliation.
5. Gate features via entitlements decremented server-side on verified payment only.

## 4. ARB gate
- Is payment state derived from verified webhooks, never frontend success messages?
- Is card data never stored (hosted/tokenized only, PCI SAQ A)?
- Are webhook replays idempotent (same event twice = one payment)?
- Are entitlements granted only after signature verification?

## 5. NFR gate
- Failed-payment handling with retry + clear user messaging.
- Reconciliation report (orders vs payments vs invoices) runs on demand.
- Secrets (`KEY_ID/SECRET/WEBHOOK_SECRET`) server-side only, from env.

## 6. Red-team review
- Try forging a payment-success callback. Must reject (bad HMAC, no entitlement).
- Try replaying a valid webhook. Must dedupe (no double entitlement).
- Try upgrading via client-side plan tampering. Must re-price server-side.
- Try refund-then-access. Must revoke entitlement on refund.

## 7. Acceptance
- `POST /api/billing` creates Order (real or labeled mock); webhook verifies + dedupes.
- `verify.mjs` payments group green (integration, webhook, auditability).

## 8. Done criteria
Real money path verified end-to-end; mocks clearly labeled; invoices reconcilable.
