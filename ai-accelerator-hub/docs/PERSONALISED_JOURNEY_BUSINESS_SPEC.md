# Personalised Learning Journey & Agent Lab — Business Specification

| | |
|---|---|
| Version | 1.0 — 2026-11-04 |
| Status | Built and tested (see §12). Items in §13–§14 are proposals or open. |
| Source design | `UI-design/Hackathon · Freedom With AI (4).pdf` (1 page: Level 1 screen) |
| Code | `apps/web/lib/domain/{personalise,profile,agentLab}.ts`, `app/(app)/{onboarding,agent-lab,review/agent-lab}`, migration `20261104120000_personalised_journey` |
| Tests | `apps/web/test/personalisation.test.ts` (16 tests). The full suite has 79 tests and all pass. |

---

## 1. Why this exists

People who learn the traditional way get the same lecture, the same examples and the same exercise, whether they are a 14-year-old who codes in Python for fun, a final-year student chasing placements, a staff engineer, a no-code founder or a tiffin-service owner. Most of them either get bored (too easy) or lost (too hard), and most drop off at the first hard setup step, which is installing and signing in to an AI tool.

This feature personalises **what each learner sees and does** at every step:
- content
- worked demos
- questions
- hints
- pace
- the recommended AI agent
- the support they get

It keeps **one competence bar** for everyone. A learner earns a level by passing the same rubric and the same human review as everyone else. Personalisation changes the path, never the destination.

### Design principles (non-negotiable)
1. **Personalise the experience, not the standard.** Grading keys, rubric, XP, attempt limits and pass marks are protected in code (`PROTECTED` in `personalise.ts`). A content variant that tries to change them is ignored.
2. **Explainable rules, not a black box.** The persona is derived by a deterministic, versioned rules function (`RULES_VERSION = 1`). The same answers always give the same plan, which can be audited and unit-tested. No model call decides a learner's path.
3. **The server decides.** The client sends answers only. The persona is computed on the server. Age and guardian consent come from server-held `UserSetting` rows and never from the form. A `persona` field sent by the client is dropped.
4. **Proof is verified by a person.** Screenshots, version output and prompts are checked by a reviewer. XP for the Agent Lab is awarded only after a human verifies the proof. Automated checks only help the reviewer.
5. **No invented facts.** Every install command, sign-in requirement and licence for the AI agents was checked against the vendor's own documentation on 2026-11-04 (see §7.2). Where a fact could not be verified, it is not shown.
6. **Safe for all ages.**
   - Under 13: blocked from registering.
   - Under 18: private by default and no purchases.
   - Paid agents: blocked for under-18s until a guardian approves.

---

## 2. What the PDF shows and how it maps

The PDF is a single Level 1 screen of the "Freedom With AI" programme. Every element on it is listed below with its implementation.

| PDF element | What it says | Where it lives now |
|---|---|---|
| Level strip (Level 1–6, weekly dates, locks) | Weekly cadence, later levels locked | Existing journey stepper and level locks (`levels/[code]`). Competence-gated unlocks are unchanged. |
| "Words you will see" glossary | Niche, prompt, AI agent, API key, app, context card | **AI agent** is defined on the Agent Lab hero. **API key** ("like a recharge code — keep it private") is in the Agent Lab *Sign in safely* step and its quiz. **Context card** is an onboarding field that the AI coach reads (§5.3). **Prompt** is the Agent Lab *Simplify your prompt* step. |
| Activity 1 — Find your business niche | Niche plus three project ideas | Level 1 Activity 1 (Mission Briefing) uses a **persona-specific real problem**. Level 2 "AI Problem Hunter" covers niche definition in depth. *Not built:* the "three project ideas" output (see §14). |
| Activity 2 — What it takes, and your promise | Commitment to yourself | Partly covered: onboarding asks for weekly hours and sets a pace and streak plan. *Not built:* an explicit written "promise" artefact (see §14). |
| Activity 3 — Talk to AI and get good answers | How to ask AI well | Level 1 Activity 4 (three prompt iterations), plus the Agent Lab five-part prompt builder (Goal · Context · Constraints · Output · Check). |
| Activity 4 — Set up your AI agent | Your own AI helper on your computer | **Agent Lab** (§7): Claude Code, Codex CLI, OpenCode or Kilo Code, with OS-specific steps, safe sign-in, a prompt, a result and screenshot proof. |
| "Get ready before you start" checklist | Laptop charged · Visa/Mastercard · international payments ON · notes app · "I will do this later" | Agent Lab *Get ready* step. **Personalised** (§5.2): minors get "guardian present, no card needed", adults get the card item marked optional, and Windows, Chromebook and "not sure" users get extra items. |
| Class info (live class, agenda) | Live 4-hour class with an agenda | Existing cohort schedule (`Cohort.schedule`, Saturday workshop and Sunday 4-hour hackathon on Mission Control). |
| Header: streak ×1.0, role chip "ARCHITECT", avatar | Gamification and identity | Existing streak and XP pills. The persona label ("Engineering Professional" etc.) is shown on Mission Control and My Path. |

**Content alignment note.** The PDF programme is business-first ("find your niche"). Our MASTER PROMPT Level 1 is "AI Explorer". We did not overwrite the approved 15-level curriculum. Instead, the **business_owner** persona gets the business framing, and every persona gets the agent setup at Level 1, exactly as the PDF does.

---

## 3. Personas

The onboarding questions place each learner in one of five personas (§4).

| Persona (code) | Who | What they need | Main risk | What we change |
|---|---|---|---|---|
| **Young Coder** (`kid_hobbyist`) | A school student, usually a minor, often learning Python as a hobby | Plain words, fun school examples, safety, no money | Unsafe data sharing, paid tools, being overwhelmed | Coding-club scenarios, a "explain my Python error, hint only" demo, free agent first, guardian checklist, no card, private by default |
| **Student & Career Starter** (`student`) | College student, or an adult in school | Proof employers can check, interview-ready skills | Tutorial hell with no portfolio | Placement-cell scenarios, resume-prompt demo, emphasis on Levels 2, 7 and 12 (problems, shipping, open-source PRs) |
| **Engineering Professional** (`software_pro`) | Software engineer, architect, other engineer | Depth, speed, production concerns | Boredom, and trusting AI code blindly | Legacy-service and incident scenarios, a "measure non-determinism" demo, pro-code mode, emphasis on Levels 9, 10 and 13, Claude Code or Codex first |
| **AI Builder** (`ai_builder`) | Wants to build an app or automation; may not code (includes non-engineering professionals) | Idea to working product, knowing how to check AI output | Shipping something broken they can't evaluate | Booking-app scenarios, a "vague idea to buildable spec" demo, emphasis on Levels 3, 6 and 7 |
| **Business Owner** (`business_owner`) | Runs a shop, service, agency or startup | Time saved, customer value, low jargon | Hype, data leaks, wasted spend | Own-business framing (the PDF's niche approach), ROI language, emphasis on Levels 2, 4 and 6, automation track |

### 3.1 A sample Level 1 for each persona

The same activity reads differently for each persona. All of this is seeded content in `seed-v3.ts → V`.

| | Young Coder | Student | Engineer | Builder | Business owner |
|---|---|---|---|---|---|
| **Briefing situation** | School coding club writes and marks a Friday Python quiz by hand | Placement cell answers 600 students' repeated questions | 9-year-old Java billing service, thin tests, painful on-call | Yoga studio books by Instagram DM, double-bookings | Your tiffin service, 200 WhatsApp messages a day in 3 languages |
| **Check question: the AI-suited task** | Writing 10 practice questions on Python lists (the captain checks them) | First-draft resume feedback (the coordinator reviews) | Drafting unit tests for a legacy class (reviewed in the PR) | Reminder message in the studio's voice (the owner approves) | Polite reply to an upset customer (you check it) |
| **Learn demo** | Ask AI to explain a Python error, hint only | Three prompts, three answers: context beats luck | Same prompt 3×, diff the outputs, add constraints and tests | Vague "make an app" turned into a spec with risks | AI drafts a complaint reply; you approve it |
| **Boss scenarios (6)** | Add up class marks, explain a for-loop with cricket, … | CGPA cut-off, interview tips, … | PR gate, release notes, incident log, … | Slot clashes, onboarding copy, … | Base tiffin set |

Answer keys for these variants stay on the server. The API strips them, as it does for the base content. A learner never receives another persona's content.

---

## 4. Onboarding: the questions and the rules

### 4.1 Questions
Route: `/onboarding`. It takes about two minutes, all answers are required unless marked optional, and they can be changed at any time.

| # | Question | Options | Why we ask |
|---|---|---|---|
| 1 | Which describes you best? | School student · College student · Working professional · I want to build something with AI · I run a business | Primary persona signal |
| 1a | *(school student only)* Learning Python or another language as a hobby? | yes / no | Young Coder signal |
| 1b | *(professional only)* What kind of work? | Software engineer · Architect · Other engineer · Non-engineering | Engineer vs builder; architect track |
| 2 | Comfort with code | Never coded · Read and change simple code · Code most days | Mode: no-code, low-code or pro-code |
| 3 | Main goal | Understand AI · Job or internship · Use AI at work · Build a product · Automate my work · Start an AI business | Track choice |
| 4 | Hours per week | 2 · 5 · 10 · 15+ | Pace |
| 5 | Computer | macOS · Windows · Linux · Chromebook · Not sure | Install commands and readiness |
| 6 | How do you like to learn? | Watch a demo · Read · Try first | Order of content |
| 7 | Field or interest *(optional, 80 characters)* | Free text | Coach examples ("use examples from cricket") |
| 8 | Context card *(optional, 1,200 characters)* | Free text | PDF glossary: "one page about you that you save in your AI, so every chat starts already knowing you" |

Phone numbers, emails and 12-digit ID numbers are rejected in the free-text fields.

### 4.2 Persona decision table (`derivePersona`)

| Role | Extra condition | Persona |
|---|---|---|
| school_student | minor **or** pythonHobby | kid_hobbyist |
| school_student | adult and not a hobbyist | student |
| college_student | — | student |
| working_professional | software_engineer, architect or other_engineer | software_pro |
| working_professional | non_engineering | ai_builder |
| builder | — | ai_builder |
| business_owner | — | business_owner |

Safety does not depend on persona. A 17-year-old college student is a `student` and still gets every minor protection.

---

## 5. The personalised plan (`buildPlan`)

The plan is recomputed on every read, so a guardian approving consent takes effect immediately.

### 5.1 Plan outputs
| Output | Rule |
|---|---|
| **Mode** | comfort none → no-code, basic → low-code, daily → pro-code |
| **Pace** | 2 h → gentle (a level every 2 weeks), 5 h → standard (1 a week), 10 h+ → fast (1 a week plus stretch challenges) |
| **Track** (one of the 8 §7 specialisations) | Young Coder → AI App Developer<br>Student → AI Product Manager if no code, otherwise AI App Developer<br>Engineer → AI Solutions Architect if an architect, otherwise AI Agent Developer<br>Builder → AI Automation Engineer if the goal is automation, otherwise AI App Developer<br>Business owner → AI Product Manager if starting an AI business, otherwise AI Automation Engineer |
| **Emphasis levels** | 3 levels per persona, each with a reason. The levels are *never skipped*; this only highlights them. |
| **Agent ranking** | Young Coder and Student: Kilo Code, OpenCode, Claude Code, Codex<br>Engineer: Claude Code, Codex, OpenCode, Kilo<br>Builder and Business: Claude Code, Kilo, Codex, OpenCode |
| **Agent access** | Under-18 without guardian consent: Claude Code, Codex CLI and OpenCode are **blocked** (they need a paid plan or API key). Kilo Code's free models stay available. Enforced in the UI **and** in `startRun`. |
| **Support notes** | Learning-style order, persona-specific demo style, and privacy notes for minors |
| **Coach hint** | Tone and example guidance added to the AI coach's system prompt (§5.3) |

### 5.2 Personalised "Get ready" checklist
Every learner gets: laptop charged and online, and a notes app open. Then:
- Windows: "PowerShell or WSL?" (Claude Code runs natively on Windows 10 1809+; OpenCode recommends WSL)
- Chromebook: turn on Linux, or use another laptop
- Not sure: find out your OS, or ask a mentor
- Minor: a guardian is present, no card needed, never share your account
- Adult: a payment card for international payments, **optional** if a paid plan is chosen

### 5.3 AI coach personalisation
- The persona's `coachHint` is appended to the assistant's system prompt. It sets tone and examples only.
- The learner's **context card is untrusted text**. It is redacted and travels in the *user* turn, never in the system prompt, so it cannot override the guardrails.
- Without an `ANTHROPIC_API_KEY` the coach still returns `AI_NOT_CONFIGURED`. Nothing is faked.

---

## 6. Content variant model

Activities can carry `config.variants[persona]`. `resolveConfig(cfg, persona)` overlays the variant on the base before display **and** before grading, so the learner is graded against exactly what they saw.

| Can vary | Protected (variant keys ignored) |
|---|---|
| `problem`, `objective`, `outcome`, `criteria` text, the `check` question and its explanation, `demo`, boss `scenarios` (same count), build-field `hint`s (via `fieldHints`) | `kind`, `rubric`, `xpSplit`, `attempts`, `passPct`, `passMin`, `iterations`, `iterationRules`, `fields` (keys, minimum words), `minWords`, `minWhyWords`, `choices`, `quiz`, `checklist`, `tools` |

Structural guards: a variant `check` must keep the option count, and variant `scenarios` must keep the scenario count. Otherwise `resolveConfig` throws, which surfaces seeding mistakes in tests rather than in production.

Learners who have not onboarded see the base content. Nothing breaks.

---

## 7. Agent Lab

### 7.1 Learner flow
`/agent-lab` → pick an agent (ranked for you) → pick an OS → five steps → submit → a reviewer verifies → +40 XP.

| Step | Learner does | Server checks |
|---|---|---|
| 1 Get ready | Ticks the personalised checklist | Every plan readiness item ticked |
| 2 Install | Runs one listed command on their computer and pastes the version line | The version text matches the agent's pattern (Claude Code: `x.y.z (Claude Code)`; Codex: banner `codex … vX.Y.Z`; others: a semver). **Secret-key scan**: a match blocks the save and tells them to revoke the key. |
| 3 Sign in safely | Reads the access and safety notes, answers the API-key question ("like a recharge code"), confirms no key was pasted on our site | The quiz is graded on the server and the confirmation is required |
| 4 Simplify your prompt | Writes their natural first prompt, then rebuilds it as **Goal · Context · Constraints · Output · How I'll check it** | Minimum words per part, secret scan. The assembled prompt is built deterministically. No AI rewrites it. |
| 5 Result & screenshot | Describes what the agent produced (≥30 words) and how they verified it (≥15 words), and uploads a screenshot | The screenshot must be the learner's own image, uploaded from this lab run (`entityType=agent_lab`, `entityId=run`), and must not be AV-infected. Secret scan. |
| Submit | — | Automated checks are recorded (version match, no secrets, prompt structured, image, scan status). Reviewers, mentors and instructors are notified. |

Steps must be done in order (403 otherwise). A run is unique per learner and agent, and restarting it returns the same run.

### 7.2 Agent facts (verified 2026-11-04; re-verified 2026-11-07)

> The full step-by-step install guide, including prerequisites (terminal, Node.js and npm, Homebrew, VS Code), per-method checks and the Node version rule, is specified in **`docs/AGENT_LAB_SETUP_GUIDE_SPEC.md`**. That file is the source of truth for install facts.

| Agent | Install (excerpt) | Access requirement | Licence | Sources |
|---|---|---|---|---|
| **Claude Code** | `curl -fsSL https://claude.ai/install.sh \| bash` · `brew install --cask claude-code` · `irm https://claude.ai/install.ps1 \| iex` · `winget install Anthropic.ClaudeCode` | Pro, Max, Ultra, Team, Enterprise or Console account. The free claude.ai plan is excluded. Verify with `claude --version`. | Proprietary | code.claude.com/docs/en/setup |
| **Codex CLI** | `curl -fsSL https://chatgpt.com/codex/install.sh \| sh` · `brew install --cask codex` · `npm install -g @openai/codex` · Windows PowerShell installer | "Sign in with ChatGPT" (Plus, Pro, Business, Edu, Enterprise), or an API key with extra setup | Apache-2.0 | github.com/openai/codex, learn.chatgpt.com/docs/codex/cli |
| **OpenCode** | **v2 (re-verified 2026-11-07):** `curl -fsSL https://opencode.ai/v2/install \| bash` · `brew install anomalyco/tap/opencode-v2` · `npm i -g @opencode/cli@latest`. Windows: desktop download only ("Windows package managers are not supported") | Any provider's API key via `/connect`. OpenCode Models needs billing details | MIT | opencode.ai/docs, github.com/anomalyco/opencode |
| **Kilo Code** | VS Code Extensions → "Kilo Code" (pre-release), VS Code 1.84+ · CLI `npm install -g @kilocode/cli` | Free models through the Kilo Gateway (`/models` → `free`), which may be rate limited. **Auto Free may route to providers that log data**, so the UI warns not to send personal data. | MIT | kilo.ai/docs (installing, using-kilo-for-free), github.com/Kilo-Org/kilocode |

**Not verified, so not shown:**
- The Kilo Code VS Code extension ID
- A version command for OpenCode and Kilo (learners paste the installer or extension version instead; the reviewer judges the screenshot)
- Whether the ChatGPT Free plan includes Codex

**Operational rule:** program staff re-check the `source` links each cohort. `VERIFIED_ON` in `agentLab.ts` must be updated with each re-check.

### 7.3 Reviewer flow
- `/review/agent-lab` shows the automated checks, version output, both prompts, the screenshot (served inline only for images, `nosniff`), the result and the learner's verification note.
- Decisions are **Verify** or **Ask for changes**, and a note is required.
- **Claim-once:** a conditional update ensures only one reviewer decides. The second gets 409.
- Reviewers cannot verify their own proof, and reviewers in another tenant get 404.
- XP is +40, with idempotency key `agentlab:{tenant}:{user}:{agent}` and a hash-chained ledger. It is awarded once even after resubmission.
- Learners can fix and resubmit after "needs changes". Attempts are counted.

---

## 8. Safety, privacy and compliance

> **Child safety:** all under-18 rules (the policy table, verified guardian consent, revocation, coach rules and regulatory mapping) now live in **`docs/CHILD_SAFETY_POLICY.md`** and `lib/domain/childSafety.ts`. Those rules take precedence over this section.

| Risk | Control |
|---|---|
| Child uses a paid tool or a card | Under-18 without guardian consent cannot start paid agents (server-enforced); the checklist says no card; the existing rule of no purchases under 18 still applies |
| API key leaked in pasted text | Secret-pattern scan on every text field (Anthropic, OpenAI-style, GitHub, AWS, Google, PEM private keys) with a "revoke and rotate" message |
| Key or PII visible in a screenshot | Upload guidance ("crop out keys, emails…"), human review, AV scan, owner-or-reviewer-only access, and a production refusal when no scanner is configured (existing `files.ts`) |
| Free model providers logging prompts | Kilo Auto Free warning shown in the plan and in the lab |
| Personal data in profile text | PII patterns rejected in the field-of-interest and context-card fields |
| Prompt injection via the context card | Redacted and sent as user content, never as system content |
| Unfair grading across personas | Protected grading keys; one rubric; a human reviewer |
| DPDP rights | `learnerProfile` and `agentLabRuns` are included in **Download my data**; deletion requests cover them through the existing 30-day process |
| Auditability | Audit events `profile.created`, `profile.updated` (persona before and after, rules version), `agent_lab.started`, `agent_lab.submitted`, `agent_lab.verified`, `agent_lab.needs_changes` |

---

## 9. Roles

| Capability | Learner / Team lead | Reviewer · Mentor · Instructor | Program / Tenant admin | Others |
|---|---|---|---|---|
| Onboarding profile | Own only | — (403) | — | — |
| Agent Lab run | Own only | — | — | — |
| View the lab proof queue | — | ✓ (`review:read`) | ✓ if they hold `review:read` | Support ✓ (read) |
| Verify or ask for changes | — | ✓ (`review:decide`), never their own | — | — |
| See a lab screenshot | Owner | ✓ for `agent_lab` files | Moderators | — |

---

## 10. Data and API

**Tables** (migration `20261104120000_personalised_journey`):
- `learner_profiles`: tenantId, userId (unique together), persona, answers (JSON), contextCard, rulesVer, timestamps
- `agent_lab_runs`: tenantId, userId, agent (unique together), os, state (in_progress, submitted, verified or needs_changes), steps (JSON), versionOutput, promptBefore, promptAfter, resultSummary, screenshotId, autoChecks, reviewerId, reviewNote, verifiedAt, xpAwarded, attempts

**Endpoints:** all of them are tenant-scoped, CSRF-checked on mutations and rate-limited.

| Method | Path | Permission |
|---|---|---|
| GET / PUT | `/api/v1/profile` | signed in; PUT is for learners only |
| GET / POST | `/api/v1/agent-lab` | `learn:self` |
| POST | `/api/v1/agent-lab/{id}/step` | `learn:self`, own run |
| POST | `/api/v1/agent-lab/{id}/submit` | `learn:self`, own run |
| GET | `/api/v1/agent-lab/queue` | `review:read` |
| POST | `/api/v1/agent-lab/{id}/verify` | `review:decide` |
| GET | `/api/v1/files/{id}?inline=1` | owner, moderator, or reviewer for lab files; inline for images only |

**UI:**
- **My Path** (`/onboarding`): the questions, then the plan
- **Agent Lab** (`/agent-lab`)
- **Agent Lab Proofs** (`/review/agent-lab`), with a pending count in the nav
- **Mission Control**: shows "Shape the journey around you" as the next best action until onboarding is done, and the persona label afterwards
- **Level workspace**: shows a "Personalised for your path" banner and the persona demo

---

## 11. Success metrics

All of these can be computed from our own tables. No external analytics are assumed.

| Metric | Definition | Source |
|---|---|---|
| Onboarding completion | Learners with a `learner_profiles` row ÷ active learners | profiles, memberships |
| Time to working agent | `verifiedAt − agent_lab_runs.createdAt`, median by persona | agent_lab_runs |
| Setup drop-off | Last completed step for runs not submitted | `agent_lab_runs.steps` |
| First-time verification rate | Runs verified on attempt 1 ÷ runs submitted | attempts, state |
| Level 1 pass rate by persona | Approved Level 1 ÷ enrolled, grouped by persona | progress, profiles |
| Secret-leak saves blocked | Count of 400s with the secret message (add a counter — §13) | logs |

Targets should be set by the program team after one cohort of baseline data. We do not invent targets.

---

## 12. Acceptance criteria and tests

| # | Criterion | Test (`test/personalisation.test.ts`) |
|---|---|---|
| A1 | Each of the five kinds of learner maps to the correct persona | *maps each kind of learner to a persona* |
| A2 | Minors get no card item, have paid agents blocked, and are unblocked once a guardian approves | *keeps minors safe…* |
| A3 | Pace, mode, track and OS readiness follow the answers | *sets pace, mode, track…* |
| A4 | Invalid answers and PII are rejected | *validates answers and rejects personal data* |
| A5 | Variants cannot change grading; counts are enforced | *variants change content but never grading rules* |
| A6 | Base content before onboarding, persona content after; keys stripped; other variants never sent | *shows base content before onboarding…* |
| A7 | Grading uses the variant the learner saw | *grades against the persona variant…* |
| A8 | Persona is derived on the server and audited | *derives the persona on the server…* |
| A9 | Staff cannot create a learning profile | *staff cannot create a learning profile* |
| A10 | Profile included in the data export | *includes the profile in the learner's data export* |
| A11 | Secret detection | *detects common secret formats* |
| A12 | Minor blocked from paid agents on the server | *blocks paid agents for a minor…* |
| A13 | Step order, secret block, version check, quiz and prompt rules | *enforces step order…* |
| A14 | Only the learner's own screenshot for this run is accepted; reviewer can open it, another learner cannot | *accepts only the learner's own screenshot…* |
| A15 | XP only after human verification, once, tenant-scoped, no self-verification, hash chain intact | *awards XP only after human verification…* |
| A16 | Resubmit after "needs changes" | *lets a learner fix and resubmit…* |

Manual checks done in a real browser (Next dev on port 3100, 2026-11-04):
- Onboarding produced the Engineering Professional plan.
- The Agent Lab showed the ranked agents and rejected invalid version output with the documented hint.
- Level 1 showed the engineering briefing with the personalised banner.

---

## 13. Enterprise enhancements: recommended next (not built)

1. **Variants for Levels 2–15**, authored when those levels are authored. The schema and engine already support it.
2. **Variant authoring UI** for instructors (`content:manage`), with a preview per persona and the structural guards above.
3. **Adaptive difficulty**: use quiz `wrong[]` indices and boss results to recommend a remediation lesson. Rules first, measured per persona before rollout.
4. **AI-assisted screenshot pre-check** (only when `ANTHROPIC_API_KEY` is set): Claude reads the screenshot and flags "agent not visible" or "possible key visible" for the reviewer. It stays *advisory*; the human decides.
5. **Guardian consent workflow**: email a signed consent link to the guardian. This needs an email provider (see PENDING_CREDENTIALS).
6. **Cohort persona analytics** on the admin dashboard: the metrics in §11 by persona and cohort.
7. **Variant effectiveness evaluation**: compare Level 1 pass rate and time-to-verify across cohorts before and after variants. Only ship a variant change that does not lower outcomes for any persona.
8. **Localised variants** (hi, te, ta, kn, ml), reviewed by native speakers. They must not be machine-translated without review.
9. **Agent fact re-verification job**: a scheduled check that the source URLs still respond, raising a task for staff to re-verify. It never auto-edits commands.
10. **Secret-block counter** in metrics, and an optional "I revoked the key" follow-up.
11. **Chromebook path**: document a browser-based or Linux-container setup once it has been tested on real devices.
12. **SSO and HRIS import** for corporate cohorts, pre-filling role and profession (needs the corporate portal).

## 14. Open items and honest gaps

- **PDF Activity 1 outputs** ("your niche and three project ideas") and **Activity 2** ("your promise to yourself") are not built as separate artefacts. They should be added to Level 2 when it is authored, or as a pre-Level-1 "Kick-off" if the program team wants the exact PDF order.
- **Business-owner boss scenarios** use the base (tiffin) set. A dedicated set is optional.
- The **Agent Lab is outside the six-activity Level 1 framework** and gives standalone XP (+40). If the program wants it to gate Level 1, add it as an unlock condition after a cohort pilot.
- **Version patterns for OpenCode and Kilo Code** accept any semver, because no official version command was verified. The reviewer's screenshot check is the real control.
- **Vendor terms and pricing change.** The access rows in §7.2 must be re-verified each cohort, and legal should confirm that recommending paid third-party tools to learners is acceptable under the institution's policies (add to PENDING_LEGAL).
