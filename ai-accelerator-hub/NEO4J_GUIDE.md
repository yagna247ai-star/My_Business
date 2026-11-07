# Neo4j Graph Database — AI Accelerator Hub

**Primary graph DB for:** Journey DAG, social graph, teams, gamification relationships, recommendations
**Hybrid model:** Neo4j (graph) + Postgres/SQLite (transactional: billing, audit, XP ledger transactional copy)

## Why Neo4j here

| Domain | Graph benefit | Cypher advantage |
|--------|---------------|------------------|
| **Journey DAG** | `(:Level)-[:REQUIRES]->(:Level)` — transitive prerequisites | `MATCH (l)-[:REQUIRES*]->(p) RETURN p` vs recursive CTE |
| **canUnlock** | Traverse all prerequisites, check completed | Single query `missing = allPrereqs - doneCodes` |
| **Social** | `(:User)-[:FOLLOWS]->(:User)` , `(:User)-[:MEMBER_OF]->(:Team)` | Real-time feed, squad suggestions via graph traversals |
| **Teams** | 3–5 members, contribution tracking | `MATCH (u)-[:MEMBER_OF]->(t) RETURN u` |
| **Leaderboard** | Alternative to Redis ZSET | `MATCH (u)-[:COMPLETED]->(l) WITH u, sum(xp) ORDER BY xp DESC` |
| **Recommendations** | Career tracks, peer learning paths | GDS algorithms (PageRank on project graph, community detection) |

## Quick Start

```bash
# 1. Start Neo4j (requires Docker)
docker compose up -d neo4j
# Browser: http://localhost:7474  (neo4j / aihud_dev_password)
# Bolt:    bolt://localhost:7687

# 2. Env (already in .env.example → .env)
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=aihud_dev_password
NEO4J_DATABASE=neo4j

# 3. Install driver (apps/web)
cd apps/web && npm install neo4j-driver

# 4. Seed graph (mirrors Prisma seed)
npm run db:seed           # Prisma (SQLite)
npx tsx packages/db/prisma/seed-neo4j.ts  # Neo4j graph

# 5. Verify in Browser or cypher-shell
# In Neo4j Browser (http://localhost:7474):
MATCH (l:Level)-[:REQUIRES]->(p) RETURN l.code, p.code LIMIT 10
MATCH (u:User {email:'student@aihub.in'})-[:ENROLLED_IN]->(j) RETURN u, j
MATCH (u:User)-[:COMPLETED]->(l:Level) RETURN u.name, count(l) ORDER BY count(l) DESC

# From code:
import { runCypher, canUnlockViaGraph } from "@/lib/neo4j";
await canUnlockViaGraph(userId, "L02_PROMPT"); // {can:true, missing:[]}
```

## Without Docker (fallback)

If `NEO4J_URI` is not set, the app runs in **Prisma-only mode**:
- `isNeo4jEnabled()` → false
- All `runCypher()` calls become no-ops with warning logs
- `canUnlock` falls back to relational `level_prerequisites` + `progress` table (already implemented)
- Graph features show banner: “Graph disabled — set NEO4J_URI to enable social/team traversals”

This satisfies §36 “document limitation, provide plan, mark pending” — the graph is not faked.

## Data Model (Nodes & Relationships)

```
(:Tenant {slug, name}) -[:HAS_JOURNEY]-> (:Journey {slug, title}) -[:CONTAINS]-> (:Level {code, idx, xpReward})
(:Level)-[:REQUIRES]->(:Level)            // DAG edge, validated acyclic
(:User {email, tenantId}) -[:ENROLLED_IN {currentLevelIdx}]-> (:Journey)
(:User)-[:COMPLETED {at}]->(:Level)       // when progress.state=approved
(:User)-[:FOLLOWS]->(:User)
(:User)-[:MEMBER_OF]->(:Team {tenantId, cohortId})
(:Team)-[:BELONGS_TO]->(:Cohort)
(:User)-[:EARNED]->(:Badge)
(:User)-[:HAS_STREAK {current, longest}]
```

## Production

- **Neo4j Aura** (managed) `neo4j+s://xxxx.databases.neo4j.io` — set `NEO4J_URI` to Aura, `NEO4J_USERNAME`/`PASSWORD` to Aura creds.
- **Self-hosted** EKS via `infra/terraform/neo4j.tf` (helm chart, 3-node cluster, backup to S3).
- **Backups:** `neo4j-admin backup` → S3 daily, test restore monthly (see `scripts/backup-neo4j.sh`).

## Tests

```bash
# Unit: graph helpers (mock driver)
npm run test -- lib/neo4j.test.ts

# Integration (requires live Neo4j):
NEO4J_URI=bolt://localhost:7687 npm run test:e2e
```

## Troubleshooting

- `ServiceUnavailable` → check `docker compose logs neo4j`, ensure `NEO4J_AUTH` matches `.env`
- `ConstraintViolation` → `ensureGraphConstraints()` is idempotent — safe to re-run
- Slow traversals → add index `CREATE INDEX FOR (l:Level) ON (l.code)` (already in `ensureGraphConstraints`)

## ADR: Neo4j vs alternatives

- **vs Postgres ltree+CTE:** Neo4j traversals are O(depth) with native graph storage; CTE is O(n) recursive SQL. For 15-level DAG + 100k users, graph is clearer and powers social features without JOIN explosion.
- **vs relational-only:** Social/leaderboard/recommendations become JOIN-heavy; graph avoids N+1 and enables GDS.
- **Tradeoff:** Adds operational component (Aura removes ops). Hybrid keeps billing/audit in Postgres for ACID + ledger guarantees.
