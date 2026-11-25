# Super Admin Control Centre — Specification

| | |
|---|---|
| Version | 1.0, 2026-11-25 |
| Trigger | "The Super Admin should have every privilege: set or reset passwords, force a change, disable people, bulk operations on selected users, upload a CSV of members so all of them get access, edit people, content and journeys, assign roles including Institution Admin, and a separate access screen with checkboxes to give any member any access." |
| Decisions | Passwords are bcrypt hashes and **cannot be viewed by anyone**. The Super Admin sets them, sends reset links, or forces a change. Institution Admin can send reset links and run bulk operations, but cannot set passwords or change access. |
| Builds on | `docs/FORGOT_PASSWORD_SPEC.md` (reset tokens, mail), `apps/web/lib/server/rbac.ts`, `apps/web/lib/server/context.ts`, `apps/web/lib/domain/settingsAdmin.ts`, `apps/web/components/settings/PeopleSettings.tsx` |
| Code | `apps/web/lib/domain/adminControlCore.ts` (new, pure: CSV parsing, bulk rules, effective permissions) · `apps/web/lib/domain/adminControl.ts` (new) · `apps/web/lib/server/rbac.ts` (`effectivePerms`) · `apps/web/lib/server/context.ts` (`ctx.perms`) · `apps/web/lib/auth.ts` (force change) · routes under `apps/web/app/api/v1/admin/people/` (new) · `apps/web/app/api/v1/me/password/route.ts` (new) · `apps/web/app/(app)/settings/password/page.tsx` (new) · `apps/web/app/(app)/settings/access/page.tsx` (new) · `apps/web/components/settings/PeopleSettings.tsx` · migration `0014_admin_control` |
| Tests | `apps/web/test/admin-control.test.ts` (new, pure) |

---

## 1. Problem
The Super Admin cannot change anyone's password, force a change, or act on many people at once. People can only be added one at a time. Access is fixed by role, so giving one mentor the "manage content" right means changing their whole role. Learners cannot even change their own password once signed in.

## 2. Solution

| Capability | Super Admin | Institution Admin |
|---|---|---|
| Set a new password for a person (optionally "must change at next sign-in") | ✓ | — |
| Email a reset link | ✓ | ✓ |
| Force password change at next sign-in | ✓ | — |
| Suspend / reactivate (disable) | ✓ | ✓ |
| Bulk: select people → suspend, activate, send reset links, force change, set role, set cohort, set area, remove | ✓ | ✓ (no force change) |
| CSV import (name, email, role, cohort, area) → accounts created, everyone gets a "set your password" email | ✓ | ✓ |
| Assign any role, including Institution Admin | ✓ | ✓ (cannot assign Institution Admin) |
| Access screen: per-person checkboxes to grant or remove any permission on top of their role | ✓ | — |
| Edit content, levels, journeys | ✓ (existing Admin → Content / Journeys) | ✓ |

## 3. Behaviour
1. **Passwords.** `POST /api/v1/admin/people/:id/password` `{ password?, mustChange }` (Super Admin only). With a password, it is checked by `passwordProblem`, hashed and saved. Without one, a reset link is emailed. It clears the login lock and is audited as `admin.password_set` or `admin.password_reset_sent`. The password is never stored or logged in plain text.
2. **Force change.** `User.mustChangePassword = true`. After sign-in, every app page redirects to `/settings/password` until the person sets a new one. Signing out stays possible.
3. **Own password.** `/settings/password`: current password plus new password twice. Clears `mustChangePassword`. Rate-limited to 5 per 15 minutes.
4. **Bulk.** `POST /api/v1/admin/people/bulk` `{ userIds[≤500], action, value? }`. Actions: `suspend | activate | reset_link | force_change | set_role | set_cohort | set_area | remove`. The caller themself is skipped. Super Admin accounts are skipped unless the caller is a Super Admin. The response is `{ done, skipped: [{ email, reason }] }`. There is one audit row per person.
5. **CSV import.** `POST /api/v1/admin/people/import` with CSV text (≤ 2,000 rows, ≤ 1 MB). Header `name,email,role,cohort,area` (role, cohort and area are optional; role defaults to learner and area to Bhagyanagar). Every row is validated first. With `dryRun: true` it returns per-row errors and nothing is written. Otherwise it creates the user if new (no password), creates the membership (or updates it if it exists), and emails a 7-day "set your password" link. The response lists created, updated and failed rows.
6. **Access screen** (`/settings/access`, Super Admin only). Pick a person to see every permission with its plain-English meaning, ticked from their role. Each can be switched **Grant** / **Role default** / **Remove**. Saved to `Membership.grants` and `Membership.revokes`. Effective permissions = role ∪ grants − revokes. Applied on the next request, since `getCtx` re-reads the membership. Super Admin permissions cannot be removed.
7. `hasPerm` and `requirePerm` use the effective permissions. Every existing role keeps exactly its current permissions when it has no grants or revokes.

## 4. Data and API
Migration `0014_admin_control`:
- `users.mustChangePassword BOOLEAN NOT NULL DEFAULT false`
- `memberships.grants TEXT NOT NULL DEFAULT '[]'`, `memberships.revokes TEXT NOT NULL DEFAULT '[]'` (JSON permission lists)

Reset-link expiry becomes a parameter: 30 minutes for forgot-password, 7 days for import and invites.

## 5. UI
- **People:** a checkbox per row, "Select all shown", a bulk-action bar (action plus value, Apply, then a result summary), "Import CSV" (upload, preview errors, import), and a Password menu on each row (Super Admin: Set password / Send reset link / Force change; Institution Admin: Send reset link).
- **Settings → Access** (Super Admin): person search, then a permission list with three-way toggles and a Save button.
- **Settings → Password**: change your own password.

## 6. Acceptance criteria
- [x] AC-1: CSV parsing handles quoted fields, a BOM, CRLF and extra spaces; it reports bad emails, unknown roles and duplicate rows by line number.
- [x] AC-2: Effective permissions = role ∪ grants − revokes; super_admin always has ALL; unknown permission names are ignored.
- [x] AC-3: Bulk rules: the caller is skipped, Super Admin targets are skipped for non-Super Admin callers, and an Institution Admin cannot set the Institution Admin role or force a change.
- [ ] AC-4: Set-password needs a Super Admin; a weak password is refused with the registration rule.
- [x] AC-5: With `mustChangePassword`, app pages redirect to `/settings/password`.
- [x] AC-6: Grants and revokes change `hasPerm` for that member only.

## 7. Out of scope
Viewing passwords (impossible by design). SSO / SCIM provisioning.

## 8. Open questions
None.
