# 01 — Payments (Razorpay)

**Status:** fails closed. Not live. Safe to launch without it, but learners cannot buy plans.

## Current state

- `apps/web/lib/payments/razorpay.ts`
  - `paymentsConfigured()` is true only when `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are both set. Production has neither.
  - Order creation throws `notConfigured('PAYMENTS', 'Online payments are not enabled yet…')` when unconfigured (line 37).
  - Webhook verification throws `notConfigured` when `RAZORPAY_WEBHOOK_SECRET` is missing (line 59).
  - Design is sound: the server creates orders, the browser never confirms payment, webhooks use HMAC-SHA256 with a constant-time compare and are deduplicated by event id.
- Route: `app/api/v1/billing/orders/route.ts`. Webhook route: `app/api/webhooks/razorpay`.
- `FEATURE_PAYMENTS_MOCK_FALLBACK=true` on production is **not read by any active code**. Only `_retired/` references it.

## Gap

- No Razorpay account or keys on Vercel.
- No webhook registered in the Razorpay dashboard. It should point to `https://ai-accelerator-hub-one.vercel.app/api/webhooks/razorpay`.
- Plans (`Plan` rows) are seeded by `packages/db/prisma/seed.ts`. The seed has not been run in production, so no plans exist. Razorpay plan IDs are still pending (`KNOWN_LIMITATIONS.md`).
- No end-to-end payment test has run against Razorpay test mode.

## Risk

- Low for launch if payments stay off. The route refuses orders.
- High if live keys are added without a verified webhook, an end-to-end test, and GST invoice review.

## Decision needed

- Launch with payments off, or set up the Razorpay account now (test keys first, then live).

## Steps to close

1. Create the Razorpay account (ap-south-1). Add `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET` to Vercel Production.
2. Register the webhook URL above with the events the code handles. Confirm the signature with a test event.
3. Run the seed (see file 06) so `Plan` rows exist, and confirm the Razorpay plan IDs.
4. Run an end-to-end test in test mode: order → checkout → webhook → entitlement → invoice.
5. Remove `FEATURE_PAYMENTS_MOCK_FALLBACK` from Vercel. It does nothing, and deleting it avoids confusion.
6. Only then switch to live keys.
