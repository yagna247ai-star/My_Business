# Pending Credentials — AI Accelerator Hub

**Version:** 1.0 — 2026-11-04
**Rule:** Never pretend an integration is operational before credentials configured. Mock fallbacks are clearly labeled and never fake success (§36).

## Required for non-mock operation

| Service | Env vars | Where to get | Status | Mock behavior when absent |
|---------|----------|--------------|--------|---------------------------|
| **Postgres (prod)** | `DATABASE_URL=postgresql://...` | AWS RDS ap-south-1 | Pending — local uses SQLite `file:./dev.db` | SQLite dev DB (RLS simulated in app) |
| **Redis** | `REDIS_URL=redis://...` | ElastiCache ap-south-1 | Pending | In-memory fallback (cache/queue/ZSET) — NOT for prod |
| **S3 / R2** | `S3_BUCKET, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_ENDPOINT` | AWS ap-south-1 / Cloudflare R2 | Pending | Local `./uploads` (dev only), AV scan skipped in dev / uploads refused in prod without scanner |
| **ClamAV** | `CLAMAV_HOST, CLAMAV_PORT` | Self-hosted ClamAV (TCP INSTREAM) | Pending | Skipped in dev/test (labeled), refused in prod until attached |
| **GitHub OAuth** | `GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET` | GitHub Developer Settings → OAuth App (callback: `https://aihub.in/api/auth/callback/github`) | Pending | Credentials auth works; GitHub link hidden |
| **LiteLLM Gateway** | `LITELLM_PROXY_URL, LITELLM_API_KEY` | Self-hosted LiteLLM proxy (EKS) | Pending | Deterministic mocks per assistant (labeled “Mock — configure LiteLLM”) |
| **OpenAI / Anthropic / Gemini** | `OPENAI_API_KEY, ANTHROPIC_API_KEY, GEMINI_API_KEY` | Provider dashboards | Pending | Same as LiteLLM — mock |
| **Razorpay India** | `RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET` | Razorpay Dashboard (ap-south-1) → API Keys + Webhooks (`/api/webhooks/razorpay`) | Pending | TEST MODE: mock Orders, HMAC bypass with WARNING header — never in prod. Webhook spec (HMAC SHA256 + razorpay_events dedup) ready. |
| **Novu / SES** | `NOVU_API_KEY, SES_REGION` | Novu Cloud / AWS SES ap-south-1 | Pending | Console log + in-app only |
| **Sentry / PostHog / OTEL** | `SENTRY_DSN, POSTHOG_KEY, OTEL_EXPORTER_OTLP_ENDPOINT` | Sentry, PostHog, Grafana Cloud | Pending | No telemetry in dev |

## How to configure

1. Copy `.env.example` → `.env` (and for prod, Secrets Manager via `infra/terraform`).
2. Fill keys. Never commit `.env`.
3. Restart: `npm run dev` (web) + `npm run dev:api` (api).
4. Verify: `curl http://localhost:3000/api/health` and `curl http://localhost:3001/api/v1/health` (when api running).

## Verification (when keys present)

- **Razorpay:** `POST /api/billing/orders` → Razorpay Orders → Checkout → `POST /api/billing/verify` HMAC → `POST /webhooks/razorpay` (HMAC + idempotent) → entitlements + invoice GST.
- **GitHub:** `POST /api/auth/github` → OAuth → `githubId` stored, repo link `POST /api/projects/:id/link-github` verifies ownership via GitHub API.
- **AI:** `POST /api/ai/conversations/:id/messages` → LiteLLM → streaming SSE (`text/event-stream`) with fallback chain (OpenAI → Anthropic → Gemini → Ollama), budgets enforced.

Until verified, UI shows `TEST MODE` badges where mocks are active — no silent fake.
