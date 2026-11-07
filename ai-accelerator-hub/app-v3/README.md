# AI Accelerator Hub — Web App v3

A working, role-based front end for the AI Accelerator Hub, built from the product's own specs (`docs/`), not from the reference screenshots. Everything runs locally on demo data, so each business flow can be tried end to end. The engine mirrors the server contracts, so every screen maps one-to-one onto a production API.

## Run it

| Option | How |
|---|---|
| Single file | Open `../standalone-v3.html` (double-click works) |
| Dev (modules) | Serve the repo root, e.g. `python3 -m http.server 8765`, then open `http://127.0.0.1:8765/app-v3/` |
| Rebuild the single file | `node app-v3/build.mjs` |
| Domain tests | `node app-v3/tests/engine.test.mjs` (15 rule tests; no browser needed) |

Reset any time: **user menu → Reset demo data**, or **Settings → Demo controls**.

## Try the core loop (≈ 3 minutes)

1. **Learner · Mission Control.** The "Next best action" points to *Explore GitHub*.
2. **Explore.** Read the repo and answer two code questions: +10 XP, streak +1.
3. **Build.** Write `class Cookie` in the editor (Tab inserts spaces) and press **Run tests**. When all 4 pass, enter a GitHub URL and press **Detect my push**: +35 XP.
4. **Submit Proof.** Enter a reflection of at least 50 words and tick the 3 checks: +5 XP. The proof is now in the review queue.
5. **Review & Boss.** Run the Mould Trial: add `Cookie.count` and `@classmethod total_baked()`. You get 3 attempts.
6. **User menu → Switch role → Reviewer.** Open the submission and click **Start from AI suggestion**. Adjust the scores and Approve. The rule is weighted average ≥ 3.0 **and** Boss ≥ 2.
7. **Switch back to Learner.** A celebration plays. Level 1 is approved, Level 2 is unlocked, the *First Proof* and *OOP Done* badges are earned, and XP is 170.
8. **Switch to Program Manager.** See the funnel, learners at risk (send a nudge), and **Audit & Integrity → Verify now**.

## Architecture

```
index.html            shell markup + script order (no framework, no build step)
css/core.css          design tokens (light/dark), shell, base components
css/features.css      feature components: palette, stepper, rubric, charts, badges…
js/core/util.js       escaping, icons, dates (IST), hash, safe storage, download/copy
js/core/seed.js       reference data from docs: 15 levels, 5 stages, 6-activity framework,
                      L01 content + rubric, 12 badges, 8 tracks, personas, cohort
js/core/engine.js     domain rules: state + persistence, XP ledger, streak, badges,
                      gating, review workflow, notifications, audit, telemetry, export
js/core/i18n.js       EN / हिन्दी / తెలుగు for shell and navigation
js/ui/components.js   toast, dialog (focus trap), headers, charts, confetti, command palette
js/ui/shell.js        role-based nav, top bar, notifications, router + RBAC guard
js/pages/*.js         learner · community · staff · settings modules (register routes/actions)
js/main.js            composition root: theme/motion, event delegation, shortcuts, boot
```

**Patterns**
- **One store.** All state changes go through `E.commit(mutator)`, which persists and re-renders.
- **One delegated listener per event type.** Clicks, changes and form submits are each handled at the document level and routed by `data-action`, `data-change` and `data-form` attributes. There are no inline handlers.
- **Routes declare which roles can see them.** The router enforces that and audits denied access.
- **Text is escaped before rendering.** User text is always escaped first; links are added only after escaping.
- **Storage never throws.** State saves under the key `ah3_state_v1`, with a schema version, and stays in sync across browser tabs.

## Roles (architecture doc §1, permission matrix §5.2)

| Role | Home | Can do |
|---|---|---|
| Learner | Mission Control | Journey, Level workspace, tracks, achievements, standings, feed, library, launch wall, AI coaches, settings, data export |
| Reviewer | Review Queue | Score proofs on the rubric, approve or request changes, moderate the feed, use coaches |
| Program Manager | Cohort Analytics | Funnel, streak health, review SLA, learners at risk + nudges, audit log, ledger verification, event stream; read-only review queue |

The other 7 canonical roles from the architecture doc are not modelled in this front end yet.

## Requirement traceability (docs/RTM.md)

| REQ | Implemented here |
|---|---|
| REQ-ACT-01 | 6 ordered, gated activities. Level 1 is fully interactive: check question, quiz with 60% pass, code reading, build tests, proof, Boss |
| REQ-LVL-01/03 | 15 levels, 5 stages with exit gates. Unauthored levels show "being authored", never fake lessons |
| REQ-GAME-01/02 | Append-only XP ledger, idempotency keys, hash chain + verification, 12 declarative badges, tiers and ranks, non-punitive streak (freeze → grace → recovery) |
| REQ-EVAL-01/02 | Weighted rubric `L01_RUBRIC`, enforced pass rule, AI pre-review shown as a suggestion only, required feedback for changes, resubmission history |
| REQ-AUTH-01/03 | 3 role workspaces, route guards, denied access is audited |
| REQ-HACK-01 | Weekly cadence strip: Mon–Fri prep, Saturday workshop, Sunday 4-hour sprint |
| REQ-AI-01..04, REQ-AIP-01, REQ-AIS-01 | Concept Coach, Code Mentor (Socratic), Career Coach. Daily quota, graceful outage, API-key redaction, context from the current step |
| REQ-COM-01/02 | Cohort feed: tags, likes, replies, report, staff moderation, auto-hold for spam/selling |
| REQ-CAR-01/02 | 8 tracks with competence gates and capstones, shortlist |
| REQ-I18N-01 | Language switch with no progress loss. Untranslated content is flagged |
| REQ-PRIV-01 | Leaderboard visibility, opt-in global standings (with consent audit), JSON data export, deletion request |
| REQ-A11Y-01 | Skip link, landmarks, focus traps, roving tabindex, live regions, labelled controls, reduced-motion setting, AA contrast tokens |
| REQ-ANL-01 | Cohort KPIs, funnel with targeted advice per drop, weekly active, review SLA, CSV export |

## Simulated in the demo vs. production

| Here (demo) | Production |
|---|---|
| Engine runs in the browser on `localStorage` | NestJS services + Postgres (RLS) + Redis; same rules, server-side |
| Build/Boss checks are static checks in the browser | Pushed commit runs `pytest` in an isolated runner (GitHub webhook) |
| "Detect my push" waits 0.9 s and derives a SHA | GitHub App webhook records the real commit SHA |
| Ledger hash = FNV-1a (16 hex chars) | SHA-256 chain written in the same DB transaction as the award |
| Coach replies are scripted | LiteLLM gateway with RAG over course content, per-tenant quotas |
| Analytics numbers are seeded aggregates | Materialised views refreshed by a job (every 15 min) |
| Role switch is a menu item | Auth.js session; one role per tenant membership; MFA for staff |

## Security headers (set at the edge, not in HTML)

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), geolocation=(), microphone=(self)
```

These apply to the modular build. The single-file bundle inlines its scripts, so it needs a nonce- or hash-based `script-src` instead of `'self'`.

## Keyboard

| Keys | Action |
|---|---|
| ⌘/Ctrl K or `/` | Command palette |
| `g` then `m` / `j` / `r` / `a` / `c` / `s` / `f` | Go to Mission Control / Journey / Review / Analytics / Coaches / Settings / Feed |
| `?` | Shortcut help |
| `Esc` | Close any panel |

## Known limits

- **Partial translation:** Hindi and Telugu cover the shell and navigation only; page bodies stay in English and are flagged.
- **Only Level 1 is authored.** Levels 2–15 show the "being authored" state.
- **Media is not bundled.** Lesson videos, recordings and launch-wall links show a demo notice.
- **Shared browser state:** demo state lives in one browser profile, so all three roles share it. This is intentional, so you can switch roles and watch one flow from every side.
