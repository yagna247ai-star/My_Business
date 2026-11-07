# AI Accelerator Hub — Master Implementation Plan

**Version:** 1.0 — 2026-11-04 · Synthesis of 5 parallel evidence streams  
**Source of truth:** MASTER BUILD PROMPT §1-37 (34241 chars, session seq494) → 92 REQs · Architecture 751 lines · Journey/Gamification 1236 lines · Brand/WCAG analysis · Workspace clean-slate audit  
**Scale target:** 100k+ MAU · 500+ tenants · 15 levels · 10 roles · 5 AI assistants — India-first, DPDP/enterprise-ready  
**Repo target (greenfield):** `ai-accelerator-hub/` at **one** canonical root — recommend `/Users/apple/Documents/My_Business/ai-accelerator-hub` (primary) with mirror/docs symlink at `/Users/apple/ai-business/ai-accelerator-hub`. Clean slate verified at both (no package.json, no DB/env, no codebase — only docs + static `AI_Accelerator_Hub_Kit` 9.7M asset kit). Legacy Angular 20 reference at `Outskill/.../ai-accelerator-hub` is **reference only**, not deployed to either target.

---

## 1) Final Stack Decision (with justification — one choice per layer)

| Layer | Final Choice | Alternatives rejected & why |
|---|---|---|
| **Frontend** | **Next.js 15 App Router + TypeScript strict + Tailwind + shadcn/ui + TanStack Query + Zustand + Framer Motion** | CRA/Vite SPA rejected: no SSR/ISR for public landing + 15-level content, worse TTI/SEO. Remix rejected: smaller hiring pool, weaker ISR. Nuxt/SvelteKit rejected: React pool + shadcn maturity. Zustand over Redux: server-state (Query) / client-state (Zustand) separation, lighter than Redux Toolkit. |
| **Backend** | **NestJS 10 (Node 22) modular monolith → extract later** | Express rejected: unstructured at 10 roles × ABAC. Django/FastAPI-only rejected: JS/TS split. Go rejected now: slower velocity for RBAC/journey domain; reserve Go for hot RLS proxy later. Spring rejected: JVM ops heavy. Modular monolith first; extract `ai-worker`, `realtime`, `billing` when coupling threshold hit. |
| **AI sidecar** | **Python FastAPI (GPU pool) for embeddings/RAG/evals + LiteLLM proxy** | Node-only for AI rejected: Python better for chunking/embeddings/experimentation. Scaled independently on g5.xlarge spot. |
| **DB primary** | **PostgreSQL 16 (RLS, JSONB, ltree/CTE DAG, pgvector)** | MongoDB rejected: weak transactions for XP+level atomicity. MySQL rejected: weaker JSONB, no RLS, no pgvector. Citus/Neon path reserved for sharding >100k. |
| **Cache/Queue/PubSub** | **Redis 7 (5 roles: cache, session, BullMQ, Socket.io adapter, ZSET leaderboards)** | Kafka/RabbitMQ rejected pre-500k: ops overkill; BullMQ on Redis is simple + already needed. Upgrade to Kafka for event sourcing later. |
| **ORM** | **Prisma 5 + pgBouncer (transaction pool) + raw SQL fallback for RLS** | Drizzle acceptable swap if team prefers SQL-native, but Prisma wins for tenant_id middleware + scaffolding speed. |
| **Auth** | **Auth.js v5 (NextAuth) — GitHub OAuth + Email OTP + JWT 15m + httpOnly rotating refresh + CASL/CASBIN RBAC/ABAC** | Auth0/Clerk rejected: DPDP data residency + cost at 100k MAU; self-host keeps isolation auditable (Clerk acceptable as SaaS shortcut if SOC2 timeline tight, provider-agnostic interface kept). Passport alone rejected: Auth.js wraps it + session. CASL over hand-rolled `if role===` (unmaintainable at 10 roles). OPA reserved later. |
| **Files** | **S3 (ap-south-1) or R2 + CloudFront + presigned POST/GET + ClamAV Lambda AV scan** | Local disk rejected: no durability. GCS equivalent — S3 chosen for Razorpay/India region. R2 attractive for zero-egress video. Tenant prefix `s3://hub-{env}/{tenantId}/{userId}/{entity}/{uuid}` + IAM prefix condition. |
| **AI gateway** | **Vercel AI SDK + LiteLLM Gateway → OpenAI/Anthropic/Gemini/Azure OpenAI/Ollama fallback** | Direct SDKs rejected: vendor lock, no fallback at cohort peak. LangChain composes *with* LiteLLM (LiteLLM=gateway, LangChain=chain internals). Budgets/quotas + streaming + tool-calling + cost tracking per tenant/assistant. |
| **Payments** | **Razorpay Orders/Subscriptions/Webhooks + RazorpayX payouts + GST invoice service** (Stripe adapter interface kept for future geo-expansion) | Stripe rejected for India gaps (UPI, recurring mandates). Hosted Checkout → PCI SAQ A (no card data touches servers). HMAC_SHA256 verification + `razorpay_events` idempotency dedup. |
| **Jobs** | **BullMQ (Redis) + Inngest alternative for durable sagas** | Celery Python-only rejected; SQS+Lambda vendor coupling rejected. Queues: xp-recalc, streak-cron, certificate-render, email-digest, embedding-backfill, razorpay-reconcile, av-scan, leaderboard-snapshot. Bull Board at `/admin/queues` (audited). |
| **Realtime** | **Socket.io 4 + Redis adapter** | ws/uWebSockets fallback. Rooms `tenant:{tid}:cohort:{cid}:team:{tid}:user:{uid}`; tenant mismatch → reject join. 10k sockets/pod, ALB stickiness optional (adapter removes requirement). |
| **Notifications** | **Novu (self-host) — one trigger fans out to in-app/email/push/SMS** | Hand-rolled rejected: N×M provider sprawl. Providers: SES/SendGrid, FCM/APNs, Web Push VAPID, MSG91 SMS India. Templates versioned + preference center + quiet-hours IST. |
| **Search/RAG** | **pgvector first (HNSW 1536d) + Qdrant optional >80ms + Meilisearch for typo-tolerant cohort search** | Dedicated vector DB rejected at launch: keep ops low; add Qdrant at 100k docs/1M chunks. |
| **Observability** | **OTEL + Prometheus/Grafana + Loki + Sentry + PostHog** | Traces sampled 10% (100% on error), metrics, structured logs with tenantId/requestId (PII redacted). Alerts: p95>500ms, webhook failures, AI error>10%, Redis>80%. |
| **Infra** | **Docker + EKS + Terraform + GitHub Actions + ArgoCD + Cloudflare (WAF/CDN/rate-limit) + ap-south-1 primary, ap-south-2 backup** | Vercel preview per-PR → staging EKS → prod manual approval. Flagsmith/Unleash for tenant+cohort feature flags. White-label via `tenants.settings.branding`. |

**ADRs (carry-forward):** shared-schema+RLS (revisit at tenant>10k users or residency demand) · modular monolith first · pgvector before dedicated vector DB · LiteLLM gateway · BullMQ on Redis · Novu for notifications.

---

## 2) Database ERD Summary (consolidated — 28 tables, RLS on 20+, tenant_id everywhere)

```
tenants 1──* memberships *──1 users ──* memberships ──1 roles
  │ 1            │ memberships 1──* abac_overrides / abac_policies
  │ *──* cohorts *──* enrollments (user×journey, cohort optional)
  │      cohorts 1──* teams 1──* team_memberships
  │      cohorts *──* orders/subscriptions (via users)
  │
  ├── journeys 1──* levels (idx 1..15, code L01..L15, stage S1..S5)
  │       levels 1──* level_prerequisites (DAG edges, cycle trigger)
  │       levels 1──* contents (video/md/quiz/assignment) 1──* content_progress (user×content)
  │       levels 1──* activities (6/level) 1──* activity_progress (enrollment×activity)
  │       levels 1──* quests / challenges ── boss_challenge_progress
  │       journeys *──* enrollments 1──* progress (user×level: locked→approved)
  │
  ├── progress 1──* submissions (link/file/repo/PR + harness_result + reflection_md + deployed_url)
  │       submissions 1──* reviews (rubric_scores + weighted_avg + rubric_id)
  │       rubrics (dimensions JSONB, pass_threshold)
  │
  ├── gamification: xp_ledger (append-only, idempotency_key UNIQUE, prev_hash/row_hash chain, advisory lock)
  │       badges (condition JSONLogic) ──* user_badges
  │       streaks (per user×tenant, freeze_tokens, grace_until) + streak_events (append-only)
  │       quests + leaderboard_snapshots (hourly Redis→Postgres archive) + flagged_xp_events
  │
  ├── tracks (8 codes) 1──* track_levels (overlay L11-13) ──* track_enrollments (user×track)
  │
  ├── ai_assistants (5 seed: code-mentor, career-coach, project-reviewer, concept-explainer, debug-assistant)
  │       1──* ai_conversations 1──* ai_messages (partitioned monthly) 1──* ai_tool_calls
  │       ai_usage_ledger (tenant/user/assistant, tokens_in/out, cost_micros, billed)
  │
  ├── projects 1──* project_repos (github) + repo_analyses
  │
  ├── billing: orders (razorpay_order_id UNIQUE), payments (razorpay_payment_id UNIQUE),
  │        subscriptions (razorpay_subscription_id UNIQUE), plans (razorpay_plan_id), entitlements (feature/remaining/resets_at),
  │        razorpay_events (razorpay_event_id UNIQUE, payload, processed — idempotent), invoices
  │
  ├── files (s3_key UNIQUE, bucket, mime, av_status pending/clean/infected, entity_type/id)
  ├── stages (global) + notifications + notification_preferences
  ├── unlock_events (level/track gate audit) + idempotency_keys (key PK, scope, response, TTL 24h)
  └── audit_logs (append-only, partitioned monthly, WORM S3 archive)  — never updated

Conventions: every tenant-scoped table has `tenant_id UUID NOT NULL` + index `(tenant_id, created_at DESC)`; GIN on JSONB; partial index `progress WHERE state IN ('submitted','needs_review')`; HNSW on `contents.embedding vector(1536)`; RLS `USING (tenant_id = current_setting('app.current_tenant')::uuid)` + `SET LOCAL app.current_tenant`; `levels CHECK idx 1..15` + `activities CHECK idx 1..6` + `level_prerequisites` cycle trigger; advisory lock `pg_advisory_xact_lock(hashtext(userId))` for XP; `subscriptions`/`orders`/`xp_ledger` unique razorpay/idempotency keys.
```

**Count:** 20+ RLS-enforced tables (users via memberships, enrollments, progress, activity_progress, submissions, reviews, xp_ledger, streaks/streak_events, badges/user_badges, ai_*, files, audit_logs, etc.). Partitioned: `ai_messages`, `audit_logs` monthly.

---

## 3) RTM Structure — 92 Requirements across 37 Sections → 9 Phases → 8 Acceptance Groups

**Source:** MASTER BUILD PROMPT §1-37 verified 37/37 sections. Schema: `REQ-ID | § | Requirement | Module | Acceptance Criterion (§35) | Priority | Phase`.

| Phase (§33) | Module bucket | #REQs | Priority split | Key P0 examples (18 First-Release items, §34) |
|---|---|---|---|---|
| **Ph1 Foundation** | Foundation | 19 | P0 8, P1 11 | REQ-AUTH-01/02/03 (10 roles, multi-tenant, RLS) · REQ-STD-01 (17 nav) · REQ-ADM-01 (Super/Tenant/Instructor/Mentor) · REQ-BRN-01/02 · REQ-I18N-01 · REQ-ARCH-01 |
| **Ph2 Learning Engine** | Learning Engine | 18 | P0 5, P1 11, P2 2 | REQ-LVL-01/03 (15 levels, 6 stages) · REQ-ACT-01 (6 activities) · REQ-HACK-01/02 (weekend engine, per-level scheduling) · REQ-REF-02/03 (Freedom AI adaptation + Prompt-Eng topics) |
| **Ph3 Gamification** | Gamification | 6 | P0 2, P1 4 | REQ-GAME-01 (XP/levels/streaks/badges/leaderboards) · REQ-GAME-02 (anti-abuse, auditable ledger, non-punitive streaks) |
| **Ph4 AI Ecosystem** | AI Ecosystem | 11 | P0 1, P1 10 | REQ-AI-01 (Learning Coach, P0) · REQ-AI-02..05 · REQ-AIP-01 (abstraction/routing/quotas) · REQ-AIS-01 (prompt-injection/PII guardrails) · REQ-EVAL-02 (AI never sole authority for career decisions) |
| **Ph5 Community+OSS** | Community | 8 | P0 1, P1 7 | REQ-GIT-01 (GitHub Lab Explore→Showcase, P0) · REQ-GIT-02 (curated OSS library) · REQ-COM-01/02 (community + moderation) |
| **Ph6 Hackathons+Mentorship** | Hackathons | 7 | P0 included via TEAM-01 (initial hackathon), P1 rest | REQ-TEAM-01/02 (3-5 teams, fair contribution) · REQ-EVAL-01 (3-layer, 10 dims) |
| **Ph7 Career** | Career | 6 | P1 2, P2 4 | REQ-CAR-01/02 (8 specializations) · REQ-TAL-01/02 (Talent Marketplace, consent-gated) |
| **Ph8 Growth+Revenue** | Growth | 9 | P0 2, P1 5, P2 2 | REQ-PAY-01/03 (Razorpay/Cashfree/PayU + webhook HMAC, hosted flow, P0) · REQ-PAY-02 (coupons/GST/refunds) · REQ-GROW-01/MKT-01 |
| **Ph9 Production** | Production | 8 | P0 2, P1 6 | REQ-SEC-01 · REQ-PRIV-01 · REQ-PERF-01 (99.9%, p95<2s) · REQ-QA-01 · REQ-A11Y-01 (WCAG 2.2 AA) · REQ-ANL-01 · REQ-SAFE-01/02 · REQ-ACC-01 (31 checks) |

**Full matrix file:** `AI_ACCELERATOR_HUB_RTM_92.csv` pattern — 92 rows `REQ-VIS-01..REQ-DEL-05`, each mapped to §35 gates: Auth(3)+Learning(4)+Gamification(4)+AI(4)+Admin(4)+Payments(3)+Security(4)+Production(5)=31 checks; all P0 must pass before First Release. Execution rule §36 (20 rules: DB before dependents, no hardcoded progress/fake analytics/placeholder auth/simulated payments/fake AI, real persistence, env/migrations/seed/tests/verified journeys) baked into Phase gates.

---

## 4) Brand System — Premium Dark Tech + Gamified Adventure + Creator Economy

### Palette — Final (MASTER §3 normative; legacy Kit noted)

| Token | Hex | Usage | WCAG on Navy #101426 | Rule |
|---|---|---|---|---|
| `background` / Deep Navy | #101426 | canvas, sidebar, header (`--background 228 36% 8%`) | — bg | — |
| `foreground` / White | #FFFFFF | body text | 18.26 AAA | Only AAA text |
| `primary` / Electric Blue | #3878F6 | buttons, links, progress, active nav (`--primary 220 91% 62%`) | 4.51 AA (borderline) | Never lower opacity; white-on-blue 4.05 passes AA-large/UI only |
| `secondary` / Purple | #8658E8 | level glyphs, quest rails, AI tint (`--secondary 262 72% 64%`) | 3.98 AA-large/UI | Text only ≥18px or ≥14px bold, or icons/borders (3:1), or white-on-purple 4.59 |
| `accent` / Gold | #E8B94F | XP, badges, streak, pills (`--accent 42 76% 68%`) | 9.99 AAA | Navy-on-gold 9.99 for pills. **Never on white (1.83 fail)** |
| Card / Border / Muted | #1E2438 / #2A3250 / #A0A8C0 (7.70) or #8890B0 (5.79) | cards, borders, muted text | — | Nothing below 5.79 on navy |
| Focus ring | 2px Blue + 2px Gold offset | Gold 9.99 on navy, Blue 3.80 on card + 4.51 on navy | — | Double ring passes on both surfaces |
| Destructive | #E84F4F | errors | 5.1 on navy | — |

**Legacy `AI_Accelerator_Hub_Kit/BRAND_KIT_4K.md` palette** (Ink #070A12 / Ink2 #0F172A / Gold #C9A86A / Paper #F8F7F4 / Slate #64748B + Bebas Neue/Instrument Serif) is the **marketing site** system for Yagna's 4K content/vault — retained for landing/vault pages. App uses the §3 palette above. Gradient rules: hero navy→card→purple 15%, XP blue→purple, level-up gold→purple→blue with navy scrim if text<4.5. Tokens derived: `--muted-foreground 224 18% 68%`, `--border 225 28% 24%`, `--ring` blue+gold.

### Logo · Typography · Components · Responsive · A11y (condensed)

- **Logo:** Upward chevron/launch arrow — two triangles (blue #3878F6 left, purple #8658E8 right) + gold star #E8B94F apex. 24×24, 8px rounded apex → 16px favicon simplifies to blue chevron+dot. Wordmark Plus Jakarta Sans 700 (matches `jne-gamified`) — `AI ACCELERATOR 700 + HUB 800 purple`, tracking 0.02em. Monogram `AH` navy circle for avatar/spinner. Motion: stroke-dash draw→fill, gold spark spring 300/20. Variants: full/stacked/icon-only/white-on-navy/single.
- **Typography:** Plus Jakarta Sans 700-800 headings / 400 15px/1.5 body / JetBrains Mono 13px code. Scale Major Third 1.25 (16→20→25→31→39→49, 1.20 mobile). H1 31/1.1/-0.02em white, body muted #A0A8C0, max 65ch, tabular-nums for XP, font-display swap woff2 preload.
- **Components:** Card bg #1E2438 border 1px #2A3250 radius 16 pad 16 shadow `0 6px 24px rgba(16,20,38,.4)`; quest left 4px rail (gold done/blue active/purple locked), XP gold pill, coach dashed blue box, portfolio 16:9 scrim. Progress: track #2A3250 h10 radius-full fill blue→purple 400ms; circular SVG gold head; 15-node vertical path (solid gold completed, pulsing current 1→1.08 1.2s, locked 40%+lock). Animations (Framer): +XP float 32px/800ms gold 700; confetti 60/1200ms; flame gold glow; row flash blue 20% 600ms on `leaderboard:delta`; optimistic TanStack Query + `idempotency_key`; `prefers-reduced-motion` disables.
- **Responsive:** Breakpoints 640/768/1024/1280/1536. <768: drawer + bottom-tab 5 (Home/Levels/Missions/Community/Profile) + grouped drawer for remaining 12. 768-1024: 64px rail→260px toggle. ≥1024: fixed 280px sidebar + max-w 1000px + 3-col xl. Sidebar 17 → 5 groups (LEARN 4, BUILD 3, COMMUNITY 3, GROW 4, SUPPORT 3) — collapsible, tenant feature-flag hideable.
- **A11y WCAG 2.2 AA:** Purple blocked for text-sm/nav-active on navy; gold-on-white blocked; UI 3:1 enforced. Focus 2.4.11 double ring + 72px scroll-margin. Targets 2.5.8: nav 36×36, CTA 44h ≥24. Motion 2.3.3, forms 3.3.7/3.3.8 (Zod), reflow 1.4.10 (320px no-scroll, 200% zoom single col, auto-fill minmax 260px). ARIA `aria-current`, `aria-valuenow`, live polite for XP/Socket. Gate: jsx-a11y + axe-core Playwright + keyboard + VoiceOver on Home/Levels/Missions/Playground.

---

## 5) Level 1 — Fully Instantiated Spec (`L01_AWAKENING`, 120 XP base)

**Level row:** `idx 1, code L01_AWAKENING, title "AI Awakening: The Mould & the Cookie", stage STAGE_IGNITION, summary "Think in objects — the mental model behind every agent/tool/RAG chunk.", xp_reward 120, unlock_condition null (entry), journey genai-career-accelerator. No prerequisites. Tags: `["oop","git","classes"]`.**

| Idx | Code | Title | Config highlights | Completion signal | XP |
|---|---|---|---|---|---|
| 1 | `MISSION_BRIEFING` | Briefing: The Cookie Factory | story "mould broken, model cookies as objects", stakeholder Factory Ops, boss preview "The Mould Trial", check Q "What does instantiation mean?" 1-Q ungraded nudge, est 8m | viewed + check answered | 5 |
| 2 | `LEARN` | Learn: Classes, Objects, Attributes | content_ids: video "Mould and the Cookie (9m)" + MD "Shared or Personal?" + quiz 4 Qs; `min_watch_pct 80`, `quiz_pass_pct 60` (server-verified), est 45m | all content viewed + quiz ≥60% | 18 |
| 3 | `EXPLORE_GITHUB` | Explore: Cookie Demo Repo | repos `org/cookie-demo` must_run true `python demo.py` + `org/oop-examples` optional; 2 code Qs ≥1 correct; est 30m | clone signal (GitHub OAuth check) or self-attest + Qs | 10 |
| 4 | `BUILD` | Build: Your Cookie Class | scaffold `level01-scaffold`, todos: `class Cookie` + `__init__(self,shape)` + class attr `oven_temp` + 2 instances; acceptance `pytest tests/test_cookie.py -q` + push to linked repo; est 90m | commit SHA recorded | 35 |
| 5 | `SUBMIT_PROOF` | Submit: Link Your Cookie | proof_types [repo,link], required repo_url + reflection_md ≥50w + checklist | `submissions` row pending | 5 |
| 6 | `EVALUATION_BOSS` | Evaluation + Boss: The Mould Trial | rubric `L01_RUBRIC` threshold 3.0, boss: `Cookie.count` + `@classmethod total_baked()`, harness `tests/test_boss.py` 3 tests must_pass 3, attempts 3, time 60m, review SLA 48h, `auto_ai_pre_review true`, est review pass | `reviews.verdict=approved` + `boss.state=passed` | 47 (20 base +27 boss bonus) |

**Rubric `L01_RUBRIC` (5 dims):** Correctness 30% · OOP Understanding 25% · Code Quality 20% · Reflection 15% · Boss 10%. Scale 1/3/5 per dim; `PASS if weighted_avg ≥3.0 AND boss ≥2` (harness 3/3 → boss 5; 2/3 → boss 3). Example `{"correctness":4,"oop":3,"quality":3,"reflection":4,"boss":3,"weighted_avg":3.45}`. Reviewer can override with audited reason.

**State/XP flow (happy):** Enroll→L1 available → A1 viewed→+5→A2 available → video 80%+quiz 75%→+18→A3→clone+1/2 correct→+10→A4 push→+35→A5 submitted→+5→A6 in_progress → AI pre-review + human review approved (3.45) + boss 3/3 → +47 → `progress approved` → `enrollment.current_level_idx=2` → L2 unlocked → badge `oop-master` (+20) → `ZINCRBY` → Novu `level_unlocked` → Socket `progress:updated`. On `needs_changes`/`rejected`: A6 stays in_progress, A5 available for resubmit, no XP loss.

---

## 6) Phase 1 Task Breakdown — Foundation (3 weeks, First Release 18 prioritized)

### Phase 1 scope = REQ-VIS-01/BRN-01/BRN-02/AUTH-01/02/03/STD-01/STD-02/I18N-01/ADM-01/ARCH-01/EXEC-01 + Level-1 scaffolding for unlock testing (full 15-level DAG but only L1 content shipped; L2-15 admin-configurable placeholders, no fabricated lessons).

| Sprint | Tasks (owner) | Acceptance gate (§35) | RTM trace |
|---|---|---|---|
| **W0 Bootstrap (3d)** | Repo + monorepo (pnpm), CI (lint/tsc/vitest/playwright), Terraform skeleton (VPC/RDS/Redis/S3/Cloudflare), `.env.example` + Secrets Manager, Prisma init + `tenant_id` helper + RLS scaffold, Auth.js GitHub OAuth `read:user user:email`, multi-tenant resolver (header/subdomain/JWT, fail-closed), `AsyncLocalStorage` TenantContext, health + OTEL wiring | Auth: register/login works | REQ-ARCH-01, AUTH-01 |
| **W1 Auth+Tenancy+RBAC (5d)** | `tenants` + `users` + `roles` (seed 10) + `memberships` UNIQUE(tenant,user) + `abac_policies`; CASL ability factory + `TenantGuard/JwtGuard/CaslGuard`; `GET /tenants/:slug/members`, invite, `PATCH role`; invitation codes + cohort enrollment; invitation vs public registration flows; tenant branding CSS variables + `tenants.settings.branding`; seed Super Admin + Institution Admin fixtures; audit_logs partition + idempotency_keys | Auth: roles enforce real permissions · Security: institutions cannot cross-access | REQ-AUTH-01/02/03, ADM-01 |
| **W1-2 Navigation & Shell (4d)** | Next.js 15 app shell: 17-item sidebar → 5 groups (LEARN/BUILD/COMMUNITY/GROW/SUPPORT) with collapsible + 64px rail + drawer + bottom-tab 5; shadcn `Sidebar`, `Card`, `Pill`, `Progress`, theme tokens (§4); Framer Motion polish; responsive QA at 320/768/1024/1280/4K; Plus Jakarta Sans + JetBrains Mono preload + WCAG double focus ring + jsx-a11y | Auth: student can register/log in · WCAG axe pass on shell | REQ-STD-01, BRN-02, A11Y-01 |
| **W2 Dashboards (5d)** | Student dashboard 12 sections (welcome, current_level, XP, rank, streak, weekly_progress, next_mission, upcoming_session, submissions, achievements, team_activity, career_readiness) — all DB-backed (`enrollments.progress`, `xp_ledger`, `streaks`, `user_badges`, `submissions`), empty-state + loading skeletons; Admin dashboards: Super (tenants/billing/audit) + Institution (students/cohorts/faculty/performance) + Instructor (lessons/sessions/activities) + Mentor (assigned students/reviews) — feature-flagged per role; i18n scaffolding `next-intl` EN/HI+TE/TA/KN/ML extensible, language switch without progress loss | Gamification: progress persistent · Admin: cohorts/lessons manageable | REQ-STD-02, ADM-01/02, I18N-01 |
| **W2-3 Levels+Activities DB (4d)** | `journeys` + `levels` (15 rows, idx CHECK, level_prerequisites DAG + cycle trigger) + `stages` S1..S5 + `contents` + `activities` (90 rows canonical, config JSONB) + `activity_progress` + `content_progress` + `github_exploration` + `progress` state machine + `enrollments`; `JourneyService.canUnlock` (6-gate: prereq DAG, linear, minXp, badge, entitlement, no time gate) + `unlock_events` audit; seed canonical `genai-career-accelerator` journey + 5 stages + Level 1 fully (see §5) with rubric `L01_RUBRIC`; admin CRUD for L2-15 placeholders (title/summary/xp only, no fabricated lessons) | Learning: Level 1 accessible · Level unlocking works · No fake lessons | REQ-LVL-01/02/03, ACT-01, HACK-02 (per-level scheduling fields) |
| **W3 Submissions+Review stub + Gamification stub (4d)** | `submissions` + `reviews` (rubric_scores) + `rubrics` + `files` presign + `boss_challenge_progress`; `POST /submissions` (Idempotency-Key, tenant-checked) + reviewer queue `GET /submissions?state=pending` (partial index) + `POST /submissions/:id/reviews` (CASL) + transactional `reviews.approved → progress approved → xp_ledger → next A1 available → enrollment.current_level_idx`; `xp_ledger` append-only (server-authoritative, no client POST), idempotency_key UNIQUE, advisory lock, prev_hash/row_hash; Redis ZSET `t:{tid}:lb:cohort:{cid}:weekly` ZINCRBY on ledger + `streaks`/`streak_events` (freeze/grace/recovery, IST) + badges `oop-master`/`first-proof`/streak-7 etc.; dashboard wires live | Learning: submit actual evidence · Gamification: XP server-side, leaderboards validated, progress persistent · Admin: mentors can review | REQ-HACK-01, ACT-01, GAME-01/02, EVAL-01 |
| **W3 Payments+i18n+Hardening (3d)** | Razorpay stub: `POST /billing/orders` → `razorpay.orders.create` → Checkout → `POST /billing/verify` HMAC → entitlements + `razorpay_events` dedup + `POST /webhooks/razorpay` (HMAC, BullMQ retry); never store raw cards; failing payment path; plan `journey_access` entitlement gates L1; hosted/tokenized flow only; i18n labels for nav/dashboard; CSP/CSRF/rate-limit guards; Sentry + Prometheus metrics `xp_events_total` etc. | Payments: provider real, webhooks verified, transactions auditable | REQ-PAY-01/03, PAY-02 (coupon/GST stub), I18N-01 |
| **Exit gate (1d)** | Seed + migrations + `.env.example` + deployment instructions (`README` + `docker-compose` for local: Postgres16+Redis7+S3 mock MinIO+LiteLLM proxy mock); test report (vitest unit, playwright e2e for Auth/Learning/Gamification critical journeys: enroll→L1 A1..A6→approve→unlock L2); backup/restore drill (pg_dump→S3, test restore); `KNOWN_LIMITATIONS.md` + `PENDING_CREDENTIALS.md` (real Razorpay keys, GitHub OAuth client, LiteLLM keys) + `PENDING_LEGAL.md` (DPDP review) | Production: deployment instructions documented, backup tested, known limitations documented; all 8 §35 groups smoke-pass for Ph1 slice | REQ-PERF-01 (zero loss for committed submissions) · REQ-QA-01 · REQ-A11Y-01 · REQ-EXEC-01 |

**Out of Ph1 (deferred):** Full Level 2-15 content (Ph2), full gamification quests/seasonal/referral engine beyond ledger+streak+badges stub (Ph3), 5 AI assistants + LiteLLM gateway (Ph4), GitHub Lab curated library + community feed/moderation (Ph5), team hackathons + 3-layer 10-dim eval (Ph6 full), 8 career tracks + Talent Marketplace (Ph7), Instagram Growth + AI Marketing Studio (Ph8), DPDP/legal review + OWASP hardening + 99.9% load/perf SLO verification (Ph9). Ph1 ships **First Release 18** backbone so Ph2 can deliver the 15-level learning engine without rework.

### File Structure (Ph1 target — pnpm monorepo, one `ai-accelerator-hub/` root)

```
ai-accelerator-hub/
├── README.md · BRAND_KIT.md · KNOWN_LIMITATIONS.md · PENDING_CREDENTIALS.md · PENDING_LEGAL.md
├── .env.example · .nvmrc · .gitignore · docker-compose.yml (postgres16, redis7, minio, litellm-mock)
├── package.json (pnpm workspaces) · tsconfig.json · eslint.config.js · prettier.config.js · turbo.json
├── apps/
│   ├── web/                          # Next.js 15 (App Router)
│   │   ├── app/
│   │   │   ├── (public)/page.tsx + (auth)/login + (legal)/privacy
│   │   │   ├── (student)/dashboard + levels/[idx] + missions + playground + projects + hackathons + squads + feed + leaderboard + resources + career + portfolio + certificates + coach + feedback + profile
│   │   │   ├── (admin)/admin/{tenants,billing,audit} + (tenant)/{cohorts,students,performance} + (instructor)/{lessons,sessions,activities} + (mentor)/{students,reviews}
│   │   │   └── api/                  # Next.js route handlers proxying to NestJS (or direct NestJS if single deploy)
│   │   ├── components/
│   │   │   ├── ui/ (shadcn: button, card, dialog, progress, pill, tabs, sheet, toast)
│   │   │   ├── shell/ (Sidebar 17→5 groups, Topbar, MobileDrawer, BottomTab)
│   │   │   ├── dashboard/ (Welcome, CurrentLevel, XpRing, StreakPill, WeeklyProgress, NextMission, UpcomingSession, SubmissionsList, Achievements, TeamActivity, CareerReadiness)
│   │   │   ├── levels/ (LevelCard, StageStepper, ActivityTabs A1..A6, BossCard, HarnessStatus)
│   │   │   └── gamification/ (LeaderboardTable, BadgeGrid, FreezeIndicator)
│   │   ├── lib/ (cn, tenant-resolver, rbac Can, i18n)
│   │   ├── hooks/ (useUnlock, useXp, useStreak — TanStack Query + optimistic)
│   │   ├── i18n/ (messages/en.json, hi.json, te.json, ta.json, kn.json, ml.json)
│   │   └── styles/ globals.css (tokens: --background/--primary/--secondary/--accent/--border/--ring)
│   └── api/                          # NestJS 10 modular monolith (Node 22)
│       ├── src/
│       │   ├── main.ts + app.module.ts
│       │   ├── common/ (tenant-context AsyncLocalStorage, RlsInterceptor, IdempotencyGuard, RateLimitGuard, AuditInterceptor, ZodValidationPipe)
│       │   ├── modules/
│       │   │   ├── tenant/ (TenantService, branding, feature flags)
│       │   │   ├── auth/ (Auth.js adapter, JWT, refresh, device sessions, GitHub OAuth)
│       │   │   ├── rbac/ (CaslAbilityFactory, AbacService, roles seed)
│       │   │   ├── user/ (UserService, MembershipService, TeamService)
│       │   │   ├── journey/ (JourneyService, LevelService, canUnlock, ActivityService, ContentService, ProgressService, EnrollmentService)
│       │   │   ├── submission/ (SubmissionService, ReviewService, RubricService, HarnessRunner stub)
│       │   │   ├── gamification/ (XpLedgerService awardXp server-only, StreakService, BadgeService, LeaderboardService Redis ZSET)
│       │   │   ├── file/ (FileService presign, av-callback)
│       │   │   ├── billing/ (RazorpayOrderService, WebhookService HMAC, EntitlementService)
│       │   │   ├── notification/ (Novu trigger stubs)
│       │   │   ├── realtime/ (Socket io, rooms, presence stub)
│       │   │   └── audit/ (AuditLogService, append-only)
│       │   └── config/ (env validation, razorpay, github, i18n)
│       └── test/ (vitest unit + supertest e2e: auth, tenant isolation, progress, xp idempotency, webhook HMAC)
├── packages/
│   ├── db/ (Prisma schema.prisma + migrations/ + seed.ts: 10 roles, journey 15 levels, L1 6 activities, rubrics, badges)
│   ├── ui/ (shared shadcn components if shared)
│   ├── config/ (eslint, tsconfig bases)
│   └── types/ (shared TS: Level, Activity, ProgressState, XpSource, Role, Tenant)
├── infra/
│   ├── terraform/ (VPC, EKS, RDS, ElastiCache, S3, Cloudflare, Secrets Manager)
│   └── k8s/ (deployments, HPA, pgBouncer)
├── docs/
│   ├── ai-accelerator-hub-architecture.md (751-line canonical)
│   ├── AI_ACCELERATOR_HUB_JOURNEY_GAMIFICATION_MODEL.md (1236-line)
│   └── AI_ACCELERATOR_HUB_MASTER_IMPLEMENTATION_PLAN.md (this file)
└── scripts/ (seed, verify-chain, backup-restore)
```

**Key file decisions:** `packages/db` owns truth (Prisma + RLS + migrations) so web+api share one schema; `apps/api/src/common/tenant-context` is the mandatory import for every service; `gamification/xp-ledger` is `internal`-role only (no client route); sidebar grouping constants live in `apps/web/components/shell/sidebarGroups.ts` (single source for desktop+mobile+bottom-tab).

---

## Scaling + Compliance Notes (Ph1 must not block Ph9)

- **Scale numbers:** 100k MAU → 10k DAU → 2k concurrent (burst 10k cohort launch) → 10k req/min API, 500 concurrent AI streams, 2k-10k sockets. Storage 10 TB S3 (lifecycle IA). `progress` 1.5M rows, `xp_ledger` ~10M/yr, `ai_messages` ~50M/yr (partitioned). Ph1 runs 2 pods; Ph9 path is HPA 5-10 pods, 2 read replicas + pgBouncer, Redis cluster, CloudFront >80% hit, LiteLLM gateway + Azure Central India fallback.
- **Budgets:** p95 API <200ms (hit), AI first token <800ms, WS <100ms, presign <50ms, leaderboard <80ms; LCP <2.5s, INP <200ms (ISR + edge).
- **DPDP:** Primary `ap-south-1`, backup `ap-south-2`; consent artifact, purpose limitation, DSR export/delete 30d, cross-border only with consent. Razorpay handles PCI SAQ A. Tenant offboard: soft-delete 30d → hard `DELETE WHERE tenant_id`. Dedicated DB escape hatch per tenant (`isolation='dedicated_db'` Terraform module).
- **Pending credentials/legal/limitations:** Razorpay key/secret/webhook secret, GitHub OAuth client, LiteLLM keys → `PENDING_CREDENTIALS.md` (no commit). DPDP/legal review → `PENDING_LEGAL.md`. Phase 1 known limitations (5 AIs not yet live, only L1 content real, L2-15 placeholders, global leaderboard opt-in default off) → `KNOWN_LIMITATIONS.md`.

---

## Evidence Index (inspected)

- Workspace clean-slate: both `/Users/apple/ai-business` (120K docs-only, no package.json/env) and `/Users/apple/Documents/My_Business` (30 entries, `AI_Accelerator_Hub_Kit` 9.7M static asset kit, no Hub codebase) + outskill clone vs Angular 20 reference divergence verified.
- Architecture 751 lines: stack justification, 10 roles, 4-layer tenant isolation, 28-entity ERD, REST `/api/v1` + `/ws`, 5 AIs via LiteLLM, scaling 100k+ path, Razorpay/GitHub appendices.
- RTM: 92 REQs from MASTER §1-37 (source `session.jsonl seq494` 34241 chars, 37/37 coverage, P0=18 §34 items, phase mapping Ph1..9).
- Brand/WCAG: palette contrasts computed via rel_luminance (Navy 18.26 white, Gold 9.99, Blue 4.51, Purple 3.98), logo concept, Major Third scale, component tokens, 5-group sidebar IA, WCAG 2.2 AA lint rules.
- Journey/Gamification 1236 lines: 15 levels S1..S5 (L01_AWAKENING..L15_CAREER, 2970 XP base), 6-activity framework (MISSION_BRIEFING..EVALUATION_BOSS) with config JSONB + state machines, L1 fully instantiated with rubric, 8 tracks T1..T8 with prerequisites/capstones/rubrics, XP ledger (idempotency UNIQUE, advisory lock, hash chain, reversal-only), streak non-punitive (freeze/grace/recovery), unlock `canUnlock` 6-gate, DDL + anti-fraud table.

## Unresolved (carry to build — not blocking Ph1)

- No existing enterprise repo to reconcile (greenfield assumed <500 tenants; RLS choice not stakeholder-reviewed).
- Razorpay plan/settlement webhook payload shapes based on docs, not live dashboard; HMAC + idempotency specified but not live-tested.
- AI cost budgets / LiteLLM fallback chain not load-tested at 500 concurrent streams.
- Reference 1/2 external URLs + Reference 3 PDF (`Prompt Engineering AG-2.pdf`) not fetched — topics preserved per §2 but original-vs-added distinction unverified; resource URL/license/last-verified fields required per Research Policy.
- §26-28 legal review (DPDP/privacy/safety) pending qualified counsel — `PENDING_LEGAL.md`.
- Logo is concept-only (no Figma/asset file audited); tenant white-label token override (`tenants.settings.branding`) token layer TBD.
- Gold #E8B94F on white 1.83 fails all WCAG — gold forbidden on light surfaces; light-mode variant not designed (dark-first system).

---

*Next step: `pnpm init` at `ai-accelerator-hub/` per §6 file structure → `packages/db` migrations (Ph1 tables) → `apps/api` TenantContext+RLS → Auth+RBAC → shell+dashboards → journey seed L1 → submissions/XP/streak slice. First `playwright e2e` must green on enroll→L1 A1..A6→approve→unlock before Ph2 starts.*
