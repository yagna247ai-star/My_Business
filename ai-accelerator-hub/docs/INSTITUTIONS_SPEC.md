# Institutions, Institution Codes, Switching and Learner Transfers — Specification

| | |
|---|---|
| Version | 1.0, 2026-11-26 |
| Trigger | "We created three institutions; one is the platform creator's. As Super Admin I can switch to any institute and view any institute profile. People must be segregated by an institution code, which they give at registration; without one they go to AIHUB, and the Super Admin can move them later. Everyone is in SLNHRD today. The institute profile needs full details and an image. A learner may learn at a skill centre, finish, then join a software company that is also our customer: design for that." |
| Decisions | Every institution has a **code** (3–12 letters/digits, unique). Registration with a valid code joins that institution; no code → **AIHUB** (the platform's own institution). One person = one lifetime account with **memberships** in many institutions over time (`active`, `alumni`, `suspended`). **Move** transfers the person's whole learning record to the new institution; **Add** gives them a second active membership. Super Admin can switch into any institution. |
| Builds on | `docs/SUPER_ADMIN_CONTROL_SPEC.md`, `apps/web/lib/domain/settingsAdmin.ts` (institutes), `apps/web/lib/domain/account.ts` (`registrationTenant`), `apps/web/lib/server/context.ts` (`getCtx`), `apps/web/lib/domain/journeyAccess.ts` |
| Code | `apps/web/lib/domain/institutionsCore.ts` (new, pure) · `apps/web/lib/domain/institutions.ts` (new: switch, transfer, clone journey) · `apps/web/lib/domain/account.ts` · `apps/web/lib/domain/settingsAdmin.ts` · `apps/web/lib/server/context.ts` · `apps/web/components/app/InstitutionSwitcher.tsx` (new) · institute settings pages · `apps/web/components/settings/PeopleAdminTools.tsx` (Move / Add to institution) · migration `0017_institutions` |
| Tests | `apps/web/test/institutions.test.ts` (new, pure) · `apps/web/test/institution-transfer.test.ts` (new, DB) |

---

## 1. Problem
Everyone sits in one institution (SLNHRD), because registration has no way to say where a person belongs: the only code is a cohort invite code. A Super Admin is stuck in the first institution they joined, with no switcher. Institution profiles hold only an email, phone, website and city, with no code, type or logo. And there is no model for a learner who moves on (skill centre → employer) while keeping their record.

## 2. Solution

**Institution** = name, **code**, **type** (`platform` · `skill_centre` · `college` · `school` · `company` · `other`), logo image, and a full profile: legal name, address, city/district (area list), state, PIN code, contact person, contact email, phone, website, registration / affiliation number, year established, about. Status and plan stay as they are.

**Membership** (person ↔ institution) gains `status: active | alumni | suspended`, plus `joinedAt`, `leftAt`, and `movedTo` (an institution id).

**Lifecycle**

```
register ──(code SKILL01)──► Skill Centre: active
      └─(no code)──────────► AIHUB: active              Super Admin "Move to…" fixes it later
Skill Centre ──finish / Move──► Skill Centre: alumni   +   Company: active (record transferred)
Company also enrols them in a new journey ──► they keep one account, one passport
```

**Scenarios covered**

| # | Scenario | Result |
|---|---|---|
| 1 | Register with a valid institution code | Learner in that institution, on its default journey |
| 2 | Register with no code | Learner in AIHUB |
| 3 | Register with a wrong code | "We don't know code X. Check it with your institution, or leave it empty to join AI Accelerator Hub." |
| 4 | Register with a cohort invite code | Joins that cohort's institution and cohort (as today) |
| 5 | Existing account enters a code (Settings → Profile → "Join an institution") | New active membership; switches to it |
| 6 | Super Admin **moves** people A → B | A: alumni (`movedTo` B). B: active, same role. Days, steps, activities, submissions, reviews, XP, streak, privacy settings, showcase projects, Agent Lab runs and material ticks move to B, so their progress shows in B |
| 7 | B has no copy of the person's journey | The journey (levels, days, activities, prerequisites, day materials) is copied into B first, unpublished for B's other learners until B's admin publishes it; the moved learner keeps access |
| 8 | Super Admin **adds** a person to B without moving | Second active membership; their history stays in A; they switch between A and B |
| 9 | Person already active in B | Move merges: B's membership stays, A's becomes alumni, and records move; streak keeps the longer one |
| 10 | Cohorts | A's cohort does not exist in B, so the cohort is cleared; B's admin assigns one |
| 11 | Under-18 learners | Guardian consent and privacy move with them; minors stay private |
| 12 | Institution suspended | Its members cannot open it; if they have another active membership, they land there |
| 13 | Code changed | The old code stops working at once; the profile warns before saving |
| 14 | Institution Admin of A | Sees only A; cannot move people in or out (Super Admin only) |
| 15 | Super Admin opens B without a membership | Allowed, as Super Admin; audited as `tenant.switched` |
| 16 | A member of A and B | The header switcher lists A and B; others never see institutions they don't belong to |
| 17 | AIHUB cannot be deleted or suspended | It is the default home for learners without a code |

**Learning passport:** a person's profile page shows their institution history (joined, left, moved to) to the Super Admin and to the admins of the institution they are in now.

**Switcher:** the header shows the current institution (logo and name). It's a menu for the Super Admin (all institutions, with search) and for people with more than one active membership.

## 3. Behaviour
1. `codeProblem(code)`: 3–12 characters, A–Z and 0–9 only, saved upper-case.
2. `suggestCode(name, taken)`: initials or the first letters of the name, upper-case, made unique with a number.
3. `resolveCode(input, tenants, cohorts)` → `{ kind: 'institution' | 'cohort' | 'default' | 'unknown' }`; institution codes are checked before cohort codes.
4. The switch is stored in a signed, httpOnly cookie `aih_tenant` (HMAC with `NEXTAUTH_SECRET`). `getCtx` uses it when the person has an active membership there, or is a Super Admin. Otherwise it is ignored.
5. A transfer runs in one transaction per person, and is audited (`member.moved`) with counts of the rows moved.
6. `planJourneyMap(source, target)` maps levels by code, activities by (level code, idx) and day lessons by (level code, position); it lists anything missing so the journey is copied first.

## 4. Data and API
Migration `0017_institutions`:
- `tenants`: `code TEXT UNIQUE`, `type TEXT NOT NULL DEFAULT 'other'`, `logoUrl TEXT`. Existing rows: a name containing "accelerator" → `AIHUB` / `platform`; a name or slug containing "slnhrd" → `SLNHRD`; others → the upper-cased slug (letters and digits, ≤ 12).
- `memberships`: `leftAt TIMESTAMP(3)`, `movedToTenantId TEXT`. `status` gains `alumni`.

Routes:
- `POST /api/v1/me/tenant` `{ tenantId }` (switch)
- `GET /api/v1/me/tenants` (for the switcher)
- `POST /api/v1/me/join` `{ code }`
- `POST /api/v1/admin/people/transfer` `{ userIds[], toTenantId, mode: 'move' | 'add' }`
- Institute profile: the existing routes get the new fields, and `logoFileId`.

## 5. UI
- Header institution switcher.
- **Institutes** (Super Admin): cards with logo, name, code, type, members, an **Open** button (switch) and a **Profile** link.
- **Institute profile**: every field, logo upload, code with an "old code stops working" warning.
- **People**: bulk actions "Move to institution…" and "Also add to institution…" (Super Admin), plus a CSV column `institution`.
- **Registration**: an "Institution code (optional)" field with helper text. **Profile**: "Join an institution with a code".

## 6. Acceptance criteria
- [x] AC-1: Code rules, suggestions and uniqueness.
- [x] AC-2: `resolveCode` covers institution, cohort, empty (AIHUB) and unknown codes.
- [x] AC-3: The switch cookie is signed; a tampered or foreign tenant is ignored for non-members; Super Admin may open any active institution.
- [x] AC-4: `planJourneyMap` maps by codes and reports what is missing.
- [ ] AC-5: A move makes A alumni and B active, moves the progress, and keeps the person's XP total the same.
- [ ] AC-6: Registration with no code lands in AIHUB.

## 7. Out of scope
Institution-to-institution data-sharing agreements. Billing per institution. Learner self-service moving (only the Super Admin moves people).

## 8. Open questions
1. Names and codes of the three institutions: the migration sets AIHUB and SLNHRD, and a code from the third institution's name. Check them on the Institutes page after deploy.
