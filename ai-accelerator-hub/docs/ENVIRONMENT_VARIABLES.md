# Environment variables

Every variable the web app reads, what it does and whether production needs it. Built from a search of `apps/web` (excluding `_retired/`) on 2026-11-19.

- **Local:** put them in `.env` at the repo root. `apps/web/next.config.js` loads it. Start from `.env.example`.
- **Production:** Vercel → project `ai-accelerator-hub` → Settings → Environment Variables. Vercel always wins over files.
- **Turbo:** variables needed at build time must also be listed in `passThroughEnv` in `turbo.json`, or strict env mode strips them.
- Never commit real values. `.env`, `.env.local` and `.env.*.local` are gitignored.

Legend: **Required** = the app fails without it. **Feature** = the feature is off (with a clear message) without it. **Optional** = sensible default.

## Core

| Variable | Need | What it does |
|---|---|---|
| `DATABASE_URL` | Required | Postgres connection used by the app. Pooled Neon URL in production. `next.config.js` throws at startup if it's missing. |
| `DATABASE_URL_UNPOOLED` | Required | Direct (non-pooled) Postgres URL. Prisma uses it as `directUrl` for migrations. Same as `DATABASE_URL` locally. |
| `NEXTAUTH_SECRET` (or `AUTH_SECRET`) | Required in prod | Signs session JWTs. Must be 32+ characters; the app refuses to start in production otherwise. |
| `APP_URL` | Required in prod | Public site URL. Used for CSP, server-action origins and links. Falls back to `AUTH_URL`, then `NEXTAUTH_URL`. Production: `https://aiachub.nachikethaenterprises.business`. |
| `NEXTAUTH_URL` (or `AUTH_URL`) | Required in prod | Auth callback base URL. Same value as `APP_URL`. |
| `APP_ORIGIN` | Optional | An extra origin allowed to call server actions. |
| `DEFAULT_TENANT_SLUG` | Optional | Institution used when none is resolved from the request. Default `demo`. Also used by the build-time content seed. |
| `TRUST_PROXY_HOPS` | Optional | Number of proxies in front of the app, so the real client IP is read from `X-Forwarded-For` for rate limits. Default `0`. |
| `NODE_ENV` | Set by tooling | `production` turns on the strict checks above. |

## AI coaches and the "stuck" helper

The app tries providers in `AI_PROVIDER_CHAIN` order and uses the first one with a key set (`apps/web/lib/ai/providers/langchain.ts`). With no key, AI features show "not set up yet" rather than fake answers.

| Variable | Need | What it does |
|---|---|---|
| `AI_PROVIDER_CHAIN` | Optional | Comma-separated order, for example `anthropic,gemini,openrouter`. Default: the order below. |
| `ANTHROPIC_API_KEY` (or `ANTHROPIC_AUTH_TOKEN`) | Feature | Anthropic Claude. Default model `claude-haiku-5-5`. |
| `GEMINI_API_KEY` (or `GOOGLE_API_KEY`) | Feature | Google Gemini. Default model `gemini-2.5-flash`; override with `AI_MODEL_GEMINI`. Set in production. |
| `OPENAI_API_KEY` | Feature | OpenAI, `gpt-4o-mini`. |
| `XAI_API_KEY` | Feature | xAI Grok. |
| `ZHIPU_API_KEY` (or `GLM_API_KEY`) | Feature | GLM. |
| `OPENROUTER_API_KEY` | Feature | OpenRouter (includes free models). |
| `CEREBRAS_API_KEY` | Feature | Cerebras. |
| `AI_API_KEY` + `AI_BASE_URL` | Feature | Any OpenAI-compatible endpoint (Ollama, LiteLLM, Groq…). Model via `AI_MODEL_CUSTOM`. |

## Payments

Online payment is off unless the active gateway's keys are set; checkout then says "Online payments are not enabled yet".

| Variable | Need | What it does |
|---|---|---|
| `PAYMENT_PROVIDER` | Optional | `razorpay` (default) or `cashfree`. |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Feature | Razorpay API keys. |
| `RAZORPAY_WEBHOOK_SECRET` | Feature | Verifies Razorpay webhook signatures. |
| `CASHFREE_APP_ID`, `CASHFREE_SECRET_KEY`, `CASHFREE_WEBHOOK_SECRET` | Feature | Cashfree keys. |
| `CASHFREE_ENV` | Optional | `production` uses the live API; anything else uses sandbox. |
| `COMPANY_GSTIN` | Optional | Printed on GST invoices. |

## Files and uploads

| Variable | Need | What it does |
|---|---|---|
| `BLOB_READ_WRITE_TOKEN` | Required in production for uploads | Vercel Blob store (`aihub-uploads`). Set automatically when the store is connected to the project. `BLOB_STORE_ID` (OIDC) also works. |
| `STORAGE_DRIVER` | Optional | `blob` or `local`. If unset: `blob` when a Blob variable exists, else `local`. `local` is refused in production. |
| `STORAGE_BUCKET` | Optional | Bucket name recorded on file rows. Default `hub-dev`. |
| `UPLOAD_DIR` | Optional | Folder for local uploads. |
| `MAX_UPLOAD_BYTES` | Optional | Upload limit. Default 10 MB. |
| `CLAMAV_HOST`, `CLAMAV_PORT` | Feature | Virus scanner. Without it, production accepts images only (PNG, JPEG, WebP, GIF); PDF and video are refused. |

## Sign-in, cache, graph

| Variable | Need | What it does |
|---|---|---|
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | Feature | Enables "Sign in with GitHub". |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Required in prod for Forgot password | Outgoing mail for password-reset links ([FORGOT_PASSWORD_SPEC.md](./FORGOT_PASSWORD_SPEC.md)). Gmail: `smtp.gmail.com`, port `465`, the full Gmail address as user, and a 16-character **App Password** (Google Account → Security → 2-Step Verification → App passwords) as `SMTP_PASS`. Without it: in development the link is printed to the server log; in production no email is sent and the error is logged. |
| `MAIL_FROM` | Optional | Sender shown on emails, e.g. `AI Accelerator Hub <you@gmail.com>`. Defaults to `SMTP_USER`. Gmail only allows the account's own address or a verified alias. |
| `IDENTITY_AUTOMERGE` | Optional | `on` lets the daily job `/api/cron/identity-merge` actually merge duplicate accounts that are certainly the same person. Unset (default) it only reports what it would merge. See `docs/IDENTITY_DEDUP_SPEC.md` §3.21. |
| `CRON_SECRET` | Required in prod | Vercel sends it to the cron routes (`/api/cron/auto-review` daily, `/api/cron/link-health` daily, `/api/cron/i18n-fill`). Without it, production cron calls are refused. Vercel adds it automatically when cron jobs exist; if not, set any long random string. |
| `GITHUB_ORG`, `GITHUB_ORG_TOKEN` | Optional (showcase repos) | Institution GitHub organisation and a **fine-grained token** owned by an org owner, with access to all repositories in the org: Administration read/write, Contents read/write, Metadata read; Organization → Members read. When both are set, showcase repos are created in the org and the learner is made admin ([SHOWCASE_GITHUB_SPEC.md](./SHOWCASE_GITHUB_SPEC.md)). |
| `GITHUB_CONNECT_CLIENT_ID`, `GITHUB_CONNECT_CLIENT_SECRET` | Optional (showcase repos) | GitHub **OAuth App** for "Connect GitHub" (repos created in the learner's own account when no org is set). Callback URL: `https://aiachub.nachikethaenterprises.business/api/v1/github/callback`. Scope requested: `public_repo`. |
| `GITHUB_TOKEN_KEY` | Required with Connect | 32 random bytes, base64 (`openssl rand -base64 32`). Encrypts learners' GitHub tokens at rest (AES-256-GCM). Changing it disconnects everyone. |
| `REDIS_URL` | Feature | Shared cache and rate limits. Without it, an in-memory fallback is used (not safe with several server instances). |
| `NEO4J_URI`, `NEO4J_USERNAME`, `NEO4J_PASSWORD`, `NEO4J_DATABASE` | Feature | Graph features. Off without `NEO4J_URI`. |

## Build and platform

| Variable | Need | What it does |
|---|---|---|
| `VERCEL`, `VERCEL_ENV`, `VERCEL_PROJECT_PRODUCTION_URL` | Set by Vercel | Detects the Vercel build; the production URL is a fallback for `APP_URL`. |
| `NEXT_DIST_DIR` | Optional | Alternative `.next` folder, for running two dev servers at once. |
| `SMOKE_ROLE_EMAIL`, `SMOKE_ROLE` | One-off | Read by `packages/db/prisma/smoke-role.ts` during a build to set the smoke-test account's role. Leave unset normally. |

## Scripts and tests only (not the app)

| Variable | Used by |
|---|---|
| `STAFF`, `TENANT_SLUG`, `STAFF_PASSWORD`, `RESET_PASSWORD`, `DRY_RUN` | `packages/db/prisma/provision-staff.ts` (admin accounts) |
| `TENANT_SLUG` | `seed-data-analytics.ts` |
| `BASE_URL` | Playwright target. Default `http://localhost:3100`. |
| `DEMO_DB_URL` | Some e2e specs that read the database directly. |
| `SMOKE_EMAIL`, `SMOKE_PASSWORD`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | `e2e/prod/prod-smoke.spec.ts` (production smoke test) |

## Unused but present

These appear in `.env.example`, `turbo.json` or Vercel but no live code reads them: `FEATURE_PAYMENTS_MOCK_FALLBACK`, `FEATURE_AI_COACH`, `FEATURE_GITHUB_LAB`, `FEATURE_NEO4J_GRAPH`, `JWT_ACCESS_EXPIRES`, `JWT_REFRESH_EXPIRES`, `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_REQUESTS`, `AI_TENANT_MONTHLY_BUDGET_USD`, `AI_USER_DAILY_BUDGET_USD`, `TENANT_RESOLUTION_ORDER`, `LITELLM_*`, `S3_*`, `NOVU_API_KEY`, `SES_REGION`, `SENTRY_DSN`, `OTEL_EXPORTER_OTLP_ENDPOINT`, `POSTHOG_KEY`, `SEED_SUPER_ADMIN_*`. Setting them has no effect. Remove them or wire them up.

## Production checklist

Must be set: `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `APP_URL`.
Set when the feature goes live: an AI key, payment keys + webhook secret, `CLAMAV_HOST`, `REDIS_URL`, GitHub OAuth keys.
Status of each is tracked in `docs/enterprise-gaps/`.
