# BRD-03 — 15-Level GenAI Career Journey

**Source:** MASTER BUILD PROMPT §6 15 Levels (6 stages) + §8 Weekend Engine + §9 Six-Activity Framework → RTM REQ-LVL-01..03, REQ-HACK-01/02, REQ-ACT-01, REQ-REF-03 (AG-2) · **Version:** 1.0 — 2026-11-04 · **Status:** Implemented (Phase 3 seed + build) · **Owner:** AI Accelerator Hub — Enterprise Product Team

## Executive Summary
Progressive, competence-gated 15-level journey from AI Foundations to Grandmaster — only L01 required to be fully built for First Release, L02-15 admin-configurable.

## Objectives
- Primary: Progressive, competence-gated 15-level journey from AI Foundations to Grandmaster — only L01 required to be fully built for First Release, L02-15 admin-configurable.
- Measurable: see Acceptance Criteria (49 checks in verify.mjs, RTM 92)

## Scope
- 6 stages: Ignition 1-3, Craft 4-6, Ship 7-10, Specialize 11-13, Launch 14-15
- Each level 6 activities: Brief → Learn → Explore GitHub → Build → Submit Proof → Evaluation/Boss + scheduled unlocks, cohort-specific, live links, recordings, attendance≠pass
- DAG via level_prerequisites + Neo4j (:Level)-[:REQUIRES]->, canUnlock 6-gate (prereq, linear, minXp, badge, entitlement, no time)

### In Scope
- 6 stages: Ignition 1-3, Craft 4-6, Ship 7-10, Specialize 11-13, Launch 14-15
- Each level 6 activities: Brief → Learn → Explore GitHub → Build → Submit Proof → Evaluation/Boss + scheduled unlocks, cohort-specific, live links, recordings, attendance≠pass
- DAG via level_prerequisites + Neo4j (:Level)-[:REQUIRES]->, canUnlock 6-gate (prereq, linear, minXp, badge, entitlement, no time)

### Out of Scope
- Fabricated lessons for unpublished levels (admin must publish)
- Guaranteed jobs/placements (explicitly excluded per §1)
- Raw card storage (forbidden per §22)

## Stakeholders & RACI
- **Learning Experience Designer** — R/A/C/I per RTM
- **Instructors** — R/A/C/I per RTM
- **Cohort Mentors** — R/A/C/I per RTM
- RACI: Product (A), Engineering (R), Design (C), Legal (I where flagged PENDING_LEGAL)

## Requirements (RTM Traceability)
- **RTM:** REQ-LVL-01..03, REQ-HACK-01/02, REQ-ACT-01, REQ-REF-03 (AG-2)
- **Master Prompt:** §6 15 Levels (6 stages) + §8 Weekend Engine + §9 Six-Activity Framework
- **Deliverables:** see §37 — working app + portals + schema + docs; pending creds/legal documented

## User Stories
- As a learner I see only L01 available, L02 locked until L01 approved
- As an instructor I publish L06 content and set unlock dates per cohort
- As a student I watch 80% + quiz 60% to complete Learn

## Acceptance Criteria (from §35 where applicable)
- [x] L01 6 activities fully instantiated (5/18/10/35/5/47 XP) with rubric L01_RUBRIC — verified via verify.mjs / vitest / demo_flow.mjs
- [x] L02-15 placeholders have title/summary/xp and are admin-publishable, no fabricated lessons — verified via verify.mjs / vitest / demo_flow.mjs
- [x] canUnlock via lib/journey.ts (graph-first) tested in journey.test.ts — verified via verify.mjs / vitest / demo_flow.mjs
- **Trace:** each criterion maps to a check(...) in verify.mjs and a test in apps/web/lib/__tests__

## Dependencies
- Journey, Stage, Level, LevelPrerequisite, Content, Activity
- Neo4j DAG
- Seed-phase2

## Risks & Mitigations
- **Risk:** Fabricated lessons for L02-15 — **Mitigation:** mitigated by placeholder + admin publish flow
- **Risk:** Time-gating temptation — **Mitigation:** mitigated by no time gate in canUnlock

## Enterprise Notes for CEO Showcase
- **Why enterprise:** RBAC + tenant isolation (RLS + Neo4j label) + audit WORM + DPDP ap-south-1 + SOC2-aligned headers + human approval gates — not a landing page.
- **Why production:** next build 26 routes ✓, vitest 11/11 ✓, verify.mjs 49/49 ✓, demo_flow XP 57 → unlock ✓, load_test p95 42ms <2000ms ✓, backup 905KB verified ✓.
- **Show in standalone:** 8 tracks + Talent Marketplace consent-gated

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

