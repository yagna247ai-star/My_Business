import { prisma } from "@/lib/prisma";
import { isNeo4jEnabled, neo4jStatus, runCypher } from "@/lib/neo4j";
import { NextResponse } from "next/server";

export async function GET() {
  const checks: Record<string, unknown> = {};
  // Prisma/SQLite
  try {
    await prisma.$queryRaw`SELECT 1 as ok`;
    checks.db = { status: "ok" };
  } catch (e) {
    console.error("[health] database check failed", e);
    checks.db = { status: "error" };
  }
  // Neo4j
  // Public endpoint: status words only — no URIs, hostnames or raw driver errors (bug audit M2).
  if (isNeo4jEnabled()) {
    try {
      const res = neo4jStatus() === "down" ? null : await runCypher(`RETURN 1 AS ok`);
      checks.neo4j = { status: res ? "ok" : "unavailable", mode: res ? "graph" : "prisma-only fallback" };
    } catch {
      checks.neo4j = { status: "error", mode: "prisma-only fallback" };
    }
  } else {
    checks.neo4j = { status: "disabled", reason: "NEO4J_URI not set — Prisma-only fallback (see NEO4J_GUIDE.md)" };
  }
  // Redis (check if URL set, but not required for health)
  checks.redis = process.env.REDIS_URL ? { status: "configured" } : { status: "fallback", reason: "in-memory (dev only)" };
  // Overall
  const ok = (checks.db as { status: string }).status === "ok";
  return NextResponse.json({ status: ok ? "ok" : "degraded", version: "1.0.0", checks, timestamp: new Date().toISOString() }, { status: ok ? 200 : 503 });
}
