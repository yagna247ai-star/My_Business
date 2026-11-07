/**
 * Neo4j Graph Driver — AI Accelerator Hub
 * Primary graph DB for: journey DAG (level prerequisites), social graph, teams, gamification relationships, recommendations
 * Falls back gracefully when NEO4J_URI absent (Prisma-only mode)
 *
 * Usage:
 *   import { getNeo4jSession, runCypher, isNeo4jEnabled } from "@/lib/neo4j";
 *   if (isNeo4jEnabled()) { await runCypher(`MATCH (t:Tenant {slug:$slug}) RETURN t`, {slug}) }
 *
 * Env: NEO4J_URI, NEO4J_USERNAME, NEO4J_PASSWORD, NEO4J_DATABASE
 */

let driver: unknown = null;
/* Circuit breaker (bug audit M2): after a connection failure, skip Neo4j for a minute instead of
   retrying (and logging a stack trace) on every request. Callers already treat null as "no graph". */
const RETRY_MS = 60_000;
let downUntil = 0;
let lastError = '';
const markDown = (e: unknown) => { downUntil = Date.now() + RETRY_MS; lastError = String((e as { code?: string })?.code || 'connection_failed'); };
const isConnectionError = (e: unknown) => /ServiceUnavailable|SessionExpired|ECONNREFUSED|ENOTFOUND|Failed to connect|connection/i.test(String((e as { code?: string })?.code || '') + ' ' + String((e as Error)?.message || e));
/** For health checks: never includes credentials or raw driver errors. */
export function neo4jStatus(): 'disabled' | 'down' | 'unknown' {
  if (!isNeo4jEnabled()) return 'disabled';
  return downUntil > Date.now() ? 'down' : 'unknown';
}
export const neo4jLastError = () => lastError;

export function isNeo4jEnabled(): boolean {
  return Boolean(process.env.NEO4J_URI);
}

async function getDriver() {
  if (!isNeo4jEnabled()) return null;
  if (downUntil > Date.now()) return null;
  if (driver) return driver;
  try {
    // Lazy import so app boots without neo4j-driver installed (Prisma-only fallback)
    const neo4j = await import("neo4j-driver");
    const uri = process.env.NEO4J_URI!;
    const username = process.env.NEO4J_USERNAME || "neo4j";
    const password = process.env.NEO4J_PASSWORD || "";
    const auth = neo4j.auth.basic(username, password);
    // @ts-ignore
    driver = neo4j.driver(uri, auth, {
      maxConnectionPoolSize: 20,
      connectionAcquisitionTimeout: 10000,
    });
    // Verify connectivity (non-blocking)
    // @ts-ignore
    const ok = await (driver as { verifyConnectivity: () => Promise<void> }).verifyConnectivity().then(() => true, (e: unknown) => {
      markDown(e);
      console.warn(`[neo4j] not reachable — Prisma-only fallback for ${RETRY_MS / 1000}s (${lastError})`);
      return false;
    });
    if (!ok) { await closeNeo4jDriver(); return null; }
    return driver;
  } catch (e) {
    console.warn("[neo4j] driver not installed or connection failed — graph features disabled:", e);
    return null;
  }
}

export async function getNeo4jSession(database?: string) {
  const d = await getDriver();
  if (!d) return null;
  const db = database || process.env.NEO4J_DATABASE || "neo4j";
  // @ts-ignore
  return (d as { session: (opts: unknown) => unknown }).session({ database: db });
}

export async function runCypher<T = unknown>(cypher: string, params: Record<string, unknown> = {}): Promise<{ records: T[]; summary: unknown } | null> {
  const session = (await getNeo4jSession()) as { run: (q: string, p: unknown) => Promise<{ records: unknown[]; summary: unknown }>; close: () => Promise<void> } | null;
  if (!session) return null; // disabled, not installed, or circuit open — callers fall back to Prisma
  try {
    const result = await session.run(cypher, params);
    // @ts-ignore
    const records = result.records.map((r: { toObject: () => T }) => r.toObject()) as T[];
    return { records, summary: result.summary };
  } catch (e) {
    if (isConnectionError(e)) { markDown(e); await closeNeo4jDriver(); console.warn(`[neo4j] connection lost — Prisma-only fallback for ${RETRY_MS / 1000}s`); return null; }
    throw e; // a real query error is a bug and should surface
  } finally {
    await session.close().catch(() => {});
  }
}

export async function closeNeo4jDriver() {
  if (driver) {
    // @ts-ignore
    await (driver as { close: () => Promise<void> }).close().catch(() => {});
    driver = null;
  }
}

// ── Graph helpers for journey DAG ──

/**
 * Ensure graph schema constraints (run on seed / bootstrap)
 * Call once at startup or seed. Idempotent.
 */
export async function ensureGraphConstraints() {
  if (!isNeo4jEnabled()) return;
  const queries = [
    `CREATE CONSTRAINT tenant_slug IF NOT EXISTS FOR (t:Tenant) REQUIRE t.slug IS UNIQUE`,
    `CREATE CONSTRAINT user_email IF NOT EXISTS FOR (u:User) REQUIRE u.email IS UNIQUE`,
    `CREATE CONSTRAINT journey_slug IF NOT EXISTS FOR (j:Journey) REQUIRE j.slug IS UNIQUE`,
    `CREATE CONSTRAINT level_code IF NOT EXISTS FOR (l:Level) REQUIRE l.code IS UNIQUE`,
    `CREATE CONSTRAINT team_id IF NOT EXISTS FOR (tm:Team) REQUIRE tm.id IS UNIQUE`,
  ];
  for (const q of queries) {
    await runCypher(q).catch((e) => console.warn("[neo4j] constraint failed:", q, e));
  }
  // Indexes for graph traversals
  const indices = [
    `CREATE INDEX tenant_id IF NOT EXISTS FOR (t:Tenant) ON (t.id)`,
    `CREATE INDEX level_idx IF NOT EXISTS FOR (l:Level) ON (l.idx)`,
    `CREATE INDEX user_id IF NOT EXISTS FOR (u:User) ON (u.id)`,
  ];
  for (const q of indices) {
    await runCypher(q).catch(() => {});
  }
}

/**
 * Graph DAG: Level prerequisites
 * (:Level)-[:REQUIRES]->(:Level)
 * Use for canUnlock — traverse prerequisites via graph, not relational CTE
 */
export async function addPrerequisite(levelCode: string, prereqCode: string) {
  return runCypher(
    `MATCH (l:Level {code: $levelCode}), (p:Level {code: $prereqCode}) MERGE (l)-[:REQUIRES]->(p) RETURN l, p`,
    { levelCode, prereqCode }
  );
}

export async function getPrerequisites(levelCode: string) {
  const res = await runCypher<{ p: { properties: { code: string } } }>(
    `MATCH (l:Level {code:$code})-[:REQUIRES]->(p:Level) RETURN p`,
    { code: levelCode }
  );
  return res?.records.map((r: unknown) => (r as { p: { properties: { code: string } } }).p.properties.code) || [];
}

export async function canUnlockViaGraph(userId: string, targetLevelCode: string): Promise<{ can: boolean; missing: string[] }> {
  // Check all prerequisites for target level are completed by user
  // Completed = (:User)-[:COMPLETED]->(:Level)
  const res = await runCypher<{ missingCodes: string[] }>(
    `
    MATCH (target:Level {code:$targetCode})
    OPTIONAL MATCH (target)-[:REQUIRES*]->(prereq:Level)
    WITH collect(prereq.code) AS allPrereqs
    MATCH (u:User {id:$userId})
    OPTIONAL MATCH (u)-[:COMPLETED]->(done:Level) WHERE done.code IN allPrereqs
    WITH allPrereqs, collect(done.code) AS doneCodes, u
    RETURN [c IN allPrereqs WHERE NOT c IN doneCodes] AS missingCodes
    `,
    { targetCode: targetLevelCode, userId }
  );
  const missing = (res?.records[0] as unknown as { missingCodes: string[] })?.missingCodes || [];
  return { can: missing.length === 0, missing };
}

export async function markLevelCompleted(userId: string, levelCode: string) {
  return runCypher(
    `MATCH (u:User {id:$userId}), (l:Level {code:$levelCode}) MERGE (u)-[r:COMPLETED {at: datetime()}]->(l) RETURN r`,
    { userId, levelCode }
  );
}

// Social graph helpers
export async function followUser(followerId: string, followingId: string) {
  return runCypher(`MATCH (a:User {id:$a}), (b:User {id:$b}) MERGE (a)-[:FOLLOWS {since: datetime()}]->(b)`, { a: followerId, b: followingId });
}
export async function joinTeam(userId: string, teamId: string) {
  return runCypher(`MATCH (u:User {id:$u}), (t:Team {id:$t}) MERGE (u)-[:MEMBER_OF]->(t)`, { u: userId, t: teamId });
}
export async function getTeamMembers(teamId: string) {
  const res = await runCypher(`MATCH (u:User)-[:MEMBER_OF]->(t:Team {id:$teamId}) RETURN u`, { teamId });
  return res?.records || [];
}
// Leaderboard via graph (alternative to Redis ZSET)
export async function getLeaderboardGraph(tenantId: string, limit = 10) {
  const res = await runCypher(
    `MATCH (u:User)-[c:COMPLETED]->(l:Level) WHERE u.tenantId=$tenantId
     WITH u, count(l) AS levelsDone, sum(l.xpReward) AS xp
     RETURN u.id AS userId, u.name AS name, levelsDone, xp ORDER BY xp DESC LIMIT $limit`,
    { tenantId, limit }
  );
  return res?.records || [];
}
