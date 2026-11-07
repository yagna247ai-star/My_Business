# AI Accelerator Hub — 15-Level GenAI Career Journey + 8 Specializations + 6-Activity Framework + Gamification Engine

**Version:** 1.0 — 2026-11-04  
**Scope:** Completes workflow contract: Level 1-15 names & stages, Level-1 six activities with data models, 8 career tracks with prerequisites & rubrics, XP ledger (fraud-proof, audit), streak (non-punitive recovery), unlock rules (competence-based), SQL-relevant entity sketches.  
**Depends on:** `ai-accelerator-hub-architecture.md` (stack, multi-tenant RLS, RBAC, ERD). This doc is the journey/gamification deep-dive it references in §9.

---

## Table of Contents

1. [Design Principles](#1-design-principles)
2. [15 Levels — Names, Stages, Narrative](#2-15-levels--names-stages-narrative)
3. [Stage Grouping (5 Stages)](#3-stage-grouping-5-stages)
4. [The 6-Activity Framework (Per Level)](#4-the-6-activity-framework-per-level)
5. [Level 1 — Fully Instantiated (OOP Foundations)](#5-level-1--fully-instantiated-oop-foundations)
6. [8 Career Tracks (Specializations)](#6-8-career-tracks-specializations)
7. [Gamification Engine](#7-gamification-engine)
8. [Unlock Rules — Competence-Based Gating](#8-unlock-rules--competence-based-gating)
9. [SQL-Relevant Entity Sketches (DDL)](#9-sql-relevant-entity-sketches-ddl)
10. [State Machines & Event Flows](#10-state-machines--event-flows)
11. [Anti-Fraud, Audit & Observability](#11-anti-fraud-audit--observability)
12. [Appendix — Example Payloads](#12-appendix--example-payloads)

---

## 1. Design Principles

| # | Principle | How it shapes this model |
|---|-----------|--------------------------|
| 1 | **Competence over completion** | No level unlocks on time spent or video watched. Every gate checks a *proof artifact* + *rubric threshold* scored by reviewer/AI. |
| 2 | **Non-punitive motivation** | Streaks encourage but never shame; freezes, grace windows, and recovery quests replace hard resets. Leaderboards default to cohort-scope, opt-in global. |
| 3 | **Ship, don't watch** | Each level ends in a Build + Boss Challenge that produces a GitHub repo / deployed URL. Portfolio is the transcript. |
| 4 | **India-first, enterprise-ready** | Razorpay entitlements gate paid specializations; DPDP consent respected in XP/progress export; multi-tenant isolation carried into every new table. |
| 5 | **Event-sourced, auditable** | XP, streak, unlock are derived from append-only ledgers, never mutable counters. Replay = audit. |
| 6 | **DAG, not ladder** | Levels 1-10 linear; 11-13 branch into 8 tracks; 14-15 converge. Prerequisites field supports non-linear enterprise cohorts. |

---

## 2. 15 Levels — Names, Stages, Narrative

Canonical journey `journey.slug = 'genai-career-accelerator'` — exactly 15 rows in `levels` (`idx 1..15`, CHECK constraint). Titles are learner-facing; `code` is API-stable.

| Idx | Code | Level Name (Learner-Facing) | Tagline | Core Capability Shipped | XP Reward (base) | Est. Effort |
|-----|------|------------------------------|---------|-------------------------|------------------|-------------|
| **1** | `L01_AWAKENING` | **Level 1 — AI Awakening: The Mould & the Cookie** | From zero to OOP thinking | Classes/objects, git init, first proof submission | 120 XP | 6-8 h |
| **2** | `L02_PROMPT` | **Level 2 — Prompt Craft: Talking to Giants** | Prompt engineering as a superpower | System/role prompting, few-shot, chain-of-thought, eval harness | 140 XP | 8 h |
| **3** | `L03_MEMORY` | **Level 3 — Memory & State: Agents That Remember** | Why stateless agents forget | SQLite session store, conversation memory, session_id passing | 150 XP | 8-10 h |
| **4** | `L04_MCP` | **Level 4 — Tools & Bridges: MCP Unlocked** | Give the model hands | MCP tools vs resources, Pydantic validation, Claude Desktop bridge | 160 XP | 10 h |
| **5** | `L05_RAG_FOUND` | **Level 5 — RAG Foundations: Chunk & Retrieve** | Ground answers in your data | Chunking, embeddings, cosine retrieval, citation | 170 XP | 10 h |
| **6** | `L06_RAG_ADV` | **Level 6 — Advanced RAG: Hybrid & Re-ranking** | When naive RAG fails | Hybrid (BM25+vector), re-ranking, HyDE, metadata filtering, pgvector HNSW | 180 XP | 10-12 h |
| **7** | `L07_AGENTS` | **Level 7 — Agent Architectures: ReAct & Teams** | Agents that plan | ReAct, planning, tool-use loop, multi-agent orchestration | 200 XP | 12 h |
| **8** | `L08_GUARDRAILS` | **Level 8 — Guardrails & Evals: Ship Safely** | Hallucinations are bugs | Guardrails, moderation, eval sets, LLM-as-judge, cost/latency budgets | 190 XP | 10 h |
| **9** | `L09_SHIP` | **Level 9 — Ship It: Your First GenAI App** | Full-stack, live URL | Next.js + FastAPI + pgvector + LiteLLM gateway + deploy + OTEL | 250 XP | 14-16 h |
| **10** | `L10_CAPSTONE1` | **Level 10 — Capstone I: Real-World Use Case** | Solve a real pain | End-to-end domain app (pick 1 of 6 briefs), stakeholder demo | 300 XP | 16-20 h |
| **11** | `L11_SPEC_DIVE` | **Level 11 — Specialization Deep-Dive** | Go deep, not wide | Track-specific deep theory + repo (branching — see §6) | 220 XP | 12 h |
| **12** | `L12_SPEC_BUILD` | **Level 12 — Specialization Build: Project II** | The portfolio piece | Track capstone II, production hardening, cost/perf report | 280 XP | 16 h |
| **13** | `L13_SCALE` | **Level 13 — Team & Scale: From Solo to Squad** | Build with others | Team project, code review, scaling, Razorpay/billing if SaaS | 260 XP | 14 h |
| **14** | `L14_PORTFOLIO` | **Level 14 — Portfolio & Open Source: Launch in Public** | Your work, discovered | Polished portfolio, OSS PR merged, blog post, demo video | 300 XP | 14 h |
| **15** | `L15_CAREER` | **Level 15 — Career Launch: Get Paid for AI** | Offer → income | Interviews / freelance proposals / SaaS launch; monetization plan | 350 XP | 14 h + ongoing |

**Total base XP:** 2,970 XP to complete L1-15 linearly (before bonuses, streaks, badges). Level thresholds use cumulative XP curve (see §7.3). Bonus XP from Boss Challenges (+20-50), streak bonuses (+5-15/day), badges (+30-100) push typical graduate to ~3,800-4,200 XP.

**Narrative arc (learner story):** *Curious → Crafter → Builder → Shipper → Specialist → Launcher*. Each level card shows: story hook ("Your app forgot the order ID — customers are angry"), mission, and boss.

---

## 3. Stage Grouping (5 Stages)

Levels cluster into 5 stages for UX pacing, mentor assignment, and analytics. `stages` table groups levels; `enrollments.current_stage` derived for dashboards.

| Stage | Code | Levels | Name | Metaphor | Exit Gate (competence proof) |
|-------|------|--------|------|----------|------------------------------|
| **S1** | `STAGE_IGNITION` | 1-3 | **Ignition** | Spark | L3 Boss: SQLite session store passes automated test harness (3/3 tests green) |
| **S2** | `STAGE_CRAFT` | 4-6 | **Craft** | Hands & Memory | L6 Boss: Hybrid RAG answers 8/10 golden Qs with citations |
| **S3** | `STAGE_SHIP` | 7-9 | **Ship** | Vessel | L9 Boss: Deployed URL scores ≥ 3.5/5 on Ship Rubric (live, safe, observable) |
| **S4** | `STAGE_SPECIALIZE` | 10-13 | **Specialize** | Forge | L13 Team Review: peer + mentor sign-off on track project |
| **S5** | `STAGE_LAUNCH` | 14-15 | **Launch** | Orbit | L15 Boss: One of — job offer / paid client / SaaS MRR / OSS merge — verified by mentor |

Stage transitions emit `stage_unlocked` XP bonus (+50) and badge check. FE renders stage as horizontal stepper with BOSSES as large challenge cards (inspired by `jne-gamified` quest UX).

---

## 4. The 6-Activity Framework (Per Level)

Every level contains **exactly 6 ordered activities**. They are the learner's loop for that level; progress through them is tracked in `activity_progress` (one row per enrollment × level × activity). Activities are authored in `activities` table, rendered as tabs/steps in the level view.

### 4.1 Activity Inventory

| # | Activity Code | Name | Icon Concept | Purpose | Primary Verb | Completion Signal | XP Slice | Review Needed? |
|---|---------------|------|--------------|---------|--------------|-------------------|----------|----------------|
| **A1** | `MISSION_BRIEFING` | **Mission Briefing** | Scroll/map | Narrative context, stakeholder pain, boss preview, success criteria | Understand | Marked viewed + 1-question check (ungraded, nudge if wrong) | 5 XP | No (auto) |
| **A2** | `LEARN` | **Learn** | Book/play | Curated micro-lessons (video 5-12m + MD + quiz) | Watch/Read | All content items viewed + quiz ≥ 60% (server-verified) | 15-20 XP | No (auto, but quiz attempts logged) |
| **A3** | `EXPLORE_GITHUB` | **Explore GitHub** | Fork | Study reference repos, run locally, answer code-reading prompts | Clone/Run | Repo cloned signal (GitHub OAuth check) or "I explored" + 2 code-Qs ≥ 1 correct | 10 XP | No (auto) |
| **A4** | `BUILD` | **Build** | Hammer | Guided build — scaffold + TODOs → working artifact in learner repo | Code | Push to linked GitHub repo detected (commit SHA recorded) or file upload | 30-50 XP (largest) | No (auto on push) but code quality rubric preview shown |
| **A5** | `SUBMIT_PROOF` | **Submit Proof** | Inbox | Package proof: repo URL + deployed URL + Loom/demo + reflection | Submit | `submissions` row created (type: repo/link/file), state=pending | 5 XP (on submit) | Yes — entry to review queue |
| **A6** | `EVALUATION_BOSS` | **Evaluation + Boss Challenge** | Trophy/skull | Human + AI review, rubric scoring, boss variant (harder twist) | Defend/Extend | `reviews.verdict = approved` + `boss_challenge_progress.state = passed` | 40-80 XP (on approval) + badge | Yes (reviewer + AI judge) |

**Why 6:** Mirrors proven JNE loop (brief → learn → explore → build → submit → review) while making the Boss an explicit, celebrated gate. JNE's `jne-gamified/index.html` validated the "submit proof → reviewer approves → XP added" loop; this model makes each phase a first-class entity so analytics can pinpoint drop-off (e.g., many stall at A3→A4).

**Ordering & gating within a level:**

```
A1 (briefing) ─► A2 (learn) ─► A3 (explore) ─► A4 (build) ─► A5 (submit) ─► A6 (evaluation+boss)
 │ unlocked        │ requires        │ requires      │ requires     │ requires      │ requires
 │ on level        │ A1 done         │ A2 quiz       │ A3 done      │ A4 push      │ A5 pending
 │ available       │                 │ passed        │              │ detected     │ → review   → approved → level complete
```

*Learner may revisit any prior activity after unlocking; forward progress is gated. Program Manager can mark A3 optional per level (config flag) — then A2→A4 shortcut allowed.*

### 4.2 Generic Data Model for the 6 Activities

#### `activities` (authoring, per level)

```sql
-- One row per activity per level. 6 per level * 15 = 90 rows for the canonical journey.
CREATE TABLE activities (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  journey_id    UUID NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
  level_id      UUID NOT NULL REFERENCES levels(id) ON DELETE CASCADE,
  idx           SMALLINT NOT NULL CHECK (idx BETWEEN 1 AND 6), -- 1=Briefing .. 6=Boss
  code          TEXT NOT NULL CHECK (code IN ('MISSION_BRIEFING','LEARN','EXPLORE_GITHUB','BUILD','SUBMIT_PROOF','EVALUATION_BOSS')),
  title         TEXT NOT NULL,             -- e.g., "Mission Briefing: The Cookie Factory"
  summary_md    TEXT NOT NULL,             -- learner-facing description
  config        JSONB NOT NULL DEFAULT '{}'::jsonb, -- activity-type-specific config (see below)
  xp_reward     INT NOT NULL DEFAULT 0,    -- auto-award on activity completion (A6 awarded via review instead)
  is_optional   BOOLEAN NOT NULL DEFAULT FALSE, -- only A3 is ever optional
  position      SMALLINT NOT NULL,         -- display order (== idx unless overridden)
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(level_id, idx),
  UNIQUE(level_id, code)
);
CREATE INDEX ON activities(tenant_id, journey_id);
CREATE INDEX ON activities(level_id, idx);
```

**`config` JSONB per activity code:**

* `MISSION_BRIEFING`:
```json
{
  "story_md": "The cookie factory's mould is broken...",
  "stakeholder": "Factory Ops Manager",
  "boss_preview": {"title": "The Mould Trial", "twist": "Add a class method that counts cookies"},
  "check_question": {"q": "What does instantiation mean?", "options": ["...", "..."], "answer_idx": 1, "hint": "Think cookie from mould"},
  "est_minutes": 8
}
```

* `LEARN`:
```json
{
  "content_ids": ["uuid-video-intro", "uuid-md-oop", "uuid-quiz-oop"],
  "quiz_pass_pct": 60,
  "min_watch_pct": 80,
  "est_minutes": 45
}
```

* `EXPLORE_GITHUB`:
```json
{
  "repos": [
    {"url": "https://github.com/org/cookie-demo", "branch": "main", "must_run": true, "run_cmd": "python demo.py"},
    {"url": "https://github.com/org/oop-examples", "must_run": false}
  ],
  "code_questions": [
    {"q": "Where is the class attribute defined?", "answer": "directly under class", "rubric": "locates correctly"}
  ],
  "est_minutes": 30
}
```

* `BUILD`:
```json
{
  "scaffold_repo": "https://github.com/org/level01-scaffold",
  "todos": ["Implement Cookie.__init__", "Create two instances", "Add class attribute oven_temp"],
  "acceptance": ["pytest tests/test_cookie.py -q passes", "commit pushed to learner linked repo"],
  "starter_files": ["cookie.py", "tests/test_cookie.py"],
  "est_minutes": 90
}
```

* `SUBMIT_PROOF`:
```json
{
  "proof_types": ["repo", "link", "file"],
  "required_fields": ["repo_url", "reflection_md"],
  "reflection_prompts": ["What broke and how did you fix it?", "What would you do differently?"],
  "checklist": ["Code runs without errors", "Reflection ≥ 50 words"],
  "est_minutes": 15
}
```

* `EVALUATION_BOSS`:
```json
{
  "rubric_id": "uuid-rubric-L01",
  "pass_threshold": 3.0,
  "boss_challenge": {
    "title": "Boss: The Mould Trial",
    "prompt_md": "Add Cookie.count and a @classmethod total_baked() — submit an extra commit",
    "harness": {"type": "pytest", "repo_path": "tests/test_boss.py", "must_pass": 3},
    "time_limit_minutes": 60,
    "attempts_allowed": 3
  },
  "review_sla_hours": 48,
  "auto_ai_pre_review": true
}
```

#### `activity_progress` (learner state, per enrollment × activity)

```sql
CREATE TYPE activity_state AS ENUM ('locked','available','in_progress','completed','skipped');

CREATE TABLE activity_progress (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL,
  enrollment_id   UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  level_id        UUID NOT NULL REFERENCES levels(id) ON DELETE CASCADE,
  activity_id     UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id),
  state           activity_state NOT NULL DEFAULT 'locked',
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  attempts        INT NOT NULL DEFAULT 0,          -- quiz retries, build pushes
  progress_json   JSONB NOT NULL DEFAULT '{}'::jsonb, -- e.g., {quiz_score: 80, watch_pct: 95, commit_sha: 'abc'}
  xp_awarded      INT NOT NULL DEFAULT 0,          -- denormalized for quick sums, but ledger is truth
  UNIQUE(enrollment_id, activity_id)
);
CREATE INDEX ON activity_progress(tenant_id, enrollment_id);
CREATE INDEX ON activity_progress(user_id, level_id, state);
-- Enforce activity belongs to level (app-level FK check + trigger)
```

State machine: `locked → available → in_progress → completed` (or `skipped` if optional). `completed` triggers XP ledger insert + next activity `available`.

#### Supporting tables for Learn/Explore evidence

```sql
-- Content consumption per user per content item (video/MD/quiz)
CREATE TABLE content_progress (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL,
  user_id       UUID NOT NULL REFERENCES users(id),
  content_id    UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
  state         TEXT NOT NULL DEFAULT 'not_started' CHECK (state IN ('not_started','in_progress','completed')),
  watch_pct     SMALLINT CHECK (watch_pct BETWEEN 0 AND 100),
  quiz_score    SMALLINT CHECK (quiz_score BETWEEN 0 AND 100),
  attempts      INT NOT NULL DEFAULT 0,
  last_seen_at  TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  UNIQUE(user_id, content_id)
);

-- GitHub exploration evidence (OAuth-verified when possible)
CREATE TABLE github_exploration (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL,
  user_id         UUID NOT NULL REFERENCES users(id),
  activity_id     UUID NOT NULL REFERENCES activities(id),
  repo_url        TEXT NOT NULL,
  cloned_at       TIMESTAMPTZ,            -- via GitHub API: user starred/cloned/forked detection or self-attest
  verified_via    TEXT CHECK (verified_via IN ('github_api','self_attest','auto')),
  code_answers    JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{q_idx, answer, correct}]
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, activity_id, repo_url)
);
```

---

## 5. Level 1 — Fully Instantiated (OOP Foundations)

To prove the generic model, Level 1 is specified end-to-end (mirrors the three JNE Python quests `py1-py3` consolidated into one level).

### Level Row

```
levels: { idx:1, code:'L01_AWAKENING', title:'AI Awakening: The Mould & the Cookie',
  summary:'Think in objects — the mental model behind every agent, tool, and RAG chunk.',
  xp_reward: 120, unlock_condition: null (entry level), journey_id: <genai> }
level_prerequisites: none
contents: 3 linked via Learn activity
quests: Boss challenge linked via A6
```

### Activities for L1 (6 rows in `activities`)

| Idx | Code | Title | Config Highlights |
|-----|------|-------|-------------------|
| 1 | MISSION_BRIEFING | Briefing: The Cookie Factory | Story: factory mould broken, must model cookies as objects. Boss preview: "The Mould Trial". Check Q: "What does instantiation mean?" |
| 2 | LEARN | Learn: Classes, Objects, Attributes | content_ids: [video "Mould and the Cookie (30 Oct 2026)" 9m, MD "Shared or Personal?" , quiz 4 Qs]. Pass 60%. |
| 3 | EXPLORE_GITHUB | Explore: Cookie Demo Repo | repos: [`org/cookie-demo` must_run true], 2 code Qs ("Where is the class attribute?") |
| 4 | BUILD | Build: Your Cookie Class | scaffold `level01-scaffold`, TODOs: `class Cookie` + `__init__(self, shape)` + class attr `oven_temp` + 2 instances. Harness `pytest tests/test_cookie.py` |
| 5 | SUBMIT_PROOF | Submit: Link Your Cookie | proof_types: [repo, link], required: repo_url + reflection (≥50 words), checklist enforced |
| 6 | EVALUATION_BOSS | Evaluation + Boss: The Mould Trial | rubric `L01_RUBRIC` threshold 3.0, boss: add `Cookie.count` + `@classmethod total_baked()`, harness 3 tests, 3 attempts |

### Rubric `L01_RUBRIC` (used in A6 review)

| Dimension | Weight | 1 — Missing | 3 — Meets | 5 — Exceeds |
|-----------|--------|-------------|-----------|-------------|
| Correctness | 30% | Class missing or doesn't run | Class + 2 objects run, attributes correct | + handles edge cases, clean `__repr__` |
| OOP Understanding | 25% | Confuses class vs instance | Correctly distinguishes + explains in reflection | Uses classmethod/staticmethod idiomatically |
| Code Quality | 20% | No formatting, hard-coded | Readable, PEP8, named well | Modular, docstrings, tests |
| Reflection | 15% | <50 words or generic | 50+ words, names one struggle + fix | Insightful, connects to agent/tool modeling |
| Boss Challenge | 10% | Not attempted | Passes 2/3 harness tests | 3/3 + creative extension |

`rubric_scores JSONB` example: `{"correctness":4, "oop":3, "quality":3, "reflection":4, "boss":3, "weighted_avg": 3.45}`. `PASS` if `weighted_avg >= 3.0` AND `boss >=2`.

### Level 1 — State Transitions with XP

```
Enrollment created → L1 available (all other levels locked)
A1 available → user views → A1 completed (+5 XP) → A2 available
A2: watches video 80% + quiz 75% → completed (+18 XP) → A3 available
A3: clones repo + answers 1/2 Qs correct → completed (+10 XP) → A4 available
A4: pushes commit abc123 → completed (+35 XP, largest) → A5 available
A5: submits proof (repo_url + reflection) → A5 completed (+5 XP) → submission pending → A6 in_progress
A6: AI pre-review + human review → verdict approved (3.45) → boss passed (3/3) → A6 completed (+47 XP: 20 base + 27 boss bonus)
      → L1 progress.state = approved → enrollment.current_level_idx = 2 → L2 unlocked → badge check → leaderboard ZINCRBY
```

If review `needs_changes`/`rejected`: A6 stays `in_progress`, learner resubmits via A5 (attempts++), no XP loss, reviewer feedback shown inline.

---

## 6. 8 Career Tracks (Specializations)

Tracks unlock at **L11** (after Capstone I). Learner chooses **one primary track** (can add a second after L12 for + fee via entitlements). Each track is a `journey` variant OR a `track` entity overlaying levels 11-13 with track-specific levels, mentors, and rubrics. Model below uses `tracks` table + `track_levels` overlay.

### 6.1 Track Matrix

| # | Code | Track Name | One-Line Promise | Ideal For | Unlock Requires (competence gate) | Capstone II (L12) Artifact |
|---|------|------------|------------------|-----------|-----------------------------------|----------------------------|
| **T1** | `APP_DEV` | **GenAI Application Developer** | Ship full-stack GenAI apps, end-to-end | Full-stack devs, founders | L10 approved + L09 ship rubric ≥3.5 + badge `ship-it` | Deployed SaaS (auth, RAG, billing, observability) + cost report |
| **T2** | `AGENT_ENG` | **AI Agent Engineer** | Autonomous agents that plan & act | Backend/automation engineers | L7 approved + L8 evals ≥3.0 + badge `agent-memory` | Multi-agent system (planner + executor + critic) with eval harness |
| **T3** | `RAG_ENG` | **RAG & Knowledge Systems Engineer** | Knowledge systems at scale | Data/ML engineers | L5+ L6 approved + RAG golden set ≥7/10 | Enterprise RAG (1k+ docs, hybrid, citations, latency <800ms) |
| **T4** | `AUTO_Nocode` | **AI Automation & No-Code Specialist** | Automate business with AI + no-code | Ops, solopreneurs, India SMB | L4 approved + automation proof (n8n/Make/MCP) | 3 live automations (lead→CRM→invoice) with error handling |
| **T5** | `AI_PRODUCT` | **AI Product & Prompt Engineer** | AI UX & prompt systems that delight | PMs, designers, writers | L2 ≥4.0 + L8 guardrails ≥3.0 + portfolio review | Prompt system + eval suite + AI UX case study (metrics) |
| **T6** | `DATA_EVAL` | **AI Data & Evaluation Engineer** | Data flywheel & reliable evals | Data/ML, QA engineers | L6 + L8 approved + eval harness artifact | Dataset (500+ rows) + fine-tune or synthetic data pipeline + eval dashboard |
| **T7** | `CONTENT_CREATOR` | **AI Content & Growth Creator** | Content at 10× with GenAI | Creators, marketers, founders | L2 + L10 approved + content proof (blog/video) | 30-day content engine (brand voice, scheduled, analytics) + revenue attribution |
| **T8** | `CONSULTANT` | **AI Consultant / Solution Architect** | Sell & architect AI for enterprises | Consultants, leads, freelancers | L10 approved + L13 team bonus + `consultant_pitch` badge | Enterprise proposal + architecture + ROI model for real client (or mock) |

**Prerequisite logic:** Track unlock is competence-gated, not paywalled alone. Entitlement check (`feature: track_access`) + competence check both required. A learner who aces L1-10 fast can unlock any track; a learner weak on RAG cannot unlock T3 until they remediate L5-6 (the remediation quest is auto-suggested).

### 6.2 Per-Track Deep Dive (Template — all 8 follow this shape)

#### T1 — GenAI Application Developer (example full)

- **Persona:** Wants to ship SaaS / internal tools with GenAI, handle auth, vectors, costs.
- **L11 Deep-Dive (track-specific theory):** Advanced Next.js RSC, streaming, LiteLLM routing, pgvector perf, tenant isolation patterns.
- **L12 Build:** SaaS with: GitHub OAuth, Razorpay subscription, RAG over tenant docs, AI chat streaming, admin dashboard, OTEL traces. Must pass: p95 <300ms, AI first token <900ms, cost <₹500/1k queries.
- **Rubric T1 (5 dims, weighted):**
  | Dim | W | 1 | 3 | 5 |
  |-----|---|---|---|---|
  | Functionality | 30% | CRUD broken | All flows work, seeded demo tenant | + edge cases, offline fallback |
  | Architecture | 25% | No tenant isolation | RLS + presigned S3 + idempotency | + read replica, cache, HPA |
  | AI Quality | 20% | Hallucinates | RAG citations, guardrails | + re-ranking, eval ≥90% |
  | UX/Polish | 15% | Unstyled | shadcn, responsive, a11y | + white-label theming |
  | Cost/Obs | 10% | No tracking | Ledger + Grafana + budget cap | + per-tenant chargeback |
  Pass ≥3.0 weighted.
- **Career outcome:** Portfolio SaaS URL, deploy on resume, freelance/ founder path. Interview prep: system design for multi-tenant GenAI.
- **Mentor pool:** Instructors with shipped SaaS; reviewer queue filtered to T1-certified reviewers (`reviewer.max_track = T1`).

#### T2 — AI Agent Engineer

- **L11:** ReAct, Plan-and-Execute, reflection, memory (long/short), tool mastery, LangGraph.
- **L12:** Multi-agent: planner, executor, critic, human-in-the-loop. Must handle 5-turn task with <2 hallucinations, recovers from tool failure.
- **Rubric dims:** Autonomy (30%), Tool Use (25%), Robustness (20%), Eval Coverage (15%), Cost (10%).
- **Artifact:** GitHub repo + Loom demo + eval report (10 tasks, success rate).

#### T3 — RAG & Knowledge Systems

- **L11:** Chunk strategies, embedding choice, hybrid, metadata, freshness, permissions-aware RAG.
- **L12:** 1k+ doc corpus (enterprise handbook), hybrid retrieval, re-ranking, citations, latency budget.
- **Rubric dims:** Retrieval Quality nDCG (35%), Citations (20%), Latency (15%), Scale (15%), Security (15% — no cross-tenant leak).
- **Artifact:** RAG API + playground + Evals notebook.

#### T4 — AI Automation & No-Code

- **L11:** n8n, Make, Zapier, MCP servers, webhooks, error handling, idempotency.
- **L12:** 3 live automations: (a) Lead ingest → enrichment → CRM, (b) Support ticket → AI draft → human approve, (c) Invoice → Razorpay → GST.
- **Rubric dims:** Reliability (30%), Coverage (25%), Error Handling (20%), ROI (15%), Docs (10%).
- **Artifact:** Automation share links + Loom + ROI sheet. Popular India SMB track.

#### T5 — AI Product & Prompt Engineer

- **L11:** Prompt patterns, system design for AI UX, trust, streaming UX, empty/error states, prompt versioning.
- **L12:** Prompt system (versioned, canary, evals) + AI UX case study with before/after metrics (task success, CSAT).
- **Rubric dims:** Prompt Quality (30%), UX (25%), Eval Rigor (20%), Metrics (15%), Safety (10%).

#### T6 — AI Data & Evaluation

- **L11:** Dataset design, synthetic data, labeling, fine-tune vs RAG decision, LLM-as-judge, dashboards.
- **L12:** 500+ row dataset + (fine-tune OR synthetic pipeline) + Grafana eval dashboard + bias report.
- **Rubric dims:** Data Quality (30%), Eval Design (25%), Rigor (20%), Insights (15%), Reproducibility (10%).

#### T7 — AI Content & Growth

- **L11:** Brand voice, content atoms, SEO+GenAI, distribution, repurposing, analytics.
- **L12:** 30-day engine: 30 pieces, scheduled, brand-consistent (human-rated ≥4/5), analytics + attribution.
- **Rubric dims:** Voice Consistency (30%), Volume (20%), Distribution (20%), Growth Metric (15%), Monetization (15%).

#### T8 — AI Consultant / Solution Architect

- **L11:** Discovery, ROI modeling, architecture (build vs buy), proposal writing, stakeholder mgmt, DPDP.
- **L12:** Full proposal for real/mimic enterprise: discovery notes + architecture + phased plan + ROI + risks + pricing.
- **Rubric dims:** Discovery (25%), Architecture (30%), ROI (20%), Risk (15%), Persuasion (10%). Mentor is enterprise Program Manager.

> **Rubric storage:** Each track rubric is a `rubrics` row with `dimensions JSONB` (array of {key, weight, scale}) + `pass_threshold`. Reviews store `rubric_scores JSONB` + `weighted_avg` computed column.

---

## 7. Gamification Engine

### 7.1 XP Ledger Schema — Fraud-Proof, Audit-Trailed

**Design intent:** XP is money. It gates levels, tracks, leaderboards. Fraud = unearned unlocks. Ledger must be append-only, idempotent, replayable, and server-authoritative.

#### Ledger table

```sql
CREATE TYPE xp_source AS ENUM (
  'activity_complete',      -- A1-A5 auto
  'level_complete',         -- L bonus on A6 approval
  'boss_challenge',         -- boss bonus
  'submission_approved',    -- legacy compat, maps to level_complete
  'streak_bonus',
  'badge_bonus',
  'mentor_bonus',           -- manual award by mentor/reviewer (audited)
  'admin_adjustment',       -- Super Admin correction (requires reason)
  'reversal'                -- clawback on fraud/reject
);

CREATE TABLE xp_ledger (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id),
  user_id           UUID NOT NULL REFERENCES users(id),
  enrollment_id     UUID REFERENCES enrollments(id) ON DELETE SET NULL,
  level_id          UUID REFERENCES levels(id) ON DELETE SET NULL,
  activity_id       UUID REFERENCES activities(id) ON DELETE SET NULL,
  submission_id     UUID REFERENCES submissions(id) ON DELETE SET NULL,

  amount            INT NOT NULL CHECK (amount BETWEEN -1000 AND 1000), -- negative only for reversal/admin
  balance_after     INT NOT NULL,           -- denormalized: user total XP after this event (for fast reads + audit)
  source            xp_source NOT NULL,
  source_ref        TEXT,                   -- e.g., activity_progress.id or badge.code

  -- Fraud prevention
  idempotency_key   TEXT NOT NULL UNIQUE,   -- e.g., "ap:{activity_progress_id}:xp" or "sub:{submission_id}:approval"
  actor_user_id     UUID REFERENCES users(id), -- who triggered it (system = NULL, or reviewer/admin id)
  actor_role        TEXT,                   -- role at time of award
  ip                INET,
  user_agent        TEXT,
  request_id        TEXT,                   -- trace id

  -- Audit chain (hash chain for tamper detection)
  prev_hash         TEXT,                   -- SHA256 of previous ledger row for this user (NULL for first)
  row_hash          TEXT NOT NULL,          -- SHA256(tenant_id|user_id|amount|balance_after|idempotency_key|prev_hash)

  -- Timestamps
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- No updated_at — immutable
  -- No DELETE — append reversal instead
  CONSTRAINT xp_amount_nonzero CHECK (amount <> 0)
);
-- Indexes for hot paths
CREATE INDEX ON xp_ledger(tenant_id, user_id, created_at DESC);
CREATE INDEX ON xp_ledger(user_id, source);
CREATE INDEX ON xp_ledger(enrollment_id);
CREATE UNIQUE INDEX ON xp_ledger(idempotency_key); -- dedup

-- Materialized view / cached total (never source of truth, but fast read)
CREATE MATERIALIZED VIEW user_xp_totals AS
  SELECT user_id, tenant_id, SUM(amount) AS total_xp, MAX(created_at) AS last_xp_at
  FROM xp_ledger GROUP BY user_id, tenant_id;
-- Refreshed via trigger or hourly BullMQ job; FE reads from Redis cache first (see below)

-- RLS
ALTER TABLE xp_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON xp_ledger USING (tenant_id = current_setting('app.current_tenant')::uuid);
```

**Ledger write path (server-only):**

```ts
// JourneyService.awardXp — ONLY server calls this. Client cannot POST /xp directly (route is internal/system).
async awardXp(input: {
  tenantId: string; userId: string; enrollmentId?: string;
  levelId?: string; activityId?: string; submissionId?: string;
  amount: number; source: XpSource; idempotencyKey: string;
  actorUserId?: string; requestId: string; ip?: string;
}) {
  // 1. Validate idempotency — if key exists, return existing row (replay, not error)
  const existing = await prisma.xpLedger.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
  if (existing) return existing;

  // 2. Rate limit: max 10 XP awards per user per minute (Redis token bucket)
  await rateLimitOrThrow(`xp:${input.userId}`, 10, '1m');

  // 3. Compute new balance (SELECT SUM + row lock via advisory lock per user)
  await prisma.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${input.userId}))`;
  const { _sum } = await prisma.xpLedger.aggregate({ where: { userId: input.userId }, _sum: { amount: true } });
  const balanceAfter = (_sum?.amount ?? 0) + input.amount;

  // 4. Hash chain
  const prev = await prisma.xpLedger.findFirst({ where: { userId: input.userId }, orderBy: { createdAt: 'desc' } });
  const prevHash = prev?.rowHash ?? null;
  const rowHash = sha256(`${input.tenantId}|${input.userId}|${input.amount}|${balanceAfter}|${input.idempotencyKey}|${prevHash ?? 'GENESIS'}`);

  // 5. Insert (unique violation on idempotency_key => concurrent dedup safe)
  const row = await prisma.xpLedger.create({ data: {
    tenantId: input.tenantId, userId: input.userId, enrollmentId: input.enrollmentId,
    levelId: input.levelId, activityId: input.activityId, submissionId: input.submissionId,
    amount: input.amount, balanceAfter, source: input.source, sourceRef: input.activityId ?? input.submissionId,
    idempotencyKey: input.idempotencyKey, actorUserId: input.actorUserId, actorRole: actor?.role,
    ip: input.ip, requestId: input.requestId, prevHash, rowHash,
  }});

  // 6. Side effects (outside tx or via outbox): Redis ZINCRBY leaderboard, badge check (BullMQ xp-recalc), Novu notify
  await redis.zincrby(`t:${input.tenantId}:lb:cohort:${cohortId}:weekly`, input.amount, input.userId);
  await bullMQ.add('xp-recalc', { userId: input.userId, tenantId: input.tenantId, xpLedgerId: row.id });
  return row;
}
```

**Fraud prevention layers (all must hold):**

| Layer | Mechanism |
|-------|-----------|
| **Server-authoritative** | No client endpoint for XP. All awards originate from server state transitions (activity completed, review approved, cron). `POST /gamification/xp-events` is `internal` role only. |
| **Idempotency** | `idempotency_key` UNIQUE. Client retries, double-clicks, network replays return same row. Keys are deterministic (`ap:{activityProgressId}:xp`, `sub:{submissionId}:approval:xp`). |
| **Rate limiting** | Redis token bucket per user + per tenant. Burst 10 XP events/min/user, 1000/min/tenant. Webhook/XP paths share limiter. |
| **Advisory lock** | `pg_advisory_xact_lock(hashtext(userId))` serializes balance computation per user, preventing race double-award. |
| **Validation** | XP amount must match `activities.xp_reward` or `levels.xp_reward` (+ boss bonus caps). Any mismatch → rejected + audit log. `admin_adjustment` requires reason + Super Admin/ Tenant Admin + audit. |
| **Hash chain** | `row_hash = SHA256(...prev_hash)` makes ledger tamper-evident. Nightly job verifies chain per user; mismatch → PagerDuty. |
| **Audit trail** | Every row records actor, role, IP, request_id, source. `audit_logs` entry for manual awards. `reversal` is an append (negative amount) with `source_ref` pointing to reversed row — never DELETE. |
| **Anomaly detection** | BullMQ job flags: >500 XP/hour/user, >5 level completions/day, or XP without matching submission → `flagged_xp_events` table for Support review. |

**XP → Level curve (tenant-configurable, default linear-sqrt):**

```
level = floor( sqrt( totalXp / 100 ) ) + 1   clamped 1..15
-- L1: 0 XP, L2: 100 XP, L3: 400 XP, L4: 900 XP, L5: 1600 XP ...
-- Or config in tenants.settings.xp_curve: { "type": "linear", "xp_per_level": 200 }
-- FE shows progress bar: (xp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)
```

---

### 7.2 Streak Rules — Non-Punitive Recovery

**Intent:** Streaks motivate daily return without punishing life. Design is *forgiving by default, rewarding consistency, recoverable on break*.

#### Streak definition

- A **streak day** counts if the user completes **≥1 qualifying action** in IST calendar day (00:00-23:59 IST):
  - Qualifying: `activity_progress.completed` OR `submission` created OR `xp_ledger` positive entry OR `ai_conversation` with ≥2 messages.
  - Passive logins do NOT count — prevents empty streak farming.
- `streaks` table tracks per user per tenant (not global).

#### Schema

```sql
CREATE TABLE streaks (
  user_id           UUID NOT NULL REFERENCES users(id),
  tenant_id         UUID NOT NULL REFERENCES tenants(id),
  current_streak    INT NOT NULL DEFAULT 0 CHECK (current_streak >= 0),
  longest_streak    INT NOT NULL DEFAULT 0,
  last_active_date  DATE,                 -- IST date of last qualifying action (NULL if never)
  freeze_tokens     INT NOT NULL DEFAULT 1 CHECK (freeze_tokens BETWEEN 0 AND 7), -- earnable up to 7
  total_freezes_used INT NOT NULL DEFAULT 0,
  grace_until       DATE,                 -- if set, streak pauses until this date (no increment, no reset)
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, tenant_id)
);

-- Append-only event log for audit + debugging
CREATE TYPE streak_event_type AS ENUM ('increment','freeze_used','grace_applied','recovery','reset','manual_adjust');

CREATE TABLE streak_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL,
  user_id       UUID NOT NULL REFERENCES users(id),
  event_type    streak_event_type NOT NULL,
  previous_streak INT NOT NULL,
  new_streak    INT NOT NULL,
  active_date   DATE,                   -- the IST date this event relates to
  reason        TEXT,
  idempotency_key TEXT NOT NULL UNIQUE, -- e.g., "streak:{userId}:{date}:increment"
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON streak_events(tenant_id, user_id, created_at DESC);
ALTER TABLE streak_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON streak_events USING (tenant_id = current_setting('app.current_tenant')::uuid);
```

#### Rules (non-punitive)

**1. Daily increment (cron + opportunistic):**
- BullMQ `streak-cron` runs daily 00:45 IST. For each user with `last_active_date = yesterday` and a qualifying action yesterday → `current_streak++`, `longest = max(longest, current)`. If `last_active_date < yesterday - 1` → see recovery, not hard reset.
- Also opportunistic: on any qualifying action, if `last_active_date < today` and `today - last_active_date == 1` → increment immediately (so FE shows live streak).

**2. Freeze tokens (earned, not bought initially):**
- Learner starts with **1 freeze**. Earn +1 freeze for every **7-day streak** milestone (cap 7 stored).
- When a day is missed (no qualifying action), cron **auto-consumes 1 freeze** instead of resetting: `current_streak` stays, `freeze_tokens--`, `streak_events` logs `freeze_used`. FE shows "Streak frozen — you had a freeze token 🧊".
- No freeze available → streak does NOT reset to 0 immediately. See grace & recovery.

**3. Grace window (48-hour pause, no penalty):**
- If no qualifying action for 1 day and no freeze, streak enters **grace**: `grace_until = today + 1` (48h window from last active). During grace, streak is *paused*—not incrementing, not resetting. FE shows "Streak at risk — complete any activity by tomorrow midnight to keep it 🔥".
- Novu triggers `streak_at_risk` notification at grace start (respects quiet hours).
- If learner completes a qualifying action within grace → `current_streak` increments by 1 (as if no break), `grace_until = NULL`.
- If grace expires with no action → streak enters **recovery**, not zero.

**4. Recovery quest (the compassionate reset):**
- After grace expires, `current_streak` is NOT zeroed; it is marked `recoverable` for **7 days** (`streak_events` `reset` with reason `recoverable`). FE shows "Streak paused at 12 — recover it with a quick win!".
- Learner can recover by completing a **Recovery Quest**: a short auto-generated micro-activity (retry a quiz, fix one TODO, or submit a reflection — 10-15 min). On completion: `current_streak` restored to `previous_streak` (pre-break value), `streak_events` logs `recovery`, streak resumes. Costs no freeze.
- If 7-day recovery window expires with no recovery → `current_streak = 0` (or `=1` if they do a new qualifying action — fresh start, not punishment). FE copy: "New streak started — every streak has a chapter 2 🌱". No shaming, no streak shaming leaderboard.

**5. Never drop to zero without notice:**
- Three notifications before any reset: `streak_at_risk` (grace start), `streak_recovery_available` (grace end), `streak_will_reset_tomorrow` (day 6 of recovery). All respect `notification_preferences` and quiet hours.

**6. Visual language:**
- Streak pill shows `🔥 12` when active, `🧊 12 (frozen)` when freeze used, `⏸ 12 — recover by Mon` in recovery. Never `💀` or `lost`.

**7. Anti-gaming:**
- Only one streak increment per IST day regardless of action count.
- `freeze_tokens` cannot be farmed by clock manipulation — server uses `now() AT TIME ZONE 'Asia/Kolkata'`, not client date.
- Recovery quest is server-generated per user, single-use, idempotent key `streak:{userId}:recovery:{week}`.

---

### 7.3 Leaderboards, Badges, Quests

**Leaderboards (Redis, cohort-scoped by default):**

```
Key pattern: t:{tenantId}:lb:cohort:{cohortId}:{period}   period ∈ {weekly, monthly, allTime}
             t:{tenantId}:lb:tenant:{period}               tenant-wide (Program Manager view)
             lb:global:{period}                             opt-in global (learner must consent; DPDP)

Type: Sorted Set (ZSET) — member = userId, score = total XP in period
Write: ZINCRBY on every xp_ledger insert (BullMQ, idempotent)
Read: ZREVRANGE withScores + MGET user profiles + ZREVRANK for "you are #23"
Rotation: Weekly keys rotate Monday 00:00 IST (new key, old archived to leaderboard_snapshots Postgres).
Anti-gaming: tenant-scoped by default; global requires ≥3 approved submissions (prevents XP farming accounts from topping global).
Privacy: Learner can set `leaderboard_visibility: private` — then still contributes to cohort analytics but not shown by name (shows "Anonymous Learner").
```

**Badges (declarative, event-driven):**

```sql
CREATE TABLE badges (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID REFERENCES tenants(id), -- NULL = global badge
  code          TEXT NOT NULL UNIQUE,        -- e.g., 'first-proof', 'streak-7', 'oop-master'
  name          TEXT NOT NULL,
  description   TEXT NOT NULL,
  tier          TEXT NOT NULL CHECK (tier IN ('bronze','silver','gold','legendary')),
  icon          TEXT NOT NULL,               -- emoji or S3 key
  condition     JSONB NOT NULL,              -- JSONLogic: {"and":[{"gte":[{"var":"xp"},1000]}, {"gte":[{"var":"streak"},7]}]}
  xp_bonus      INT NOT NULL DEFAULT 0,      -- bonus XP on earn (ledger entry)
  rarity        TEXT NOT NULL DEFAULT 'common' CHECK (rarity IN ('common','rare','epic','legendary')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE user_badges (
  user_id       UUID NOT NULL REFERENCES users(id),
  badge_id      UUID NOT NULL REFERENCES badges(id),
  earned_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  tenant_id     UUID NOT NULL,
  PRIMARY KEY (user_id, badge_id)
);
CREATE INDEX ON user_badges(tenant_id, badge_id);
```

Seed badges (12 canonical):

| Code | Name | Tier | Condition | XP Bonus |
|------|------|------|-----------|----------|
| `first-proof` | First Proof | bronze | approved >=1 | +30 |
| `oop-master` | OOP Done | bronze | L1 approved | +20 |
| `mcp-unlocked` | MCP Done | bronze | L4 approved | +25 |
| `memory-keeper` | Agents That Remember | silver | L3 approved + streak >=3 | +40 |
| `rag-explorer` | RAG Explorer | bronze | L5+ L6 approved | +35 |
| `ship-it` | Ship It | silver | L9 deployed URL approved | +50 |
| `streak-7` | Week Warrior | silver | streak >=7 | +50 |
| `streak-30` | Month Master | gold | streak >=30 | +100 |
| `top-10-weekly` | Top 10 Weekly | silver | leaderboard weekly rank <=10 at week end | +40 |
| `github-pr-merged` | OSS Contributor | gold | linked PR merged (GitHub API) | +80 |
| `track-chosen` | Path Chosen | silver | track enrollment (L11) | +30 |
| `career-launched` | Career Launched | legendary | L15 approved | +150 |

Badge check runs on every `xp_ledger` insert via BullMQ `xp-recalc` (idempotent, evaluates `condition` against user totals).

**Quests (lightweight cross-level challenges):**

```sql
CREATE TABLE quests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID REFERENCES tenants(id),
  code          TEXT NOT NULL UNIQUE,
  title         TEXT NOT NULL,
  description_md TEXT NOT NULL,
  condition     JSONB NOT NULL,   -- e.g., {"and":[{"gte":["approved_levels",5]}, {"gte":["xp",800]}]}
  xp_reward     INT NOT NULL,
  badge_id      UUID REFERENCES badges(id),
  is_active     BOOLEAN NOT NULL DEFAULT true
);
-- Quest progress is derived from xp_ledger + progress, no separate state table needed unless quest is multi-step.
```

---

## 8. Unlock Rules — Competence-Based Gating

**Principle:** *Time never unlocks; demonstrated competence does.* A learner who already knows OOP can breeze through L1 in an hour; a learner who needs practice cannot buy or wait past a boss.

### 8.1 Core Gating Function

```ts
// JourneyService.canUnlock — single source of truth, called on every level access + on review approval
async canUnlock(userId: string, targetLevelIdx: number, enrollmentId: string): Promise<GateResult> {
  const enrollment = await getEnrollment(enrollmentId);
  const targetLevel = await getLevel(enrollment.journeyId, targetLevelIdx);
  const progress = await getProgressMap(enrollmentId); // Map<levelIdx, Progress>

  // 1. DAG prerequisites (levels.level_prerequisites)
  for (const prereqIdx of targetLevel.prerequisiteIdxs) {
    const p = progress.get(prereqIdx);
    if (!p || p.state !== 'approved') return { allowed: false, reason: `Prerequisite L${prereqIdx} not approved` };
  }

  // 2. Linear default: all lower idx must be approved (unless DAG overrides)
  //    Enterprise can configure "allow_skip": true for placement-tested learners — still requires boss pass via challenge exam
  if (!targetLevel.config.allowSkip) {
    for (let i = 1; i < targetLevelIdx; i++) {
      if (!targetLevel.prerequisiteIdxs.includes(i) && progress.get(i)?.state !== 'approved') {
        return { allowed: false, reason: `L${i} not completed` };
      }
    }
  }

  // 3. XP threshold (optional per level, e.g., L9 requires 800 XP to ensure S1-2 mastery)
  const totalXp = await getTotalXp(userId, enrollment.tenantId);
  if (targetLevel.minXp && totalXp < targetLevel.minXp) {
    return { allowed: false, reason: `Need ${targetLevel.minXp} XP (you have ${totalXp})` };
  }

  // 4. Badge gates (e.g., T3 requires 'rag-explorer')
  for (const badgeCode of targetLevel.requiredBadges ?? []) {
    if (!await hasBadge(userId, badgeCode)) return { allowed: false, reason: `Badge ${badgeCode} required` };
  }

  // 5. Entitlement (paid tracks)
  if (targetLevel.entitlementFeature) {
    const ent = await getEntitlement(userId, enrollment.tenantId, targetLevel.entitlementFeature);
    if (!ent || ent.remaining <= 0) return { allowed: false, reason: `Entitlement ${targetLevel.entitlementFeature} required`, action: 'upgrade' };
  }

  // 6. No time gate — explicitly never check "enrolled_at + 7 days"
  return { allowed: true };
}
```

**Enforced server-side on:**
- `GET /enrollments/:id/progress` (filters to allowed levels; locked levels returned as `state: locked` with `unlock_reason`)
- `POST /enrollments/:id/progress/:levelIdx/unlock` (mutation guard — returns 403 with reason if not allowed)
- `POST /submissions` (rejects if level not available/in_progress)

### 8.2 Level Unlock Matrix (Canonical)

| Target | Prerequisites (must be approved) | Min XP | Badge Gate | Entitlement | Notes |
|--------|----------------------------------|--------|------------|-------------|-------|
| L1 | — (entry) | 0 | — | `journey_access` | Enroll → L1 available |
| L2 | L1 | — | — | — | Linear |
| L3 | L2 | — | — | — | — |
| L4 | L3 | — | — | — | — |
| L5 | L4 | — | — | — | — |
| L6 | L5 | — | — | — | — |
| L7 | L6 | 600 | — | — | Ensures RAG base solid |
| L8 | L7 | — | — | — | — |
| L9 | L8 | 900 | — | — | Ship requires craft mastery |
| L10 | L9 | 1200 | `ship-it` | — | Capstone requires shipped app |
| **L11 (track)** | L10 + (L1-9 all approved) | 1500 | track-specific (see §6.1) | `track_access` | Choose track at L11 briefing |
| L12 | L11 (same track) | — | — | `track_access` | — |
| L13 | L12 | — | — | `track_access` | Team project |
| L14 | L13 | 2200 | — | — | Portfolio |
| L15 | L14 | 2500 | — | — | Career launch |

**Placement / fast-track (competence shortcut):**
- Learner with prior experience may take a **Challenge Exam** for L1-6 (proctored, same rubric, 1 attempt/week). Passing (weighted ≥3.5) grants `approved` without doing A1-A5, but boss challenge still required. Recorded as `progress.state=approved` with `source='challenge_exam'` + audit.
- No fast-track for L9-10, L13-15 (must ship).

### 8.3 Activity-Level Competence Within a Level

- **Quiz:** Server-verified, 60% to complete A2, but rubric for L approval requires no quiz score (quiz is formative). However, quiz attempts logged for mentor nudge.
- **Build:** Commit must pass harness (`pytest` 0 failures) to complete A4, but harness can be lenient (warnings ok). Strict rubric applied at A6 review.
- **Boss Challenge:** Must pass harness 3/3 or rubric boss ≥3. No auto-pass; reviewer can override with reason (audited).

### 8.4 Idempotent Unlock Flow (Transactional)

```sql
-- On reviews.verdict = approved (inside transaction)
BEGIN;
  -- 1. xp_ledger insert (idempotent key sub:{submissionId}:approval)
  INSERT INTO xp_ledger (...) VALUES (...);

  -- 2. progress state → approved
  UPDATE progress SET state='approved', completed_at=now(), xp_earned = levels.xp_reward
  WHERE id = :progressId;

  -- 3. activity_progress for A6 → completed
  UPDATE activity_progress SET state='completed', completed_at=now() WHERE id = :a6ProgressId;

  -- 4. Compute next level(s) unlockable
  SELECT * FROM levels WHERE journey_id = :jid AND idx = :nextIdx; -- check canUnlock

  -- 5. If unlockable, activity_progress for next level A1 → available
  INSERT INTO activity_progress (enrollment_id, level_id, activity_id, user_id, state)
  VALUES (:enrollmentId, :nextLevelId, :nextA1Id, :userId, 'available')
  ON CONFLICT DO NOTHING;

  -- 6. enrollment.current_level_idx = min available/in_progress idx
  UPDATE enrollments SET current_level_idx = :nextIdx WHERE id = :enrollmentId;

  -- 7. Outbox: BullMQ xp-recalc + Novu level_unlocked
COMMIT;
-- All steps use advisory lock per enrollment to prevent concurrent review race.
```

---

## 9. SQL-Relevant Entity Sketches (DDL)

Consolidated DDL for all new/expanded entities, tenant-aware, RLS-ready. Assumes existing `tenants`, `users`, `journeys`, `levels`, `enrollments`, `progress`, `submissions`, `reviews`, `cohorts` from architecture.md §6.

> **Convention:** Every tenant-scoped table has `tenant_id UUID NOT NULL`, index on `tenant_id`, and RLS policy `tenant_isolation`. `created_at`/`updated_at` defaults `now()`. UUID PK via `gen_random_uuid()`.

### 9.1 Levels & Prerequisites (expanded)

```sql
-- Additions to existing levels table (architecture.md §6.2)
ALTER TABLE levels
  ADD COLUMN code TEXT UNIQUE,                     -- e.g., L01_AWAKENING
  ADD COLUMN stage TEXT NOT NULL DEFAULT 'STAGE_IGNITION' CHECK (stage IN ('STAGE_IGNITION','STAGE_CRAFT','STAGE_SHIP','STAGE_SPECIALIZE','STAGE_LAUNCH')),
  ADD COLUMN min_xp INT CHECK (min_xp >= 0),       -- gate
  ADD COLUMN required_badges TEXT[] DEFAULT '{}',   -- e.g., {'ship-it'}
  ADD COLUMN entitlement_feature TEXT,              -- e.g., 'track_access:T1'
  ADD COLUMN config JSONB NOT NULL DEFAULT '{}'::jsonb; -- {allowSkip: false, isTrackLevel: false}

-- DAG edges (already in architecture.md, restated with RLS)
CREATE TABLE level_prerequisites (
  tenant_id               UUID NOT NULL REFERENCES tenants(id),
  level_id                UUID NOT NULL REFERENCES levels(id) ON DELETE CASCADE,
  prerequisite_level_id   UUID NOT NULL REFERENCES levels(id) ON DELETE CASCADE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (level_id, prerequisite_level_id),
  CHECK (level_id <> prerequisite_level_id)
);
-- Trigger: prevent cycles (recursive CTE check on insert)
ALTER TABLE level_prerequisites ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON level_prerequisites USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE TABLE stages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID REFERENCES tenants(id), -- NULL = global stages
  code        TEXT NOT NULL UNIQUE,        -- STAGE_IGNITION etc.
  name        TEXT NOT NULL,
  level_from  SMALLINT NOT NULL,
  level_to    SMALLINT NOT NULL,
  CHECK (level_from <= level_to)
);
```

### 9.2 Activities & Activity Progress (new)

```sql
-- Already defined in §4.2, repeated here for DDL consolidation
CREATE TYPE activity_state AS ENUM ('locked','available','in_progress','completed','skipped');

CREATE TABLE activities (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  journey_id    UUID NOT NULL REFERENCES journeys(id) ON DELETE CASCADE,
  level_id      UUID NOT NULL REFERENCES levels(id) ON DELETE CASCADE,
  idx           SMALLINT NOT NULL CHECK (idx BETWEEN 1 AND 6),
  code          TEXT NOT NULL CHECK (code IN ('MISSION_BRIEFING','LEARN','EXPLORE_GITHUB','BUILD','SUBMIT_PROOF','EVALUATION_BOSS')),
  title         TEXT NOT NULL,
  summary_md    TEXT NOT NULL,
  config        JSONB NOT NULL DEFAULT '{}'::jsonb,
  xp_reward     INT NOT NULL DEFAULT 0,
  is_optional   BOOLEAN NOT NULL DEFAULT FALSE,
  position      SMALLINT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(level_id, idx),
  UNIQUE(level_id, code)
);
CREATE INDEX ON activities(tenant_id, journey_id);
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON activities USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE TABLE activity_progress (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  enrollment_id   UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  level_id        UUID NOT NULL REFERENCES levels(id) ON DELETE CASCADE,
  activity_id     UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id),
  state           activity_state NOT NULL DEFAULT 'locked',
  started_at      TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  attempts        INT NOT NULL DEFAULT 0,
  progress_json   JSONB NOT NULL DEFAULT '{}'::jsonb,
  xp_awarded      INT NOT NULL DEFAULT 0,
  UNIQUE(enrollment_id, activity_id)
);
CREATE INDEX ON activity_progress(tenant_id, enrollment_id);
CREATE INDEX ON activity_progress(user_id, level_id);
ALTER TABLE activity_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON activity_progress USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE TABLE content_progress (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  user_id       UUID NOT NULL REFERENCES users(id),
  content_id    UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
  state         TEXT NOT NULL DEFAULT 'not_started',
  watch_pct     SMALLINT CHECK (watch_pct BETWEEN 0 AND 100),
  quiz_score    SMALLINT CHECK (quiz_score BETWEEN 0 AND 100),
  attempts      INT NOT NULL DEFAULT 0,
  last_seen_at  TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  UNIQUE(user_id, content_id)
);

CREATE TABLE github_exploration (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  user_id         UUID NOT NULL REFERENCES users(id),
  activity_id     UUID NOT NULL REFERENCES activities(id),
  repo_url        TEXT NOT NULL,
  cloned_at       TIMESTAMPTZ,
  verified_via    TEXT CHECK (verified_via IN ('github_api','self_attest','auto')),
  code_answers    JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, activity_id, repo_url)
);
```

### 9.3 Tracks & Track Enrollments

```sql
CREATE TABLE tracks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID REFERENCES tenants(id), -- NULL = global tracks
  code            TEXT NOT NULL UNIQUE,        -- APP_DEV, AGENT_ENG, etc.
  name            TEXT NOT NULL,
  tagline         TEXT NOT NULL,
  description_md  TEXT NOT NULL,
  icon            TEXT,
  prerequisites   JSONB NOT NULL DEFAULT '{}'::jsonb, -- {min_xp:1500, required_levels:[1,2,3,4,5,6,7,8,9,10], required_badges:['ship-it']}
  rubric_id       UUID REFERENCES rubrics(id),
  is_active       BOOLEAN NOT NULL DEFAULT true,
  max_enrollments INT,                          -- cap for mentor ratio
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Track-specific level overlays for L11-L13 (inherit base level structure but track-scoped config)
CREATE TABLE track_levels (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  track_id        UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  level_idx       SMALLINT NOT NULL CHECK (level_idx BETWEEN 11 AND 13), -- which global level this overlays
  title_override  TEXT,
  config_override JSONB NOT NULL DEFAULT '{}'::jsonb, -- track-specific todos, repos, rubrics
  UNIQUE(track_id, level_idx)
);

CREATE TABLE track_enrollments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  user_id         UUID NOT NULL REFERENCES users(id),
  track_id        UUID NOT NULL REFERENCES tracks(id),
  enrollment_id   UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE, -- main journey enrollment
  state           TEXT NOT NULL DEFAULT 'active' CHECK (state IN ('active','completed','dropped')),
  enrolled_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at    TIMESTAMPTZ,
  UNIQUE(user_id, track_id, enrollment_id)
);
CREATE INDEX ON track_enrollments(tenant_id, track_id);
ALTER TABLE track_enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON track_enrollments USING (tenant_id = current_setting('app.current_tenant')::uuid);
```

### 9.4 Rubrics, Submissions, Reviews (expanded)

```sql
CREATE TABLE rubrics (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID REFERENCES tenants(id), -- NULL = global
  code            TEXT NOT NULL UNIQUE,        -- L01_RUBRIC, T1_RUBRIC etc.
  title           TEXT NOT NULL,
  dimensions      JSONB NOT NULL,              -- [{key:'correctness', label:'Correctness', weight:0.30, scale:{1:'...',3:'...',5:'...'}}, ...]
  pass_threshold  NUMERIC(3,2) NOT NULL DEFAULT 3.00 CHECK (pass_threshold BETWEEN 1 AND 5),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Submissions expanded (repo + harness support)
ALTER TABLE submissions
  ADD COLUMN track_id UUID REFERENCES tracks(id),
  ADD COLUMN harness_result JSONB,             -- {passed:3, total:3, logs: '...'}
  ADD COLUMN reflection_md TEXT,
  ADD COLUMN deployed_url TEXT;

-- Reviews expanded (rubric scores)
ALTER TABLE reviews
  ADD COLUMN rubric_id UUID REFERENCES rubrics(id),
  ADD COLUMN rubric_scores JSONB,              -- {correctness:4, oop:3, ...}
  ADD COLUMN weighted_avg NUMERIC(3,2) GENERATED ALWAYS AS (
    -- computed in app, not PG generated, to avoid JSONB weight lookup complexity; shown for intent
    NULL
  ) STORED;

-- Boss challenge separate tracking (optional, for granular analytics)
CREATE TABLE boss_challenge_progress (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  enrollment_id   UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  level_id        UUID NOT NULL REFERENCES levels(id) ON DELETE CASCADE,
  activity_id     UUID NOT NULL REFERENCES activities(id),
  user_id         UUID NOT NULL REFERENCES users(id),
  state           TEXT NOT NULL DEFAULT 'locked' CHECK (state IN ('locked','available','in_progress','passed','failed')),
  attempts        INT NOT NULL DEFAULT 0,
  best_score      NUMERIC(3,2),
  harness_result  JSONB,
  passed_at       TIMESTAMPTZ,
  UNIQUE(enrollment_id, level_id)
);
```

### 9.5 XP Ledger, Streaks, Badges (consolidated)

```sql
-- xp_ledger, streaks, streak_events, badges, user_badges already defined in §7.1-7.2 — DDL repeated for completeness.
-- See §7.1 for xp_ledger (with prev_hash, row_hash, idempotency_key)
-- See §7.2 for streaks, streak_events
-- See §7.3 for badges, user_badges, quests

-- Leaderboard snapshots (hourly archive from Redis)
CREATE TABLE leaderboard_snapshots (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  cohort_id     UUID REFERENCES cohorts(id),
  period        TEXT NOT NULL CHECK (period IN ('weekly','monthly','allTime')),
  snapshot_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  entries       JSONB NOT NULL,               -- [{user_id, xp, rank}, ... top 100]
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON leaderboard_snapshots(tenant_id, cohort_id, snapshot_at DESC);

-- Flagged XP for anomaly review
CREATE TABLE flagged_xp_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  xp_ledger_id  UUID NOT NULL REFERENCES xp_ledger(id),
  user_id       UUID NOT NULL REFERENCES users(id),
  reason        TEXT NOT NULL,                -- e.g., 'rate_limit_exceeded', 'amount_mismatch'
  state         TEXT NOT NULL DEFAULT 'open' CHECK (state IN ('open','reviewed','cleared','reversed')),
  reviewed_by   UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 9.6 Entitlements & Unlock Audit

```sql
-- Already in architecture.md §6.2, plus unlock audit
CREATE TABLE unlock_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  user_id         UUID NOT NULL REFERENCES users(id),
  enrollment_id   UUID NOT NULL REFERENCES enrollments(id),
  level_id        UUID NOT NULL REFERENCES levels(id),
  track_id        UUID REFERENCES tracks(id),
  allowed         BOOLEAN NOT NULL,
  reason          TEXT,                       -- e.g., "L5 not approved"
  gated_by        TEXT,                       -- 'prerequisite' | 'xp' | 'badge' | 'entitlement' | 'none'
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON unlock_events(tenant_id, user_id, created_at DESC);
```

### 9.7 Indexes & Constraints Summary

- All tables `tenant_id` leading index; GIN on `JSONB` condition/config fields.
- `progress` partial index `WHERE state IN ('submitted','needs_review')` for reviewer queue.
- `xp_ledger` unique on `idempotency_key`; `streak_events` unique on `idempotency_key`.
- `levels` CHECK `idx 1..15`; `activities` CHECK `idx 1..6`.
- `level_prerequisites` cycle trigger (recursive CTE).
- RLS enabled on 20+ tables; app sets `SET LOCAL app.current_tenant = '...'` per tx.

---

## 10. State Machines & Event Flows

### 10.1 Enrollment → Level Progress

```
enrollments.state: active → completed (when L15 approved) | dropped (user or admin)
progress.state per level: locked → available → in_progress → submitted → needs_review → approved
                                                    ↘ rejected → in_progress (retry, attempts++)
enrollment.current_level_idx = min idx where progress.state IN ('available','in_progress','submitted','needs_review')
```

### 10.2 Activity Progress

```
activity_progress.state: locked → available → in_progress → completed
                                              ↘ skipped (if is_optional)
On completed: insert xp_ledger (idempotent), set next activity to available (or A6 → submission pending).
```

### 10.3 Submission → Review

```
submissions.state: pending → in_review (reviewer claimed) → approved | rejected | needs_changes
reviews.verdict determines next: approved → progress approved + XP + unlock next level
                               rejected/needs_changes → progress → in_progress, feedback visible, A5 available for resubmit
```

### 10.4 End-to-End Event Flow (Happy Path L1)

```
User views A1 → activity_progress A1 completed (+5 XP ledger) → BullMQ xp-recalc → badge check → leaderboard ZINCRBY → Novu (optional)
User passes A2 quiz → A2 completed (+18 XP) → ...
User pushes commit → webhook / github → activity_progress A4 completed (+35 XP)
User submits proof → submissions row pending → activity_progress A5 completed (+5 XP) → A6 in_progress → Reviewer queue
Reviewer approves (rubric 3.45) + boss harness 3/3 → xp_ledger +47 XP → progress approved → enrollment current_level_idx++ → next level A1 available → Novu level_unlocked → FE realtime progress:updated via Socket.io
```

---

## 11. Anti-Fraud, Audit & Observability

| Concern | Mitigation | Evidence |
|---------|------------|----------|
| XP farming via client | Server-authoritative awards only; no client XP endpoint | `awardXp` internal guard + RLS + route role `internal` |
| Replay / double-click | Idempotency keys UNIQUE, advisory lock | `xp_ledger.idempotency_key` + `pg_advisory_xact_lock` |
| Forged submissions | GitHub OAuth verified repo ownership; file AV scan; presigned S3 | `files.av_status`, `submissions.repo_url` verified |
| Harness spoofing | Harness runs server-side (BullMQ job clones repo, runs pytest) | `harness_result` populated by worker, not client |
| Ledger tampering | Hash chain + nightly verifier job | `row_hash`, `prev_hash`, PagerDuty on mismatch |
| Streak manipulation | Server date (Asia/Kolkata), one increment/day, freeze cap | `streak_events` append-only, idempotent key per date |
| Unlock bypass | `canUnlock` enforced on every read & write; RLS as last line | `unlock_events` audit, 403 with reason |
| PII / DPDP | Progress/XP export per user on DSR; pseudonymized analytics | `audit_logs` partitioned, S3 WORM archive |

**Metrics (Prometheus):** `xp_events_total{source,tenant}`, `streak_freezes_used_total`, `level_completions_total{level, track}`, `unlock_denied_total{reason}`, `review_sla_breach_total`, `flagged_xp_total`.

---

## 12. Appendix — Example Payloads

### A. Level with Activities (GET /journeys/:id/levels?enrollment=:id)

```json
{
  "idx": 1,
  "code": "L01_AWAKENING",
  "title": "AI Awakening: The Mould & the Cookie",
  "stage": "STAGE_IGNITION",
  "state": "in_progress",
  "xp_reward": 120,
  "activities": [
    {"idx": 1, "code": "MISSION_BRIEFING", "title": "Briefing: The Cookie Factory", "state": "completed", "xp_reward": 5},
    {"idx": 2, "code": "LEARN", "title": "Learn: Classes, Objects, Attributes", "state": "completed", "xp_reward": 18},
    {"idx": 3, "code": "EXPLORE_GITHUB", "title": "Explore: Cookie Demo Repo", "state": "completed", "xp_reward": 10},
    {"idx": 4, "code": "BUILD", "title": "Build: Your Cookie Class", "state": "completed", "xp_reward": 35},
    {"idx": 5, "code": "SUBMIT_PROOF", "title": "Submit: Link Your Cookie", "state": "completed", "xp_reward": 5},
    {"idx": 6, "code": "EVALUATION_BOSS", "title": "Evaluation + Boss: The Mould Trial", "state": "in_progress", "xp_reward": 47, "boss": {"attempts": 1, "harness": {"passed": 2, "total": 3}}}
  ]
}
```

### B. XP Ledger Entry

```json
{
  "id": "01H...",
  "user_id": "u_123",
  "tenant_id": "t_abc",
  "amount": 35,
  "balance_after": 68,
  "source": "activity_complete",
  "source_ref": "ap_456",
  "idempotency_key": "ap:ap_456:xp",
  "row_hash": "a3f9...",
  "prev_hash": "9c1e...",
  "created_at": "2026-11-04T05:30:00Z"
}
```

### C. Streak Status (GET /gamification/me)

```json
{
  "xp": 842,
  "level": 3,
  "streak": {"current": 12, "longest": 12, "state": "active", "freeze_tokens": 2, "grace_until": null},
  "badges": [{"code": "first-proof", "earned_at": "2026-11-01"}],
  "next_level_xp": 900,
  "leaderboard": {"cohort_rank": 4, "cohort_size": 24}
}
```

### D. Unlock Denied

```json
{
  "allowed": false,
  "reason": "Prerequisite L9 not approved",
  "gated_by": "prerequisite",
  "action": null,
  "next_steps": ["Complete L9 Ship It — your deployed URL is awaiting review"]
}
```

---

*End of model. Evidence: this file at `/Users/apple/ai-business/AI_ACCELERATOR_HUB_JOURNEY_GAMIFICATION_MODEL.md`. Companion architecture at `ai-accelerator-hub-architecture.md` and prototype `jne-gamified/index.html`.*
