# Level × Persona Specifications — Index

| | |
|---|---|
| Version | 1.0, 2026-11-04 |
| Parent spec | `docs/PERSONALISED_JOURNEY_BUSINESS_SPEC.md` (the rules engine, variant model and safety rules) |
| Curriculum source | `packages/db/prisma/seed-v3.ts`: `STAGES`, `LEVELS` (15 levels, titles, XP and topics), `TRACKS` (8 specialisations), `L1` (the six-activity framework), and `V` (the Level 1 persona variants) |
| Status | **Level 1 is built and seeded.** Levels 2–15 are **specifications to author from**. Their rubrics, scenarios and answer keys need sign-off from the program team before they are seeded. |

## How to read these files

There is one file per level. Each file has two parts:

1. **Shared and protected.** These are the same for everyone, so they are the competence bar:
   - the learning outcomes
   - the six activities and their XP share
   - the build fields and minimum words
   - the boss choice set
   - the rubric
   - the proof rules

   `resolveConfig` ignores any persona variant that tries to change them.
2. **Five persona specs.** Each persona gets its own version of:
   - why the level matters to them
   - the mission briefing
   - the check question (with its answer)
   - the learn demo
   - the explore task
   - the build project and its hints
   - six boss scenarios (with their answers)
   - the proof they submit
   - tools and agent notes
   - safety notes

   These map onto the variant keys that are allowed to change: `problem`, `objective`, `check`, `demo`, `fieldHints` and `scenarios`.

## Personas

| Code | Label | Who | Default mode | Default track (see `TRACK_BY`) |
|---|---|---|---|---|
| `kid_hobbyist` | **Young Coder** | School student, often under 18, often learning Python as a hobby | low-code | AI Application Developer |
| `student` | **Student & Career Starter** | College student | low-code (no-code if they have never coded) | App Developer, or Product Manager if they don't code |
| `software_pro` | **Engineering Professional** | Software engineer, architect or other engineer | pro-code | Agent Developer, or Solutions Architect for architects |
| `ai_builder` | **AI Builder (Enthusiast)** | Wants to build with AI; may not code | no-code to low-code | App Developer, or Automation Engineer if the goal is automation |
| `business_owner` | **Business Owner** | Runs a shop, service, agency or startup | no-code | Automation Engineer, or Product Manager if starting an AI business |

The mode actually comes from the learner's coding comfort, not their persona. The defaults above are typical.

## Levels

| # | Stage | Level | XP | File | Emphasised for |
|---|---|---|---|---|---|
| 1 | AI Foundations | AI Explorer | 120 | [L01](L01-ai-explorer.md) | Young Coder |
| 2 | AI Foundations | AI Problem Hunter | 140 | [L02](L02-problem-hunter.md) | Student, Business Owner |
| 3 | AI Foundations | Prompt Wizard | 150 | [L03](L03-prompt-wizard.md) | Young Coder, AI Builder |
| 4 | AI Productivity & Creation | AI Power User | 160 | [L04](L04-power-user.md) | Business Owner |
| 5 | AI Productivity & Creation | AI Creator | 170 | [L05](L05-creator.md) | — |
| 6 | AI Productivity & Creation | AI Workflow Builder | 180 | [L06](L06-workflow-builder.md) | AI Builder, Business Owner |
| 7 | AI Application Development | AI App Builder | 200 | [L07](L07-app-builder.md) | Student, AI Builder |
| 8 | AI Application Development | AI Developer | 210 | [L08](L08-developer.md) | Young Coder |
| 9 | AI Agents & Advanced Systems | RAG Engineer | 220 | [L09](L09-rag-engineer.md) | Engineering Professional |
| 10 | AI Agents & Advanced Systems | Agent Architect | 250 | [L10](L10-agent-architect.md) | Engineering Professional |
| 11 | AI Agents & Advanced Systems | Automation & MCP Specialist | 280 | [L11](L11-mcp-specialist.md) | — |
| 12 | Open Source & Engineering | Open Source Hacker | 300 | [L12](L12-oss-hacker.md) | Student |
| 13 | Open Source & Engineering | AI Engineer | 320 | [L13](L13-ai-engineer.md) | Engineering Professional |
| 14 | Career & Industry Readiness | AI Career Specialist | 340 | [L14](L14-career-specialist.md) | (track-based) |
| 15 | Career & Industry Readiness | AI Grandmaster | 350 | [L15](L15-grandmaster.md) | — |

"Emphasised for" comes from `EMPHASIS` in `personalise.ts`. Emphasis highlights a level; it never skips one.

## Rules that apply to every level and persona

1. **Same bar for everyone.**
   - The rubric, pass threshold (3.0 of 5, as in Level 1), attempt limits, minimum words and boss choice set are identical for all personas.
   - Each persona's boss scenarios keep the **same count (6)** and the **same choice order**. `resolveConfig` enforces this.
2. **The six-activity framework** (seed `L1`):
   1. Mission Briefing
   2. Learn
   3. Explore GitHub
   4. Build
   5. Submit Proof
   6. Evaluation and Boss

   The XP split follows Level 1's proportions: 4% / 15% / 8% / 29% / 4% / 40%. The content team rounds the numbers per level.
3. **Pace.** Gentle pace is one level every 2 weeks. Standard and fast pace are one level a week. Fast pace adds a stretch challenge to the Sunday hackathon.
4. **Safety is set by age, never by persona.** The binding rules are in `docs/CHILD_SAFETY_POLICY.md` (enforced in `lib/domain/childSafety.ts`). For anyone under 18:
   - private by default
   - no purchases
   - paid agents and paid SaaS only after a guardian has given consent
   - public publishing (deploys, public repos, social posts) only after a guardian has given consent, with no personal data of their own or others in the work

   Under-13s cannot register.
5. **Third-party tools.** This spec names tools only where the master curriculum names them. Their age limits, prices and free tiers are **not verified here**. Program staff check each tool's current terms every cohort before recommending it, and legal review is tracked in `PENDING_LEGAL.md`.
6. **No invented repositories.** Explore-GitHub tasks use repositories from the platform's verified library (`library` table, checked through the GitHub API). Where these specs say "a verified repo for X", the instructor picks it from that library.
7. **Human verification.** Every Build and Proof is reviewed by a person. AI review only advises.
