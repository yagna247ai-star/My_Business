# 03 — Redis, rate limits, and leaderboard

**Status:** in-memory fallback. Works for one instance; does not hold across replicas.

## Current state

- `app/api/health/route.ts:28` reports `redis: fallback — in-memory (dev only)` because `REDIS_URL` is unset.
- `apps/web/lib/server/http.ts:12`: the rate limiter is a fixed-window in-memory counter, "per instance only." The comment says production should use Redis.
- `apps/web/lib/gamification.ts`: the leaderboard tries Redis ZSET (`ZINCRBY t:{tenantId}:lb:weekly`) when configured, then Neo4j, then a Prisma aggregate over `xp_ledger`. With no Redis, it uses the Prisma aggregate.
- `RATE_LIMIT_WINDOW_MS=60000` and `RATE_LIMIT_MAX_REQUESTS=60` are set on production.

## Gap

- Vercel runs many function instances. Each has its own counter, so the effective rate limit is multiplied by the number of instances. Abuse protection on login and AI endpoints is weak.
- The leaderboard works through the Prisma fallback, which is slower but correct. Real-time ranking is not available.
- `PENDING_CREDENTIALS.md` names ElastiCache (ap-south-1) as the intended Redis, but nothing is provisioned.

## Risk

- Medium. Login brute-force and AI spend limits are not reliable across instances.

## Decision needed

- Redis provider. Options: Upstash (serverless, easy on Vercel) or ElastiCache in ap-south-1 (matches the data-residency plan, needs VPC access from Vercel, which is hard).

## Steps to close

1. Provision Redis and set `REDIS_URL` on Vercel Production.
2. Confirm `/api/health` reports `redis: configured`.
3. Confirm the rate limiter uses Redis when `REDIS_URL` is set. If it does not, move the limiter to Redis before launch.
4. Load-test login and an AI endpoint across two deployments to confirm the limit holds.
