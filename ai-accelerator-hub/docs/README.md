# Development artifacts

The index of every document a developer or operator needs for AI Accelerator Hub. Start with the first section. Paths are relative to the `ai-accelerator-hub/` folder.

Last updated 2026-11-19.

## 1. Start here (engineering)

| Document | Use it to |
|---|---|
| [PRODUCTION_GUIDE.md](./PRODUCTION_GUIDE.md) | Operate production: URLs, access, roles, admin screens, what's live, incident first steps |
| [LOCAL_SETUP.md](./LOCAL_SETUP.md) | Run the app on your machine: Postgres, `.env`, migrations, seed, tests, troubleshooting |
| [DATA_MODEL.md](./DATA_MODEL.md) | Understand the 70 database models, roles, conventions, and how to change the schema |
| [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) | See every env var the app reads, which are required, and which are unused |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Release to Vercel: build steps, checklist, health check, rollback |
| [PRODUCTION_DATABASE.md](./PRODUCTION_DATABASE.md) | Connect to and safely work with the production Neon database |
| [ai-accelerator-hub-architecture.md](./ai-accelerator-hub-architecture.md) | The target technical architecture (note: describes more than is built) |

## 2. Production readiness

| Document | Covers |
|---|---|
| [enterprise-gaps/README.md](./enterprise-gaps/README.md) | Status of every production component, with decisions needed |
| [01-payments](./enterprise-gaps/01-payments.md) · [02-ai-coach](./enterprise-gaps/02-ai-coach.md) · [03-redis](./enterprise-gaps/03-redis-rate-limit-leaderboard.md) · [04-tenancy-rls](./enterprise-gaps/04-tenancy-rls.md) · [05-migrations](./enterprise-gaps/05-database-migrations.md) · [06-admin-accounts](./enterprise-gaps/06-seed-and-admin-accounts.md) · [07-uploads](./enterprise-gaps/07-file-uploads-and-storage.md) · [08-neo4j](./enterprise-gaps/08-graph-neo4j.md) · [09-github-oauth](./enterprise-gaps/09-github-oauth.md) · [10-observability](./enterprise-gaps/10-observability.md) · [11-vercel](./enterprise-gaps/11-vercel-deployment.md) | One gap each: current state, risk, steps to close |
| [../KNOWN_LIMITATIONS.md](../KNOWN_LIMITATIONS.md) | What Phase 1 deliberately doesn't do |
| [../PENDING_CREDENTIALS.md](../PENDING_CREDENTIALS.md) | Third-party keys still to be obtained |
| [../PENDING_LEGAL.md](../PENDING_LEGAL.md) | Items waiting on legal review |
| [BUG_AUDIT_2026-11-07.md](./BUG_AUDIT_2026-11-07.md) | Platform bug audit and fixes |
| [../packages/db/pg/README.md](../packages/db/pg/README.md) | How to apply and verify Postgres row-level security |
| [../NEO4J_GUIDE.md](../NEO4J_GUIDE.md) | Optional graph database |

## 3. Requirements and product

| Document | Covers |
|---|---|
| [BRDs/](./BRDs/) | 12 business requirement documents (vision, auth, journey, gamification, AI, GitHub, community, hackathons, careers, payments, security, operations) |
| [RTM.md](./RTM.md) | Requirements traceability matrix (92 requirements → code and tests) |
| [AI_ACCELERATOR_HUB_MASTER_IMPLEMENTATION_PLAN.md](./AI_ACCELERATOR_HUB_MASTER_IMPLEMENTATION_PLAN.md) | Master build plan |
| [AI_ACCELERATOR_HUB_JOURNEY_GAMIFICATION_MODEL.md](./AI_ACCELERATOR_HUB_JOURNEY_GAMIFICATION_MODEL.md) | 15-level journey, specialisations, 6-activity framework |
| [PERSONALISED_JOURNEY_BUSINESS_SPEC.md](./PERSONALISED_JOURNEY_BUSINESS_SPEC.md) | Personalised journey and Agent Lab |
| [CHILD_SAFETY_POLICY.md](./CHILD_SAFETY_POLICY.md) | Rules for learners under 18 |
| [V3_DELIVERY_STATUS.md](./V3_DELIVERY_STATUS.md) | Delivery status as of 2026-11-04 |

## 4. Feature specifications

| Document | Covers |
|---|---|
| [AGENT_LAB_SETUP_GUIDE_SPEC.md](./AGENT_LAB_SETUP_GUIDE_SPEC.md) | Agent Lab step-by-step setup guide |
| [AGENT_LAB_PROMPT_STUDIO_SPEC.md](./AGENT_LAB_PROMPT_STUDIO_SPEC.md) | Prompt Studio |
| [AGENT_LAB_PROOF_SCORING_SPEC.md](./AGENT_LAB_PROOF_SCORING_SPEC.md) | Screenshot proof, validation and scoring |
| [AGENT_LAB_GET_UNSTUCK_SPEC.md](./AGENT_LAB_GET_UNSTUCK_SPEC.md) | Error gallery, fix finder, AI coach and mentor help |
| [../specs/001-data-analytics-journey/](../specs/001-data-analytics-journey/) | Spec-kit spec and checklists for the data-analytics journey |
| [data-analytics-journey/00-INDEX.md](./data-analytics-journey/00-INDEX.md) | Data-analytics journey master spec, days, modules, gamification, practice labs |
| [level-specs/00-INDEX.md](./level-specs/00-INDEX.md) | Level × persona specifications |
| [MODULE_PROMPTS/00-INDEX.md](./MODULE_PROMPTS/00-INDEX.md) | Build prompts per module (M01–M12) |

## 5. UX and learner experience

| Document | Covers |
|---|---|
| [LEARNER_JOURNEY_ZERO_TO_RUNNING.md](./LEARNER_JOURNEY_ZERO_TO_RUNNING.md) | Walkthrough of a new learner's first run |
| [UI_GAP_REPORT_standalone_vs_reference.md](./UI_GAP_REPORT_standalone_vs_reference.md) | UI gaps against the reference designs |
| [UI_GAP_APPLIED.md](./UI_GAP_APPLIED.md) | Which UI gaps were fixed |

## Keeping these up to date

- Schema change → update DATA_MODEL.md in the same commit.
- New env var → ENVIRONMENT_VARIABLES.md (and `turbo.json` `passThroughEnv` if needed at build time).
- Deploy process or infrastructure change → DEPLOYMENT.md and the matching `enterprise-gaps` file.
- New setup step → LOCAL_SETUP.md.
- Put a "Last updated" or "Last reviewed" date at the top of operational docs.

## Not yet written

- **Incident runbook** — what to do when the site or database is down, who to call. Blocked on choosing an alerting tool (enterprise-gaps 10).
- **API reference** for `apps/web/app/api/v1/*`.
- **Backup and restore drill** results for Neon.
- **Security / access review** — who holds Vercel, Neon and GitHub access.
