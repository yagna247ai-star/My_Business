# AI Accelerator Hub — Enterprise Platform Technical Architecture

**Version:** 1.0 — 2026-11-04  
**Scale Target:** 100,000+ MAU, 500+ tenants, 15-level journey, 10 roles, 5 AI assistants  
**Compliance:** India-first (Razorpay, DPDP Act), GDPR-ready, SOC2-aligned  
**Author:** Architecture Design Task (Workflow Child parallel-2)

> This document satisfies the workflow contract: stack proposal + justification, multi-tenant strategy, RBAC/ABAC, ERD, API structure, scaling approach.

---

## Table of Contents

1. [Executive Summary & Constraints](#1-executive-summary--constraints)
2. [Proposed Modern Stack (with Justification)](#2-proposed-modern-stack)
3. [System Architecture Overview](#3-system-architecture-overview)
4. [Multi-Tenant Isolation Strategy](#4-multi-tenant-isolation-strategy)
5. [RBAC / ABAC Authorization Model](#5-rbac--abac-authorization-model)
6. [Database — High-Level ERD & Entities](#6-database--high-level-erd--entities)
7. [API Structure](#7-api-structure)
8. [Realtime, Background Jobs & Notifications](#8-realtime-background-jobs--notifications)
9. [15-Level Journey & Gamification Engine](#9-15-level-journey--gamification-engine)
10. [5 AI Assistants — Abstraction Layer](#10-5-ai-assistants--abstraction-layer)
11. [Scaling to 100k+ Users](#11-scaling-to-100k-users)
12. [Security, Compliance & Observability](#12-security-compliance--observability)
13. [Deployment Topology & Environments](#13-deployment-topology--environments)
14. [Migration / Build Phases](#14-migration--build-phases)
15. [Decision Log (ADRs)](#15-decision-log-adrs)

---

## 1. Executive Summary & Constraints

### Product in one line
A multi-tenant, cohort-based AI upskilling hub where learners progress through a 15-level journey, earn gamified rewards, interact with 5 domain AI assistants, submit project proof, get human + AI review, pay via Razorpay, and collaborate in realtime. Ten enterprise tenants already anticipate branded portals.

### Hard requirements traced to architecture

| # | Requirement | Architectural driver |
|---|-------------|----------------------|
| 1 | **10 roles** | RBAC+ABAC, permission matrix, tenant-scoped roles |
| 2 | **Multi-tenant isolation** | Row-level `tenant_id`, RLS, tenant-aware middleware, S3 prefix isolation |
| 3 | **15-level journey** | State machine, DAG prerequisites, level-gating service |
| 4 | **Gamification** | Event-sourced XP, Redis sorted-set leaderboards, badge engine |
| 5 | **5 AI assistants** | AI Gateway + router, per-assistant system prompts/tools/RAG |
| 6 | **Payments — Razorpay India** | Orders/Subscriptions/Webhooks, GST invoices, DPDP |
| 7 | **GitHub OAuth** | NextAuth/Auth.js, account linking, org/classroom sync |
| 8 | **Realtime** | WebSocket (Socket.io) + Redis adapter + presence |
| 9 | **100k+ MAU** | Stateless API, horizontal autscaling, read replicas, CDN, cache |
| 10 | **Enterprise** | Audit log, SSO-ready, SLA, data export, white-label theming |

### Ten roles (canonical)

| Role | Scope | Primary capabilities |
|------|-------|---------------------|
| **1. Super Admin** | Platform | Create tenants, billing, feature flags, global audit |
| **2. Tenant Admin** | Tenant | Manage users, branding, cohorts, billing for tenant |
| **3. Program Manager** | Tenant | Design journeys, publish levels, manage cohorts, analytics |
| **4. Instructor** | Tenant/ Cohort | Author content, create assignments, grade |
| **5. Mentor** | Cohort | 1:1 guidance, office hours, nudge at-risk learners |
| **6. Reviewer** | Journey | Approve proof submissions, award XP, QA |
| **7. Learner** | Self | Progress through journey, AI chat, submissions, pay |
| **8. Team Lead** | Team | View team progress, approve team submissions (ABAC: `team_id`) |
| **9. Finance** | Tenant | Invoices, refunds, Razorpay reconciliation, GST reports |
| **10. Support / Moderator** | Tenant/Platform | Tickets, moderation, realtime help, impersonation (audited) |

> Learner is the default; every authenticated user holds exactly one system role per tenant via `memberships`. A human can hold different roles in different tenants (e.g., Learner in Tenant A, Mentor in Tenant B).

---

## 2. Proposed Modern Stack

### 2.1 Stack at a glance

```
Frontend        Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui + Zustand/Jotai + TanStack Query + Framer Motion
Backend         NestJS 10 (Node 22) — modular monolith → microservices; Python FastAPI sidecar for AI/RAG workers
Realtime        Socket.io 4 + Redis Adapter (or ws + uWebSockets fallback)
Database        PostgreSQL 16 (primary, RLS) + Redis 7 (cache/session/queue/pubsub) + S3/R2 (objects)
ORM             Prisma 5 (or Drizzle) + pgBouncer + Timescale for analytics (optional extension)
Auth            Auth.js v5 (NextAuth) — GitHub OAuth + Email OTP + JWT (access 15m) + rotating refresh (httpOnly) + CASL / CASBIN
File Storage    AWS S3 (or Cloudflare R2) + CloudFront + presigned POST/GET, AV scan (ClamAV Lambda)
AI Abstraction  Vercel AI SDK + LiteLLM Gateway → OpenAI / Anthropic / Gemini / Azure OpenAI / Ollama (self-host fallback)
Payments        Razorpay Orders + Subscriptions + Webhooks + RazorpayX (payouts) + GST invoice service
Jobs            BullMQ (Redis) + Inngest as durable-function alternative; cron via pg_cron / BullMQ repeatable
Notifications   Novu (self-host) or Knock; SendGrid/SES (email), FCM/APNs (push), Web Push
Search & RAG    pgvector (Postgres) + Qdrant (optional) for AI knowledge base; Meilisearch for content search
Observability   OpenTelemetry + Grafana/Prometheus + Loki + Sentry + PostHog
Infra           Docker + Kubernetes (EKS) + Terraform + GitHub Actions + ArgoCD + Cloudflare
```

### 2.2 Justification per layer

| Layer | Choice | Why this, why not alternatives |
|-------|--------|-------------------------------|
| **Frontend — Next.js 15 App Router** | SSR/ISR/RSC, file-based routing, edge-ready, image optimization, built-in i18n. | *vs CRA/Vite SPA:* SEO for public landing/cohort pages, faster TTI, server components reduce JS bundle. *vs Remix:* Larger ecosystem, Vercel/AWS deploy agnostic, better ISR for 15-level static content. *vs Nuxt/SvelteKit:* React hiring pool in India, shadcn/ui maturity. |
| **TypeScript strict** | Shared types FE↔BE via OpenAPI codegen, fewer runtime bugs at 100k users. | Dynamic JS would cost incidents in payment/journey gating. |
| **Tailwind + shadcn/ui** | White-label enterprise theming via CSS variables, copy-paste ownership (no vendor lock), a11y, dark mode free. | *vs MUI/Chakra:* Smaller bundle, design-token theming per tenant is trivial; no heavy runtime. |
| **TanStack Query + Zustand** | Server-state (Query) decoupled from client-state (Zustand); offline cache, optimistic XP updates. | Redux Toolkit is overkill; Jotai atom-level fine if preferred — Zustand chosen for team familiarity. |
| **Backend — NestJS (Node 22)** | Angular-like modules mirror 10 roles + journey + gamification + payment domains; decorators for guards/interceptors; first-class WebSocket, microservice, and OpenAPI support; shared TS with FE; huge hiring pool. | *vs Express:* Structure prevents big-ball-of-mud at enterprise scale. *vs Django/FastAPI (Python-only):* JS/TS unified, but Python isolated to AI workers where it shines. *vs Go (Gin/Fiber):* Faster raw throughput but slower feature velocity for 15-level + RBAC domain complexity; Go reserved for hot paths later (leaderboard, RLS proxy). *vs Spring Boot:* Heavy JVM ops, slower iteration for startup. Modular monolith first → extract `ai-worker`, `realtime`, `billing` when bounded contexts harden. |
| **Python FastAPI sidecar** | Embeddings, RAG chunking, eval harnesses, notebook-style experimentation. | Keeps Node API stateless; Python scales independently on GPU nodes. |
| **PostgreSQL 16** | ACID for payments, JSONB for level config, `ltree`/`recursive CTE` for journey DAG, `RLS` for tenant isolation, `pgvector` eliminates extra vector DB initially, mature India talent. | *vs MongoDB:* Weak transactions needed for XP+level atomicity; *vs MySQL:* Weaker JSONB, no RLS, no pgvector. Citus or Neon branching when sharding needed. |
| **Redis 7** | 5 roles: cache, session, BullMQ queue, Socket.io pub/sub adapter, sorted-set leaderboards (O(log N)). | *vs Kafka/RabbitMQ:* Overkill before 500k users; BullMQ on Redis is ops-simple, already needed for cache. Upgrade path to Kafka for event sourcing later. |
| **Prisma 5** | Typed migrations, RLS-friendly raw fallback, excellent DX. | Drizzle is lighter and more SQL-native — acceptable swap if team prefers; Prisma chosen for `tenant_id` middleware + quick scaffolding. |
| **Auth — Auth.js v5 + JWT** | GitHub OAuth one-line provider, magic-link/OTP for India numbers, Prisma adapter, session strategy hybrid (DB for admin, JWT for learner high-throughput). 15m access + httpOnly refresh mitigates XSS. | *vs Auth0/Clerk:* Data residency DPDP requirements + cost at 100k MAU; self-hosted keeps tenant isolation auditable. Clerk is valid SaaS shortcut if SOC2 timeline is tight — interface is provider-agnostic. *vs Passport alone:* Auth.js wraps Passport + session. |
| **CASL/CASBIN for RBAC/ABAC** | Declarative ability definitions (`can('approve','Submission',{tenantId,level})`), enforcement at guard + field level. | *vs hand-rolled `if role===`:* Unmaintainable at 10 roles × ABAC attributes. OPA is heavier, introduced later if policy-as-code maturity demanded. |
| **S3/R2 + CloudFront** | Presigned URLs keep app servers out of data path; per-tenant prefix `s3://hub/{tenantId}/{userId}/...`; lifecycle to Glacier for old submissions; R2 zero-egress attractive for video-heavy journeys. | *vs local disk:* No durability; *vs GCS:* Equivalent — S3 chosen for Razorpay/India AWS region ap-south-1. |
| **AI Abstraction — Vercel AI SDK + LiteLLM Gateway** | One OpenAI-compatible interface across OpenAI/Anthropic/Gemini/Azure; streaming, tool-calling, fallback, cost tracking per tenant/assistant; model routing (cheap for explainer, strong for reviewer). LiteLLM handles retries, budgets, self-hosted proxy for DPDP. | *vs direct SDKs:* Vendor lock + no fallback when one provider throttles during cohort peak. *vs LangChain alone:* LangChain for RAG chain internals, LiteLLM for gateway — they compose. |
| **Payments — Razorpay** | UPI/Card/Netbanking/Wallet + Orders/Subscriptions/Webhooks + RazorpayX for mentor payouts + auto GST invoices; India-native, DPDP-compliant, supports 3DS. | *vs Stripe:* Stripe India gaps (UPI, recurring mandates). Stripe kept as abstraction interface so future geo-expansion is one adapter. |
| **Jobs — BullMQ** | Delayed XP recalculation, streak cron, certificate PDF render, email digests, webhook retries, AI embedding backfill. Redis already present, UI dashboard (Bull Board) for Support role. | *vs Celery:* Python-only; *vs SQS+Lambda:* Vendor coupling; Inngest added for durable workflows (e.g., 15-level completion saga) where step retries matter. |
| **Notifications — Novu** | Single `trigger('level_unlocked')` fans out to in-app + email + push + SMS (via provider routing); tenant branding, digest batching, preference center per learner. | *vs hand-rolled:* Notification sprawl is inevitable; Novu prevents N×M provider code. |
| **Search/RAG — pgvector first** | Journey content + past submissions as vectors; 2k dim, HNSW index; Qdrant added only if pgvector latency > 80ms at 100k docs. Meilisearch for typo-tolerant cohort search. | Keeps operational count low at launch. |

---

## 3. System Architecture Overview

### 3.1 High-level diagram (text)

```
                    ┌──────────── Cloudflare (WAF, CDN, Rate-limit, Bot) ────────────┐
                                    │  *.aihub.in  (tenant subdomain) or path /t/:slug
                                    ▼
                    ┌────────────────────────────────────────────────────────┐
                    │  Next.js 15 (SSR/RSC) — Vercel / EKS — Edge Cache     │
                    │  shadcn/ui · TanStack Query · Socket.io-client        │
                    └──────────────────────┬─────────────────────────────────┘
                                           │  REST /api/v1 + WebSocket /ws
                    ┌──────────────────────▼─────────────────────────────────┐
                    │  API Gateway (Kong / AWS ALB + Cloudflare)             │
                    │  — tenant resolver (subdomain/header), rate limit       │
                    │  — JWT verify, idempotency-key, request-id              │
                    └──────────────┬──────────────────────┬──────────────────┘
                                   │                      │
              ┌────────────────────▼──────────┐   ┌───────▼────────────┐
              │ NestJS API (modular monolith) │   │ Python AI Worker   │
              │ modules:                      │◄──► FastAPI + LiteLLM  │
              │ auth·tenant·user·rbac         │   │ RAG · embeddings   │
              │ journey·gamification·review   │   │ eval · pgvector    │
              │ billing·ai-gateway·realtime   │   └────────────────────┘
              │ files·notifications·audit     │
              └──┬──────────┬──────────┬─────┘
                 │          │          │
        ┌────────▼──┐ ┌─────▼────┐ ┌───▼──────────────┐
        │ Postgres  │ │  Redis   │ │ S3 / R2 + CDN    │
        │ + RLS     │ │ BullMQ   │ │ presigned URLs   │
        │ + vector  │ │ PubSub   │ │ AV scan Lambda   │
        └───────────┘ └──────────┘ └──────────────────┘
                 │          │          │
        ┌────────▼──────────▼──────────▼──────────────┐
        │  External: Razorpay · GitHub OAuth ·        │
        │  SendGrid/SES · FCM/APNs · GitHub API       │
        │  OpenAI/Anthropic/Gemini (via LiteLLM)      │
        └─────────────────────────────────────────────┘
```

### 3.2 Module boundaries (NestJS)

Each module owns its tables (via `tenant_id`) and publishes domain events over Redis/ BullMQ:

- `TenantModule` — tenant CRUD, branding, feature flags, domain mapping
- `AuthModule` — OAuth, JWT, refresh, device sessions
- `UserModule` — profiles, memberships, teams
- `RbacModule` — roles, permissions, CASL abilities, ABAC policies
- `JourneyModule` — levels (15), prerequisites, enrollment, progress, gating
- `GamificationModule` — XP, badges, streaks, leaderboards, quests
- `ReviewModule` — submissions (proof), reviewer queue, rubric, resubmit loop
- `ProjectModule` — GitHub-linked projects, repo analysis
- `AiGatewayModule` — 5 assistants, routing, streaming, tool calls, budgets
- `BillingModule` — Razorpay orders/subscriptions/webhooks, invoices, entitlements
- `FileModule` — upload, presign, virus scan, tenant prefix enforcement
- `RealtimeModule` — Socket.io namespaces, presence, typing, live progress
- `NotificationModule` — Novu triggers, preferences, digests
- `AuditModule` — append-only audit log (who, what, tenant, before/after)

Cross-cutting: `TenantContext` AsyncLocalStorage, `RlsInterceptor`, `IdempotencyGuard`, `RateLimitGuard`.

---

## 4. Multi-Tenant Isolation Strategy

### 4.1 Chosen: Shared Database, Shared Schema, Row-Level Security (hybrid)

**Why not other models:**

| Model | Pros | Cons | Verdict |
|-------|------|------|---------|
| **DB-per-tenant** | Strongest isolation, per-tenant backup | 500 tenants = 500 DBs → migration hell, connection exhaustion, cost ×500 | Rejected except for 1-2 enterprise VIP tenants on request |
| **Schema-per-tenant** | Good isolation, single DB | Schema migrations fan-out, 500 schemas → pg_catalog bloat, cross-tenant analytics hard | Rejected |
| **Shared schema + `tenant_id` (chosen)** | One migration set, efficient joins for platform analytics, cheapest at 100k MAU | Requires discipline | Chosen + hardened |

**Hardening (the actual isolation, not just a column):**

1. **Mandatory `tenant_id` everywhere**
   - Every tenant-scoped table has `tenant_id UUID NOT NULL`.
   - Composite PK `(tenant_id, id)` or PK `id` + unique `(tenant_id, id)`.
   - Index: `CREATE INDEX ON table(tenant_id, created_at DESC)` for all hot paths.
   - Prisma middleware auto-injects `tenant_id` from `AsyncLocalStorage`; raw SQL helper `withTenant(tenantId, fn)` asserts presence.

2. **PostgreSQL Row-Level Security (defense-in-depth)**
   ```sql
   ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
   CREATE POLICY tenant_isolation ON submissions
     USING (tenant_id = current_setting('app.current_tenant')::uuid);
   -- App sets per-transaction: SET LOCAL app.current_tenant = '...';
   -- Super Admin bypass via BYPASSRLS or explicit policy.
   ```
   RLS guarantees even a buggy `WHERE` cannot leak. Enabled on 20+ tables: `users` (via memberships), `enrollments`, `progress`, `submissions`, `ai_conversations`, `orders`, etc.

3. **Tenant resolution (no confusion)**
   - Priority: `X-Tenant-Slug` header → subdomain `{slug}.aihub.in` → JWT `tenantId` claim → path `/t/:slug`.
   - Fail-closed: no tenant resolved → 400, never default.
   - Cache: Redis `tenant:slug → {id, plan, flags}` with 5m TTL + invalidation on update.

4. **Storage isolation**
   - S3 key: `s3://hub-{{env}}/{tenantId}/{userId}/{entity}/{uuid}.{ext}`
   - IAM condition: app role can only `s3:GetObject` with prefix `${tenantId}/*` when acting for that tenant (STS scoped credentials for direct upload).
   - Presigned URLs short-lived (15m) and embed `tenantId` in signature context.

5. **Cache / Queue / WebSocket isolation**
   - Redis keys namespaced: `t:{tenantId}:leaderboard:cohort:{id}` etc.
   - Socket.io rooms: `tenant:{tenantId}:cohort:{id}`, `user:{userId}`; server rejects join if JWT tenant mismatch.
   - BullMQ queue namespaced but workers filter by `tenantId` job data.

6. **Data export / deletion (DPDP)**
   - Tenant offboarding: `DELETE FROM ... WHERE tenant_id = $1` cascade with hard-delete after 30-day soft-delete window.
   - Per-tenant DSR export streams to S3, presigned download.

7. **Escape hatch**
   - For data-residency or enterprise SLA, provision dedicated Postgres schema/DB + dedicated Redis logical DB + isolated S3 bucket via Terraform module `tenant-isolated`. Flag `tenant.isolation = 'dedicated_db'`.

### 4.2 Tenant lifecycle states

`provisioning → active → suspended (billing) → deprovisioning → purged`. Suspended blocks writes but keeps reads for 30d.

---

## 5. RBAC / ABAC Authorization Model

### 5.1 Design: RBAC base + ABAC attributes

RBAC alone cannot express "Reviewer can approve only submissions at level ≤ 8 in their assigned cohort" or "Team Lead can view only their team's progress." ABAC attributes close the gap.

**Core tables (see ERD §6):** `roles`, `permissions`, `role_permissions`, `memberships` (user × tenant × role), `abac_policies`.

**Permission naming:** `resource:action` — e.g., `submission:approve`, `journey:publish`, `billing:refund`, `ai:use:code-mentor`.

**ABAC attributes evaluated per request:**

- Subject: `userId`, `roles[]`, `tenantId`, `teamId`, `cohortId`, `subscriptionTier`
- Resource: `tenantId`, `cohortId`, `levelIndex`, `ownerId`, `teamId`, `state`
- Environment: `time`, `ip`, `rateLimitRemaining`
- Context: `enrollment.level`, `entitlement.aiCreditsRemaining`

**Enforcement points:**

1. **Next.js middleware + NestJS `AuthGuard`** — JWT verify, attach `req.user` + `req.tenant` + `req.abilities` (CASL).
2. **CASL ability factory**
   ```ts
   // ability.ts
   if (user.hasRole('reviewer')) {
     can('approve','Submission',{ tenantId:user.tenantId, level:{ $lte: reviewer.maxLevel } });
   }
   if (user.hasRole('team_lead')) {
     can('read','Progress',{ tenantId:user.tenantId, teamId:user.teamId });
   }
   // Learner: can only mutate own progress, cannot skip locked levels
   can('update','Progress',{ userId:user.id, state:'in_progress' });
   ```
3. **Field-level guards** — e.g., Finance can see `order.amount` but not `user.email` unless `support:view_pii` granted + audited.
4. **DB RLS as last line** — even if guard bypassed, RLS blocks cross-tenant read.
5. **Frontend `<Can>` component** mirrors CASL so UI never shows disallowed actions (but never trusts UI).

### 5.2 Permission matrix (10 roles × key resources)

| Resource→ | Tenant | Journey | Content | Submission | Review | User/Membership | Billing | AI | Cohort/Team | Audit | Notifications |
|-----------|--------|---------|---------|------------|--------|-----------------|---------|----|-------------|-------|---------------|
| Super Admin | CRUD | CRUD | CRUD | R | R | CRUD | R | RUD | CRUD | R | R |
| Tenant Admin | RU (own) | CRUD | CRUD | R | R | CRUD (own tenant) | R | manage | CRUD | R (own) | manage |
| Program Mgr | R | CRUD | CRUD | R | assign | R | R | configure | CRUD | R | manage |
| Instructor | R | R (publish w/ approval) | CRUD (own) | R | R | R (cohort) | — | use | R (cohort) | — | — |
| Mentor | — | R | R | R (assigned) | comment | R (cohort) | — | use | R (cohort) | — | trigger nudge |
| Reviewer | — | R | R | R/U (approve/reject) | CRUD (own queue) | R | — | use (reviewer) | R | — | — |
| Learner | R (own) | R (enrolled) | R (unlocked) | CRU (own) | R (own) | R (self) | CR (self) | use (entitled) | R (own cohort) | — | manage prefs (self) |
| Team Lead | — | R | R | R (team) | R (team) | R (team) | — | use | R (team) | — | — |
| Finance | — | — | — | — | — | R | CRUD (tenant) | — | — | R (billing) | — |
| Support | R | R | R | R | R (escalate) | R (PII audited) | R | R | R | R | R |

`C/R/U/D` = create/read/update/delete; `—` = no access. `R (own tenant)` enforced via ABAC `tenantId`.

### 5.3 Admin invariants

- A user holds **one role per tenant** (membership), but can be Learner in Tenant A and Mentor in Tenant B — prevents privilege creep.
- Support impersonation requires second factor + `audit_logs` entry with reason + auto-expiry 30m.
- Permission changes emit `audit_logs` + invalidate Redis ability cache `abilities:{userId}:{tenantId}`.

---

## 6. Database — High-Level ERD & Entities

### 6.1 ERD (text, tenant_id omitted on most tables for brevity — assume present)

```
tenants 1──* memberships *──1 users
  │ 1            │ memberships *──1 roles
  │ 1            │ memberships 1──* abac_overrides (optional)
  │ *──* cohorts *──* enrollments (user × journey)
  │      cohorts 1──* teams 1──* team_memberships
  │      cohorts *──* subscriptions / orders
  │
  ├── journeys 1──* levels (15, ordered, DAG edges via level_prerequisites)
  │       levels 1──* contents (video, md, quiz, assignment)
  │       levels 1──* quests / challenges
  │       journeys *──* enrollments 1──* progress (user × level → state, xp)
  │
  ├── progress 1──* submissions (proof: url, repo, file) 1──* reviews (reviewer, rubric, verdict)
  │
  ├── gamification: xp_events, badges, user_badges, streaks, leaderboard_snapshots
  │       xp_events (tenant, user, source, amount, level) → triggers badge checks
  │       badges (code, tier, condition_json: "xp >= 1000 AND streak >= 7")
  │
  ├── ai_conversations 1──* ai_messages 1──* ai_tool_calls
  │       ai_assistants (5 rows seed) 1──* ai_conversations
  │       ai_usage_ledger (tenant, user, assistant, tokens_in/out, cost_micros)
  │
  ├── projects 1──* project_repos (github) + repo_analyses
  │
  ├── billing: orders, payments, subscriptions, invoices, entitlements, razorpay_events (idempotency)
  │
  ├── files (s3_key, tenant, owner, entity_type/id, mime, av_status)
  │
  ├── notifications, notification_preferences
  │
  └── audit_logs (append-only, partitioned by month) + idempotency_keys
```

### 6.2 Key entities (column sketches — high level)

**tenants** `id PK, slug UNIQUE, name, plan (free/pro/enterprise), settings JSONB (branding, feature_flags), isolation (shared/dedicated), status, created_at`  
**users** `id PK, email UNIQUE, email_verified, github_id UNIQUE NULL, github_username, avatar_url, global_role (super_admin NULL), created_at` — identity is global; tenancy via memberships.  
**roles** `id PK, code UNIQUE (10 fixed + custom), name, description` — seeded.  
**memberships** `id PK, tenant_id FK, user_id FK, role_id FK, team_id FK NULL, cohort_id FK NULL, status, joined_at, UNIQUE(tenant_id,user_id)`  
**abac_policies** `id PK, tenant_id, name, effect (allow/deny), actions text[], resources text[], condition JSONB (JSONLogic), priority` — evaluated after RBAC.  
**journeys** `id PK, tenant_id, slug, title, description, is_published, config JSONB`  
**levels** `id PK, journey_id FK, tenant_id, idx 1..15, title, summary, unlock_condition JSONB, xp_reward, badge_id FK NULL`  
**level_prerequisites** `level_id FK, prerequisite_level_id FK, PK(level_id,prerequisite_level_id)` — DAG, validated acyclic.  
**contents** `id PK, level_id FK, kind (video/md/quiz/assignment/live), payload JSONB, position, duration_min`  
**enrollments** `id PK, tenant_id, user_id FK, journey_id FK, cohort_id FK NULL, current_level_idx, state (active/completed/dropped), enrolled_at, completed_at NULL, UNIQUE(tenant_id,user_id,journey_id)`  
**progress** `id PK, enrollment_id FK, level_id FK, user_id FK, tenant_id, state (locked/available/in_progress/submitted/needs_review/approved/rejected), xp_earned, attempts, unlocked_at, completed_at, UNIQUE(enrollment_id, level_id)`  
**submissions** `id PK, progress_id FK, tenant_id, user_id, type (link/file/repo/pr), url, file_id FK NULL, repo_url NULL, metadata JSONB, state (pending/in_review/approved/rejected), submitted_at`  
**reviews** `id PK, submission_id FK, reviewer_id FK, verdict (approved/rejected/needs_changes), rubric_scores JSONB, feedback_md, reviewed_at`  
**xp_events** `id PK, tenant_id, user_id, source (level_complete/submission_approved/streak/ai_task), amount, level_id FK NULL, idempotency_key UNIQUE, created_at` — append-only, drives leaderboard & badges.  
**badges** `id PK, tenant_id NULL (global) or FK, code, name, tier (bronze/silver/gold), icon, condition JSONB, xp_bonus`  
**user_badges** `user_id FK, badge_id FK, earned_at, PK(user_id,badge_id)`  
**streaks** `user_id FK, tenant_id, current_streak, longest_streak, last_active_date, UNIQUE(user_id,tenant_id)`  
**cohorts** `id PK, tenant_id, name, start_date, end_date, max_size, mentor_ids UUID[]`  
**teams** `id PK, cohort_id FK, tenant_id, name, lead_user_id FK`  
**ai_assistants** `id PK, code UNIQUE (5), name, system_prompt_md, model (e.g., gpt-4o-mini), tools JSONB, rag_collection, max_tokens, tenant_id NULL (global template) or FK (override)`  
  - 5 seed assistants: `code-mentor`, `career-coach`, `project-reviewer`, `concept-explainer`, `debug-assistant` — each with distinct prompt, toolset (code exec, RAG search, rubric scoring), and cost tier.  
**ai_conversations** `id PK, tenant_id, user_id FK, assistant_id FK, title, context JSONB (level_id, submission_id), created_at`  
**ai_messages** `id PK, conversation_id FK, role (user/assistant/tool), content_md, tokens_in/out, cost_micros, created_at` — partitioned.  
**ai_usage_ledger** `id PK, tenant_id, user_id, assistant_id, tokens_in/out, cost_micros, billed BOOLEAN, period DATE` — for tenant chargeback & rate limiting.  
**orders** `id PK, tenant_id, user_id, razorpay_order_id UNIQUE, amount_paise, currency (INR), status (created/paid/failed), items JSONB`  
**payments** `id PK, order_id FK, razorpay_payment_id UNIQUE, method, amount_paise, fee_paise, status, captured_at`  
**subscriptions** `id PK, tenant_id, user_id, razorpay_subscription_id UNIQUE, plan_id FK, status, current_end, cancel_at NULL`  
**plans** `id PK, tenant_id NULL (platform) or FK, razorpay_plan_id, name, amount_paise, interval, features JSONB (ai_credits, max_levels)`  
**entitlements** `user_id FK, tenant_id, feature (ai_credits/level_access), remaining, resets_at` — checked before AI/level unlock.  
**razorpay_events** `id PK, razorpay_event_id UNIQUE, type, payload JSONB, processed BOOLEAN, processed_at` — idempotent webhook handling.  
**files** `id PK, tenant_id, owner_id FK, s3_key UNIQUE, bucket, mime, size_bytes, av_status (pending/clean/infected), entity_type/id, created_at`  
**notifications** `id PK, tenant_id, user_id FK, channel (in_app/email/push), template, payload JSONB, state (pending/sent/failed), sent_at`  
**audit_logs** `id PK, tenant_id, actor_user_id FK, action, resource_type/id, before JSONB, after JSONB, ip, ua, created_at` — partitioned monthly, append-only, WORM S3 archive.  
**idempotency_keys** `key PK, tenant_id, scope, response JSONB, created_at, expires_at` — for Razorpay, XP award, submission.  

### 6.3 Indexing & partitioning highlights

- All `tenant_id` leading indexes; GIN on `JSONB` condition fields.
- `progress` partial index `WHERE state IN ('submitted','needs_review')` for reviewer queue.
- `ai_messages` partitioned by `created_at` monthly; retained 90d hot, archive to S3.
- `audit_logs` partitioned monthly; never updated.
- HNSW index on `contents.embedding vector(1536)` via `pgvector` for RAG.

---

## 7. API Structure

### 7.1 Principles

- **Versioned**: `/api/v1` (URL versioning for enterprise cache friendliness); sunset header `Sunset: Sat, 31 Dec 2028`.
- **Style**: REST for CRUD, WebSocket for realtime, idempotency for mutations, cursor pagination for feeds, OpenAPI 3.1 generated via NestJS Swagger.
- **Conventions**: `kebab-case` URLs, `camelCase` JSON, `snake_case` never; errors as RFC 7807 `application/problem+json`; `X-Request-Id`, `Idempotency-Key`, `X-Tenant-Slug` headers.
- **Auth**: `Authorization: Bearer <JWT>` (15m) + `Cookie: refreshToken` (httpOnly). Every handler has `@UseGuards(TenantGuard, JwtGuard, CaslGuard)`.
- **Rate limits**: 60 req/min per user + 1000 req/min per tenant (Redis token bucket), stricter on AI (`20 req/min`) and Razorpay webhooks (HMAC verified, no rate limit but dedup).

### 7.2 Resource map (illustrative, not exhaustive)

```
Auth & Users
  POST   /api/v1/auth/github              → OAuth start (302 GitHub)
  GET    /api/v1/auth/github/callback      → code→tokens, create/link user, set refresh cookie
  POST   /api/v1/auth/refresh              → rotate refresh
  POST   /api/v1/auth/logout
  GET    /api/v1/me
  PATCH  /api/v1/me
  GET    /api/v1/tenants/:tenantSlug/members              (Tenant Admin)
  POST   /api/v1/tenants/:tenantSlug/members/invite
  PATCH  /api/v1/tenants/:tenantSlug/members/:userId/role

Tenants
  POST   /api/v1/tenants                   (Super Admin)
  GET    /api/v1/tenants/:slug
  PATCH  /api/v1/tenants/:slug             (Tenant Admin — branding, flags)
  GET    /api/v1/tenants/:slug/analytics/* (Program Mgr)

Journeys & Levels (15-level)
  GET    /api/v1/journeys                  ?tenant=slug&cohort=id
  POST   /api/v1/journeys                  (Program Mgr)
  GET    /api/v1/journeys/:journeyId/levels
  PATCH  /api/v1/journeys/:journeyId/levels/:levelIdx     ( gating rules )
  POST   /api/v1/journeys/:journeyId/reorder
  GET    /api/v1/enrollments               ?user=me|id
  POST   /api/v1/enrollments               {journeyId, cohortId?}
  GET    /api/v1/enrollments/:id/progress
  POST   /api/v1/enrollments/:id/progress/:levelIdx/unlock  (checked server-side; client cannot force)
  POST   /api/v1/enrollments/:id/progress/:levelIdx/complete {submissionId?}

Submissions & Reviews
  POST   /api/v1/submissions               {progressId, type, url/fileId/repoUrl}  Idempotency-Key required
  GET    /api/v1/submissions               ?state=pending&level=3 (Reviewer queue)
  GET    /api/v1/submissions/:id
  POST   /api/v1/submissions/:id/reviews   {verdict, rubricScores, feedbackMd} (Reviewer)
  POST   /api/v1/submissions/:id/resubmit

Gamification
  GET    /api/v1/gamification/me           → {xp, level, streak, badges[], nextLevelXp}
  GET    /api/v1/gamification/leaderboard  ?cohort=id&scope=tenant|cohort|global&period=weekly|allTime  (cursor, Redis ZSET)
  GET    /api/v1/gamification/badges
  POST   /api/v1/gamification/xp-events    (internal/system only, idempotent)

AI — 5 Assistants (streaming)
  GET    /api/v1/ai/assistants             → list 5 + per-tenant overrides
  POST   /api/v1/ai/conversations          {assistantCode, context:{levelId, submissionId?}}
  GET    /api/v1/ai/conversations          ?assistant=code-mentor
  GET    /api/v1/ai/conversations/:id/messages
  POST   /api/v1/ai/conversations/:id/messages  {content} → 200 SSE / WebSocket stream (Vercel AI SDK data-stream)
  POST   /api/v1/ai/conversations/:id/tool-approval {toolCallId, approved}
  GET    /api/v1/ai/usage                  ?period=month (Finance/Tenant Admin)

Projects & GitHub
  POST   /api/v1/projects                  {name, repoUrl}
  POST   /api/v1/projects/:id/link-github  {repoUrl} → verifies OAuth ownership
  GET    /api/v1/projects/:id/analysis     (AI repo review)
  POST   /api/v1/webhooks/github           (commit/PR → submission auto-update)

Billing (Razorpay)
  POST   /api/v1/billing/orders            {planId|amount, items} → {razorpayOrderId, amount}
  POST   /api/v1/billing/verify            {razorpay_payment_id, signature} → 200 (HMAC verified)
  POST   /api/v1/billing/subscriptions     {planId} → subscription + entitlements
  POST   /api/v1/webhooks/razorpay         (HMAC + idempotent via razorpay_events)
  GET    /api/v1/billing/invoices
  POST   /api/v1/billing/refunds           (Finance, audited)

Files
  POST   /api/v1/files/presign             {mime, size, entityType/id} → {url, key, headers}
  GET    /api/v1/files/:id                 → 302 presigned GET (tenant-checked)
  POST   /api/v1/files/:id/av-callback     (internal Lambda)

Realtime
  WS     /ws  — namespaces: /cohort/:id, /user/:id, /review-queue, /ai/:conversationId
         Events: progress:updated, submission:created, review:decided, leaderboard:delta,
                 ai:delta, ai:tool_call, presence:join/leave, notification:new

Notifications
  GET    /api/v1/notifications             ?unread=true
  PATCH  /api/v1/notifications/:id/read
  PUT    /api/v1/notification-preferences  {channel, event, enabled}
```

### 7.3 Streaming contracts

- **AI chat**: `POST /ai/conversations/:id/messages` returns `text/event-stream` (SSE) with Vercel AI SDK `data-stream` protocol (`0:"token"`, `2:tool_call`, `8:finish`). Fallback WebSocket `ai:delta` for mobile clients with poor SSE support.
- **Realtime**: Socket.io with JWT handshake (`auth.token`), tenant room auto-join, heartbeat 25s, reconnect with `lastEventId`.

### 7.4 Idempotency & consistency

- Mutations that create money/XP/submissions require `Idempotency-Key: <uuid>`; server stores `idempotency_keys` with 24h TTL and replays same response.
- Progress state transitions are a **state machine** guarded server-side; client cannot jump `locked → approved` without passing through `submitted → needs_review`.

---

## 8. Realtime, Background Jobs & Notifications

### 8.1 Realtime (Socket.io + Redis Adapter)

- **Adapter**: `@socket.io/redis-adapter` with Redis Streams so any pod can emit to any room; horizontal scale is linear.
- **Namespaces/rooms**: `tenant:{tid}`, `cohort:{cid}`, `team:{teamId}`, `user:{uid}`, `level:{lid}`.
- **Auth**: Handshake verifies JWT + tenant; `socket.data.tenantId` checked on every `join`.
- **Presence**: Redis `SET presence:tenant:{tid}:user:{uid} EX 60` updated on heartbeat; `GET presence` API for "who's online" in cohort.
- **Scale**: 100k concurrent sockets ≈ 10 pods × 10k sockets (uWebSockets.js if Node hits ceiling); sticky sessions via ALB cookie or Redis adapter removes need for stickiness (but keep for perf).
- **Fallback**: If Socket.io unavailable, long-poll `GET /notifications?since=cursor` (Novu in-app feed).

### 8.2 Background Jobs (BullMQ)

Queues (each with concurrency, rate limit, DLQ):

- `xp-recalc` — award XP, check badge conditions (idempotent by `xp_events.idempotency_key`)
- `streak-cron` — daily 00:30 IST, increments/resets streaks
- `certificate-render` — HTML → PDF (Puppeteer) → S3
- `email-digest` — nightly learner digest via Novu batch
- `ai-embedding-backfill` — chunk + embed journey content → pgvector
- `razorpay-reconcile` — nightly fetch settlements, mismatch alert
- `av-scan` — S3 event → ClamAV Lambda → update `files.av_status`
- `leaderboard-snapshot` — hourly snapshot to Postgres for analytics

Dashboard: Bull Board at `/admin/queues` (Support/ Super Admin, audited).

### 8.3 Notifications (Novu)

- Providers: SendGrid/SES (email), FCM/APNs (push), Web Push (VAPID), SMS via MSG91 (India) — toggled per tenant.
- Templates versioned: `level_unlocked`, `submission_needs_review`, `review_decided`, `streak_at_risk`, `payment_failed`, `ai_credits_low`.
- Preference center: per-user per-channel toggles; `Do Not Disturb` respects IST quiet hours.
- Fan-out: `novu.trigger('review_decided', {to:{subscriberId}, payload:{submissionId, verdict}})` → Novu handles routing + retry.

---

## 9. 15-Level Journey & Gamification Engine

### 9.1 15-Level Journey

**Model**: Each journey has exactly 15 ordered `levels` (enforced at DB constraint `CHECK idx BETWEEN 1 AND 15`). Prerequisites form a DAG (usually linear 1→2→...→15, but allow branching 5→{6a,6b}→7 for enterprise custom).

**State machine per learner per level:**

```
locked ──► available ──► in_progress ──► submitted ──► needs_review ──► approved ─┐
              ▲                          │ rejected ◄─────────────────────────────┘
              │ resubmit                 └──► rejected ──► in_progress (retry, attempts++)
```

Gating rules in `levels.unlock_condition` JSONB: `{ "allOf": [1,2], "minXp": 500, "badge":"first-pr" }` evaluated by `JourneyService.canUnlock(user, level)`.

**Progress computation**: Materialized from `progress` table; `enrollments.current_level_idx` is min `available/in_progress` index for fast queries. Unlocks happen transactionally when `reviews.verdict = approved` → `xp_events` insert → `progress` update → BullMQ `xp-recalc` → Novu `level_unlocked`.

**Content per level**: Video (Mux/Cloudflare Stream), Markdown, Quiz (client-graded but server-verified), Assignment (submission-gated). All content rows tenant-scoped, support white-label copy via `tenants.settings.content_overrides`.

### 9.2 Gamification

- **XP**: Event-sourced via `xp_events`; total XP = `SELECT SUM(amount)`. Level formula: `level = floor((xp/100) ^ 0.5)` or config per tenant (stored in `tenants.settings.xp_curve`). Atomic: review approval and XP insert in same transaction + idempotency key `submission:{id}:xp`.
- **Badges**: Declarative conditions `{"and":[{"gte":["xp",1000]},{"gte":["streak",7]}]}` evaluated on every XP event; earned badges inserted to `user_badges` and notified. Includes `first-submission`, `streak-7/30`, `top-10-weekly`, `github-pr-merged`.
- **Streaks**: Daily unique `xp_events` or `progress` completion counts; cron at IST midnight increments `streaks.current_streak`; break resets. Shown on FE `pill Streak`.
- **Leaderboards**: Redis sorted set `t:{tid}:lb:cohort:{cid}:weekly` with `ZINCRBY xp` per event; `ZREVRANK` for position; paginated `ZREVRANGE` with user hydration from Postgres. Weekly key rotates Monday 00:00 IST (new key, old archived to Postgres hourly snapshot). Supports `tenant`, `cohort`, `global` scopes.
- **Quests**: Lightweight alias over levels — frontend `quest` cards (as in jne-gamified) map to `levels` + `quests` table for cross-level challenges.

### 9.3 Frontend tie-in (jne-gamified precedent)

Existing `jne-gamified/index.html` prototype validated the XP/level/streak/badge/leaderboard UX. Architecture preserves its concepts but moves state from localStorage to Postgres+Redis with realtime deltas.

---

## 10. 5 AI Assistants — Abstraction Layer

### 10.1 Gateway design (LiteLLM + Vercel AI SDK)

```
Client (useChat) ──► NestJS AiGatewayModule ──► LiteLLM Proxy ──► Provider
                        │                          ├── OpenAI gpt-4o-mini (cheap)
                        │ RAG (pgvector)           ├── Anthropic claude-3.5-sonnet
                        │ tools (exec, rubric)     ├── Gemini 1.5-flash
                        │ budget check             └── Azure OpenAI (DPDP fallback)
                        └── ai_usage_ledger (tenant cost)
```

- **One interface**: All calls use OpenAI-compatible `chat/completions` with `stream:true`. LiteLLM handles provider translation, retries (3× exponential backoff), fallback chain (primary → fallback), and cost logging.
- **Per-assistant config** in `ai_assistants` table, tenant-overridable:

| Code | Name | Model default | Tools | RAG collection | Cost tier |
|------|------|---------------|-------|---------------|-----------|
| `code-mentor` | CodeMentor | gpt-4o-mini | `run_code`, `rag_search`, `github_read` | `journey:{journeyId}` | Low |
| `career-coach` | CareerCoach | claude-3.5-haiku | `rag_search` | `career-playbooks` | Low |
| `project-reviewer` | ProjectReviewer | gpt-4o | `rubric_score`, `github_read`, `rag_search` | `rubrics + journey` | High |
| `concept-explainer` | ConceptExplainer | gemini-1.5-flash | `rag_search`, `diagram_gen` | `journey:{journeyId}` | Low |
| `debug-assistant` | DebugAssistant | gpt-4o-mini | `run_code`, `github_read`, `rag_search` | `errors-kb` | Medium |

- **Streaming**: NestJS `AiController` proxies LiteLLM stream as SSE; Vercel AI SDK `streamText` on client consumes it. Tool calls pause stream, execute via `tool-approval` flow (e.g., `run_code` sandboxed in Firecracker/ Modal microVM, 5s timeout, no network).
- **RAG**: Journey markdown chunked (500 tokens, 50 overlap) → embeddings (`text-embedding-3-small`) → `pgvector` HNSW; top-6 chunks injected as `system` context with citations. Re-ranking via Cohere Rerank (optional).
- **Budgets**: Pre-call check `entitlements.ai_credits`; post-call ledger insert; 80%/100% thresholds trigger Novu `ai_credits_low`; Program Manager dashboard shows per-tenant burn.
- **Safety**: Guardrail prompt prefix (no PII leakage across tenants), Max output 2k tokens, content filter via provider moderation + self-host `llamaguard` sidecar for DPDP.

### 10.2 Consistency & evaluation

- Prompt templates versioned in `ai_assistants.system_prompt_md` with canary flags (5% traffic to v2).
- Evals nightly: golden Q&A set per assistant, scored by `gpt-4o` as judge, Grafana alert if accuracy < 90%.
- Cost alert: if tenant token spend > Razorpay plan allocation, throttle to cheaper model automatically.

---

## 11. Scaling to 100k+ Users

### 11.1 Numbers (back-of-envelope)

- 100k MAU → ~10k DAU → ~2k concurrent (2% DAU), burst 10k at cohort launch.
- Requests: 2k × 5 req/min = 10k req/min API; AI: 500 concurrent streams; WebSocket: 2k-10k sockets.
- Storage: 100k users × 50 submissions × 2 MB avg = 10 TB S3 (lifecycle to IA).
- DB: `progress` 100k×15 = 1.5M rows; `xp_events` ~10M/yr; `ai_messages` ~50M/yr (partitioned).

### 11.2 Scaling tactics

| Layer | Current (0-10k) | 10k-100k (this design) | 100k-1M (path) |
|-------|----------------|------------------------|----------------|
| **App** | 2 pods (2 vCPU/4GB) | 5-10 pods HPA (CPU 60% / RPS), stateless, 30s rolling deploy | 20+ pods, split `ai-worker` & `realtime` to dedicated ASGs, Go RLS proxy |
| **DB — Postgres** | Single RDS db.t3.medium | db.r6g.large + 2 read replicas (1 for analytics/leaderboard reads), `pgBouncer` transaction pooling (pool 100 → DB 20 connections/pod), RLS indexed | Citus/sharding by `tenant_id` hash, or Neon branching per large tenant; read replica for AI RAG vector queries |
| **Redis** | Single ElastiCache t3.micro | Cluster (3 shards, 1 replica/shard), separate logical DB for BullMQ vs cache vs pubsub; enable `maxmemory-policy allkeys-lru` for cache | Redis Enterprise or Dragonfly for higher throughput |
| **Files** | S3 Standard | S3 + CloudFront (hit ratio >80% for level videos), presigned direct-to-S3 uploads (app not in data path) | R2 for egress-heavy video; Mux for transcoded streaming |
| **AI** | Direct OpenAI | LiteLLM gateway with circuit breaker, fallback, and regional Azure OpenAI (Central India) for DPDP | Self-host 7B models (Ollama/TGI) for Tier-1 assistants to cut cost 70% |
| **Realtime** | Socket.io single pod | Redis adapter cluster, 10k sockets/pod, ALB stickiness optional | uWebSockets.js or Ably/Pusher if ops burden high |
| **CDN** | Cloudflare free | Cloudflare Pro: WAF, rate limit, tiered cache, `Cache-Tag` purge on journey publish | Edge compute (Cloudflare Workers) for tenant resolution |
| **Search** | Postgres LIKE | pgvector HNSW + Meilisearch | Qdrant dedicated vector cluster |
| **Observability** | Logs only | OTEL traces sampled 10%, Prometheus cardinality 100k, Sentry 5k events/min | Dedicated Loki + Tempo |

### 11.3 Resilience patterns

- **Rate limiting**: Token bucket per `tenantId+userId` (Redis), burst 60, refill 1/s; AI tighter 20/min; Razorpay webhook HMAC bypasses rate limit but deduped via `razorpay_events`.
- **Circuit breakers**: LiteLLM → provider, S3 → presign (fallback to R2), Redis (cache-aside, never fail request on cache miss).
- **Idempotency**: All money/XP mutations idempotent; client retries safe.
- **Backpressure**: BullMQ concurrency caps; AI `maxConcurrentStreams` per tenant (queue excess → 429 + `Retry-After`).
- **Graceful degradation**: If AI down, journey still progresses; if Redis down, app runs with DB-only (no leaderboard, no realtime — banner).
- **Data**: PITR 7d, cross-AZ replica, nightly `pg_dump` to S3 (encrypted KMS), 30d soft-delete.

### 11.4 Performance budgets

- p95 API < 200ms (cache hit), AI first token < 800ms, WS round-trip < 100ms (in-region), file presign < 50ms, leaderboard fetch < 80ms (Redis).
- Frontend: LCP < 2.5s, INP < 200ms (Next.js ISR + CloudFront edge).

---

## 12. Security, Compliance & Observability

### 12.1 Security

- **Auth**: GitHub OAuth scopes `read:user user:email` only (never `repo` unless project linking). JWT `aud: aihub`, `iss: api.aihub.in`, `tenantId` claim, 15m expiry, rotation on refresh, revocation list in Redis `revoked:jti` 24h.
- **Tenant isolation**: RLS + IAM prefix + Redis namespace + Socket.io room checks — 4 layers.
- **Encryption**: TLS 1.3 everywhere, at-rest AES-256 (RDS, S3 SSE-KMS), secrets in AWS Secrets Manager, never in env.
- **Input**: Zod validation on every DTO, 5 MB JSON limit, AV scan on uploads, CSP `frame-ancestors none`, CSRF double-submit for cookie refresh.
- **Audit**: `audit_logs` append-only, actor+ before/after, admin export to S3 WORM.

### 12.2 Compliance (India focus)

- **DPDP Act 2023**: Consent artifact per user, purpose limitation (AI training opt-in separate), DSR (export/delete in 30d), data localization — primary region `ap-south-1` (Mumbai), backup `ap-south-2` (Hyderabad). No cross-border transfer without explicit consent.
- **Razorpay**: PCI-DSS SAQ A (no card data touches our servers — Razorpay Checkout handles it). GST invoices with HSN/SAC, e-invoice ready.
- **DPDP/ GDPR**: Right to erasure cascades; pseudonymized analytics (PostHog self-host option).

### 12.3 Observability

- **Traces**: OTEL auto-instrumentation NestJS + Postgres `pg_stat_statements`; sample 10% normal, 100% on errors.
- **Metrics**: Prometheus — `http_request_duration`, `xp_events_total`, `ai_tokens_total{assistant,tenant}`, `ws_connections`, `bullmq_jobs_failed`.
- **Logs**: Loki structured JSON, `tenantId` and `requestId` on every line; PII redacted.
- **Alerts**: PagerDuty: p95 > 500ms, Razorpay webhook failure >5/10m, AI error rate >10%, Redis memory >80%.

---

## 13. Deployment Topology & Environments

```
Environments: dev (per-PR preview via Vercel) → staging (EKS staging, seeded) → prod (EKS prod, ap-south-1)

CI/CD (GitHub Actions):
  push → lint (eslint, tsc --noEmit) → test (vitest, playwright) → build Docker → push ECR
       → Terraform plan → ArgoCD sync (staging auto, prod manual approval for Tenant Admin)
  Secrets: OIDC → AWS (no static keys), Razorpay webhook secret via Secrets Manager

Infra (Terraform):
  VPC (3 AZ), EKS (managed nodes: app pool 5×m6i.large, ai-worker pool 2×g5.xlarge spot)
  RDS Postgres 16 multi-AZ, ElastiCache Redis cluster, S3 + CloudFront, Cloudflare DNS/WAF
  Route53: {slug}.aihub.in wildcard + apex; ACM certs auto

Feature flags: Flagsmith / Unleash (tenant + cohort targeting: "enable code-mentor v2 for Tenant X cohort Y")

White-label: `tenants.settings.branding {logo, primaryColor, font, domainCname}` → Next.js middleware injects CSS variables, Cloudflare custom hostname.
```

---

## 14. Migration / Build Phases

| Phase | Duration | Deliverables | Risk |
|-------|----------|--------------|------|
| **0. Bootstrap** | 2 wks | Repo, CI, Terraform, shared tenant_id + RLS scaffold, Auth.js GitHub login | — |
| **1. Core** | 4 wks | Journey 15 levels + progress state machine + file upload + enrollments | Prereq DAG cycles |
| **2. RBAC + Multi-tenant hardening** | 2 wks | 10 roles, CASL, ABAC, tenant resolver, RLS policies, audit log | Missing tenant check |
| **3. Gamification** | 2 wks | XP events, Redis leaderboards, streaks, badges, jne-gamified parity | Redis key migration |
| **4. AI Gateway** | 3 wks | LiteLLM, 5 assistants, RAG pgvector, streaming, budgets | Cost runaway → caps |
| **5. Billing** | 2 wks | Razorpay orders/subs/webhooks, entitlements, invoices | HMAC + idempotency |
| **6. Realtime + Notifications** | 2 wks | Socket.io + Novu + presence | Socket scale test |
| **7. Hardening & Scale** | 3 wks | pgBouncer, read replicas, HPA, k6 load (10k sockets, 10k RPS), DPDP DSR, SOC2 controls | Load test fixes |
| **8. Enterprise** | Ongoing | Dedicated DB offer, SSO (SAML/OIDC), custom domain, data export | Per-tenant infra |

---

## 15. Decision Log (ADRs)

| ADR | Decision | Consequence | Revisit when |
|-----|----------|-------------|--------------|
| ADR-01 | Shared schema + RLS over DB/schema-per-tenant | Cheap, one migration set; discipline required | Tenant >10k users or residency demand |
| ADR-02 | NestJS modular monolith first | Velocity, shared types; later extract ai/realtime/billing | Module coupling > threshold (coupling metric) |
| ADR-03 | pgvector before dedicated vector DB | Fewer moving parts; add Qdrant if vector latency >80ms | 1M+ chunks or <50ms RAG needed |
| ADR-04 | LiteLLM gateway | Provider agnostic, cost control | If self-host open models dominate |
| ADR-05 | BullMQ on Redis over SQS/Kafka | Ops simple, already have Redis | 500k DAU or need exactly-once |
| ADR-06 | Novu for notifications | One trigger fans out | If Novu ops overhead outweighs hand-rolled |

---

## Appendix A — Razorpay India Integration Details

- **Flow**: FE creates `POST /billing/orders` → BE calls `razorpay.orders.create({amount, currency:INR, receipt: tenant:user:uuid})` → returns `order_id` → FE opens Razorpay Checkout → on success POST `/billing/verify` with `razorpay_payment_id + signature` → BE verifies `HMAC_SHA256(order_id|payment_id, key_secret)` → marks paid + creates `entitlements` + emits `payment.succeeded` → Novu receipt.
- **Subscriptions**: `razorpay.subscriptions.create({plan_id, customer_notify:1, total_count:12})`, mandate via UPI Autopay / eMandate; webhooks `subscription.charged` → extend entitlement.
- **Webhooks**: `POST /webhooks/razorpay` verified with `X-Razorpay-Signature` (HMAC), dedup via `razorpay_events.razorpay_event_id`, BullMQ retry with backoff, dead-letter to `audit_logs`.
- **Payouts**: Mentor payouts via RazorpayX `payouts.create` (reviewed by Finance role).
- **GST**: Invoice service generates GST-compliant PDF with tenant GSTIN, HSN 9983, e-invoicing IRN if enabled.

## Appendix B — GitHub OAuth Integration Details

- **NextAuth provider**: `GitHubProvider({clientId, clientSecret, authorization:{params:{scope:"read:user user:email"}}})`; for repo linking request extra `repo` scope incrementally via `signIn('github',{scope:'repo'})`.
- **Linking**: `users.github_id` unique; on callback upsert `accounts` table; if email conflict, prompt merge.
- **Features**: Pull PR metadata for submissions, commit history for `project-reviewer` AI, org membership sync for enterprise tenant auto-provisioning (`GET /user/orgs` → map org→tenant).

## Appendix C — Operational Secrets & Env

```
DATABASE_URL=postgres://...
REDIS_URL=redis://...
S3_BUCKET=hub-prod
S3_REGION=ap-south-1
AUTH_SECRET=...
GITHUB_ID=...
GITHUB_SECRET=...
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
LITELLM_PROXY_URL=https://litellm.internal
OPENAI_API_KEY=...
ANTHROPIC_API_KEY=...
GEMINI_API_KEY=...
NOVU_API_KEY=...
SENTRY_DSN=...
```

Never commit; injected via Secrets Manager → EKS secrets.

---

*End of architecture. Evidence: this file at `/tmp/ai-accelerator-hub-architecture.md` plus copy at workspace for durability. Unresolved items listed in submission payload.*

