# 06 — Seed data and admin accounts

**Status (updated 2026-11-17):** reference seed and super-admin created in production. Demo accounts were NOT created. Admin sign-in verified on the custom domain (session returned; wrong password rejected). The seed source still contains demo passwords; the production copy was built without them.

## Current state

- `packages/db/prisma/seed.ts` creates these accounts with fixed passwords (lines 53–57):
  - `admin@aihub.in` (super_admin), password `Admin@12345`
  - `student@aihub.in`, `mentor@aihub.in`, `instructor@aihub.in`, `finance@aihub.in` with similar predictable passwords
- The seed also creates the demo tenant, roles, the level/journey data, badges, AI assistant prompts, and plans.
- `.env.example` and the local `.env` contain `SEED_SUPER_ADMIN_PASSWORD=Admin@12345`. The production env does **not** have this variable.
- Login is credentials-based (`verifyCredentials` in `lib/auth.ts:23`). The seed has not been run against production, so no accounts are expected to exist. This is inferred, not checked against the production database.

## Gap

- No way to sign in to production yet. The app is live but empty.
- The seed would create well-known accounts with well-known passwords. Running it against production as-is would be a security hole.
- The journey and level data (L01 only is published, per `KNOWN_LIMITATIONS.md`) is needed for the learner flow to work.

## Risk

- High if the seed runs unchanged on production. Medium if no admin exists, because the platform cannot be administered.

## Decision needed

- Which accounts should exist in production: a single super-admin only, or the demo accounts too? Who is the admin email?

## Steps to close

1. Split the seed: reference data (levels, badges, assistant prompts, plans) should run in production. Demo users should not.
2. Create the super-admin with a generated password through a one-off script. Print it once, store it in a password manager, and enforce a password change on first login if the app supports it.
3. Remove `SEED_SUPER_ADMIN_PASSWORD` and the demo passwords from any production-reachable configuration.
4. Run the reference-data seed against production, then verify `/dashboard` and the L01 activities load.
5. Delete or disable the demo accounts if they were created by mistake.

## Super Admin created (2026-11-19)

`yagna247.ai@gmail.com` was created as Super Admin in the `demo` institution with `provision-staff.ts` (audit action `staff.provisioned`). Sign-in on the custom domain was verified: login redirected to `/dashboard`, the session belonged to that email, and `/admin` returned 200. The password was chosen by the owner and shared in a chat session; rotate it with `RESET_PASSWORD=1`.

## Staff and admin roles (added 2026-11-19)

`packages/db/prisma/provision-staff.ts` creates the production staff accounts (Institution Admin, Program Manager, Instructor, Mentor, Reviewer, Team Lead, Finance, Support). Run it locally against the production database. It is not part of the Vercel build.

```
cd packages/db
DATABASE_URL='<prod url>' STAFF='ops@yourco.com=tenant_admin,pm@yourco.com=program_mgr:Priya Rao' DRY_RUN=1 npm run db:provision-staff
# then the same command without DRY_RUN=1
```

- New accounts get a random 24-character password, printed once. Existing accounts keep their password unless `RESET_PASSWORD=1`.
- It refuses `super_admin`, `learner`, the seed demo emails, `@example.com` addresses, and CI/Vercel environments.
- Each change is written to the audit log as `staff.provisioned`.
- The app has no self-service password change yet, so rotate with `RESET_PASSWORD=1`.
