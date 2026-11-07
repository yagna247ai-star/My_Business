# Known Limitations — Phase 1 Foundation

**Version:** 1.0 — 2026-11-04
**Scope:** Phase 1 ships the First Release 18 backbone (landing, auth, tenant, dashboard, L1 6 activities, XP ledger, streak, submissions). The following are intentionally deferred or limited per Master Plan §33.

## What IS live (Phase 1)

- Marketing landing (dark, responsive, WCAG double-ring)
- Auth: credentials + GitHub OAuth (when keys present) + JWT 15m + httpOnly refresh + 10 roles + membership UNIQUE(tenant,user)
- Multi-tenant: shared-schema + `tenant_id` everywhere + app-layer isolation (integration-tested cross-tenant 404s) + reviewed RLS in `packages/db/pg/rls.sql` — NOT yet applied, no live Postgres here; apply + verify per `packages/db/pg/README.md` before production
- Student dashboard: 12 sections DB-backed (welcome, current_level, XP, rank, streak, weekly_progress, next_mission, upcoming_session, submissions, achievements, team_activity, career_readiness)
- 15-level DAG (L01..L15) with `level_prerequisites` + `canUnlock` 6-gate, but **only L01 published** — L02-15 are admin placeholders (title/summary/xp only, no fabricated lessons)
- L01 fully instantiated: 6 activities with config/checks/XP slice 5+18+10+35+5+47, rubric L01_RUBRIC (5 dims), boss harness stub
- Submissions: real proof (repo URL + reflection) + Idempotency-Key + server-side XP (+5) + hash-chain ledger + streak (IST, non-punitive)
- XP ledger: append-only, UNIQUE idempotency_key, advisory-lock concept, prev_hash/row_hash, no client POST for XP
- Streaks: current/longest, freeze_tokens, grace_until, streak_events, recovery quests (non-punitive)
- Badges (5 seed): oop-master, first-proof, streak-7/30, level-1-complete
- Plans (3): free, cohort-pro, cohort-annual (Razorpay plan IDs pending — mock mode)
- Enrollments, progress (locked→approved state machine), activity_progress, content_progress, boss_challenge_progress
- Entitlements, files (presign stub), notifications stub, audit_logs, idempotency_keys, unlock_events
- i18n scaffolding: next-intl structure (EN default, HI/TE/TA/KN/ML messages extensible) — language switch without progress loss (architecture ready, translations P1)
- Security headers, rate-limit guard stub, audit logging

## Deferred (Phases 2-9)

| Phase | Deferred | Note |
|-------|----------|------|
| Ph2 | L02-15 full content (videos, quizzes, assignments, GitHub repos) | Admin CRUD exists, but content is placeholder until curriculum team publishes |
| Ph3 | Full gamification: quests, seasonal challenges, referral engine, mystery rewards, Hall of Fame | Ledger + streak + badges + leaderboard ZSET stub live; full engine in Ph3 |
| Ph4 | 5 AI assistants live LLM calls | 5 assistants seeded with system prompts; Vercel AI SDK + LiteLLM gateway wired, but falls back to deterministic mocks when keys absent (clearly labeled, never fake AI) |
| Ph5 | GitHub Lab curated library + community feed/moderation | OAuth link + repo verification live; curated library (Voice AI, STT, TTS, OSS LLMs...) requires license/last-verified research per Policy |
| Ph6 | Team hackathons (3-5, roles, contribution tracking, fair scoring) + 3-layer 10-dim eval | Basic teams/TeamMembership tables live; full hackathon engine + peer review in Ph6 |
| Ph7 | 8 career tracks + Talent Marketplace (consent-gated, no opaque ranking) | Tracks + TrackLevel + TrackEnrollment tables live; full pathways + resume + mock interviews in Ph7 |
| Ph8 | Instagram Growth + AI Marketing Studio + Razorpay live webhooks | Razorpay Orders/Subscriptions/HMAC + razorpay_events idempotency spec'd; live keys pending — mock mode with warning |
| Ph9 | DPDP/legal review, OWASP hardening, 99.9% load/perf SLO verification | Arch is DPDP-ready (ap-south-1, consent, DSR, purpose limitation), but requires qualified counsel + pen test + load test |

## Design Limitations

- **Gold #E8B94F on white 1.83** fails WCAG — forbidden on light surfaces. App is dark-first (#101426). Light-mode variant not designed.
- **SQLite dev vs Postgres prod:** Local uses SQLite file (zero infra). RLS policies, pgvector HNSW, advisory locks, partitions, and ltree/CTE DAG are Postgres-only — simulated in app layer for dev, real in prod via migrations.
- **Redis fallback:** Leaderboards, pubsub, BullMQ are in-memory in dev when REDIS_URL absent. Prod requires Redis 7 (ZSET, Streams). No data loss for committed submissions (tested via pg_dump restore drill in Ph1 exit gate — manual in dev).
- **Logo:** Concept-only (chevron + star) — no Figma asset file audited yet. Tenant white-label token override (`tenants.settings.branding` CSS variables) layer TBD at design-token granularity.

## How to verify Phase 1 is production-ready for its scope

- `npm run db:seed` → 10 roles, demo tenant, journey 15, L01 6 activities, rubrics, badges, 5 AIs, 3 plans, student/mentor/admin users
- Enroll → L1 A1..A6 → Submit proof → Review → XP ledger → unlock L2 (playwright e2e `auth, learning, gamification, tenant_isolation, payment webhook HMAC`)
- Tenant isolation test: student in tenant A cannot read submissions where tenantId = B (app check + RLS in prod)
- Webhook HMAC: `POST /api/webhooks/razorpay` verifies signature, dedups via `razorpay_events`, updates entitlements
- Backup: `pg_dump → S3` + restore test (SQLite dev simulates via file copy; Postgres prod via infra/terraform)

See `PENDING_CREDENTIALS.md` and `PENDING_LEGAL.md`.
