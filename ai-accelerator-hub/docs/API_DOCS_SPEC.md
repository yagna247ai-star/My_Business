# API docs (Swagger / OpenAPI for every route) — Specification

| | |
|---|---|
| Version | 1.0, 2026-11-26 |
| Trigger | "For all the APIs, enable Swagger." |
| Decisions | The API is the 139 Next.js route handlers under `apps/web/app/api` (the NestJS app in `apps/api` is not deployed). The OpenAPI document is generated from the route files themselves, so it cannot drift: paths, methods, path parameters, who may call it, rate limits, and request bodies converted from each route's own zod schema. Docs are for Super Admins and Institution Admins (they map out admin endpoints); every endpoint still enforces its own permission. Swagger UI comes from jsDelivr, pinned to swagger-ui-dist 5.17.14 with subresource integrity, and only the docs page's CSP allows it. |
| Code | `apps/web/lib/apiDocs/openapi.ts` (pure builder) · `apps/web/scripts/openapi-gen.ts` → `apps/web/lib/apiDocs/openapi.generated.json` · `apps/web/app/api/v1/openapi.json/route.ts` · `apps/web/app/api-docs/page.tsx` · CSP entry in `apps/web/next.config.js` · menu link in the admin console |
| Tests | `apps/web/test/api-docs.test.ts` |

## 1. Acceptance criteria
- [x] AC-1: Given every `route.ts` under `app/api`, when the document is built, then each exported method appears once under its path, with `[param]` written as `{param}` and declared as a path parameter.
- [x] AC-2: Each operation says who may call it: `x-permission` and the cookie session for `requirePerm('…')`, a signed-in session for `requireCtx()`, the cron secret for `/api/cron/*`, and public otherwise. Rate limits appear as `x-rate-limit`.
- [x] AC-3: When a route reads its body with `body(req, schema)` and the schema is a zod expression in that file, then the request body is that schema as JSON Schema. Anything that cannot be converted is documented as a JSON object, never dropped.
- [x] AC-4: The committed `openapi.generated.json` equals a fresh build (the test fails when a route is added or changed without `npm run openapi`).
- [x] AC-5: `GET /api/v1/openapi.json` and the `/api-docs` page require a Super Admin or Institution Admin (`institute:manage`); others get 401/403 or the no-access card.
- [x] AC-6: Only `/api-docs` may load scripts and styles from cdn.jsdelivr.net, and only the pinned files with integrity hashes.

## 2. Release
No migration. A new page, one new GET route, one CSP entry. Regenerate with `npm run openapi` after changing any route.
