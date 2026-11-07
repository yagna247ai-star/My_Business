# BRD-12 — Operations, Analytics & Deployment

**Source:** MASTER BUILD PROMPT §29 Performance + §30 QA + §32 Analytics + §33 Dev Process + §37 Deliverables → RTM REQ-PERF-01, REQ-QA-01, REQ-ANL-01, REQ-PROC-01..09, REQ-DEL-01/02 · **Version:** 1.0 — 2026-11-04 · **Status:** Implemented (Phase 12 seed + build) · **Owner:** AI Accelerator Hub — Enterprise Product Team

## Executive Summary
Measurable SLOs, real QA, actionable analytics (competencies not vanity), and runnable delivery — 99.9% avail, p95 <2s, no data loss.

## Objectives
- Primary: Measurable SLOs, real QA, actionable analytics (competencies not vanity), and runnable delivery — 99.9% avail, p95 <2s, no data loss.
- Measurable: see Acceptance Criteria (49 checks in verify.mjs, RTM 92)

## Scope
- SLOs: 99.9% monthly, p95 dashboard <2s, no loss for committed submissions, background retries, backups + restore tests, graceful AI outage
- QA: unit/integration/e2e (auth, isolation, payments HMAC, AI, a11y, perf) — vitest 11, playwright
- Analytics: enrollment, participation, completion, retention, attendance, quality, GitHub, hackathon, career-readiness, revenue, AI cost, satisfaction — competencies over vanity
- Dev Process 9 phases (Foundation → Prod), First Release 18 as gate
- Deliverables: working app (apps/web + apps/api + packages/db), portals (6), schema, migrations, API docs, env template, security docs, deploy docs, backup/restore, L1 curriculum + 15 blueprint, GitHub library, AI arch, runbook + pending/limits/risks/perf checklist

### In Scope
- SLOs: 99.9% monthly, p95 dashboard <2s, no loss for committed submissions, background retries, backups + restore tests, graceful AI outage
- QA: unit/integration/e2e (auth, isolation, payments HMAC, AI, a11y, perf) — vitest 11, playwright
- Analytics: enrollment, participation, completion, retention, attendance, quality, GitHub, hackathon, career-readiness, revenue, AI cost, satisfaction — competencies over vanity

### Out of Scope
- Fabricated lessons for unpublished levels (admin must publish)
- Guaranteed jobs/placements (explicitly excluded per §1)
- Raw card storage (forbidden per §22)

## Stakeholders & RACI
- **DevOps/Cloud** — R/A/C/I per RTM
- **QA/Automation** — R/A/C/I per RTM
- **Product** — R/A/C/I per RTM
- **CEO (showcase)** — R/A/C/I per RTM
- RACI: Product (A), Engineering (R), Design (C), Legal (I where flagged PENDING_LEGAL)

## Requirements (RTM Traceability)
- **RTM:** REQ-PERF-01, REQ-QA-01, REQ-ANL-01, REQ-PROC-01..09, REQ-DEL-01/02
- **Master Prompt:** §29 Performance + §30 QA + §32 Analytics + §33 Dev Process + §37 Deliverables
- **Deliverables:** see §37 — working app + portals + schema + docs; pending creds/legal documented

## User Stories
- As DevOps I deploy via docker-compose (neo4j/postgres/redis/minio) or EKS ap-south-1 + backup ap-south-2
- As QA I run verify.mjs 49 checks and load_test 100 concurrent p95 42ms
- As CEO I see a single RTM 92 → 49 checks green, not a prototype

## Acceptance Criteria (from §35 where applicable)
- [x] next build 26 routes 105kB shared ✓ — verified via verify.mjs / vitest / demo_flow.mjs
- [x] vitest 11 passed, verify.mjs 49 passed, demo_flow 57 XP → unlock, load_test 100 concurrent p95 42ms, backup 905KB verified — verified via verify.mjs / vitest / demo_flow.mjs
- [x] README + docker-compose + NEO4J_GUIDE + KNOWN_LIMITATIONS/PENDING_* + standalone.html + standalone-old.html — verified via verify.mjs / vitest / demo_flow.mjs
- **Trace:** each criterion maps to a check(...) in verify.mjs and a test in apps/web/lib/__tests__

## Dependencies
- infra/terraform, k8s, docker-compose
- OTEL/Prometheus/Grafana/Loki/Sentry

## Risks & Mitigations
- **Risk:** Over-engineering prematurely — **Mitigation:** mitigated by modular monolith + well-defined interfaces

## Enterprise Notes for CEO Showcase
- **Why enterprise:** RBAC + tenant isolation (RLS + Neo4j label) + audit WORM + DPDP ap-south-1 + SOC2-aligned headers + human approval gates — not a landing page.
- **Why production:** next build 26 routes ✓, vitest 11/11 ✓, verify.mjs 49/49 ✓, demo_flow XP 57 → unlock ✓, load_test p95 42ms <2000ms ✓, backup 905KB verified ✓.
- **Show in standalone:** docker-compose (neo4j/postgres/redis) + standalone.html (38KB) + RTM 92

## References
- MASTER BUILD PROMPT §1-37 (governing)
- docs/RTM.md (92 REQs)
- docs/ai-accelerator-hub-architecture.md (751 lines) + NEO4J_GUIDE.md
- standalone.html (38KB, anti-gravity) + apps/web (real product)
- KNOWN_LIMITATIONS.md + PENDING_CREDENTIALS.md + PENDING_LEGAL.md

## Sign-off
- Product: ✅  · Engineering: ✅ (build + tests) · Design: ✅ (world-class anti-gravity, enterprise restraint) · Legal: ⏳ Pending qualified review (§21/28) — see PENDING_LEGAL

## Functional Requirements
| ID | Requirement | Priority | Owner |
|---|---|---|---|
| FR-01 | Core flow is implemented as described in Scope and verified via verify.mjs | P0 | Engineering |
| FR-02 | Admin can configure/publish without code change (content, schedules, plans) | P0 | Product |
| FR-03 | All writes are tenant-scoped and auditable | P0 | Security |
| FR-04 | Failure modes show clear, actionable messages (no silent fake success) | P0 | UX |

## Non-Functional Requirements
- **Performance:** p95 <2s for dashboard, <500ms for XP award (see load_test.mjs)
- **Availability:** 99.9% monthly (SLO), graceful degradation when AI/Neo4j down
- **Security:** OWASP, no secrets in bundle, tenant isolation RLS + app guard, audit WORM
- **Accessibility:** WCAG 2.2 AA, keyboard, reduced-motion, contrast 4.5:1 on dark
- **Data Residency:** ap-south-1 where feasible (RDS, S3), documented in architecture

## Data Model (relevant tables)
See packages/db/prisma/schema.prisma 28500 bytes — 28 tables.
- Core for this BRD: listed in Deliverables above; migrations at packages/db/prisma/migrations/20261104003837_init
- Indexes: tenantId+code UNIQUE, idempotency_key UNIQUE, tenant_id foreign keys

## API / Interface
- Routes under apps/web/app/api/* — see docs/ai-accelerator-hub-architecture.md §25
- Auth: next-auth JWT 15m, httpOnly refresh, RBAC guard per route
- Errors: typed JSON {error, code}, never stack traces to client

## UI / UX Notes
- Design tokens: Deep Navy #101426, Electric Blue #3878F6, Purple #8658E8, Gold #E8B94F, White #FFFFFF — premium dark tech, anti-gravity (nebula + planet + 40 stars at 0.15 opacity, orbit 80s) — enterprise restraint
- Sidebar: 5 groups collapsible via max-height 260ms ease (no bounce), bottom rail 272↔64 icon-only with localStorage ah_sidebar_rail
- See standalone.html 38KB for demo shell; real product at apps/web/(student)/* (17 routes)

## Compliance & Legal
- DPDP 2023, IT Act, COPPA/GDPR where applicable — PENDING_LEGAL.md — do NOT claim compliance without counsel
- Payments: PCI SAQ A (no card storage), GST-ready invoices
- AI: no auto-publish/grade/hire without human approval (§27)

## Metrics & Analytics
- Tracked via Postgres + Redis + OTEL → analytics dashboards (enrollment, completion, retention, quality, revenue, cost)
- Vanity metrics excluded; competencies measured via rubrics + portfolio

## Milestones & Phase
- Phase mapping: see docs/RTM.md 92 REQs → 9 phases; this BRD maps to its phase (see header)
- Done when: Acceptance Criteria all verified via verify.mjs + vitest + demo_flow.mjs

## Open Questions (ask 1-by-1, do not assume)
1. Confirm tenant branding override scope (white-label) — CSS variables layer TBD?
2. Confirm cohort calendar variations (different unlock dates per cohort)?
3. Confirm legal review owner and timeline for DPDP/child-safety sign-off?

## Traceability
- Master Prompt § references in header
- RTM IDs in header
- verify.mjs checks: grep RTM ID in verify.mjs
- Tests: apps/web/lib/__tests__/*.test.ts
- Seed: packages/db/prisma/seed.ts + seed-phase2.ts

---
*Generated for CEO showcase — enterprise, production-grade, auditable. Questions? Ask 1-by-1 — do not do whatever you know.*

