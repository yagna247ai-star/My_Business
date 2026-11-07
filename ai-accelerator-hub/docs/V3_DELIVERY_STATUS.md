# AI Accelerator Hub — Delivery Status (2026-11-04)

Honest status against MASTER BUILD PROMPT §34–§37. Supersedes the claims in `KNOWN_LIMITATIONS.md` where they differ.

## Verified working (tests + live production build)
- **Security fixes to the previous code:** every old API route acted as `student@aihub.in` with no auth — retired to `apps/web/_retired/`. Hard-coded auth secret fallback removed in production. Server Actions wildcard origin removed.
- **Auth & RBAC:** credentials sign-in, brute-force lockout (5 fails / 15 min), 10-role permission matrix, deny by default, role/tenant re-read from DB on every request.
- **Tenant isolation:** all queries scoped by tenant; verified live (cross-tenant read → 404) and in tests.
- **Registration:** public or invite code → cohort; age rules (<13 blocked, <18 needs guardian email, private by default, purchases blocked).
- **Level 1 "AI Explorer" (§6, §9):** six real activities, answer keys server-only, server grading, ordered gating, build-brief validation incl. personal-data detection, proof with safe-URL checks, Boss (3 attempts).
- **Evaluation (§12):** human rubric review, enforced pass rule, automated checks shown as suggestions only, appeals resolved by a different person.
- **Gamification (§10):** append-only SHA-256 hash-chained XP ledger, idempotency keys, server-side amounts, non-punitive streak (freeze → grace → 7-day recovery), declarative badges, privacy-aware standings.
- **Payments (§22):** Razorpay order creation (needs keys), HMAC-verified webhook, event-ID dedupe, amount-mismatch flagging, GST-inclusive invoices. Frontend success is never trusted.
- **AI (§14, §25, §27):** Anthropic provider via official SDK (`claude-opus-5-5`, server-side refusal fallbacks), quota, secret/PII redaction, usage+cost ledger, honest `AI_NOT_CONFIGURED` without a key.
- **Admin:** analytics from real rows, people/roles/suspend, nudges, cohorts + invite codes + weekend sessions, audit log, ledger verification.
- **Privacy (§28):** visibility, consent (audited), data export, deletion request.
- **Open-source library (§13):** 24 projects from `/Users/apple/Documents/ThinkNous/GenAI-Projects` resolved to their true upstream; licence/activity from GitHub API; licence class + usage guidance. **24/24 verified.** `mutonby/openshorts` is itself a fork of `kamilstanuch/Autocrop-vertical`, which has no licence, so it is listed as study-only.
- **Showcase (§34.12):** opt-in publishing of reviewer-approved work, institution-only visibility, guardian consent required for minors, author-only removal.
- **Added by parallel work (present and covered by tests):** hackathons with teams and peer review, community feed with reactions, comments, reports, blocking and a moderation queue, talent marketplace (consent-gated profiles, opportunities, applications), career page, file uploads with type/size checks and antivirus quarantine (refuses uploads in production without a scanner).
- **Tests:** `cd apps/web && npx vitest run` → 39/39 pass (28 integration tests on a freshly migrated DB). Re-verified 2026-11-04 after a setup fix (global-setup now uses `node --import tsx/esm`; `npx tsx` dies with EPERM in sandboxed shells). `next build` succeeds (57 app routes + middleware; run with hub `.env` loaded for `NEXTAUTH_SECRET`/`DATABASE_URL`).
- **Build gotcha (fixed):** hub `.env` sets `NODE_ENV=development`. Sourcing it into `next build` poisons prerendering (dev/prod React mix → `useContext of null` on `/`). `apps/web` build script now forces `NODE_ENV=production`. Rebuilt green with the poisoned env still exported.

## Awaiting credentials (code ready, not live)
`ANTHROPIC_API_KEY` (AI coaches) · `RAZORPAY_KEY_ID/SECRET/WEBHOOK_SECRET` · `GITHUB_CLIENT_ID/SECRET` (OAuth) · `GITHUB_TOKEN` (library re-verify) · email/SMS provider (guardian consent, notifications are in-app only) · `REDIS_URL` (rate limits are per-instance in memory).

## Awaiting legal review
DPDP / child-protection compliance, guardian-consent workflow, terms & privacy notice text, GST registration (`COMPANY_GSTIN`).

## Not yet built (pending)
Levels 2–15 content (shown as "being authored"; L3 needs the Prompt Engineering AG-2.pdf, which was not found) · marketing portals (corporate/placement Talent page covers discovery + posting) · Instagram/marketing studio · full i18n strings · Postgres live migration + backups/restore drill (RLS SQL reviewed in `packages/db/pg/`, not applied — no live PG here), monitoring, load tests · Playwright e2e spec in CI.

## Shipped 2026-11-04 — talent marketplace + corporate/placement surface
Consent-gated profiles (private default; public needs DPDP opt-in; minors need granted guardian consent) · skill-match discovery with reasons shown, no opaque ranking · opportunities (internship/job/project/sponsorship) + applications with consent snapshots, withdraw + re-apply · poster shortlist/reject, applicant notify · tenant-isolated throughout. Career page (profile, opportunities, applications) + Talent page (discovery, posting, applicants). 5 new integration tests; suite 61/61; build green (8 new API routes + 2 pages).

## Shipped 2026-11-04 — personalised journey + Agent Lab
From `UI-design/Hackathon · Freedom With AI (4).pdf`. Spec: `docs/PERSONALISED_JOURNEY_BUSINESS_SPEC.md`.
- **Onboarding** (`/onboarding`): questions place each learner in one of 5 personas (young coder, student, engineering professional, AI builder, business owner) using deterministic, versioned rules. The persona is derived on the server; age and consent come from the server.
- **Plan**: pace, mode, track, emphasis levels, agent ranking, a personalised readiness checklist and a coach tone hint.
- **Level 1 persona variants**: briefing problem and check question, learn demo, build hints and boss scenarios. Grading keys are protected, so everyone meets the same bar.
- **Agent Lab** (`/agent-lab`): Claude Code, Codex CLI, OpenCode and Kilo Code, with install facts verified against vendor docs on 2026-11-04. Five steps: get ready, install with version check, safe sign-in quiz, five-part prompt builder, result and screenshot. Every text field has a secret-key scan.
- **Verification**: a human reviewer verifies at `/review/agent-lab` (claim-once, no self-verification). +40 XP, idempotent and hash-chained.
- **Minors**: paid agents are blocked until a guardian approves.
- **Data**: the profile and lab runs are included in the DPDP export.
- 16 new tests; suite 79/79; `tsc` clean.

## Shipped 2026-11-04 — upload validation + AV gating
Allowlisted types (images/PDF/short video), 10MB cap, extension↔MIME match, path-traversal-safe tenant keys; ClamAV INSTREAM when `CLAMAV_HOST` set (fail-closed on error/timeout), `skipped` in dev/test, uploads refused (503) in prod without a scanner; infected files quarantined and never served; serve-gated to owner + moderators. 5 new integration tests; suite 56/56; build green.

## Shipped 2026-11-04 — community feed + moderation
Tenant-scoped posts/comments/reactions/reports/blocks. Feed hides blocked users both directions and hidden/removed content; SSRF-checked links; self-reports and duplicate open reports blocked. Moderators (mentor/support/program_mgr/tenant_admin) work a queue: hide/remove/dismiss with audit + notify reporter/author. Learner Feed page (composer, likes, replies, reports) + Moderation page in Program group. 4 new integration tests; suite 51/51; build green (7 new API routes + 2 pages).

## Shipped 2026-11-04 — weekend hackathon engine + teams + peer review
`Hackathon` (draft→open→building→submit→review→closed, forward-only) · team formation capped 3–5 with one-team-per-hackathon enforced · window-gated entries with SSRF-safe URLs and 50-word reflections · deterministic round-robin peer review (2 reviewers, never your own team; advisory only, judges decide) · judge decisions award +10 XP participation / +25 win, idempotent · tenant-isolated throughout. 8 new integration tests; suite now 47/47; build green (11 new routes: 9 API + 2 pages).

## Known limitations
SQLite dev DB · in-memory rate limiting · mouse-click automation failed in the test tool (in-page events used for UI e2e) · demo passwords in `seed-v3.ts` (refuses to run in production without `ALLOW_DEMO_SEED=1`).
