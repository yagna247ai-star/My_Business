# 10 — Observability (errors, analytics, tracing)

**Status:** not implemented. Production has no error monitoring, product analytics, or tracing.

## Current state

- `SENTRY_DSN`, `POSTHOG_KEY`, and `OTEL_EXPORTER_OTLP_ENDPOINT` are listed in `.env.example` and `PENDING_CREDENTIALS.md`.
- A search of `apps/web/lib`, `apps/web/app`, and `instrumentation*` found **no code that reads any of them.**
- Production sets none of these variables.
- Errors surface only in Vercel function logs. The health endpoint reports status but does not alert.

## Gap

- Production errors are invisible unless someone reads the Vercel logs.
- No way to measure learner funnel, drop-off, or AI spend over time.
- No alerting when the database or health check fails.

## Risk

- High operationally. Incidents will be found by users first.

## Decision needed

- Which provider: Sentry (errors), PostHog (analytics), and an OpenTelemetry backend such as Grafana Cloud (traces). A minimum is Sentry for errors.

## Steps to close

1. Create a Sentry project and set `SENTRY_DSN` on Vercel Production. Add the Sentry Next.js SDK, with source maps uploaded at build.
2. Add an alert on new error issues and on `/api/health` returning non-ok (uptime check).
3. Optionally add PostHog for funnel events (enrolment, activity submit, AI message, payment).
4. Trigger a test error in production and confirm it appears in Sentry.
