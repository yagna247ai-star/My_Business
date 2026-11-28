# Pending Legal Review — AI Accelerator Hub

**Version:** 1.0 — 2026-11-04
**Requirement:** §21 All-Ages Safety, §26 Security Guardrails, §27 AI Safety, §28 Privacy/DPDP — legal review required before production launch. Do not claim automatic compliance.

## Pending Reviews

| Area | Sections | What’s built (engineering) | What requires counsel |
|------|----------|----------------------------|------------------------|
| **DPDP Act (India)** | §28, §21, §22 | Purpose limitation, consent artifact, DSR export/delete, ap-south-1 residency, cross-border with consent, WORM audit logs, tenant offboard soft→hard delete | Qualified Indian DPDP counsel must review privacy notices, consent flows, retention schedules, breach response, data processing agreements |
| **Age-appropriate & Child Protection** | §21 | Age-aware registration, parental consent hooks, restricted profiles/messaging for minors, no targeted ads on sensitive data, grooming/harassment safeguards, limited purchases for minors, reporting/escalation | POCSO, IT Act, COPPA/GDPR-K equivalent review; additional safeguards for minors; qualified child-safety counsel |
| **Healthcare/Finance simulations** | §15 | Challenges use safe educational simulations, not real PHI/financial advice | Domain expert + legal review for regulated-industry challenges |
| **Payments & GST** | §22 | Razorpay hosted/tokenized, no card storage, GST-ready invoices, reconciliation | CA + legal review for GST invoicing, refund workflows, recurring mandates |
| **AI Safety & IP** | §27, §13 | Prompt injection defenses, PII redaction, human approval for consequential actions, license checks for OSS | AI risk counsel, OSS license compliance (Voicebox etc.) |

## Engineering holds until review

- No production launch checklist can be marked “compliant” — only “engineering controls implemented, awaiting legal sign-off.”
- Privacy notices and consent management are transparent but need counsel-approved wording.
- Moderation tools (reporting, blocking, appeals, anti-harassment) are built but need policy review.

## Action

- **Child safety policy** (`docs/CHILD_SAFETY_POLICY.md`, 2026-11-06). Counsel to confirm:
  - (a) whether offline-verified guardian consent (signed school form, guardian in person, or guardian confirmation on a contact the institution already holds) meets the DPDP Rules' "verifiable consent" requirements
  - (b) a POCSO escalation and reporting runbook with a named safeguarding lead
  - (c) whether the platform is an intermediary under the IT Rules, and who the grievance officer is
  - (d) whether COPPA, GDPR Art. 8 and the UK Age Appropriate Design Code are in scope
  - (e) whether streaks and XP for minors count as "nudge techniques"
  - (f) a process for moving a learner to adult at 18
  - (g) whether merging a minor's duplicate accounts counts as new processing needing fresh guardian consent (`docs/IDENTITY_DEDUP_SPEC.md` §3.20: merges keep the strictest settings and never infer consent)

- Agent Lab recommends third-party AI coding tools (Claude Code, Codex CLI, OpenCode, Kilo Code), some of them paid. Confirm this is acceptable under institution policy and consumer law, and that the minor-safety rule (paid agents blocked without guardian approval) is sufficient. Kilo "Auto Free" may route prompts to providers that log data; review the learner warning wording.
- Engage qualified legal counsel (India DPDP + child protection + payments + AI safety) before public marketing.
- Document review outcome in this file and update `README.md` compliance badges.

*This file must be cleared by counsel before removing “Pending” from production checklist.*
