# Showcase Link Health (Drive links that do not open) — Specification

| | |
|---|---|
| Version | 1.0, 2026-11-25 |
| Trigger | "There are some Drive links in the showcase and those are not opening. Why? Do deep research and fix them." |
| Builds on | `apps/web/lib/domain/proofRelevance.ts` (`proofLinkProblem`, `linkPrivateProblem`), `apps/web/lib/domain/showcase.ts`, `docs/SHOWCASE_MODERATION` commit d15ecba |
| Code | `apps/web/lib/domain/linkHealthCore.ts` (new, pure) · `apps/web/lib/domain/proofRelevance.ts` · `apps/web/lib/domain/showcase.ts` · `apps/web/app/api/cron/link-health/route.ts` (new) · `apps/web/app/(app)/showcase/page.tsx` · `packages/db/prisma/migrations/0013_link_health` (new) |
| Tests | `apps/web/test/link-health.test.ts` (new, pure) |

---

## 1. Problem: root causes found in the code
1. **The check fails open.** `linkPrivateProblem` returns "fine" on any status other than 200/401/403/404, on timeouts and on errors. Google answers requests from cloud servers (Vercel runs on AWS) with 429, "unusual traffic" pages or consent pages, so private Drive links pass the check.
2. **Account-index links.** A link copied while signed in to a second Google account has `/u/1/` in the path or `?authuser=1`. It opens for the owner and fails, or asks for access, for everyone else.
3. **Personal views pass.** `drive.google.com/drive/my-drive`, `/drive/recent`, `/drive/home`, `/drive/shared-with-me`, `/drive/search?q=…` are the owner's own Drive views, not a shared item. They have a path, so `proofLinkProblem` accepts them.
4. **No re-check.** Projects published before the check existed (before commit d15ecba) were never checked. A link that was public at publish time can later be made private, deleted, or limited to the institution's Workspace domain ("Anyone at <school>").

## 2. Solution
- **Normalise** Google links when saved: remove `/u/N/` and `authuser`, and keep `resourcekey` (older shared files need it).
- **Reject** personal Drive views with a clear "Open the file or folder → Share → Copy link" message.
- **Three-state check**: `open | private | unknown`. Unknown (429, timeout, consent page) is retried once. Unknown still never blocks a learner's proof, but the showcase records it.
- **Link health** for showcase links: each `ProjectRepo` stores `linkStatus` (`ok | private | broken | unknown`) and `linkCheckedAt`. A daily cron re-checks every showcase link. When a link turns private or broken, the author is notified once with the share instructions, and the card shows "Link needs the author's attention".
- **Moderators** see the status and can trigger "Re-check now".

## 3. Behaviour
1. `normaliseShareUrl("https://drive.google.com/drive/u/1/folders/ABC?usp=sharing")` returns `https://drive.google.com/drive/folders/ABC?usp=sharing`. `https://docs.google.com/document/d/X/edit?authuser=2` returns `https://docs.google.com/document/d/X/edit`. A `resourcekey` is kept.
2. `proofLinkProblem` rejects the personal Drive views listed above.
3. `classifyResponse(status, location, body)` returns `private` for 401/403, for login redirects and for the private-page texts; `broken` for 404/410; `open` for 200 without private text; and `unknown` for anything else (429, 5xx, consent pages).
4. Publishing stores the normalised link and its status.
5. The cron route (`Bearer $CRON_SECRET`, daily) checks up to 200 links, oldest check first. If the status changes to private or broken, the author gets one notification.
6. Showcase cards: `ok` or `unknown` shows "Open project". `private` or `broken` shows a warning to the author and moderators, and the button stays for others with the note "may ask for access".

## 4. Data and API
`project_repos`: add `linkStatus TEXT NOT NULL DEFAULT 'unknown'` and `linkCheckedAt TIMESTAMP(3)`. Migration `0013_link_health`. Route `GET /api/cron/link-health`. `POST /api/v1/admin/showcase/:id/recheck` (moderators).

## 5. UI
Showcase card badge, author and moderator warning, and a Re-check button in Admin → Showcase.

## 6. Acceptance criteria
- [x] AC-1: `/u/1/` and `authuser` are removed and `resourcekey` is kept.
- [x] AC-2: `my-drive`, `recent`, `home`, `shared-with-me` and `search` Drive views are rejected.
- [x] AC-3: 429 / 5xx / timeouts are `unknown`, not `open`; 403 and login redirects are `private`; 404 is `broken`.
- [ ] AC-4: The cron route returns 401 without the secret.

## 7. Out of scope
Copying files into an institution Drive. That needs the Google Drive API and a service account.

## 8. Open questions
1. Please share one showcase link that does not open, to confirm which cause applies. Default: all four fixes ship.
