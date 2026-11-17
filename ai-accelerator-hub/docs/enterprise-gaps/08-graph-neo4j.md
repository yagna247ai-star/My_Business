# 08 — Graph database (Neo4j)

**Status:** disabled. Optional. The app works without it.

## Current state

- `apps/web/lib/neo4j.ts:29` enables the graph when `NEO4J_URI` is set. Production does not set it.
- `/api/graph/health` returns `{"status":"disabled","mode":"prisma-only"}`.
- `FEATURE_NEO4J_GRAPH=false` is set on production, but **no active code reads it.** Enablement depends only on `NEO4J_URI`.
- Used for the journey DAG, social graph (followers and squads), and recommendations. Leaderboard falls back to Prisma (see file 03).

## Gap

- Features that depend on the graph (social graph, some recommendations) are off. Nothing core is blocked.
- The graph code is not tested against a live Neo4j in this environment.

## Risk

- Low for launch.

## Decision needed

- Is the graph needed at launch? If yes, choose Neo4j Aura (`neo4j+s://…`). If no, keep it off and document that the social features are deferred.

## Steps to close

1. If needed: create an Aura instance, set `NEO4J_URI`, `NEO4J_USERNAME`, `NEO4J_PASSWORD`, `NEO4J_DATABASE` on Vercel Production.
2. Confirm `/api/graph/health` reports `ok` and run the seed (`seed-neo4j.ts`) once.
3. Remove `FEATURE_NEO4J_GRAPH` from Vercel. It does nothing today.
