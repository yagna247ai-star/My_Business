# Showcase Projects on GitHub — Specification

| | |
|---|---|
| Version | 1.0, 2026-11-25 |
| Trigger | "The showcase is the definition of the project. It should have their email IDs and map their existing GitHub repositories; if someone has none, ask them to create one. Help them step by step: create a GitHub account, enable two-factor authentication, get a personal access token, use it in VS Code, check out the project, and set up the project documents structure. If they already have GitHub, a project repo is created with a README, so they can check it out and add documentation. Use the GitHub API." |
| Decisions | **Learner-first.** The learner is always admin of their project repo. **Where the repo is created:** the institution GitHub organisation if one is configured (`GITHUB_ORG` + `GITHUB_ORG_TOKEN`); otherwise the learner's own account via "Connect GitHub" (OAuth). GitHub's API cannot create an organisation, so the org is created once by you, by hand. Institution admins with a GitHub username are added as **maintainers**. Any member can ask to **contribute** and is added with write access. The author's email shows to members of the institution and is hidden for learners under 18. |
| Builds on | `apps/web/lib/domain/showcase.ts`, `docs/SHOWCASE_LINK_HEALTH_SPEC.md`, `apps/web/lib/domain/childSafety.ts`, `apps/web/lib/domain/setupGuide.ts` (guide style), `User.githubUsername` |
| Code | `apps/web/lib/github/repoTemplate.ts` (new, pure: README and docs files) · `apps/web/lib/github/githubCore.ts` (new, pure: names, target choice, validation) · `apps/web/lib/github/client.ts` (new: REST calls) · `apps/web/lib/github/tokens.ts` (new: AES-GCM encryption of OAuth tokens) · `apps/web/lib/domain/projects.ts` (new) · routes under `apps/web/app/api/v1/projects/` and `apps/web/app/api/v1/github/` (new) · `apps/web/app/(app)/showcase/new/page.tsx`, `apps/web/app/(app)/showcase/[id]/page.tsx`, `apps/web/app/(app)/showcase/github-guide/page.tsx` (new) · `apps/web/app/(app)/showcase/page.tsx` · migration `0015_showcase_github` |
| Tests | `apps/web/test/showcase-github.test.ts` (new, pure) |

---

## 1. Problem
The showcase only lists a title, a description and one link from an approved proof. Projects have no definition (problem, approach, tech), no author contact, and no real code home. Learners who have never used GitHub get no help, and those who have must create and organise repos by hand, each in a different shape.

## 2. Solution

```
Define project (title, problem, solution, tech, links)
   │
   ├─ Has GitHub?  no ──► GitHub guide (account → 2FA → token → VS Code → clone → docs) ──► enter username
   │                yes
   ├─ Map an existing public repo  ─┐
   └─ Create a repo for me ─────────┤  org configured? → create in org, learner = admin
                                     │  else connected?  → create in learner's account
                                     │  else            → "Connect GitHub" first
                                     ▼
          README.md + docs/ structure committed by the app → learner clones in VS Code and adds docs
                                     ▼
          Showcase card: definition, author + email, repos, Drive/doc links, stage (Defined · Building · Reviewed)
```

**Repo layout** created by the app (one commit per file through the Contents API):
```
README.md                 title, problem, solution, tech, how to run, structure, author (name, email), links
CONTRIBUTING.md           how institution members contribute (branch → pull request)
.gitignore                Python + Node + OS files, .env
docs/01-problem.md        who has the problem, why it matters, success measure
docs/02-solution-design.md approach, architecture diagram placeholder, decisions
docs/03-data.md           sources, licences, cleaning steps, privacy
docs/04-setup-and-run.md  prerequisites, install, run, test
docs/05-results.md        what worked, metrics, screenshots
docs/06-demo-and-links.md demo video, Drive/Docs links, slides
src/README.md · data/README.md · notebooks/README.md   what goes in each folder
```

## 3. Behaviour
1. **Define.** `POST /api/v1/projects` `{ title 4–90, problem 30–1000, solution 30–1000, tech[≤12], links[≤6] }` creates a Project with `stage = 'defined'`, owned by the learner. Links are normalised and checked with `SHOWCASE_LINK_HEALTH_SPEC`. Under-18 learners need guardian consent (`assertChildAllowed('showcase_publish')`).
2. **GitHub identity.** `PUT /api/v1/github/username` `{ username }` checks the name against GitHub's rules (1–39 characters, letters, digits and single hyphens, no leading or trailing hyphen), confirms it with `GET /users/{u}`, and saves `githubUsername`.
3. **Map existing.** `GET /api/v1/github/repos` lists the learner's public repos (`GET /users/{u}/repos?sort=updated&per_page=100`; with a connected token, `GET /user/repos` so private repos show too, marked "private: make public to showcase"). `POST /api/v1/projects/:id/repos` `{ fullName }` attaches one; the repo must belong to the learner (owner = their username) or be in the institution org with the learner as a collaborator.
4. **Create.** `POST /api/v1/projects/:id/create-repo` picks the target with `repoTarget()`:
   - **org**: `POST /orgs/{org}/repos` (public, `auto_init: false`), then `PUT /repos/{org}/{name}/collaborators/{learner}` `{ permission: 'admin' }` (GitHub sends the learner an invitation).
   - **own**: `POST /user/repos` with the learner's token.
   - **none**: 409 "Connect GitHub or ask your admin to set up the institution organisation", with a link to the guide.

   The repo name is the slug of the title (lowercase, `-`, ≤ 60). On a name clash, a short suffix is added (`-2`, `-3`). Then each template file is written with `PUT /repos/{o}/{r}/contents/{path}`. Topics are set to `ai-accelerator-hub` plus the tech slugs. The stage becomes `building`. Every call is audited (`github.repo_created`).
5. **Admins as maintainers.** After creation, every Institution Admin of the tenant with a `githubUsername` is invited with `permission: 'maintain'`. If an invite fails (for example the username does not exist), it is skipped and logged; it never fails the creation.
6. **Contribute.** `POST /api/v1/projects/:id/contribute`: a signed-in member with a `githubUsername` is invited with `permission: 'push'`. The author is notified. One request per person per project.
7. **Showcase card**: title, stage badge, problem (two lines), tech chips, author name with email (hidden for minors), the repo link (GitHub icon), up to 6 extra links with link-health badges, and the Contribute button. The detail page `/showcase/:id` shows the full definition, the README checklist, and the clone command `git clone https://github.com/{o}/{r}.git`.
8. **Reviewed stage**: publishing an approved proof (existing flow) can attach to an existing defined project, which sets `stage = 'reviewed'` and keeps the "Reviewed" badge.
9. **Token safety**: OAuth tokens are encrypted with AES-256-GCM (key `GITHUB_TOKEN_KEY`, 32 bytes base64) and never sent to the browser or logged. "Disconnect" deletes the token. The org token lives only in env.
10. **GitHub guide** `/showcase/github-guide`: seven step cards with the exact clicks, each with a "Done" tick saved in the browser:
    1. Create the account (github.com/signup → email, password, username → verify email code).
    2. Turn on two-factor authentication (Settings → Password and authentication → Enable two-factor authentication → authenticator app → save the recovery codes).
    3. Create a personal access token (Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token; 90-day expiry; repository access: only the project repos; permissions: Contents read and write). Copy it once and keep it in a password manager.
    4. Install Git and VS Code, then set your name and email with `git config --global user.name "…"` and `git config --global user.email "…"`.
    5. Connect VS Code (Accounts → Sign in with GitHub in the browser), or on the first `git push` enter your username and paste the token as the password.
    6. Check out the project (VS Code → Source Control → Clone Repository → paste the clone URL → choose a folder → Open).
    7. Fill the docs (open `docs/01-problem.md` …, commit with a clear message, Sync / push), and see the README update on GitHub.

    Plus a short "How to organise all your GitHub projects" card: one repo per project, a clear name, a README in every repo, `docs/` for writing, `src/` for code, pinned repos on your profile, and a profile README.

## 4. Data and API
Migration `0015_showcase_github`:
- `projects`: `problem TEXT`, `solution TEXT`, `tech TEXT NOT NULL DEFAULT '[]'`, `stage TEXT NOT NULL DEFAULT 'reviewed'` (existing rows came from approved proofs), `links TEXT NOT NULL DEFAULT '[]'`
- `project_repos`: `fullName TEXT`, `createdByApp BOOLEAN NOT NULL DEFAULT false`
- `github_accounts` (new): `userId` (unique), `username`, `tokenEnc`, `scope`, `connectedAt`
- `project_contributors` (new): `projectId`, `userId`, `githubUsername`, `permission`, `createdAt`, unique(`projectId`, `userId`)

Env: `GITHUB_ORG`, `GITHUB_ORG_TOKEN` (fine-grained token on the org with Administration and Contents read/write, Members read), `GITHUB_CONNECT_CLIENT_ID`, `GITHUB_CONNECT_CLIENT_SECRET` (OAuth App with callback `https://<site>/api/v1/github/callback`, scope `public_repo`), `GITHUB_TOKEN_KEY`.

## 5. UI
`/showcase` (cards, "Define a project"), `/showcase/new` (form), `/showcase/:id` (detail: repo panel with Map / Create / Connect, clone command, contributors), `/showcase/github-guide`.

## 6. Acceptance criteria
- [x] AC-1: `repoName("My Sales Dashboard!!")` = `my-sales-dashboard`; names are ≤ 60 characters; a clash adds `-2`.
- [x] AC-2: `repoTarget`: org when configured; own when the learner is connected; none otherwise.
- [x] AC-3: GitHub username validation follows GitHub's rules.
- [x] AC-4: The template has README.md with the title, problem, author email and clone command, plus all of the `docs/` files listed above; no file is empty.
- [x] AC-5: Token encryption round-trips, a tampered ciphertext fails, and the plain token never appears in the encrypted string.
- [x] AC-6: The author's email is hidden on cards for under-18 authors.
- [ ] AC-7: Without org env or a connected token, create-repo returns 409 with the guide link.

## 7. Out of scope
GitLab (the same model can be added later). GitHub Classroom. Private showcase repos.

## 8. Open questions
1. Credentials: create the GitHub organisation and the fine-grained org token, and/or the "Connect" OAuth App, then add the env vars above. Until then, mapping existing public repos and the guide work, and "Create repo" explains what is missing.
