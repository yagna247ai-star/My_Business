# M10 — Security, Privacy & Safety (BRD-11 · §21 §26 §27 §28 §31 · REQ-SEC/SAFE/AIS/PRIV)

## 1. Objective
Harden every prior module: OWASP, privacy by design, all-ages safety, accessibility.

## 2. Prerequisites
- M01–M09 built (this is a hardening pass over all of them, not a standalone feature).

## 3. Build steps
1. Apply OWASP controls: session, MFA for privileged, RBAC/tenant, enc transit/at rest, validation, CSRF/XSS/SQLi/SSRF, rate limit, brute-force, upload AV, audit, headers, dep scan.
2. Apply privacy: notices, consent, minimization, retention, export/delete, access logs, breach runbook.
3. Apply all-ages safety: age-aware registration, parental consent where required, private-by-default, limited DM, moderated community, safe AI, restricted purchases, reporting/escalation.
4. Apply AI safety: prompt-injection defenses, PII redaction, tool perms, human approval for consequential actions.
5. Apply WCAG 2.2 AA: keyboard, screen reader, contrast (gold on navy, not gold on white), captions, reduced motion.

## 4. ARB gate
- Is there one authZ enforcement point per layer (not per-handler improvisation)?
- Are secrets inventoried (no key in bundle, storage, logs, or repo)?
- Is PII handling documented per field (collect → store → retain → delete)?
- Are consequential AI actions allow-listed with human approval?

## 5. NFR gate
- Security headers + rate limits on all routes. Uploads scanned/quarantined.
- DPDP ap-south-1 residency documented. Backups encrypted + restore-tested.
- Accessibility: full keyboard flow, focus-visible rings, `prefers-reduced-motion` respected.

## 6. Red-team review
- Run the M01/M04/M05/M09 red-team cases again after hardening. All must still block.
- Try uploading a malicious file as project evidence. Must validate/quarantine.
- Try prompt-injecting an assistant to publish content. Must refuse (approval gate).
- Try exporting another user's data via export endpoint. Must scope to self + log.

## 7. Acceptance
- `verify.mjs` security group green; headers present; audit logs append-only.
- Legal review is PENDING (`PENDING_LEGAL.md`) — never claim compliance without counsel.

## 8. Done criteria
Hardening verified adversarially. No claimed compliance. Risks documented.
