# P0 build plan: AI foundations (governance, gateway, cache-first pipeline)

| | |
|---|---|
| Version | 1.0 for review, 2026-11-27 |
| Spec | `docs/AGENT_ORCHESTRATION_SPEC.md` v0.2 (§3.1a decisions, §3.12 Hub AI Gateway, §3.13 query pipeline, §3.14 hosting) |
| Goal | Everything the agents will stand on, with **no learner-visible change**: one governed path to any model, a cache-first pipeline, self-hosted embeddings, the gateway machine, and no vendor SDK in app code. Paid keys stay **off**; learner text reaches no LLM (§3.13). |
| Not in P0 | The supervisor and specialist agents (P1), course search C6–C9 (P1), admin pages (P2), lab keys and BYOK (P3) |
| Way of working | `build-it` style: spec → failing tests → code → green; every task ships behind `AGENTS_V2` (off) and passes `npm run test:pure`, `tsc` and lint; deploy only on "deploy to prod" |

## 1. What I need from you (no secrets in chat)
1. **The DigitalOcean Droplet:** NYC3, Basic 4 vCPU / 8 GB, Ubuntu 24.04 LTS, weekly backups on. Add my deploy SSH public key, which I'll generate and show you, and send me the IP.
2. **DNS:** an `A` record, e.g. `ai-gw.nachikethaenterprises.business`, pointing to that IP.
3. **FreeLLMAPI free-tier provider keys:** add them yourself on the FreeLLMAPI Keys page once it's running, through an SSH tunnel. The **content** profile only uses them.
4. **Vercel environment variables** (I'll give you the exact names; you paste the values): `AI_GATEWAY_URL`, `AI_GATEWAY_TOKEN`, `AI_GATEWAY_SECRET`, `AI_GATEWAY_SIGNING_KEY`. The paid Gemini and OpenRouter keys stay **unset** until you decide to switch them on.
5. **An uptime monitor account** (Better Stack or UptimeRobot, free) for the `/healthz` check.

## 2. Tasks

| ID | Task | Files | Tests first | Done when | Est. |
|---|---|---|---|---|---|
| **T1** | **Policy package** `packages/ai-governance`: types (principal, tenant mode, purpose, data class, age band), deny-by-default rules for Managed mode (minor ⇒ no free pool, learner text ⇒ paid only, `AI_LEARNER_LLM=off` ⇒ no LLM for learner purposes, content ⇒ free pool allowed), versioned policy, decision object `{ allow, profile, reasons, policyVersion }` | `packages/ai-governance/src/*` | `policy.test.ts`: about 30 cases (every rule, defaults, version stamped) | All rules pass; it is used by the app and the gateway service | 1.5 d |
| **T2** | **Redaction and normaliser (C1)** moved from `coach.ts` into the package; adds zero-width and encoded-text stripping and language detection (EN/TE/HI) | `ai-governance/src/normalise.ts`, `coach.ts` imports it | `normalise.test.ts`: PII corpus, tricks, scripts | The existing coach tests still pass; PII never survives | 0.5 d |
| **T3** | **In-app model gateway**: `getModel(tier, principal)` over `PROVIDER_DEFS`, the policy decision from T1, a per-`provider:model` price table, usage via LangChain callbacks, a circuit breaker (3 failures in 60 s → open 2 min), `hub-gateway` as the first route and direct providers as fallback | `apps/web/lib/agents/gateway/*` | `gateway.test.ts` with two fake chat models: tier routing, fallback, breaker, cost, "learner LLM off" ⇒ no call | Swapping `AI_TIER_FAST` changes the model with no code change | 1.5 d |
| **T4** | **Remove vendor coupling**: `coach.ts` drops `@anthropic-ai/sdk` (errors mapped from LangChain errors, dead `anthropicProvider` removed); `stuckHelper.ts` uses `getModel('fast')` instead of Gemini; the i18n translators use `purpose=content`. ESLint `no-restricted-imports` bans vendor SDKs outside `lib/agents/gateway/` | `coach.ts`, `stuckHelper.ts`, `lib/i18n/*`, `.eslintrc` | Lint test, plus the existing stuck-helper and coach tests | `grep` finds no vendor SDK outside the gateway; behaviour unchanged | 1 d |
| **T5** | **Inference table and traces**: migration `0027_ai_requests` with tables `ai_requests` (principal, tenant, purpose, service, provider/model, policy version and decision, tokens, cost, ms, status, cache layer hit, redacted summary ≤ 1 kB) and `ai_usage_hourly`; an async writer | `packages/db/prisma/*`, `lib/agents/telemetry/*` | Migration-table test; writer unit test (batching, never throws into the request) | Every gateway call writes one row | 1 d |
| **T6** | **Deterministic resolver (C3)**: one interface over `diagnose()`, setup-guide steps, hint-ladder steps 1 and 3, and a new platform FAQ (about 40 entries drafted from the help docs) | `lib/agents/pipeline/deterministic.ts`, `faq.ts` | `deterministic.test.ts`: catalogue match, FAQ match in EN/TE/HI, no match ⇒ null | Answers with no model call | 1 d |
| **T7** | **Cacheability classifier (C2)**: shareable vs private (pasted code or logs, own run, profile, minor ⇒ private), plus intent | `pipeline/classify.ts` | 40 labelled cases | ≥ 95% on the labelled set; never shareable when personal context is present | 0.5 d |
| **T8** | **Exact cache (C4)**: key = hash(normalised query, agent, tenant, journey, level, day, locale, contentVersion, policyVersion); L1 LRU and L2 Valkey; TTL 7 d; only verified, shareable answers by adults are written (C12); re-validated on read; evicted by a down vote (C13 hook) | `pipeline/cache.ts`, `contentVersion` helper | `cache.test.ts` with an in-memory Valkey fake: key scoping, cross-tenant miss, version bump ⇒ miss, minor ⇒ no write | Cross-tenant and stale hits are impossible in tests | 1.5 d |
| **T9** | **Embeddings service**: bge-m3 (ONNX int8) served by a small internal HTTP service on the Droplet (`/embed`, batch 32), called only by `hub-gateway` | `services/embed/*` (Node with onnxruntime-node, or a pinned TEI image if its CPU build fits; chosen in a 1-hour spike) | Golden-vector test (cosine of known pairs), latency benchmark | p95 ≤ 150 ms for one query on the Droplet | 1.5 d |
| **T10** | **Semantic cache (C5)**: pgvector table `ai_semantic_cache` (vector, scope columns, answer, citations, versions, votes); similarity ≥ 0.95 within the same scope; re-validated on read | migration `0028_semantic_cache`, `pipeline/semanticCache.ts` | Scope tests, threshold tests with fixture vectors, invalidation by version | No cross-scope hit; stale entries never served | 1.5 d |
| **T11** | **`hub-gateway` service**: Node (Fastify), `/v1/chat/completions`-compatible plus `/healthz`; verifies the platform request signature (HMAC over body and principal, 60 s clock skew) plus token and shared secret; runs T1 policy, C1–C5 and C10 routing to FreeLLMAPI `auto:content` or `auto:learner` (learner profile disabled while keys are off); per-principal rate limits in Valkey; async T5 logging with a local spool | `services/hub-gateway/*` | Contract tests (signature, replay, policy deny, cache hit path, streaming passthrough, rate limit) with FreeLLMAPI mocked | All contract tests pass; adds ≤ 50 ms p95 on a cache miss | 2.5 d |
| **T12** | **Cache warmer (content job)**: nightly; for each published day and activity, generate the 10 likely questions plus grounded answers through `auto:content` (course text only), verify (answer-key overlap check, links), write as `pregenerated`; mentor review flag | `services/hub-gateway/jobs/warm.ts`, admin review list (read-only for P0) | Job test with a fake model: answer-key overlap rejected, only course text in the prompt | About 450 entries per 45-day course in staging | 1.5 d |
| **T13** | **Droplet deploy**: Docker Compose (Caddy for TLS with only `/v1/*` and `/healthz` exposed; `hub-gateway`; FreeLLMAPI pinned to v0.13.6 with catalogue auto-update **off** (R20); the dashboard bound to localhost; Valkey with AOF on; the embed service), ufw firewall, unattended security upgrades, nightly encrypted backups of the FreeLLMAPI SQLite and the Valkey snapshot | `deploy/hub-gateway/*` (compose, Caddyfile, `deploy.sh`, `backup.sh`) | `deploy.sh --check` (lint the compose file, external port scan shows only 443) | `https://ai-gw…/healthz` is green; the dashboard is reachable only through an SSH tunnel | 1.5 d |
| **T14** | **App wiring behind `AGENTS_V2`**: the coach and stuck helper call T3 → `hub-gateway`; with `AI_LEARNER_LLM=off` they answer from C3, C4 and C5, else the existing "ask your mentor"; credits charged only on an LLM answer (none in P0) | `coach.ts`, `stuckHelper.ts`, flag | Pure tests for each path; the existing tests stay green | With the flag off nothing changes; with it on in staging, cache and deterministic answers work | 1 d |
| **T15** | **Monitoring**: `/healthz` aggregate (gateway, FreeLLMAPI, Valkey, embed warm), uptime monitor set up, Super Admin email plus in-app alert after 2 failures, a recovered notice | `services/hub-gateway/health.ts`, `lib/agents/telemetry/alerts.ts` | Health unit tests | An alert fires in a staged outage drill | 0.5 d |
| **T16** | **P0 security pass**: red-team items R4, R9, R14, R17, R19, R20, R21 as automated tests; a dependency audit of the new packages; an external port scan | `test/agents/redteam-p0/*` | Those are the tests | All pass; findings recorded in the spec | 1 d |

**Total: about 20 developer days.** Order and dependencies: T1 → T2 → T3 → T4 and T5 (parallel) → T6, T7 → T8 → T9 → T10 → T11 → T12 → T13 → T14 → T15 → T16. T13 can start as soon as the Droplet exists, in parallel with T6–T10.

## 3. P0 acceptance (all must be true)
1. No vendor SDK is imported outside `lib/agents/gateway/` (lint), and switching a tier's model is configuration only.
2. With `AI_LEARNER_LLM=off`, **no learner text reaches any LLM** (proved by test and by `ai_requests` showing no learner-purpose model rows in staging).
3. Every AI request has an `ai_requests` row with principal, tenant, purpose, policy version and cache layer.
4. The exact and semantic caches never return a cross-tenant, cross-scope or stale answer (tests), and minors' answers are never written to them.
5. `hub-gateway` is reachable only on 443 with signature, token and secret; the FreeLLMAPI dashboard is not public; catalogue auto-update is off.
6. When the Droplet is down, the app still works: deterministic answers plus "ask your mentor", no errors (outage drill).
7. All existing tests pass; no learner-visible change with `AGENTS_V2` off.

## 4. Rollout
1. Merge T1–T10 and T14 with the flag off and deploy (no visible change).
2. Create the Droplet; T13 deploy; T15 monitoring.
3. Staging: `AGENTS_V2=on`, run the cache warmer for one course, then smoke and red-team tests.
4. Production: turn on `AGENTS_V2` for **AIHUB only**; watch hit rates and errors for 3 days; then other institutions.
5. Paid keys: when you decide, set them in Vercel and on the gateway, and flip `AI_LEARNER_LLM=on` per tenant. That starts P1 behaviour; it is not part of P0.

## 5. Risks to watch in P0
- **CPU speed of bge-m3 and the reranker on a shared-CPU Droplet** (T9 benchmark). Fallback: a CPU-Optimized Droplet (more cost), or a smaller embedding model (multilingual-e5-small) for the cache only.
- **FreeLLMAPI free tiers changing** (content jobs only): the warmer must tolerate failures and resume.
- **Neon pgvector** limits on the current plan (index size): check in T10. Fallback: Valkey vector search on the Droplet.
- **Price drift:** confirm the Droplet price on DigitalOcean's page before ordering.
