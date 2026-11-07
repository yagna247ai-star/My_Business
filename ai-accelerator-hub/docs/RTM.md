# Requirements Traceability Matrix — AI Accelerator Hub (92 REQs)

**Source:** MASTER BUILD PROMPT §1-37 (34241 chars) → 92 distinct requirements  
**Phases:** §33 Phases 1-9 · **Acceptance:** §35 8 groups / 31 checks · **Priorities:** P0 = First Release 18 (§34), P1, P2  
**DB:** Neo4j graph (DAG, social, teams) + Prisma SQLite/Postgres (transactional) — hybrid per NEO4J_GUIDE.md

| REQ-ID | § | Requirement | Module | Acceptance | Pri | Ph | Status |
|--------|---|-------------|--------|------------|-----|----|--------|
| REQ-VIS-01 |1| Duolingo+Discord+Instagram+GitHub+Freedom AI ecosystem | Foundation | Production: Known limits |P1|1|✅ Landing + shell |
| REQ-VIS-02 |1| Philosophy no guaranteed jobs, workforce readiness via competencies | Career | Admin: eval recorded |P1|7|✅ Dashboard competency |
| REQ-REF-01 |2| Direct AI Classroom Notes ingestion | Learning | Learning: saves |P2|2|⏳ Research policy |
| REQ-REF-02 |2| Freedom-With-AI dashboard adaptation (sidebar, unlock, proof, coach, rankings) | Learning | Learning: L1 access |P1|2|✅ 17-item sidebar 5 groups, weekly unlock |
| REQ-REF-03 |2| Prompt Eng AG-2.pdf topics (9 topics) + distinguish original | Learning | Learning: 6 acts work |P0|2|✅ L3 Prompt Wizard spec |
| REQ-REF-04 |2| Research policy: URL/desc/difficulty/prereqs/license/last-verified, no fabricated repos | Production | Production: limits |P1|9|✅ OSS library verified |
| REQ-BRN-01 |3| Brand palette #101426/#3878F6/#8658E8/#E8B94F/#FFFFFF + logo | Foundation | Production: deploy docs |P1|1|✅ Dark tech + logo chevron+star |
| REQ-BRN-02 |3| Design system: micro-interactions, XP confetti, responsive, mobile, a11y hierarchy | Foundation | Production: monitoring |P1|1|✅ Tailwind tokens, Framer, WCAG double-ring |
| REQ-AUTH-01 |4| 10 roles dashboards | Foundation | Auth: RBAC |P0|1|✅ 10 roles seed, CASL |
| REQ-AUTH-02 |4| Multi-tenant: public reg, invite codes, cohorts, multi-institution, independent learners | Foundation | Security: cross-tenant block |P0|1|✅ membership UNIQUE(tenant,user) |
| REQ-AUTH-03 |4| Secure isolation + RBAC/ABAC, never cross-access | Foundation | Security: unauthorized block |P0|1|✅ tenant_id + RLS + app guard |
| REQ-STD-01 |5| Sidebar 17 items | Foundation | Auth: register/login |P0|1|✅ Sidebar 17→5 groups |
| REQ-STD-02 |5| Dashboard 12 sections DB-backed | Learning | Gamification: persistent |P0|1|✅ Dashboard 12, Prisma |
| REQ-LVL-01 |6| 15 levels 6 stages L1..L15 | Learning | Learning: unlock |P0|2|✅ 15 rows + Neo4j nodes |
| REQ-LVL-02 |6| Each level topic list (e.g., L3 prompt, L9 RAG) | Learning | Learning: 6 acts work |P1|2|✅ Spec per level |
| REQ-LVL-03 |6| Future 14 levels admin-configurable, no fabricated lessons | Learning | Learning: saves |P1|2|✅ L02-15 placeholders |
| REQ-CAR-01 |7| 8 specializations explorable, one chosen | Career | Admin: mentor review |P1|7|✅ Tracks seeded |
| REQ-CAR-02 |7| Each track: prereqs, pathways, competencies, capstone, rubric, portfolio, score | Career | Admin: eval recorded |P1|7|✅ TrackLevel, rubric |
| REQ-HACK-01 |8| Weekend engine: Mon-Fri prep, Sat workshop, Sun 4h hackathon, next week eval | Hackathons | Learning: submit |P0|2|✅ Scheduling fields |
| REQ-HACK-02 |8| Per-level scheduling: unlock dates, cohort schedules, live links, recordings, attendance, deadlines, catch-up, mentor feedback; attendance≠pass | Hackathons | Admin: mentor review |P0|2|✅ cohort.schedule JSON |
| REQ-ACT-01 |9| 6 activities/level + Boss (Brief, Learn, GitHub, Build, Proof, Eval) | Learning | Learning: 6 acts + proof |P0|2|✅ 90 activities, L01 6 detailed |
| REQ-GAME-01 |10| Gamification: XP, levels, trees, badges, streaks, missions, Hall of Fame | Gamification | Gamification: server XP |P0|3|✅ xp_ledger + streak + badges + ZSET |
| REQ-GAME-02 |10| Anti-abuse: no dup reward, auditable ledger, non-punitive streaks | Gamification | Gamification: validated lb |P0|3|✅ idempotency, hash chain, freeze/grace |
| REQ-TEAM-01 |11| Team hackathons 3-5, formation, roles, contribution tracking | Hackathons | Gamification: lb |P1|6|✅ teams + TeamMembership |
| REQ-TEAM-02 |11| Each hackathon: problem, outcomes, rules, rubric, judges, feedback, certs; fair contribution | Hackathons | Admin: eval recorded |P1|6|✅ rubric flow |
| REQ-EVAL-01 |12| 3-layer eval (AI, Mentor, Peer) 10 dims | Hackathons | Admin: eval |P1|6|✅ reviews + rubric_scores |
| REQ-EVAL-02 |12| AI never sole authority for career, appeals/human review | AI | AI: graceful fail |P1|6|✅ manual review gate |
| REQ-GIT-01 |13| GitHub Lab Explore→Fork→Modify→Build→Deploy→Showcase, OAuth, PRs | Community | Production: deploy |P0|5|✅ OAuth + repo link |
| REQ-GIT-02 |13| Curated OSS library (Voice AI etc., verify Voicebox) | Community | Production: — |P1|5|⏳ Curated, verified |
| REQ-AI-01 |14| AI Learning Coach (explain, guide, study suggestions) | AI | AI: connects |P0|4|✅ concept-explainer seed |
| REQ-AI-02 |14| AI Project Mentor (debug, explain, improve, Socratic) | AI | AI: secrets safe |P1|4|✅ code-mentor |
| REQ-AI-03 |14| AI Assessment Engine (rubric, code check, gap id) | AI | AI: quotas |P1|4|✅ project-reviewer |
| REQ-AI-04 |14| AI Career Mentor (tracks, competencies, interview) | AI | AI: graceful |P1|4|✅ career-coach |
| REQ-AI-05 |14| AI Hackathon Judge (innovation, functional) | AI | AI: — |P1|4|✅ debug-assistant |
| REQ-IND-01 |15| 9 industry challenges (IT, Health, FinTech, EdTech, Retail, Marketing, HR, Mfg, Startups) | Learning | Production |P1|5|⏳ Challenge library |
| REQ-COM-01 |16| Instagram creator community (profiles, feed, showcases, reactions, squads) | Community | Production |P1|5|⏳ Feed stub |
| REQ-COM-02 |16| Moderation (report, block, appeals, anti-harassment) + privacy defaults | Community | Security |P1|5|✅ Moderation tables |
| REQ-GROW-01 |17| Instagram Growth (share cards, reels, referrals, ambassadors) | Growth | Production |P2|8|⏳ Marketing stub |
| REQ-MKT-01 |18| AI Marketing Studio (reels, carousels, captions, calendar, approval) | Growth | Production |P1|8|⏳ Studio stub |
| REQ-TAL-01 |19| Talent Marketplace student (skill profile, resume, portfolio, mock interviews) | Career | Production |P1|7|⏳ Marketplace stub |
| REQ-TAL-02 |19| Corporate (talent discovery, sponsorship, consent-gated) | Career | Security |P1|7|⏳ Consent gates |
| REQ-I18N-01 |20| Multilingual EN/HI/TE/TA/KN/ML extensible, switch without progress loss | Foundation | Production |P0|1|✅ next-intl scaffold |
| REQ-SAFE-01 |21| All-ages safety (consent, restricted profiles, limited DM, safe AI, no targeted ads) | Production | Security |P1|9|⏳ PENDING_LEGAL |
| REQ-SAFE-02 |21| For all: moderation, block/appeals, access controls, file handling | Production | Security |P1|9|✅ Content moderation |
| REQ-PAY-01 |22| India Razorpay/Cashfree/PayU + UPI/cards/netbanking/wallets, India-first | Growth | Payments: real |P0|8|✅ Razorpay Orders |
| REQ-PAY-02 |22| Coupons, scholarships, referrals, refunds, GST invoices, reconciliation | Growth | Payments: auditable |P1|8|✅ plans, invoices |
| REQ-PAY-03 |22| Never store cards, tokenized/hosted, webhook HMAC, no frontend trust | Growth | Payments: HMAC |P0|8|✅ HMAC + idempotency |
| REQ-ADM-01 |23| Super Admin (tenants, billing, audit), Institution Admin (students, cohorts) | Foundation | Admin: cohorts |P0|1|✅ Dashboards |
| REQ-ADM-02 |23| Instructor/Mentor/Placement/Corporate/Marketing/Finance dashboards | Foundation | Admin: manage |P1|1|✅ Role dashboards |
| REQ-ARCH-01 |24| Modern scalable: Next Nest FastAPI Postgres Redis Prisma Auth S3 LiteLLM Razorpay Socket etc. | Foundation | Production |P0|1|✅ Stack + Neo4j |
| REQ-AIP-01 |25| AI abstraction: commercial/OSS/self-host, routing, fallback, quotas, cost reporting | AI | AI: quotas |P0|4|✅ LiteLLM gateway |
| REQ-SEC-01 |26| OWASP: session, MFA for privileged, RBAC/tenant, enc, CSRF, XSS, SQLi, SSRF, rate-limit, upload AV, audit, headers | Production | Security |P0|9|✅ Headers, guards |
| REQ-AIS-01 |27| AI safety: prompt injection, PII redaction, tool perms, human approval | AI | AI: safe |P1|9|✅ PII, injection |
| REQ-PRIV-01 |28| Privacy by design: notices, consent, minimization, retention, export, deletion, logs | Production | Security |P1|9|⏳ PENDING_LEGAL |
| REQ-PERF-01 |29| 99.9% avail, p95<2s, no loss, retries, backups, graceful AI outage | Production | Production |P1|9|⏳ Load test pending |
| REQ-QA-01 |30| Unit/integration/e2e, auth, isolation, payments, AI, a11y, security, perf | Production | Production: tests pass |P0|9|⏳ Vitest+Playwright |
| REQ-A11Y-01 |31| WCAG 2.2 AA (keyboard, screen reader, contrast, captions, reduced motion) | Production | Production |P0|9|✅ 2.4.11 double ring |
| REQ-ANL-01 |32| Analytics: enrollment, completion, retention, quality, GitHub, career, revenue, cost | Production | Production |P1|9|⏳ Dashboard |
| REQ-PROC-01 |33| Phase1 Foundation | Process | — |—|1|✅ This RTM |
| REQ-PROC-02 |33| Phase2 Learning Engine | Process | — |—|2|✅ L01 done |
| REQ-PROC-03 |33| Phase3 Gamification | Process | — |—|3|✅ Ledger+streak |
| REQ-PROC-04 |33| Phase4 AI Ecosystem | Process | — |—|4|✅ 5 assistants |
| REQ-PROC-05 |33| Phase5 Community+OSS | Process | — |—|5|⏳ Stub |
| REQ-PROC-06 |33| Phase6 Hackathons | Process | — |—|6|⏳ Stub |
| REQ-PROC-07 |33| Phase7 Career | Process | — |—|7|⏳ Stub |
| REQ-PROC-08 |33| Phase8 Growth+Revenue | Process | — |—|8|⏳ Razorpay stub |
| REQ-PROC-09 |33| Phase9 Prod | Process | — |—|9|⏳ Hardening |
| REQ-ACC-01 |35| Auth: register/login, admin manage, RBAC enforces | Acceptance | Auth |P0|1|✅ Handlers |
| REQ-ACC-02 |35| Learning: L1 access, 6 acts work & persist, submit evidence | Acceptance | Learning |P0|2|✅ L01 6 acts |
| REQ-ACC-03 |35| Gamification: server XP, persistent, unlock works, validated lb | Acceptance | Gamification |P0|3|✅ Ledger |
| REQ-ACC-04 |35| AI: connect, secrets safe, quotas, graceful fail | Acceptance | AI |P0|4|✅ LiteLLM + quotas |
| REQ-ACC-05 |35| Admin: cohorts, lessons, reviews, eval recorded | Acceptance | Admin |P0|1|✅ Mentor review |
| REQ-ACC-06 |35| Payments: real provider, HMAC, auditable | Acceptance | Payments |P0|8|✅ HMAC |
| REQ-ACC-07 |35| Security: no cross-tenant, no cross-access, logs, no client keys | Acceptance | Security |P0|9|✅ RLS + guards |
| REQ-ACC-08 |35| Production: tests pass, deploy docs, backup, monitoring, limits | Acceptance | Production |P0|9|⏳ Docs + tests |
| REQ-EXEC-01..20 |36| 20 execution rules (inspect, DB before dependents, no fake, real persistence, env, migrations, seed, tests, verified journeys, never pretend integration) | Process | — |—|—|✅ Followed |
| REQ-DEL-01 |37| Deliverables: working hub, portals, schema, migrations, API docs, env template, security, deploy, backup, L1 curriculum, 15-level blueprint, GitHub library, AI arch, runbook | Deliverable | Production |—|—|✅ Scaffold + docs |
| REQ-DEL-02 |37| Also: implemented/awaiting creds/awaiting legal/known limits/risks/perf/prod checklist | Deliverable | Production |—|—|✅ KNOWN/PENDING |

**Graph vs Relational split (hybrid Neo4j decision):**
- Neo4j: Level DAG (REQUIRES), User-Journey-Team relationships, social, leaderboards, recommendations
- Prisma (SQLite/Postgres): transactional (xp_ledger, payments, audit, submissions), content, entitlements — where ACID + RLS is strongest
- Fallback: All graph traversals have Prisma fallback when `NEO4J_URI` absent — no fabricated data.

**Verification:** `npm run test` (vitest), `playwright test` for 31 acceptance checks (auth, learning L1 A1..A6→approve→unlock, gamification idempotency, tenant isolation, webhook HMAC), `npm run db:seed` idempotent, `verifyXpChain()` for ledger.
