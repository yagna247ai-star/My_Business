# Area Picker (Telangana and Andhra Pradesh) — Specification

| | |
|---|---|
| Version | 1.0, 2026-11-25 |
| Trigger | "Students are typing their area as Bagyanagar, Bagya Space Nagar and so on. Make it one unique place. Put current and subscribed people into a single Bhagyanagar as the default. Super Admin or Institution Admin can set the area. Others save their area from a list of Hyderabad / Telangana and Andhra Pradesh areas." |
| Decisions | Default spelling **Bhagyanagar**. List = every district and major city of **Telangana and Andhra Pradesh**, each tagged with its state. **Every** existing user is set to Bhagyanagar (not only blanks). |
| Builds on | `docs/AI_ACCELERATOR_HUB_JOURNEY_GAMIFICATION_MODEL.md` (area crowns), `packages/db/prisma/migrations/0002_user_area`, `apps/web/lib/domain/ranksCore.ts`, `apps/web/lib/domain/standingsCore.ts` |
| Code | `apps/web/lib/domain/areas.ts` (new, pure catalogue + normaliser) · `apps/web/lib/domain/ranksCore.ts` (`stateOf` uses the catalogue) · `apps/web/lib/domain/account.ts` (settings schema, registration default) · `apps/web/lib/domain/settingsAdmin.ts` + `apps/web/app/api/v1/settings/people/[userId]/route.ts` (admin sets area) · `apps/web/components/account/SettingsForm.tsx` (dropdown) · `apps/web/components/settings/AreaPicker.tsx` (new) · `apps/web/app/(app)/settings/people/[userId]/page.tsx` · `packages/db/prisma/schema.prisma` · `packages/db/prisma/migrations/0011_area_bhagyanagar/migration.sql` (new) |
| Tests | `apps/web/test/areas.test.ts` (new, pure) · `apps/web/test/ranks.test.ts` (extend) |

---

## 1. Problem
The area is a free-text box. The same place shows up under several spellings ("Bagyanagar", "Bagya Space Nagar", "Bhagya nagar"), so area crowns and City rankings split one city into several small groups, and none of them gets enough learners to rank. Admins have no way to correct a learner's area.

## 2. Solution
Replace the free-text box with a fixed list of areas. One canonical name per place, each tagged with its state. **Bhagyanagar** (Telangana) is the default for everyone.

| Who | What they can do |
|---|---|
| Learner (any signed-in user) | Choose their own area from the list in **Settings → Profile & privacy**. |
| Super Admin, Institution Admin (`members:manage`) | Set any member's area on **Settings → People → (person)**. |
| New sign-up | Starts with Bhagyanagar and can change it in settings. |
| Existing users | All set to Bhagyanagar by the migration. |

Catalogue (`lib/domain/areas.ts`): `{ name, state, aliases[] }`.
- **Telangana:** Bhagyanagar (aliases: Hyderabad, Hyd, Bagyanagar, Bagya Nagar, Bhagya Nagar, Bagya Space Nagar), Secunderabad, and the 33 districts (Adilabad … Yadadri Bhuvanagiri), with Hyderabad district folded into Bhagyanagar.
- **Andhra Pradesh:** the 26 districts (Alluri Sitharama Raju … YSR Kadapa), plus the cities Vijayawada, Amaravati, Rajamahendravaram (alias Rajahmundry), Nellore, Ongole and Kadapa.

## 3. Behaviour
1. `AREAS` contains only Telangana and Andhra Pradesh entries, with unique names. `DEFAULT_AREA` is `"Bhagyanagar"`.
2. `normaliseArea(input)` ignores case, spaces, dots and hyphens, and matches names and aliases. It returns the canonical name, or `null` for anything not in the list. So "bagya space nagar", "HYDERABAD" and " Bhagya-Nagar " all return "Bhagyanagar".
3. `PATCH /api/v1/settings` with `area` accepts only a value that normalises to a catalogue name and stores the canonical name. Anything else returns 400 with "Choose your area from the list." A blank area is no longer allowed.
4. `PATCH /api/v1/settings/people/:userId` accepts `area` under the same rule. It needs `members:manage` (Super Admin, Institution Admin). Other roles get 403. The member must belong to the admin's institution (404 otherwise). The change is written to the audit log as `member.updated`, with the area before and after.
5. Registration stores `area = DEFAULT_AREA`.
6. Migration `0011_area_bhagyanagar` sets `users.area = 'Bhagyanagar'` for every user and sets the column default to `'Bhagyanagar'`. Running it twice gives the same result.
7. `stateOf("Bhagyanagar") === "Telangana"`, and `stateOf` returns the correct state for every catalogue name. Names outside the catalogue keep their old mapping (for example "Bengaluru" → Karnataka), so older data still ranks.
8. The dropdown groups areas by state, Telangana first and Bhagyanagar at the top. It has a search box that also matches aliases, so typing "Hyderabad" finds Bhagyanagar.

## 4. Data and API
- `users.area`: still `TEXT`, now `DEFAULT 'Bhagyanagar'`. Prisma: `area String? @default("Bhagyanagar")`.
- Migration `0011_area_bhagyanagar` (proposed): `UPDATE "users" SET "area" = 'Bhagyanagar'; ALTER TABLE "users" ALTER COLUMN "area" SET DEFAULT 'Bhagyanagar';`
- `PATCH /api/v1/settings`: `area` is validated against the catalogue.
- `PATCH /api/v1/settings/people/:userId`: new optional field `area`.

## 5. UI
- **Profile & privacy → My area:** a select grouped by state, with a search box above it and a "Save area" button. Help text: "Pick your district or city. Used for area crowns and City / State ranks." States: saved ("Saved."), error (server message).
- **People → person page:** an "Area" row with the same picker and a "Save" button. Shown only to `members:manage`.
- New strings go through `<Tr>` / `t()`.

## 6. Acceptance criteria
- [x] AC-1: Given the catalogue, then every entry is in Telangana or Andhra Pradesh, names are unique, and Bhagyanagar is the default.
- [x] AC-2: Given "bagya space nagar", "Bagyanagar", "HYDERABAD" or " bhagya-nagar ", when normalised, then the result is "Bhagyanagar".
- [x] AC-3: Given "Rajahmundry", when normalised, then "Rajamahendravaram"; given "Atlantis" or "", then `null`.
- [ ] AC-4: Given a learner, when they PATCH settings with area "Atlantis", then 400 and the area is unchanged; with "warangal", then the stored area is "Warangal".
- [ ] AC-5: Given an Institution Admin, when they set a member's area, then it is saved and audited; given a learner calling the same route, then 403.
- [ ] AC-6: Given the migration has run, then every user's area is "Bhagyanagar" and a new user defaults to it.
- [x] AC-7: `stateOf` returns Telangana for Bhagyanagar and Andhra Pradesh for Vijayawada and NTR, and still returns Karnataka for Bengaluru.

## 7. Out of scope
- States other than Telangana and Andhra Pradesh in the picker.
- Localities inside Hyderabad (Kukatpally, Madhapur, …).
- Letting admins edit the catalogue itself. The list lives in code.

## 8. Open questions
1. Andhra Pradesh may add more districts. Default: add them to `areas.ts` when they are notified officially.
2. Should "Hyderabad" stay folded into Bhagyanagar? Default: yes, as an alias, so the city is never split again.
