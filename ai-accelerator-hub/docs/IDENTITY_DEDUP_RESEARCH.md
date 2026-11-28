# Duplicate accounts: industry research and decisions

| | |
|---|---|
| Date | 2026-11-28 |
| Purpose | Keep the evidence behind `docs/IDENTITY_DEDUP_SPEC.md` so later work (self-service secondary emails, SSO, auto-merge, CRM sync) starts from it. |
| Method | Web searches on identity resolution, Auth0/Okta account linking, and CDP / Salesforce duplicate management. Vendor docs are authoritative for how the products behave; vendor blogs are marketing and are marked as such. Numbers in examples are illustrations, not standards. |

## 1. What the industry does

| Practice | Evidence | Use here |
|---|---|---|
| **Deterministic first.** Link on exact, normalised identifiers (account id, verified email, GitHub id). Rigid but safe. | Hightouch, Amperity, BlueConic identity-resolution docs | `emailKey` (Gmail dots, `+tags`, googlemail) and GitHub id = **certain**. |
| **Probabilistic as a second layer.** Score name and contact similarity; finds typos and changed emails but is "not 100% accurate". | Hightouch, Amperity | Name + look-alike email = **likely**. Name alone = **possible**. |
| **Match policy follows risk.** Merges that affect accounts, access or fraud need stricter rules than marketing analysis. | Amperity | Accounts carry roles, XP, minors: merges are Super Admin only. |
| **Measure false merges and missed matches**, and test common names, shared households, changed contact info. | Amperity / vendor guidance | Tests cover "Priya Sharma" (common name) and "Mami Kumar" (shared first name). |
| **Three bands: auto, review, ignore.** Oracle CDM: above the auto-merge threshold merges, medium goes to a data steward; also caps how many records auto-merge (default 10). One DZone example uses 0.75 / 0.50. | Oracle docs; DZone (illustrative) | Certain = bulk merge button; likely = merge one by one; possible = counted only. Our likely cut-off is 0.75 email-name similarity. |
| **Prefer not merging over a bad merge.** | BlueConic | The tombstone keeps every conflicting row; nothing is deleted. |
| **Fuzzy rules need at least one exact condition.** | Microsoft Dynamics 365 Customer Insights | A likely match needs a name match and an email-name match; name alone never acts. |
| **Block vs alert.** Salesforce duplicate rules can *block* creation or *allow with an alert* and log the pair in a duplicate record set. Admins commonly start with alert + report and move to block once patterns are known. | Salesforce Trailhead / admin guides | Sign-up: **certain = block, likely = alert** then review. |
| **Same email is not proof of the same person.** Auth0 links only verified emails, and its Account Link extension makes the person sign in to the existing account first, because a verified email does not prove they control both. | Auth0 docs and support articles | Never auto-link a new sign-up to an existing account by name. Secondary emails come from an admin merge, or (future) from the owner proving the mailbox with a link while signed in. Normalise email case before lookup (an Auth0 known issue). |

## 2. Decision: sign-up with a likely duplicate (decision 1 of 8)

Options were *block* or *allow after confirmation*. Taken as the owner of the product, on this evidence:

- **Certain (same mailbox / GitHub): block.** Deterministic, no real-person false positives, and the database enforces it.
- **Likely: ask once, then allow, then review.** A false block loses a real new learner and gives them a support ticket; a duplicate that gets through is cheap to fix with the merge tool and shows in the report. This is the Salesforce "alert and report" pattern, which teams use until they have enough data to tighten it.
- **Never auto-link or auto-merge on name.** (Auth0, BlueConic.)
- **Admin add and CSV import still refuse likely matches**, because an admin can simply use the existing email.

Implemented: `POSSIBLE_DUPLICATE` (409) with a masked email; the form offers Sign in, Reset password and "This is not me"; `confirmNewAccount: true` creates the account.

**Revisit when** the report shows many confirmed-new accounts that later merged (then tighten to a block) or very few (then keep).

## 2b. Decision: who merges (decision 2 of 8)

Owner's answer, which matches the "auto, review, escalate" pattern in section 1: **(1) automatic for certain matches, (2) the institution admin merges by hand inside their own institution, (3) anything else becomes a ticket for a Super Admin.**

- Automatic runs are capped at 25 groups and skip groups of more than 5 accounts (Oracle's record cap idea); a failed or oversized group becomes a ticket instead of blocking the run.
- An institution admin may merge only when every account in the group belongs to their institution and no other, and none is a Super Admin. The same person in two institutions is a Super Admin job, because a merge moves data in both.
- Out-of-scope groups show masked emails to an institution admin, with **Send to Super Admin**.
- One open ticket per set of accounts (database-enforced), and both accounts are row-locked during a merge, so two people acting on the same duplicates cannot collide; the later one gets a clear "already merged" and the ticket closes as `already_merged`.

## 2c. Decisions 3, 4, 5: what survives a merge

| Question | Evidence | Decision |
|---|---|---|
| **Which account is kept** (record-level survivorship) | MDM guides (Oracle, Profisee, Talend) pick the master record by source trust and completeness, then attribute by attribute; stewards can override. | Keep the order: has a password (it is the one in use), Super Admin, most activity (completeness), GitHub, oldest as the tie-break. The person merging can choose another account in the panel. |
| **Which name is kept** (attribute-level) | Completeness scores beat plain recency, which batch updates distort (Profisee). | The fuller name when one contains the other ("Mami Dala Reddy" over "Mami Dala"); otherwise the primary's. The other name stays in the audit entry. |
| **Role clash in the same institution** | Least-privilege guidance (UK NCSC "10 steps", Canadian Cyber Centre, an NHI-governance article on merged environments): do not union or take the maximum of permissions on a merge; recompute from the business role and review; keep privileged accounts apart from daily-use ones. | **Reverses my first recommendation (keep the higher role).** The primary's role stays; a higher role on the other account is recorded (`roleClashes`) so someone grants it deliberately. A group with a Super Admin account is never merged automatically. |

Search limits: none of these sources describes a user-account merge workflow specifically; they cover MDM survivorship and least privilege in general, and the mapping to accounts is my reading.

## 2d. Decision 6: the owner's own emails

Owner's decision: **removing a secondary email is the customer's own choice and needs no verification.** Research decision for adding: **an added email must be confirmed before it counts.**

- Microsoft's MSRC and the "Pre-hijacked accounts" study (35 of 75 popular services vulnerable) say the root cause is not verifying that the user owns the identifier; the fix is a verification email completed before the identifier is used.
- Auth0's linking guidance adds that the confirmation is opened while signed in to the account being changed.
- A practitioner post (not OWASP itself; I could not confirm the OWASP wording) suggests notifying the old address when the main email changes. Built.
- Not adopted: a 24 to 72 hour delay before a new main email is trusted (practitioner suggestion; the old address is notified instead).

What this means in the product: a pending email cannot sign in, reset a password, or block the real owner (an unconfirmed claim is deleted when the real owner signs up or adds it); removal is one click with no extra step; the main email can only be moved to a confirmed one.

## 2e. Decisions 7 and 8: minors and rollout

**Minors (7).** DPDP s.9 treats everyone under 18 as a child and needs verifiable parental consent without prescribing the mechanism; the Schedule 4 education exemption is limited. The sources are law-firm commentary, not the statute, and none says whether *merging* a child's accounts counts as new processing. So the decision is the conservative one, and the legal question goes to counsel (`PENDING_LEGAL.md`):
- a merge never loosens anything (most protective settings win, consent is never inferred from an adult record);
- groups with a minor are never merged automatically; an admin or Super Admin decides, with the panel marking the learner as under 18;
- a guardian's email cannot become the learner's own email.

**Rollout (8).** GitHub's "Safe Rollout" ladder (report-only, staged, shadow, direct), PlanGrid's dry-run migration behind a flag and Unleash's "small reversible steps" all say: run the real logic without acting first. Decision: the migration is additive and ships first; the daily job is report-only until `IDENTITY_AUTOMERGE=on`; a Super Admin can merge deliberately from day one. Turn it on after one or two days of reports look right.

## 3. Not yet built, in priority order
1. (done) Owner adds a secondary email in Settings, proven with an emailed link while signed in.
2. A "possible duplicate" count on the Super Admin home so the review queue is not forgotten.
3. A "grant role" shortcut on the merge result, using the recorded `roleClashes`.
4. Tune the automatic run limits (25 groups, 5 accounts per group) after the first real runs.
5. Undo for a merge, built on the tombstone.

## Sources
- [Verifiable consent for children under the DPDP Act (ELP)](https://elplaw.in/wp-content/uploads/2026/04/Verifiable-consent-for-processing-personal-data-of-children-under-the-DPDP-Act.pdf), [Chambers: schools and platforms processing children's data](https://chambers.com/articles/schools-coaching-centres-platforms-processing-children-s-data-are-you-compliant), [FPF: verifiably safe processing of children's data](https://fpf.org/wp-content/uploads/2023/11/Verifiably-safe-processing-of-childrens-personal-data-under-the-DPDPA-2023-A-Catalogue-of-Measures2.pdf)
- [GitHub: safe rollout](https://github.github.com/gh-aw/practices/safe-rollout/), [PlanGrid: safely migrating records](https://medium.com/plangrid-technology/safely-migrating-millions-of-database-records-across-thousands-of-devices-f9ea98f941dc), [Unleash: feature flags for migrations](https://docs.getunleash.io/guides/feature-flags-for-migrations)
- [Microsoft MSRC: pre-hijacking attacks](https://msrc.microsoft.com/blog/2022/05/pre-hijacking-attacks) and the paper [Pre-hijacked accounts](https://arxiv.org/pdf/2205.10174); practitioner post [Secure secondary email changes](https://dev.to/sophiax99/secure-secondary-email-changes-1pg4)
- [Oracle: survivorship rules](https://docs.oracle.com/en/cloud/saas/sales/oacdm/survivorship-rules.html), [Profisee: MDM survivorship](https://profisee.com/blog/mdm-survivorship/), [Talend: master record rules](https://help.qlik.com/talend/en-US/data-stewardship-getting-started-guide/Cloud/setting-rules-and-values-for-master-records)
- [UK NCSC: managing user privileges](https://gov.uk/government/publications/10-steps-to-cyber-security-advice-sheets/10-steps-managing-user-privileges--11), [Canadian Cyber Centre: administrative privileges](https://cyber.gc.ca/en/guidance/managing-and-controlling-administrative-privileges-itsap10094), [NHIMG: least privilege in merged environments](https://nhimg.org/faq/what-do-teams-get-wrong-about-least-privilege-in-merged-environments/)
- [Hightouch: deterministic identity resolution](https://hightouch.com/docs/identity-resolution/deterministic) and [probabilistic](https://hightouch.com/docs/probabilistic-idr/overview)
- [Amperity: deterministic, probabilistic, hybrid](https://amperity.com/blog/identity-resolution-techniques-probabilistic-deterministic-hybrid)
- [BlueConic: probabilistic and deterministic matching](https://www.blueconic.com/resources/probabilistic-and-deterministic-matching-explained)
- [Auth0: link user accounts](https://auth0.com/docs/manage-users/user-accounts/user-account-linking/link-user-accounts) and [Account Link extension](https://auth0.com/docs/customize/extensions/account-link-extension.md)
- [Oracle CDM: implement automerge](https://docs.oracle.com/en/cloud/saas/customer-data-management/fagcd/implement-automerge.html)
- [Microsoft: data unification and deduplication](https://learn.microsoft.com/en-us/dynamics365/customer-insights/data/data-unification-concepts-deduplication)
- [Salesforce Trailhead: duplicate management](https://trailhead.salesforce.com/modules/sales_admin_duplicate_management/units/sales_admin_duplicate_management_unit_1) and [admin blog](https://admin.salesforce.com/blog/2017/deal-duplicates-two-tactics-use-today)
- [DZone: multi-signal ML pipeline for CRM dedup](https://dzone.com/articles/multi-signal-ml-pipeline-crm-deduplication) (illustrative thresholds)
