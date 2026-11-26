# New learners land in AI Accelerator Hub (AIHUB) — Specification

| | |
|---|---|
| Version | 1.0, 2026-11-26 (builds on `docs/INSTITUTIONS_SPEC.md`) |
| Trigger | "For new user registration: all new registrations need to go to AI Hub, not SLN Skill Centre. The institution code should show AIHUB by default when they register. AIHUB still has no institution code; build the module on institution codes so we can solve the problem." |
| Cause | People without a code join the institution that holds the code **AIHUB**. Migration 0017 only gave AIHUB to an institution named "…accelerator…" (or slug "…aihub…"); when none matched, no one held AIHUB and registration fell back to `DEFAULT_TENANT_SLUG`, which points at SLN in production. |
| Decisions | (1) The home for people without a code is the institution holding AIHUB, else the institution of type **platform**, else `DEFAULT_TENANT_SLUG`; never a deactivated one. (2) Typing AIHUB always means that home, even before anyone holds the code. (3) The registration form starts with **AIHUB** in the code field and says where the learner will land ("You'll join: AI Accelerator Hub · AIHUB"); an unknown code is shown under the field. (4) Super Admin sees on Institutes where new learners go, a warning when no one holds AIHUB, and "Make default for new learners" on each institution (two taps): it takes AIHUB and type platform; the previous holder gets a code suggested from its name; audited `institution.default_home`. (5) Migration `0024_aihub_home` gives AIHUB to the platform's own institution when no one holds it, never to an SLN one. |
| Code | `apps/web/lib/domain/institutionsCore.ts` (`pickHome`, `resolveCode`) · `apps/web/lib/domain/institutions.ts` (`defaultInstitution`, `institutionPreview`, `makeDefaultHome`) · `app/api/v1/register/journeys/route.ts` · `app/api/v1/settings/institutes/[id]/default/route.ts` (new) · `app/(auth)/register/page.tsx` · `components/settings/InstituteSettings.tsx` · migration `0024_aihub_home` |
| Tests | `apps/web/test/registration-home.test.ts` |

## Acceptance criteria
- [x] AC-1: `pickHome` returns the active AIHUB holder; else the active platform institution; else the `DEFAULT_TENANT_SLUG` one; a deactivated AIHUB holder is skipped.
- [x] AC-2: `resolveCode('AIHUB')` is the home (`default`) when no institution holds AIHUB; an empty code is the home; SLNHRD still joins SLN.
- [x] AC-3: The form starts with AIHUB, shows the institution a code leads to, and shows an unknown code's message under the field.
- [x] AC-4: Only a Super Admin can make an institution the default home; it takes AIHUB, the previous holder gets a new unique code; audited.
- [x] AC-5: Migration 0024 assigns AIHUB only when no one holds it, only to an active platform-like institution, never to an SLN one.
