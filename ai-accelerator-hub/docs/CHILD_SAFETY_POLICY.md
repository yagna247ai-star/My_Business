# Child Safety Policy — Learners Under 18

| | |
|---|---|
| Version | 1.0, 2026-11-06 |
| Status | **Engineering controls are built and tested. Legal sign-off is pending** (see `PENDING_LEGAL.md`). This document does not claim compliance with any law. |
| Code | `apps/web/lib/domain/childSafety.ts` is the single policy table. It is used by feed, hackathon, talent, showcase, account settings, the AI coach, the Agent Lab (through `personalise.ts`) and payments |
| Tests | `apps/web/test/child-safety.test.ts` has 11 tests. The full suite has 90 tests and all pass |
| Applies to | Every learner whose age band is `minor`, whatever their persona. Age decides safety; persona never does |

---

## 1. Principles
1. **Default deny.** Anything social, public, paid or career-facing is off for under-18s until a verified guardian consent is recorded. Some things stay off even with consent.
2. **The server decides.** Age comes from `UserSetting.ageBand`, set at registration. The client can never claim to be an adult. A learner account without a settings row is treated as a minor without consent.
3. **Consent is verified by a person, audited, and can be revoked.** Revoking it rolls back everything consent opened.
4. **Collect as little as possible.** Only the birth year is collected; no date of birth or ID documents. Guardian contact is stored only for minors.
5. **Learning is never blocked.** Lessons, builds, reviews, XP, badges and the AI coach work for every learner, with or without consent.

## 2. Age at registration
| Rule | Implementation |
|---|---|
| Age is calculated as the **youngest possible** age from the birth year (`currentYear − birthYear − 1`) | `account.ts → register`. A learner born in December 2008 is treated as 17 in January 2026 |
| Under 13: no self-registration; the school or guardian enrols them | `register` returns 400 |
| 13–17: a guardian email is required, and the account starts with `ageBand=minor`, `guardianConsent=pending`, a private leaderboard and no global opt-in | `register` |
| Quiet hours are on by default | `UserSetting.quietHours` |
| Turning 18: staff with `members:manage` press **Turned 18** in Admin → People, choose how age was confirmed, and add a note with no identifiers. The guardian contact is erased and privacy settings are **not** opened up. Audited as `age_band.adult_confirmed` | `childSafety.ts → confirmAdult` |

## 3. Policy table (`CHILD_POLICY`)
| Action | Under 18, no consent | Under 18, verified consent | Where enforced |
|---|---|---|---|
| Lessons, builds, proofs, XP, badges, AI coach | ✅ | ✅ | — |
| Read the community feed | ✅ | ✅ | — |
| Post or comment in the community | ❌ | ✅ (no emails or phone numbers in the text) | `feed.ts → createPost`, `createComment` |
| React to posts | ❌ | ✅ | `feed.ts → toggleReaction` |
| Create or join a hackathon team | ❌ | ✅ | `hackathon.ts → createTeam`, `joinTeam` |
| Publish to the showcase | ❌ | ✅ | `showcase.ts → publish` |
| Leaderboard visible to the cohort | ❌ | ✅ | `account.ts → updateSettings` |
| Visible across institutions | ❌ | ✅ | `account.ts → updateSettings` |
| Paid AI agents (Claude Code, Codex CLI, OpenCode) | ❌ (Kilo Code free models are allowed) | ✅ | `personalise.ts → buildPlan`, `agentLab.ts → startRun` |
| Talent profile visible to recruiters | ❌ | ❌ **never** | `talent.ts → upsertProfile`; `discoverTalent` always excludes minors |
| Apply to jobs or internships | ❌ | ❌ **never** | `talent.ts → applyToOpportunity` |
| Purchases | ❌ | ❌ **never** (a guardian or the institution buys) | `payments/razorpay.ts` |
| Behavioural analytics or cohort insights about the child | Excluded | Excluded | `insights.ts` |
| Advertising | None on the platform | None | No ad code exists |

## 4. Guardian consent
- **Who records it:** staff with `members:manage` (tenant admin) in the **same institution**, from **Admin → People**. Mentors and reviewers can't, staff in another institution get 404, and nobody can record consent for themselves.
- **How it's verified:** one of three methods:
  - a signed school or institution consent form
  - the guardian confirming in person
  - the guardian confirming on a contact the institution already holds

  A note is required (10–500 characters), and notes that contain phone numbers, emails or 12-digit ID numbers are rejected.
- **Audit:** `guardian_consent.granted` and `guardian_consent.revoked` record who acted, the before and after state, the method and the note. The learner gets an in-app notification.
- **Revoking** makes all of these private again in one transaction:
  - the leaderboard entry
  - visibility across institutions
  - the talent profile
  - showcase projects
  - membership of open hackathon teams

  Community actions are blocked again. Learning progress is untouched.
- **Not built:** an online guardian consent link sent by email needs an email provider (`PENDING_CREDENTIALS.md`). Until then, consent is collected offline by the institution and recorded by staff, which is the normal school workflow.

## 5. AI coach for under-18s
`CHILD_COACH_RULES` is added to the system prompt for every minor, whatever their persona. The coach must:
- use age-appropriate language
- never ask for personal information
- refuse sexual, romantic, violent, gambling, drug or other age-inappropriate content
- not help get around age limits, parental controls or tool terms
- not recommend paid services
- give homework hints, not finished answers
- respond to signs of danger, bullying or self-harm by encouraging the learner to speak to a trusted adult now, and to contact local emergency services if they are in danger

The learner's own text (questions, context card) stays in the user turn, with personal data redacted. It is never placed in the system prompt.

## 6. Community safety (all ages; stricter for minors)
- Feed posts are visible to the learner's own institution only, and authors are shown by display name only.
- Anyone can report content or block another user; moderators (`community:moderate`) see the queue.
- Minors can't post emails or phone numbers.
- **Agent Lab help requests** (`docs/AGENT_LAB_GET_UNSTUCK_SPEC.md` §5) are supervised support, not private messaging. A request goes to the institution's staff queue (mentors, reviewers, instructors), is visible to all of them, and is audited. Peers never see it. For minors, emails and phone numbers are rejected, and every message is redacted.
- **There's no private messaging between users on the platform.** Keep it that way for minors: any future direct-messaging feature must exclude them by default and be reviewed first.

## 7. Content and curriculum for under-18s
Every level spec (`docs/level-specs/L01`–`L15`) has a Young Coder section that applies these rules:
- no faces, names, school names or uniforms in any upload, image or video
- deployments and repos are private or unlisted unless a guardian has consented
- only free tools or tools the guardian has approved, and the learner never signs up with a false age
- GitHub activity uses the noreply email address, and GitHub's own minimum age applies
- under-18s can't recruit or interview strangers
- in Level 15, "career readiness" becomes "learning readiness", and the talent marketplace stays closed

## 8. Regulatory mapping (for counsel; not a compliance claim)
| Framework | What it requires (summary) | Our engineering control | Counsel to confirm |
|---|---|---|---|
| **India DPDP Act 2023, s.9** | A child is under 18. It requires verifiable consent from a parent or lawful guardian, no processing likely to harm a child's well-being, and no tracking, behavioural monitoring or targeted advertising directed at children | Guardian consent recorded with the method used; minors excluded from insights; no ads; private by default | Whether our offline-verified methods satisfy the DPDP Rules' "verifiable consent" requirements; whether educational institutions qualify for any exemption |
| **POCSO Act 2012 (India)** | Protects children from sexual offences, with reporting obligations | Reporting and blocking; minors can't share contact details; no direct messages; coach rules | An escalation and reporting procedure, and who reports to authorities |
| **IT Act 2000 and IT Rules 2021 (India)** | Intermediary due diligence and grievance handling | Moderation queue and audit log | Whether the platform is an intermediary; who the grievance officer is |
| **COPPA (US)** | Verifiable parental consent for under-13s | Under-13s can't self-register | Whether US users are in scope |
| **GDPR Art. 8 (EU)** | Parental consent below 16 (a member state may set 13–16) | Consent model already covers all under-18s | Whether EU users are in scope |
| **UK Age Appropriate Design Code** | High privacy by default, no harmful nudges, profiling off by default | Private defaults, quiet hours, no profiling of minors | Whether streaks and XP count as "nudge techniques" for minors (§10) |

## 9. Acceptance criteria and tests (`test/child-safety.test.ts`)
| # | Criterion | Test |
|---|---|---|
| C1 | Default deny; "never" actions stay closed even with consent; revoked = denied | *denies by default for minors…* |
| C2 | Coach rules cover personal data, harmful content, bypassing limits and getting help | *coach rules cover…* |
| C3 | Age uses the youngest possible value | *uses the youngest possible age…* |
| C4 | A minor without consent can't post, comment, react or join teams; adults are unaffected | *blocks a minor without consent…* |
| C5 | Only same-institution `members:manage` staff can record consent; no adults; no identifiers in the note | *staff without members:manage…* |
| C6 | After consent, the community opens, contact details are still blocked, and career features stay closed | *after verified consent…* |
| C7 | Minors are never in talent discovery | *never shows a minor in talent discovery…* |
| C8 | Revoking rolls back every consent-gated setting and notifies the learner | *revoking consent rolls back…* |
| C9 | Staff without a settings row are adults; learners without one are minors | *treats staff without a learner settings row…* |
| C10 | Under-18s get a welcome-back message instead of a streak countdown; adults are unchanged | *sends under-18s a calm welcome-back message…* |
| C11 | Moving a learner to adult at 18: staff only, same institution, no identifiers in the note, guardian contact erased, privacy unchanged, audited | *moves a learner who turned 18 to adult…* |

## 10. Open items
1. ~~Age band at 18~~: **built** (2026-11-07). Staff confirm it in Admin → People. There's still no automatic change, because the birth year isn't stored.
2. **Guardian online consent link and guardian dashboard.** Needs an email provider.
3. ~~Streaks for minors~~: **built** (2026-11-07). Under-18s get a calm "Welcome back" message with no countdown and no warning tone (`streak.ts`). The "at risk" label on the streak chip is still shown to everyone; counsel's "nudge" review (`PENDING_LEGAL.md` (e)) decides whether to soften it.
4. **Incident escalation runbook** (POCSO). It needs to define who acts, how fast, and how evidence is preserved. Counsel and the institution's safeguarding lead must write it.
5. **Third-party tools.** Age terms for the tools named in the curriculum are re-checked each cohort (level-specs index, rule 5).
6. **Uploads.** Screenshots and files from minors are reviewed by a person. An optional AI pre-check for faces or personal data is in the parent spec, §13.
