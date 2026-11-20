# Production guide

How to run AI Accelerator Hub in production: where it lives, who has access, how to administer it, what's switched on, and what to do when something breaks. For engineering detail, follow the links.

Last updated 2026-11-19.

## At a glance

| | |
|---|---|
| Site | https://aiachub.nachikethaenterprises.business |
| Fallback URL | https://ai-accelerator-hub-one.vercel.app |
| Health check | https://aiachub.nachikethaenterprises.business/api/health |
| Hosting | Vercel — team `nachiketha`, project `ai-accelerator-hub` |
| Database | Neon Postgres (`neondb`, us-east-1), linked through Vercel |
| Default institution | `demo` (Demo Institute) |
| Code | `ai-accelerator-hub/` in GitHub repo `yagna247ai-star/My_Business` |

## Access

| System | Who | How |
|---|---|---|
| App — Super Admin | yagna247.ai@gmail.com | Email + password at `/login`. Created 2026-11-19 with `provision-staff.ts`; sign-in verified the same day. |
| Vercel | Vercel account `yagna247ai-star`, team `nachiketha` | vercel.com |
| Neon | Through the Vercel integration | Vercel → Storage → Open in Neon |
| GitHub | `yagna247ai-star` | github.com |

Passwords are never written in docs or the repo. Keep them in a password manager.

**Super Admin** has every permission in every area of the app. There is one role per person per institution, so to try the app as a mentor or learner, use a second account and change its role in Admin → People.

### Adding or changing staff accounts

- **From the app (preferred):** Admin → **People** → change a member's role, or suspend them. Every change is in the audit log. Super Admin can't be granted here.
- **New staff account or another Super Admin:** run `packages/db/prisma/provision-staff.ts` from a laptop against production. See [06-seed-and-admin-accounts.md](./enterprise-gaps/06-seed-and-admin-accounts.md) and [PRODUCTION_DATABASE.md](./PRODUCTION_DATABASE.md).
- **Resetting a password:** there is no "forgot password" or change-password screen yet. Re-run `provision-staff.ts` for that email with `RESET_PASSWORD=1` (and `STAFF_PASSWORD=…` to set a specific one).
- **Never** run `seed.ts` against production: it creates demo accounts whose passwords are published in the repo.

## Roles

| Role | Can |
|---|---|
| Super Admin | Everything, platform-wide |
| Institution Admin | Manage people and roles, cohorts, content, analytics, audit log |
| Program Manager | Same as Institution Admin, except changing roles |
| Instructor | Author content, review submissions, analytics |
| Cohort Mentor | Review submissions, moderate, nudge learners, search talent |
| Reviewer | Review queue only |
| Team Lead | Learner access plus view cohort |
| Finance & Operations | Billing management, audit log |
| Support & Moderation | Moderation, member list, audit log |
| Learner | The default for anyone who signs up |

Full permission matrix: `apps/web/lib/server/rbac.ts`. Data detail: [DATA_MODEL.md](./DATA_MODEL.md#1-tenancy-identity-and-access).

## Settings (`/settings`)

One place for admins to manage the institute. Open **Settings** in the left menu. Learners only see their own **Profile & privacy**.

| Section | Path | Institution Admin | Super Admin |
|---|---|---|---|
| Profile & privacy | `/settings/profile` | Own photo, theme, language, area, privacy | Same |
| Institute(s) | `/settings/institute` | Edit own institute's name and contact details | Also create, edit (short name, plan, status), deactivate and delete any institute |
| People | `/settings/people` | Add people (new or existing account) with a role, cohort and starting password; edit name, role, cohort, status; remove from the institute. Click a name to open their **profile**: journeys and level progress, XP, streak, badges, submissions with review results, talent profile (each view is audited; mentors and instructors can view too) | Same |
| Cohorts | `/settings/cohorts` | Create, edit name/dates/size, new invite code, delete | Same |
| Talent | `/settings/talent` | Post, edit, close/reopen and delete opportunities; edit a learner's headline, hide or remove a talent profile | Same |

Rules worth knowing:
- Nobody can change or remove their own membership, or touch a Super Admin, from People. Super Admin can't be granted from People.
- Removing a person ends their membership in this institute only. Their account, other institutes and past progress are kept.
- Deleting a cohort keeps its learners and their progress; they're just no longer in a cohort.
- An institute can be deleted only when it's empty (no members, cohorts, journeys or orders) and you're not signed in to it. Otherwise deactivate it.
- Admins can hide a talent profile but never make one visible: who sees a profile is the learner's own choice.
- Every change is written to the **Audit log**.
- Permission: `institute:manage` (Institution Admin; Super Admin has every permission).

## Admin screens

All under `/admin` after signing in as staff.

| Screen | Path | Use it to |
|---|---|---|
| Cohort analytics | `/admin` | Overview of learners and progress |
| People | `/admin/people` | List members, change roles, suspend, nudge. Super Admin: move a person (or yourself) to another journey |
| Cohorts & sessions | `/admin/cohorts` | Create cohorts, get invite codes, schedule workshops and hackathons |
| Journey builder | `/admin/journeys` | Create journeys and levels. Super Admin: publish/unpublish journeys and pick the **default** journey for new learners |
| Hackathon builder | `/admin/hackathons` | Create and run hackathons |
| Moderation queue | `/admin/moderation` | Handle reported posts and comments |
| Audit log | `/admin/audit` | See who changed what |

Submission reviews are at `/review`.

### Journeys: who is on which

There are two journeys: **Data Analytics** and **AI**. Only a Super Admin can change who is on which.

- **Default for new learners:** Data Analytics. Change it in Journey builder → **Make default**. Only a published journey can be the default.
- **At sign-up:** the learner picks any published journey on the registration form. The default is pre-selected.
- **Moving someone:** People → Journey column. Their old journey is paused, not deleted, so progress returns if they are moved back.
- **Unpublishing** a journey hides it from sign-up and assignment. Existing learners on it keep their place. The default journey can't be unpublished; make another one the default first.
- Learners who joined before 2026-11-19 stay on the AI journey.
- **Domain journeys (17):** "Data Analytics by industry domain" on the sign-up form lists 17 domains (Education, BFSI, Insurance, Healthcare, Pharma, Retail, FMCG, Manufacturing, Automotive, Energy & Utilities, Telecom, Logistics, Agriculture, Government, Media, Travel, Real Estate). Each is its own journey (`da-<domain>`): 45 days, 9 modules, one enterprise problem from problem framing to Databricks, Unity Catalog, bronze/silver/gold, Power BI, ML and go-live. They appear in Journey builder like any journey (publish, unpublish, make default). Content is generated from `apps/web/lib/domain/daDomains/` and seeded on every production build (`seed:domains`); spec: [DOMAIN_ANALYTICS_JOURNEYS_SPEC.md](./DOMAIN_ANALYTICS_JOURNEYS_SPEC.md).
- **Validated evidence:** dataset steps check an uploaded CSV/Excel in memory (columns, types, key, nulls, categories, ranges, personal data) and award XP only when every check passes; screenshot steps accept the learner's own image for that step (min 800×450) and reviewers can open it. Points flow into ranks and standings automatically.

### First-day setup checklist

- [ ] Sign in as Super Admin and open `/admin`.
- [ ] Create a cohort in **Cohorts & sessions** and note its invite code.
- [ ] Check the journey and levels in **Journey builder**.
- [ ] Sign up a test learner with the invite code and walk through Level 1.
- [ ] Give staff their roles in **People**.

## What's live and what's off

From [enterprise-gaps/README.md](./enterprise-gaps/README.md). Features that are off show a clear "not set up yet" message rather than failing.

| Feature | Status | To switch on |
|---|---|---|
| Sign-in (email + password) | Live | — |
| Learning journey, levels, XP, ranks | Live | — |
| AI coach | Depends on keys; `GEMINI_API_KEY` is set | [02-ai-coach](./enterprise-gaps/02-ai-coach.md) |
| Online payments | Off | Razorpay or Cashfree keys — [01-payments](./enterprise-gaps/01-payments.md) |
| File uploads | Images live (Vercel Blob); PDF/video off | Virus scanner — [07-uploads](./enterprise-gaps/07-file-uploads-and-storage.md) |
| GitHub sign-in | Off | OAuth app — [09-github-oauth](./enterprise-gaps/09-github-oauth.md) |
| Shared cache / rate limits | In-memory fallback | `REDIS_URL` — [03-redis](./enterprise-gaps/03-redis-rate-limit-leaderboard.md) |
| Graph features | Off (optional) | [08-neo4j](./enterprise-gaps/08-graph-neo4j.md) |
| Error tracking / alerts | None | [10-observability](./enterprise-gaps/10-observability.md) |
| Database tenant isolation (RLS) | Not applied; app-level only | [04-tenancy-rls](./enterprise-gaps/04-tenancy-rls.md) |

## Day-to-day operations

| Task | How |
|---|---|
| Is the site up? | Open `/api/health`. `"status":"ok"` with `db: ok` is healthy; HTTP 503 means the database is unreachable. |
| Release a change | [DEPLOYMENT.md](./DEPLOYMENT.md) — commit, preview, `vercel deploy --prod`, check health. |
| Roll back a bad release | Vercel → Deployments → last good one → **Promote to Production**. |
| Change a setting / key | Vercel → Settings → Environment Variables, then redeploy. Reference: [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md). |
| Look at data | Neon SQL editor. [PRODUCTION_DATABASE.md](./PRODUCTION_DATABASE.md). |
| See errors | Vercel → project → **Logs** (there's no alerting yet, so check after each release). |

## When something breaks

| Symptom | First checks |
|---|---|
| Site down / 500 errors | `/api/health`. Vercel → Deployments: did a recent deploy fail or misbehave? Roll back to the last good one. Then read Vercel Logs. |
| Health says `db: error` | Neon console: is the project suspended or over quota? Did a migration fail in the last build log? |
| Nobody can sign in | Check `NEXTAUTH_SECRET`, `NEXTAUTH_URL` and `APP_URL` in Vercel match the site URL. Check the RLS note in [04-tenancy-rls](./enterprise-gaps/04-tenancy-rls.md) (step 0) — forced RLS on `memberships` blocks sign-in. |
| One person can't sign in | 5 wrong passwords lock that email for 15 minutes. Otherwise reset their password with `provision-staff.ts`. Check they aren't suspended in People. |
| Wrong data after a release | Roll back the code. A migration is not undone by rollback: fix forward, or restore from Neon history into a branch first. |
| A bad actor / abusive content | Suspend them in People; remove content in Moderation. Both are audited. |

## Security rules

- Keep production secrets in Vercel and Neon only. If you pull them locally, do it outside the repo and delete the file afterwards.
- Change passwords that have been shared in chat or email.
- Give people the lowest role that lets them do their job. Keep Super Admins to as few people as possible.
- Review the audit log regularly for `member.role_changed` and `staff.provisioned`.
- Before giving anyone Vercel, Neon or GitHub access, record who has it (see "Not yet written" in [README.md](./README.md)).

## Related documents

[README.md](./README.md) (index) · [DEPLOYMENT.md](./DEPLOYMENT.md) · [PRODUCTION_DATABASE.md](./PRODUCTION_DATABASE.md) · [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) · [DATA_MODEL.md](./DATA_MODEL.md) · [LOCAL_SETUP.md](./LOCAL_SETUP.md) · [enterprise-gaps/](./enterprise-gaps/README.md)
