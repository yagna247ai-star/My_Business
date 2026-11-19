# Traceability Matrix — AI-Powered Data Analytics Journey → AI Accelerator Hub

| | |
|---|---|
| Version | 1.0, 2026-11-18 |
| Spec | `../../specs/001-data-analytics-journey/spec.md` (toolkit) · `../../specs/001-data-analytics-journey/spec-mcp.md` (MCP record) |
| Source | `45_Day_Data_Analytics_Course_Syllabus.pdf` |
| Index | `00-INDEX.md` · Modules `modules/M1–M9` · Days `days/D01–D45` |
| Hub reference | `../RTM.md` (92 REQs for the AI journey) · `../level-specs/00-INDEX.md` · `../PERSONALISED_JOURNEY_BUSINESS_SPEC.md` |

**Status key:** ✅ written and checked · ◐ written, needs reviewer sign-off · ⏳ not started (needs approval) · ✗ out of scope for this feature

---

## A. Functional requirements

| Req | Requirement (short) | Module(s) | Day artifacts | Hub mapping | Status |
|---|---|---|---|---|---|
| FR-001 | 9 modules, 45 days, PDF ranges | M1–M9 | D01–D45 (ranges per `00-INDEX.md` §2) | RTM REQ-LVL-01 pattern (levels with unlock) | ✅ |
| FR-002 | Each day: MSME problem, task, answer key | All | All 45 (sections §1, §5, §6 present in every file) | RTM REQ-ACT-01 (6 activities per level) | ✅ |
| FR-003 | Fictional business, synthetic data | All | Named MSMEs in 43/45 days; D43–D44 use the Day 42 capstone MSMEs | Safety rules as in `PERSONALISED_JOURNEY_BUSINESS_SPEC.md` | ✅ |
| FR-004 | Shared rubric, pass 3.0 | All | Each applied task refers to `00-INDEX.md` §5 | RTM REQ-CAR-02 (rubric per track) | ◐ rubric not yet calibrated |
| FR-005 | Assessment weights match PDF | M2, M5, M9 | Checkpoints in M2 (SQL), M4 (Python), M5 (Power BI), M9 (capstone, viva) | RTM REQ-GAME-01 (points model) — weights are separate | ✅ |
| FR-006 | State ML/ETL are introductory | M7, M8, M9 | D45 §5 (scope statement), M7 safety rules | RTM REQ-VIS-02 (no guaranteed jobs) | ✅ |
| FR-007 | AI output verified and recorded | M6 | D28–D31, D44 claim checks | RTM AI-tool verification pattern | ✅ |
| FR-008 | No personal identifiers or protected features | M6, M7 | D28 (never-paste list), D35 fairness note, M6 safety rules | Privacy line in `docs/CHILD_SAFETY_POLICY.md` pattern | ◐ needs privacy review |
| FR-009 | Each module ends with an MSME checkpoint | M1–M9 | Checkpoint sections in each module spec | — | ✅ |
| FR-010 | Link each job role to days | M1–M9 | Job links in every day (§8); roles in `00-INDEX.md` §8 | RTM REQ-CAR-02 (career pathways) | ✅ |
| FR-011 | Three PDF capstones; one completed | M9 | D42–D45; `00-INDEX.md` §7 | RTM REQ-HACK-01 (weekend hackathon engine) | ✅ |
| FR-012 | Content only, no app code | — | None (no code written) | Seeding and UI are future work | ✗ (by design) |

## B. User stories

| Story | Priority | Module(s) | Days | Checkpoint | Status |
|---|---|---|---|---|---|
| US1 SQL on MSME problems | P1 | M2 | D05–D11 | M2 SQL checkpoint (8 questions, pass 60%) | ✅ |
| US2 Clean and explore in Python | P1 | M3, M4 | D12–D22 | M4 Python checkpoint (cleaning log + insight) | ✅ |
| US3 Power BI dashboard | P2 | M5 | D23–D27 | M5 dashboard assessment (10%) | ✅ |
| US4 Responsible AI use | P2 | M6 | D28–D31 | M6 claim check (4 of 5 correct) | ✅ |
| US5 Simple prediction, honest metrics | P3 | M7 | D32–D36 | M7 model report | ✅ |
| US6 Pipeline and reconciliation | P2 | M8 | D37–D41 | M8 validation pack | ✅ |
| US7 Capstone and interview-ready | P1 | M9 | D42–D45 | Readiness pack (portfolio, case study, interview log, skills sheet) | ✅ |

## C. Success criteria

| SC | Criterion | How verified | Status |
|---|---|---|---|
| SC-001 | 45 days + 9 modules exist; links resolve | Count of files; link check on `00-INDEX.md` and modules | ✅ verified 2026-11-18 |
| SC-002 | A reviewer can check each answer key in under 10 min | Manual review sample (not yet done) | ⏳ |
| SC-003 | Every module has a named-MSME checkpoint | Read each module spec | ✅ |
| SC-004 | ≥90% of days use a named MSME | Grep: 43/45 = 95.6% | ✅ |
| SC-005 | Portfolio contains SQL pack, cleaning log, dashboard, capstone | Defined in M9 readiness pack | ◐ depends on learner output |
| SC-006 | Each job role linked to ≥5 days | Grep of job-link mentions per role: Junior Data Analyst 14, Python Data Analyst 19, Data Quality Analyst 9, SQL Analyst 8, Power BI Developer 6, ETL Tester 6, **MIS / Reporting Analyst 4 (fails)** | ◐ 6 of 7 pass; MIS needs 1+ more day (suggest D31 or D36) |
| SC-007 | Capstone doable in 4 days | Dry run against capstone brief | ⏳ |
| SC-008 | No personal identifiers in journey | Grep for names, contact details, IDs | ◐ grep done for common patterns; a full pass is still needed |

## D. Hub integration (proposed, not built)

The AI journey is a **sequence of 15 levels** in the hub (`REQ-LVL-01`, `docs/level-specs/`). This journey is a **separate sequence** (a second journey, as requested), so the hub needs a place for it. The table shows each part of the hub that would need a matching entry.

| Hub element | Existing (AI journey) | Data analytics journey (proposed) | Status |
|---|---|---|---|
| Level sequence | 15 levels, L1–L15 (`seed-v3.ts` `LEVELS`) | 9 modules, DA01–DA09, as a separate `Journey` row | ✅ built: `packages/db/prisma/seed-data-analytics.ts` |
| Stages / tracks | 6 stages, 8 specialisations (`REQ-CAR-01`) | 5 stages; a separate journey, not a track | ✅ built (separate journey, as requested) |
| Activities per level | 6 activities + Boss (`REQ-ACT-01`) | Six slots per module. Module 1 authored; modules 2–9 `unauthored` | ✅ built (same as AI Levels 2–15) |
| Day units | Activity content inside each level | 45 day artifacts stored as `Content` rows (kind `md`), read from `docs/` | ✅ built |
| Rubric | Per level (`REQ-CAR-02`) | Shared rubric (`00-INDEX.md` §5) | ◐ |
| Future content rule | "No fabricated lessons" (`REQ-LVL-03`) | Content comes from the syllabus PDF only | ✅ compatible |
| Proof and review | Mentor review, evaluation recorded (`REQ-CAR-02`) | Module checkpoints and M9 readiness pack | ⏳ mapping decision needed |
| Weekend engine | Mon–Fri prep, Sat workshop, Sun hackathon (`REQ-HACK-01`) | 4h30 day pattern from the PDF (§3 of index) | ⏳ mapping decision needed |
| Data storage | Postgres/Prisma (`REQ-AUTH-02`, `REQ-STD-02`) | Would need `db` tables for units and submissions | ⏳ |

### Open mapping decisions
1. Is the Data Analytics journey a **new track** (sits inside the existing journey) or a **separate journey** with its own sidebar entry? The request said "separate journey", so the default in this matrix is separate.
2. Do days map to hub "levels" (one per day), or do modules map to levels (nine per journey) with days as activities? This matrix uses modules as levels and days as units.
3. Who signs off the rubric and the content (FR-004, SC-002)?

## E. Gaps

| Gap | Owner | Next step |
|---|---|---|
| MCP spec is a requirements record only | Decision | Keep both, or rewrite `spec-mcp.md` to the toolkit structure |
| No synthetic datasets | Approval | Separate step (`00-INDEX.md` §9) |
| No reviewer sign-off on answer keys | Program team | Sample review (SC-002) |
| Privacy review for AI prompts | Compliance | FR-008 review |
| Hub mapping decisions (§D) | Product | Decide before any seeding |
