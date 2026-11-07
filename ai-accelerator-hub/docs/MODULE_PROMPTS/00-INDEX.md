# Module Build Prompts — Index (run in order)

Each file is a self-contained build prompt for one module. Run top to bottom. Do not skip gates.

Order:
- [M01](M01-auth-multitenant.md) — Auth & multi-tenancy (BRD-02). Foundation. No dependencies.
- [M02](M02-learning-journey.md) — 15-level journey (BRD-03). Depends on M01.
- [M03](M03-gamification.md) — Gamification (BRD-04). Depends on M02.
- [M04](M04-ai-ecosystem.md) — 5 AI assistants (BRD-05). Depends on M01, M02.
- [M05](M05-github-lab.md) — GitHub Lab (BRD-06). Depends on M02.
- [M06](M06-community.md) — Community & creator (BRD-07). Depends on M01, M05.
- [M07](M07-hackathons-eval.md) — Hackathons & evaluation (BRD-08). Depends on M02, M03, M06.
- [M08](M08-career-marketplace.md) — Career tracks & marketplace (BRD-09). Depends on M02, M05.
- [M09](M09-payments.md) — Payments & revenue (BRD-10). Depends on M01.
- [M10](M10-security-privacy.md) — Security, privacy & safety (BRD-11). Depends on all above. Hardening pass.
- [M11](M11-ops-analytics.md) — Ops, analytics & deploy (BRD-12). Depends on all above.
- [M12](M12-showcase.md) — Vision showcase + standalone (BRD-01). Depends on all above. CEO demo last.

How to run each prompt:
1. Read the module file.
2. Execute Build steps in order.
3. Run the ARB gate. If any item fails, fix before continuing.
4. Run the NFR gate. If any item fails, fix before continuing.
5. Run the red-team review. Treat every finding as a defect.
6. Run Acceptance commands. All must pass.
7. Mark Done only when all four pass: build + ARB + NFR + red-team + acceptance.

Gates:
- ARB = Architecture Review Board. Checks decisions, boundaries, tenant isolation, data model.
- NFR = Non-functional requirements. Checks performance, security, accessibility, i18n, residency.
- Red-team = adversarial review. Tries to break, cheat, leak, or spoof the module.

Source of truth: `MASTER BUILD PROMPT §1-37`, `docs/RTM.md`, `docs/BRDs/`.
