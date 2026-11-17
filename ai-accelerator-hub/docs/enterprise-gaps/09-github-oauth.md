# 09 — GitHub OAuth

**Status:** disabled. Email and password sign-in works; GitHub sign-in and the GitHub Lab are off.

## Current state

- `apps/web/lib/auth.ts:41` adds the GitHub provider only when both `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are set. Neither is set on production.
- `app/api/github/route.ts` and `app/_legacy_student/github/page.tsx` depend on it. `FEATURE_GITHUB_LAB=true` is set on production, but the code path still needs the OAuth credentials to work.
- `PENDING_CREDENTIALS.md` expects the callback `https://aihub.in/api/auth/callback/github`. The production domain is `ai-accelerator-hub-one.vercel.app`, so that callback is wrong for this deployment.

## Gap

- No GitHub OAuth app exists for this deployment.
- The callback URL must match the deployed domain exactly.

## Risk

- Low. GitHub is optional for sign-in. The learner proof flow may expect a linked GitHub repo, which would block that flow.

## Decision needed

- Is GitHub sign-in required at launch, and which domain will be the public one (see file 11)?

## Steps to close

1. In GitHub → Settings → Developer settings → OAuth Apps, create an app. Callback: `https://<final-domain>/api/auth/callback/github`.
2. Set `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` on Vercel Production. Redeploy.
3. Sign in with GitHub and confirm the link flow in `app/api/github/route.ts` works. Note: the `/api/projects/:id/link-github` endpoint in `PENDING_CREDENTIALS.md` does not exist in the code, so do not test against it.
