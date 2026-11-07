# AI Accelerator Hub — Enterprise GenAI Learning Platform

**Tagline:** Learn AI. Build Solutions. Become Future-Ready.
**Version:** 1.0 — Phase 1 Foundation (First Release 18 backbone)
**Spec:** [MASTER BUILD PROMPT §1-37](../../AI_ACCELERATOR_HUB_MASTER_IMPLEMENTATION_PLAN.md) · **Architecture:** [ai-accelerator-hub-architecture.md](../../ai-accelerator-hub-architecture.md) · **RTM:** 92 REQs → 9 Phases

![Next.js 15](https://img.shields.io/badge/Next.js-15-black) ![NestJS](https://img.shields.io/badge/NestJS-10-red) ![Prisma](https://img.shields.io/badge/Prisma-5-blue) ![Neo4j](https://img.shields.io/badge/Neo4j-5-008CC1) ![Postgres](https://img.shields.io/badge/Postgres-16-blue) ![Redis](https://img.shields.io/badge/Redis-7-red) ![Tailwind](https://img.shields.io/badge/Tailwind-3-38bdf8)

## Product Vision

Duolingo-style progression × Discord community × Instagram creator × GitHub portfolio × Weekly missions — rigorous enough for colleges & enterprise, exciting enough for Gen Z.

**Philosophy:** *Learn by doing. Build by experimenting. Prove through projects. Get discovered via demonstrated capabilities.*

Never promises guaranteed jobs — measures workforce readiness via demonstrable competencies.

## First Release (18 items — must pass before public launch)

1. Public marketing website
2. Functional registration
3. Student dashboard (12 sections, DB-backed)
4. Admin dashboards (Super / Institution / Instructor / Mentor)
5. Instructor & mentor foundations
6. Complete Level 1 (AI Awakening)
7. Six working activities (Briefing → Learn → GitHub → Build → Proof → Eval/Boss)
8. Real submission workflows (repo URL / screenshots / video / live URL / docs / reflection)
9. XP & progress engine (server-side, auditable ledger, idempotency)
10. Level unlocking (competence-based, DAG)
11. Initial AI Learning Coach
12. Project showcase
13. GitHub project library (verified, license-checked)
14. Weekend live session management
15. Initial hackathon
16. Payment foundation (Razorpay Orders/Subscriptions/HMAC)
17. Multi-language architecture (EN + HI/TE/TA/KN/ML extensible)
18. Privacy & security controls

> L2-15 are **admin-configurable placeholders** (no fabricated lessons) — progressively released per §33 Phases 2-9.

## Stack (justified — see Master Plan §1)

| Layer | Choice |
|-------|--------|
| Frontend | Next.js 15 App Router + TS strict + Tailwind + shadcn/ui + TanStack Query + Zustand + Framer Motion |
| Backend | NestJS 10 (Node 22) modular monolith → extract later (FastAPI sidecar for embeddings/RAG) |
| DB | PostgreSQL 16 (RLS, JSONB, pgvector) — SQLite for local dev without Docker |
| Cache/Queue/PubSub | Redis 7 (BullMQ, Socket.io adapter, ZSET leaderboards) — in-memory fallback for local |
| ORM | Prisma 5 + pgBouncer + raw RLS fallback |
| Auth | Auth.js v5 (GitHub OAuth + Email OTP + JWT 15m + httpOnly refresh + CASL/CASBIN RBAC) |
| Files | S3 ap-south-1 / R2 + CloudFront + presigned + ClamAV Lambda |
| AI Gateway | Vercel AI SDK + LiteLLM → OpenAI/Anthropic/Gemini/Azure/Ollama fallback |
| Payments | Razorpay Orders/Subscriptions/Webhooks/HMAC + RazorpayX + GST |
| Realtime | Socket.io 4 + Redis adapter |
| Observability | OTEL + Prometheus/Grafana + Loki + Sentry + PostHog |

## Repo Structure

```
ai-accelerator-hub/
├── apps/
│   ├── web/              # Next.js 15 (public + student + admin + tenant + mentor)
│   └── api/              # NestJS 10 modular monolith (tenant, auth, rbac, journey, gamification, billing...)
├── packages/
│   ├── db/               # Prisma schema + migrations + seed (single source of truth)
│   ├── ui/               # shared shadcn components
│   └── config/           # eslint/tsconfig bases
├── docs/
│   ├── ai-accelerator-hub-architecture.md
│   ├── AI_ACCELERATOR_HUB_JOURNEY_GAMIFICATION_MODEL.md
│   └── AI_ACCELERATOR_HUB_MASTER_IMPLEMENTATION_PLAN.md
├── infra/
│   ├── terraform/        # VPC, EKS, RDS, ElastiCache, S3, Cloudflare
│   └── k8s/              # deployments, HPA, pgBouncer
├── docker-compose.yml    # postgres16, redis7, minio, litellm-mock
└── .env.example
```

## Quick Start (zero external deps)

```bash
# 1. Clone & install
npm install

# 2. Env
cp .env.example .env
# Edit .env — for local SQLite, DATABASE_URL="file:./dev.db" already works without Postgres

# 3. DB
npm run db:generate   # prisma generate
npm run db:migrate    # creates SQLite dev.db + 28 tables + RLS scaffolding
npm run db:seed       # 10 roles, demo tenant, journey 15 levels, L1 6 activities, rubrics, badges

# 4. Dev
npm run dev           # web on http://localhost:3000, api on http://localhost:3001
# Or: npm run dev:web  /  npm run dev:api

# Seed login:
# Super Admin: admin@aihub.in / Admin@12345
# Student:     student@aihub.in / Student@12345 (enrolled in L1)
# Mentor:      mentor@aihub.in / Mentor@12345
```

### With Docker (optional — real Postgres/Redis/S3)

```bash
docker compose up -d
# Then set DATABASE_URL=postgresql://aihub:aihub_dev_password@localhost:5432/aihub
# and REDIS_URL=redis://localhost:6379, S3_ENDPOINT=http://localhost:9000
npm run db:migrate && npm run db:seed
```

## Environment & Secrets

- Never commit `.env` — use `.env.example` + Secrets Manager (AWS).
- `DATABASE_URL` for prod must be Postgres `postgresql://...` with `app.current_tenant` RLS.
- Razorpay/GitHub/LiteLLM keys → `PENDING_CREDENTIALS.md` if missing (mock fallback with warning, never fake success).
- No secrets in frontend bundles / browser storage / logs — server-side only.

## Architecture Highlights

- **Multi-tenant:** shared-schema + `tenant_id` + PostgreSQL RLS (`SET LOCAL app.current_tenant`), 4-layer isolation (tenant_id + RLS + S3 prefix + Socket rooms). Fail-closed.
- **RBAC/ABAC:** 10 roles via CASL/CASBIN + membership `UNIQUE(tenant,user)`; abilities like `can('approve','Submission',{tenantId, level:{$lte:max}})`.
- **Journey:** 15 levels (L01..L15) + `level_prerequisites` DAG cycle trigger + `canUnlock` 6-gate (prereq, linear, minXp, badge, entitlement, no time gate).
- **Gamification:** `xp_ledger` append-only (UNIQUE idempotency_key, advisory lock, prev_hash/row_hash chain), Redis ZSET `t:{tid}:lb:*`, streaks (freeze/grace/recovery, non-punitive), badges via JSONLogic.
- **Payments:** Razorpay Orders → Checkout → `/billing/verify` HMAC_SHA256 → `razorpay_events` idempotent → entitlements; PCI SAQ A (no card touches server).
- **AI:** 5 assistants via LiteLLM gateway (CodeMentor, CareerCoach, ProjectReviewer, ConceptExplainer, DebugAssistant) — Vercel AI SDK streaming, RAG pgvector, budgets/quotas, fallback chain.

## Testing & Acceptance

```bash
npm run test          # vitest unit
npm run test:e2e      # playwright — Auth, Learning (L1 A1..A6 → approve → unlock), Gamification, Tenant isolation, Payment webhook HMAC
```

**§35 Acceptance (8 groups, 31 checks)** must all pass for First Release:

- **Auth:** register/login, admin manage users, RBAC enforces
- **Learning:** L1 accessible, 6 activities work & persist, actual evidence submission
- **Gamification:** server-side XP, persistent progress, competence unlock, validated leaderboards
- **AI:** provider connect, secrets never exposed, quotas, graceful failures
- **Admin:** cohorts/lessons manageable, mentors review, eval recorded
- **Payments:** real provider, HMAC webhooks, auditable
- **Security:** no cross-tenant access, privileged actions logged, no client API keys
- **Production:** tests pass, deploy docs, backup/restore tested, monitoring, known limitations documented

## Deployment

- `infra/terraform` + `infra/k8s` + `docker-compose.yml`.
- Vercel preview per-PR → staging EKS → prod manual approval (ArgoCD).
- Flagsmith/Unleash: tenant+cohort feature flags. White-label via `tenants.settings.branding` CSS variables.
- Backups: `pg_dump` → S3 daily, test restore monthly. ADRs in Master Plan.

## Known Limitations & Pending

- `KNOWN_LIMITATIONS.md` — Phase 1 ships L1 content only; L2-15 placeholders; 5 AIs need live keys; Gold #E8B94F forbidden on white (dark-first design).
- `PENDING_CREDENTIALS.md` — Razorpay/GitHub/LiteLLM live keys needed for non-mock operation.
- `PENDING_LEGAL.md` — DPDP/privacy/safety requires qualified counsel review (§26-28).

## License & Compliance

DPDP Act (India) primary, GDPR-ready, SOC2-aligned. Data residency ap-south-1, backup ap-south-2. No targeted ads on sensitive data, no card storage, audit logs WORM. Not auto-compliant — requires legal review before prod.

---

**Next:** `Phase 2 Learning Engine` (full 15-level content), `Phase 3 Gamification` (quests/seasonal/referral), `Phase 4 AI Ecosystem` (5 live assistants), `Phase 5 Community/GitHub`, `Phase 6 Hackathons`, `Phase 7 Career`, `Phase 8 Growth`, `Phase 9 Prod Hardening` — per §33.
