# Access by Module, and a Super Admin Menu That Makes Sense — Specification

| | |
|---|---|
| Version | 1.0, 2026-11-26 |
| Trigger | "Access should be simple, based on modules. The alignment: there are two side bars, they need to expand. Act as Super Admin, think in his view, and correct everything." |
| Decisions | Access is set per **module** with three choices (**No access · View · Manage**), not per raw permission. Both side bars can collapse to icons and expand again, and remember the choice. The main menu is regrouped by what an admin does. Staff can open Ranks and Showcase. |
| Builds on | `docs/SUPER_ADMIN_CONTROL_SPEC.md` (grants and revokes), `apps/web/lib/server/rbac.ts`, `apps/web/components/app/Shell.tsx`, `apps/web/components/settings/SettingsNav.tsx` |
| Code | `apps/web/lib/domain/accessModules.ts` (new, pure) · `apps/web/lib/domain/adminControl.ts` · `apps/web/app/api/v1/admin/access/[userId]/route.ts` · `apps/web/components/settings/AccessEditor.tsx` · `apps/web/components/settings/SettingsNav.tsx` · `apps/web/app/styles/settings.css` · `apps/web/app/(app)/layout.tsx` · `apps/web/app/layout.tsx` |
| Tests | `apps/web/test/access-modules.test.ts` (new, pure) |

---

## 1. Problem
- The Access screen lists 19 technical permissions (`members:manage`, `ledger:verify` …), and each has three radio buttons. A Super Admin has to translate every one.
- Settings pages show two side bars (the main menu plus the Settings menu). Only the main one can collapse, so wide tables like People are squeezed.
- From the Super Admin's chair, the main menu puts 10+ admin items in one "Program" list, hides Ranks and Showcase from staff, and has no direct link to Access.

## 2. Solution

**Modules** (each maps to permissions; "View" ⊂ "Manage"):

| Module | View | Manage |
|---|---|---|
| Learning (journeys as a learner) | — | `learn:self` |
| AI coach | — | `ai:use` |
| Community & showcase | `community:post` | `community:post`, `community:moderate` |
| Reviews | `review:read` | `review:read`, `review:decide` |
| People | `members:read` | `members:read`, `members:manage` |
| Cohorts & sessions | `cohort:read` | `cohort:read`, `cohort:manage` |
| Content & journeys | — | `content:manage` |
| Analytics | — | `analytics:read` |
| Audit & points ledger | `audit:read` | `audit:read`, `ledger:verify` |
| Billing | `billing:self` | `billing:self`, `billing:manage` |
| Talent & careers | `talent:discover` | `talent:discover`, `talent:post` |
| Institution settings | — | `institute:manage` |

For each person, the Access screen shows every module with **No access / View / Manage**. The level the role gives is marked "role default". Saving turns the levels into the existing grants and revokes, so nothing else changes.

**Side bars:** the Settings menu gets the same collapse button as the main menu (icons only, 64 px), stored as `aih_setnav` and applied before paint. `Ctrl/⌘ + B` keeps collapsing the main menu.

**Main menu for staff:**
- **Overview:** Analytics
- **People:** People · Access (Super Admin) · Cohorts & Sessions
- **Content:** Content review (with day materials) · Journey Builder
- **Community:** Ranks · Showcase · Moderation · Hackathon Builder
- **Governance:** Audit Log · Talent

## 3. Behaviour
1. `moduleLevel(perms, module)` returns `none | view | manage`. `permsForLevels(role, levels)` returns `{ grants, revokes }`, so that `effectivePerms(role, grants, revokes)` matches exactly the chosen levels.
2. A module set to its role default produces no grant or revoke.
3. Every permission belongs to exactly one module.
4. Super Admin accounts cannot be edited (always Manage everywhere).
5. Collapsed Settings menu: icon links keep an `aria-label` and a tooltip; the button has `aria-expanded`.

## 4. Data and API
No schema change. `GET /api/v1/admin/access/:id` adds `modules: [{ key, label, info, roleLevel, level }]`. `PUT` accepts `{ levels: Record<module, 'none'|'view'|'manage'> }` (the old `modes` body still works).

## 5. UI
Access screen: person list (left), and a module table (right) with three-way segmented buttons, the role default badge and a one-line "what this lets them do". Advanced permissions sit in a collapsed panel. Settings menu: collapse button at the top.

## 6. Acceptance criteria
- [x] AC-1: Every permission is in exactly one module.
- [x] AC-2: Levels → grants/revokes → effective permissions give back the same levels, for every role.
- [x] AC-3: Role defaults give empty grants and revokes.
- [x] AC-4: The Settings menu has a collapse button with `aria-expanded`, and the setting is applied before paint.
- [x] AC-5: Staff with the permission see Analytics, Access (Super Admin), Ranks and Showcase in the main menu, grouped as above.

## 7. Out of scope
Custom roles with names. Per-cohort access scopes.

## 8. Open questions
None.
