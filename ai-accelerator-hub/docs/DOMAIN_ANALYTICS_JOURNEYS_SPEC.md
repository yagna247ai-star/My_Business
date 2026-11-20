# Domain-Based Data Analytics Journeys — Specification

| | |
|---|---|
| Version | 1.1, 2026-11-20 (45 days, 9 modules, enterprise production grade, ML/AI module) |
| Trigger | Vishal: learners choose an industry domain (about 17) at registration; each domain gets its own day-wise journey (now 45 days) around one domain problem: problem → data collection (structured, semi-structured, unstructured) → ingestion → cleansing → transformation → Databricks + Unity Catalog → medallion (bronze, silver, gold) → Power BI from gold. Step-by-step activities with prompts, screenshot and Excel validation, Playwright evidence for every domain, TDD, deployable on Vercel. The generic journey stays. |
| Size | L |
| Builds on | `docs/data-analytics-journey/` (generic 45-day journey), `lib/domain/journeyAccess.ts` (registration journey choice), `lib/domain/journey.ts` (activity engine), `lib/domain/imageProof.ts` |
| Code | `apps/web/lib/domain/daDomains/{catalog,curriculum,datasetCheck,xlsx}.ts`, `packages/db/prisma/seed-domain-journeys.ts`, `lib/domain/journey.ts` (two new activity kinds), `app/api/v1/levels/[code]/dataset/route.ts`, `components/learn/{DatasetCheck,ScreenshotEvidence}.tsx`, `app/(auth)/register/page.tsx`, `apps/web/scripts/release-db.sh` |
| Tests | `test/da-domains.test.ts` (catalogue + curriculum), `test/dataset-check.test.ts` (CSV/XLSX validation), `test/domain-journeys.test.ts` (integration: enrol, dataset, screenshot), `e2e/domain-journeys.spec.ts` (Playwright evidence, all 17 domains) |

---

## 1. Problem

The Data Analytics journey is generic: every learner gets the same examples. Learners want to work on problems from the industry they are aiming for, and employers want to see an end-to-end, domain-specific solution on a modern stack (Databricks, Unity Catalog, medallion architecture, Power BI). There is no way to choose a domain at registration, and no step where uploaded data or screenshots are checked.

## 2. Solution

17 domain journeys, each a separate Journey (`da-<domain>`) built from one curriculum template and one domain specification. The generic journey is unchanged. Every domain is taught at **corporate deployment level**: each carries an enterprise profile (production scale, business SLA, the Indian regulations that apply including the DPDP Act 2023, PII columns to mask, the SCD Type 2 dimension, and an ML prediction target).

**Domains (one flagship problem each):** Education (Student 360° evaluation) · BFSI · Insurance · Healthcare · Pharma & Life Sciences · Retail & E-commerce · FMCG / CPG · Manufacturing · Automotive · Energy & Utilities · Telecom · Logistics & Supply Chain · Agriculture · Government & Public Sector · Media & Entertainment · Travel & Hospitality · Real Estate & Construction.

**45 days = 9 modules × 5 days.** Each module has the six graded activities the app already uses (briefing, learn, hands-on evidence, AI-assisted build, proof, boss).

| Module | Days | Phase | Hands-on evidence (activity 3) |
|---|---|---|---|
| M1 | 1–5 | Problem framing: stakeholders, KPIs, **business case, SLA, data contracts, compliance (DPDP + sector regulator)** | Screenshot: problem canvas |
| M2 | 6–10 | Data collection: structured, semi-structured, unstructured; synthetic data with AI prompts | **Dataset check**: the structured dataset (Excel/CSV) is validated against the domain schema |
| M3 | 11–15 | Databricks + Unity Catalog: **dev/prod catalogs**, schemas, volumes, group grants, **column masks and row filters** for PII | Screenshot: Catalog Explorer |
| M4 | 16–20 | Ingestion to Bronze: `read_files`, `COPY INTO`, **Auto Loader with schema evolution** | Screenshot: bronze tables |
| M5 | 21–25 | Cleansing to Silver: profiling, dedup, standardisation, **Lakeflow Declarative Pipelines expectations** and quarantine | **Dataset check**: silver extract |
| M6 | 26–30 | Gold: star schema, **SCD Type 2 with MERGE INTO**, KPI marts, **liquid clustering / OPTIMIZE** | **Dataset check**: gold KPI mart |
| M7 | 31–35 | Power BI from Gold: model, DAX, **row-level security, deployment pipelines (Dev→Test→Prod), scheduled refresh, certified model** | Screenshot: dashboard |
| M8 | 36–40 | **Predictive analytics with ML and AI**: leakage-free features, MLflow tracking, model in Unity Catalog, batch scoring to gold, AI/BI Genie, bias/fairness, drift monitoring, model card | Screenshot: MLflow run and registered model |
| M9 | 41–45 | Capstone and go-live: insights, recommendations, **Databricks Jobs, Asset Bundles (CI/CD), monitoring, runbook, go-live readiness review** | Screenshot: lineage bronze → gold |

## 3. Behaviour

1. Registration lists the generic journeys plus a **"Data Analytics by industry"** choice with all 17 domains; the learner is enrolled in the chosen domain journey.
2. Each domain journey has 9 modules, 45 day pages and 54 activities, all written for that domain's problem, data, KPIs, SLA and regulations.
3. Every day page has: goal, why it matters for the domain, numbered steps, an AI prompt to copy (where AI helps), and what to submit.
4. **Dataset check:** the learner uploads `.csv` or `.xlsx` (max 5 MB, first sheet). The server reads it in memory (it is not stored), checks required columns, data types, minimum rows, unique key, nulls in required columns, allowed categories, and personal-data patterns (phone, email, Aadhaar-like numbers). It returns a line-by-line report. The activity completes only when every check passes.
5. **Screenshot evidence:** the learner uploads a real image (PNG/JPEG/WebP, at least 800×450) through the existing upload flow and ticks the checklist. A reviewer can open it.
6. XLSX files are read without third-party libraries (zip size limits, no macros, first sheet only).
7. All modules are fully authored and published; they unlock in order after the previous module is approved (proof + boss + review), as in every journey.
8. Content is seeded idempotently on production builds; re-seeding never deletes learner progress and never re-publishes a journey a Super Admin unpublished.

## 4. Data and API

- No schema migration. Journey `config` JSON: `{ family: "data-analytics-domain", domain, code, problem, icon }`.
- Level codes `<DOMAIN>_M<n>` (e.g. `EDU_M2_COLLECTION`), unique across journeys.
- 9 shared rubrics `DOMAIN_M<n>_RUBRIC`.
- `POST /api/v1/levels/[code]/dataset` (multipart `file`, activity idx) → `{ passed, report[] }`.
- `POST /api/v1/levels/[code]/activities/[idx]` accepts `{ fileId, checklist }` for screenshot activities.

## 5. UI

- Register: journey cards, plus a domain card with a searchable domain select showing each domain's problem.
- Level page: two new activity panels (Dataset check, Screenshot evidence); everything else reuses the existing workspace.

## 6. Acceptance criteria

- [x] Given registration, when a learner picks "Energy & Utilities", then they are enrolled in `da-energy-utilities` and Level 1 is available.
- [ ] Given any of the 17 domains, the journey has 9 modules, 45 day pages and 54 activities, with the domain's problem, SLA, regulations and PII columns in the day text.
- [ ] Given a valid domain CSV or XLSX, the dataset check passes and the activity completes; given a missing column, duplicate key, nulls, wrong type or personal data, it fails with a specific message.
- [ ] Given a non-image or a tiny image, the screenshot activity is refused.
- [ ] Playwright captures, for each of the 17 domains: registration with the domain selected, the journey map, a day page, and the dataset-check result.
- [ ] All unit, integration and e2e tests pass; the CI pipeline is green; the guarded deploy passes the smoke test.

## 7. Out of scope

Automatic checking of screenshot content (a reviewer checks it), running Databricks or Power BI inside the app, real learner data (all datasets are synthetic).
