# A Super Admin has every privilege in every institution — Specification

| | |
|---|---|
| Version | 1.0, 2026-11-26 (builds on `docs/SUPER_ADMIN_CONTROL_SPEC.md`, `docs/INSTITUTIONS_SPEC.md`) |
| Trigger | "yagna247.ai is a Super Admin for SLN, but for AIHUB it is not a Super Admin, so I cannot create a cohort there. Make it a Super Admin for all the institutions, with all privileges to edit any of them." |
| Cause | (1) Where a Super Admin also held an ordinary membership (e.g. a learner account in AIHUB), the session took that membership's role, so menus and role checks showed a learner. (2) The Super Admin role given as a membership in one institution (not `users.globalRole`) counted only inside that institution. (3) The institution switcher showed only for people with two or more memberships. |
| Decisions | A person is a Super Admin when `users.globalRole = 'super_admin'` **or** they hold an active Super Admin membership anywhere. A Super Admin's session in any institution has role Super Admin and every permission, whatever their membership there. The switcher always shows for a Super Admin. Migration `0025_super_admin_everywhere` sets `globalRole` for everyone holding an active Super Admin membership. |
| Code | `apps/web/lib/server/context.ts` (`getCtx`) · `apps/web/app/(app)/layout.tsx` (switcher) · migrations `0025_super_admin_everywhere`, `0026_platform_owner_super_admin` |
| Tests | `apps/web/test/super-admin-everywhere.test.ts` |

## Acceptance criteria
- [x] AC-1: A Super Admin membership in any institution makes the person a Super Admin everywhere.
- [x] AC-2: In an institution where a Super Admin is also a learner (or any other role), their session is Super Admin with every permission.
- [x] AC-3: The institution switcher is shown to every Super Admin.
- [x] AC-5: Migration `0026_platform_owner_super_admin` makes the platform owner's account (yagna247.ai) a Super Admin for the whole platform, as requested; it changes nothing else.
- [x] AC-4: The migration only adds `globalRole = 'super_admin'` for active Super Admin memberships; it removes nothing.
