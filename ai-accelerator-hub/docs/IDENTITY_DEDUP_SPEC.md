# One person, one account — Specification

| | |
|---|---|
| Version | 1.0, 2026-11-28 |
| Trigger | "We are getting duplicate users. We should not allow duplicate users… make one the primary and the second a secondary email… The profile should not display two different usernames. Some user called Mami Dala, Mami Dala something… bring only one user per platform, in a unique way." |
| Builds on | `docs/REGISTRATION_HOME_SPEC.md`, `docs/SUPER_ADMIN_EVERYWHERE_SPEC.md`, `docs/FORGOT_PASSWORD_SPEC.md` |
| Decisions | (1) `User` is the one person on the platform; institutions hold only memberships, so one person is one `User` row everywhere. (2) A person has one **primary** email (`users.email`, shown everywhere) and any number of **secondary** emails (`user_emails`). Any of them signs in and resets the password; only the primary is displayed. (3) **Revised 2026-11-28 after research (`docs/IDENTITY_DEDUP_RESEARCH.md`):** sign-up refuses the same mailbox or GitHub account (certain) outright. A likely match asks "Is this you?" once (sign in, reset password, or "This is not me"); if they confirm, the account is created and the pair shows in the Super Admin duplicate report. Admin add and CSV import refuse both levels and name the existing account. (4) **Revised 2026-11-28 (owner decision 2 of 8): three steps, cheapest first.** (a) *Automatic:* certain groups (same mailbox / GitHub) merge by themselves, daily and on demand. (b) *Institution admin, manual:* an institution admin merges likely and certain groups, but only when every account in the group belongs to **their institution only**. (c) *Ticket:* anything else (another institution is involved, a Super Admin account, too many accounts, or an automatic merge failed) becomes a ticket for a Super Admin, who merges from the ticket. A Super Admin can merge anything. Likely groups are never merged automatically, because two real people can share a name. (5) **Survivorship (decisions 3 to 5, 2026-11-28, `docs/IDENTITY_DEDUP_RESEARCH.md` §2c):** the account kept is the one with a password, then Super Admin, most activity, GitHub, oldest, and the person merging can override it; the name kept is the fuller one; a merge **never raises a role**: where both accounts belong to the same institution the primary's role stays and the higher one is recorded in the audit entry for a person to grant on purpose. (7) **Own emails (decision 6, 2026-11-28):** the owner adds a secondary email only after confirming it with an emailed link (pre-hijacking protection); removing one needs no verification. (6) A merge never deletes the second account: it keeps a tombstone (`mergedIntoId`) so nothing is lost and every conflict is auditable. |
| Code | `apps/web/lib/domain/identityCore.ts` (pure rules) · `apps/web/lib/domain/identity.ts` (DB: lookup, report, merge) · `apps/web/lib/domain/account.ts` (`register`) · `apps/web/lib/auth.ts` (`verifyCredentials`) · `apps/web/lib/domain/passwordReset.ts` · `apps/web/lib/domain/settingsAdmin.ts` (`createPerson`) · `apps/web/lib/domain/adminControl.ts` (import) · `app/api/v1/admin/people/duplicates/route.ts`, `…/duplicates/tickets/route.ts`, `…/duplicates/tickets/[id]/route.ts`, `app/api/cron/identity-merge/route.ts` (new) · `apps/web/vercel.json` (cron) · `components/settings/PeopleAdminTools.tsx` (`DuplicatesPanel`) · `packages/db/prisma/schema.prisma` (`UserEmail`, `User.mergedIntoId`) · migration `0027_identity_dedup` |
| Research | `docs/IDENTITY_DEDUP_RESEARCH.md` |
| Tests (emails) | `apps/web/test/identity-emails.test.ts` |
| Tests | `apps/web/test/identity-dedup.test.ts` (pure, in `test:pure`) · `apps/web/test/identity-merge.test.ts` (DB) |

---

## 1. Problem
The same person gets several accounts: they register with `mami.dala@gmail.com`, later with `mamidala@gmail.com` or `Mami.Dala+aihub@gmail.com`, and the platform treats them as different people. The unique index only blocks the exact same text. Admin "add person" and CSV import also match on exact text. Result: one learner appears as "Mami Dala" and "Mami Dala R" in lists, with split progress and XP, and a profile that can show two names.

## 2. Solution
Three layers.

1. **Canonical email key.** Every email gets a key: lowercase; for Gmail/Googlemail, dots in the name and everything after `+` are ignored and `googlemail.com` becomes `gmail.com`; for other domains only the `+tag` is ignored. `user_emails.emailKey` is unique, so the database itself refuses a second account on the same mailbox.
2. **Matching intelligence** (pure, no database) scores two accounts:

| Level | When | What happens |
|---|---|---|
| certain | same email key, or same GitHub id | Sign-up refused. Merge allowed in bulk. |
| likely | names are the same person (same words in any order, or one name is the other plus extra words, with at least two words) **and** the email names look alike (similarity ≥ 0.75) | Sign-up asks "Is this you?" once; confirmed sign-ups go ahead and are listed for review. Super Admin confirms each merge. |
| possible | name alone matches | Listed for review only. Never blocks, never merges by itself. |

3. **Merge.** A Super Admin picks the primary (the system suggests one: has a password, is Super Admin, has the most activity, has GitHub, is oldest). The second account's emails become secondary emails of the primary, every row it owns moves to the primary, and one display name is kept.

## 3. Behaviour
1. `emailKey("Mami.Dala+x@GoogleMail.com")` equals `emailKey("mamidala@gmail.com")`.
2. `nameMatch("Mami Dala", "dala mami")` is exact. `nameMatch("Mami Dala", "Mami Dala Reddy")` is subset. A single word (`"Mami"`) never matches as subset. Accents, case, dots and extra spaces are ignored.
3. Registration: if the email key belongs to any account (primary or secondary) the answer is the existing "An account with this email already exists. Try signing in." (409), and no flag can override it. If a likely duplicate exists the answer is 409 with code `POSSIBLE_DUPLICATE` and "You may already have an account (m•••@gmail.com)…"; the form shows Sign in, Reset password and "This is not me". Sending `confirmNewAccount: true` creates the account.
4. Sign-in and "forgot password" accept any email of the account (primary or secondary), by key. The session, profile, lists and notifications always show the primary email and one name.
5. Admin add person and CSV import: a matching email key attaches the existing account (as today for the same text). A likely duplicate under a different email is refused with the existing account named, so the admin uses that email instead.
6. Duplicate report (Super Admin): groups of certain and likely duplicates with the suggested primary and the reasons, plus a count of "possible" pairs. System accounts (`@system.local`) and merged tombstones are excluded.
7. Merge (Super Admin, one group or "merge all certain"): inside one transaction, (a) the second account's `user_emails` move to the primary as secondary, (b) its `githubId` moves to the primary if the primary has none, (c) every table with a user foreign key is repointed to the primary, skipping rows that would break a unique rule (the primary's row wins), (d) a skipped row in a table nothing else depends on is deleted; a skipped row in a table with dependants stays on the tombstone, (e) the second account becomes a tombstone: `mergedIntoId` set, password and GitHub id cleared, email changed to `merged-<id>@merged.invalid`, (f) the primary keeps `globalRole = super_admin` if either had it, (g) the display name becomes the fuller of the two when one contains the other, otherwise the primary's, (h) one audit entry `user.merged` records both ids, the emails moved and the count of skipped rows.
8. A merge is refused when the ids are equal, either account is missing, either is already merged, or either is a system account.
9. A merged person who signs in with their old email lands on the primary account.
10. Who may merge (`mergeScope`): a Super Admin, any group. An institution admin (`members:manage`, not Super Admin), only when **every** account in the group has memberships in their institution and in no other (any status), and none is a Super Admin. Everyone else gets 403. The report an institution admin sees lists only such groups; groups that touch other institutions show as "needs Super Admin" with **Send to Super Admin**.
11. Automatic merge (`autoMergeCertain`, daily cron `/api/cron/identity-merge` and the Super Admin button): merges certain groups only, at most 25 groups per run, skipping groups of more than 5 accounts. A skipped or failed group becomes a ticket (no requester, reason `auto_failed` or `too_many_accounts`). Each merge is audited as `user.merged` with `auto: true`.
12. Tickets (`duplicate_tickets`): created when an institution admin sends a group to Super Admin, when an institution admin tries a merge out of scope (the refusal offers the button), or by the automatic run. One open ticket per set of accounts: asking again returns the existing ticket. A Super Admin sees open tickets in the panel, opens one and chooses **Merge** (runs the normal merge, closes the ticket, notifies the requester) or **Reject** with a note (closes it, notifies the requester).
14. Roles: in an institution both accounts belong to, the primary's role stays. A different role on the second account is listed as `roleClashes` (`tenantId`, `kept`, `notCarried`) in the merge result and the `user.merged` audit entry. An institution the second account alone belongs to keeps its role (nothing is raised). The automatic run never merges a group that contains a Super Admin account (ticket reason `super_admin_account`).
16. **Adding a secondary email** (Settings → Profile → My emails, signed in): the address is stored as *pending* and a link goes to it. A pending email proves nothing: it cannot sign in, reset a password, or block anyone else's sign-up, and it expires after 24 hours. At most 5 emails per account, pending ones included.
17. **Confirming**: the link opens Settings → Profile while signed in to the same account; the same account confirms once, atomically. Another account, a used link or an expired one is refused.
18. **Removing a secondary (or pending) email needs no verification**: it is the owner's own choice (owner decision 6). The main email cannot be removed; make another one main first.
19. **Making an email main**: only a confirmed secondary. `users.email` changes, the old main stays as a secondary that still signs in, and a notice goes to the old address. Password reset goes to the address the person typed.
20. **Minors** (`docs/CHILD_SAFETY_POLICY.md`): a merge never loosens protection. If either account was a minor anywhere, the merged person is a minor in every institution; consent stays only where an institution recorded it for a minor and every minor record had it, otherwise it is `pending` (or `revoked` if any was revoked); the leaderboard is private unless consent is granted; global opt-in needs both accounts' agreement and consent. A learner cannot add their guardian's email as their own. The automatic run never merges a group containing a minor (ticket reason `minor_account`); the panel marks minors.
21. **Report-only first** (decision 8): the daily job only reports what it would merge, and merges only when the environment variable `IDENTITY_AUTOMERGE=on`. A Super Admin's "Merge all certain" button always merges.
15. The panel shows each group with a "keep this account" choice, pre-set to the suggestion; the chosen account becomes the primary.
13. No merge conflicts: both accounts are locked (`SELECT … FOR UPDATE`, in id order) inside the merge transaction, so two merges that touch the same account run one after the other; the second finds the account already merged and is refused with a clear message, and its ticket is closed as `already_merged`.

## 4. Data and API
- `user_emails` (new): `id`, `userId`, `email` (unique), `emailKey` (unique), `isPrimary`, `verified`, `createdAt`. `users.email` stays the primary and is mirrored in `user_emails` with `isPrimary = true`.
- `users.mergedIntoId`, `users.mergedAt` (new, nullable).
- Migration `0027_identity_dedup` creates both, backfills one row per user (`ON CONFLICT DO NOTHING`: users who share a key keep no row yet, and show up in the report), safe to run twice.
- `duplicate_tickets` (new): `id`, `tenantId` (nullable, requester's institution), `requestedById` (nullable), `accountIds` (JSON, sorted), `accountKey` (open tickets are unique per key), `primaryId`, `reason` (`out_of_scope`, `requested`, `auto_failed`, `too_many_accounts`), `note`, `status` (`open`, `merged`, `rejected`, `already_merged`), `resolvedById`, `resolvedAt`, `createdAt`.
- `GET /api/v1/admin/people/duplicates` returns the report for the caller's scope plus their tickets (a Super Admin gets all open tickets). `POST` with `{ primaryId, secondaryIds }` merges one group; `{ auto: true }` (Super Admin) merges every certain group.
- `POST /api/v1/admin/people/duplicates/tickets` `{ primaryId, secondaryIds, note? }` opens a ticket. `POST /api/v1/admin/people/duplicates/tickets/[id]` `{ action: 'merge' | 'reject', note? }` (Super Admin) resolves it.
- `GET /api/cron/identity-merge` (cron secret) runs the automatic merge; scheduled daily in `apps/web/vercel.json`.

## 5. UI
The People screen gets one compact "Duplicate accounts" panel (institution admins and Super Admins) reusing the existing card and button styles: each group shows the names and emails, the reason, the suggested primary, and a **Merge** button, or **Send to Super Admin** when it is out of scope. A Super Admin also sees **Merge all certain** and a short list of open tickets with **Merge** and **Reject**; an institution admin sees the status of their own tickets. Nothing else on screen changes. Profiles show the primary name and email only.

## 6. Acceptance criteria
- [x] AC-1: Given `Mami.Dala+x@googlemail.com` and `mamidala@gmail.com`, when keys are computed, then they are equal; `a@outlook.com` and `a+b@outlook.com` are equal; `a.b@outlook.com` and `ab@outlook.com` differ.
- [x] AC-2: Given names `Mami Dala`, `dala  MAMI`, `Mámi Dala`, then all match exact; `Mami Dala` vs `Mami Dala Reddy` is subset; `Mami` vs `Mami Dala` is none; `Priya Rao` vs `Priya Sharma` is none.
- [x] AC-3: Given two accounts with the same email key or the same GitHub id, when scored, then the level is `certain`.
- [x] AC-4: Given `Mami Dala <mami.dala@gmail.com>` and `Mami Dala R <mamidala22@yahoo.com>`, then the level is `likely`; given `Priya Sharma <priya@a.com>` and `Priya Sharma <zzqx@b.com>`, then `possible`, not likely.
- [x] AC-5: Given a mixed list, when grouped, then certain and likely accounts form one group (transitively), the group's confidence is the weakest link, and `possible` pairs are only counted.
- [x] AC-6: Given a group, when the primary is suggested, then the account with a password, Super Admin role, most activity, GitHub, then oldest wins, in that order.
- [x] AC-7: Given the fuller name contains the other, when the display name is chosen, then the fuller one is kept; otherwise the primary's.
- [ ] AC-8: Given a secondary-email sign-up, or a likely duplicate without confirmation, when registering, then no user is created; the likely message has code `POSSIBLE_DUPLICATE` and masks the email (`m•••@gmail.com`).
- [x] AC-14: Given actor and accounts, when scope is checked, then a Super Admin may merge any; an institution admin only when every account belongs to their institution alone and none is a Super Admin; others are refused with a reason.
- [x] AC-15: Given the same accounts in any order or primary, when the ticket key is made, then it is the same.
- [x] AC-16: Given groups, when the automatic plan is made, then only certain groups merge, groups over 5 accounts are escalated, and at most 25 merge per run.
- [ ] AC-17: Given an institution admin and a group inside their institution, when merging, then it succeeds and is audited; given a group that touches another institution, then it is refused with code `OUT_OF_SCOPE` and nothing moves.
- [ ] AC-18: Given a ticket, when a Super Admin merges it, then the accounts merge, the ticket is `merged` and the requester is notified; when rejected, `rejected` with the note; asking twice for the same accounts returns the same ticket.
- [ ] AC-19: Given an automatic run where one group fails, then the other groups still merge and the failed one has an open `auto_failed` ticket; the cron route refuses a call without the secret.
- [ ] AC-20: Given a ticket whose accounts were already merged elsewhere, when resolved, then it closes as `already_merged` without error.
- [x] AC-23: Given a primary, a secondary and a pending email, when removal is checked, then secondary and pending are allowed, the primary is refused, an unknown id is not found.
- [x] AC-24: Given the same rows, when "make main" is checked, then only a confirmed secondary is allowed.
- [x] AC-25: Given 4 emails one more is allowed; given 5 it is not.
- [ ] AC-26: Given an added email, when the link is opened by another account the owner's, or twice, then it is refused; by the owner once, the email signs in; an address owned by another account is refused; an unconfirmed claim never blocks that address's real owner.
- [ ] AC-27: Given a confirmed secondary, when the owner removes it, then it is gone and cannot sign in; the main email cannot be removed.
- [ ] AC-28: Given a confirmed secondary, when made main, then `users.email` changes, the old one stays a secondary that signs in, and the old address is notified.
- [ ] AC-29: Given five emails an add is refused; an unconfirmed email cannot be made main.
- [x] AC-30: Given a minor and an adult account, when merged, then the result is a minor with private leaderboard, no global opt-in and consent no stronger than the weakest minor record (DB test also checks the row).
- [x] AC-31: Given a certain group with a minor, when the automatic plan is made, then it is escalated as `minor_account` and nothing merges.
- [ ] AC-32: Given `IDENTITY_AUTOMERGE` is not `on`, when the cron runs, then it returns `dryRun: true` with counts and changes nothing.
- [ ] AC-33: Given a minor with a guardian email, when they add that email as their own, then it is refused.
- [ ] AC-21: Given both accounts in one institution with different roles, when merged, then the primary's role stays and `roleClashes` lists the other.
- [ ] AC-22: Given a certain group with a Super Admin account, when the automatic run happens, then nothing merges and an open `super_admin_account` ticket exists.
- [ ] AC-13: Given a likely duplicate and `confirmNewAccount`, when registering, then the account is created; given the same mailbox, then it is still refused.
- [ ] AC-9: Given a secondary email, when signing in or requesting a password reset, then the primary account is found.
- [ ] AC-10: Given two accounts with progress, XP, memberships (one institution in common), when merged, then every row points to the primary, the common-institution membership exists once, the tombstone cannot sign in, and one `user.merged` audit entry exists.
- [ ] AC-11: Given a learner (no `members:manage`), when calling the report or merge, then 403.
- [ ] AC-12: Given an already merged or system account, when merging, then it is refused.

## 7. Out of scope
- Phone numbers as identifiers, and a delay before a new main email is trusted for sensitive codes.
- Undoing a merge (the tombstone keeps the data, so a manual restore is possible).
- Fuzzy matching on phone number or date of birth (not collected).
- Learners under 18: merges involving a minor are allowed only for a Super Admin and keep the stricter guardian settings (`userSetting` of the primary wins).

## 8. Open questions
1. ~~Should "likely" sign-ups be allowed after the person confirms?~~ Decided: yes, once, then reviewed. See the research note.
2. ~~Should "merge all certain" run after each deploy?~~ Decided: no. The daily job starts report-only (`IDENTITY_AUTOMERGE` unset) and a Super Admin turns merging on after reading its report.
