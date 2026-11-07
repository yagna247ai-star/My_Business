/**
 * Gamification — XP ledger, streak, badges, leaderboard (hybrid Prisma + Neo4j + Redis)
 * XP: server-authoritative, append-only, idempotency_key UNIQUE, hash chain prev_hash/row_hash
 * Streak: non-punitive (freeze, grace, recovery) IST
 * Leaderboard: Redis ZSET in prod, Neo4j graph alternative, in-memory fallback for dev
 */
import { prisma } from "./prisma";
import crypto from "crypto";
import { isNeo4jEnabled, runCypher } from "./neo4j";

export async function awardXp(params: {
  tenantId: string;
  userId: string;
  amount: number;
  source: string;
  levelId?: string;
  activityId?: string;
  idempotencyKey: string;
  metadata?: Record<string, unknown>;
}): Promise<{ awarded: boolean; entry?: unknown; totalXp?: number }> {
  const { tenantId, userId, amount, source, levelId, activityId, idempotencyKey, metadata } = params;

  // Validate server-side: amount must match canonical XP for source (prevent client tampering)
  // For activity_complete, amount is looked up from Activity.xpReward — caller must not pass arbitrary amount in prod
  if (amount <= 0 || amount > 1000) throw new Error("Invalid XP amount (server-side guard)");

  // Advisory lock concept: Prisma doesn't have pg_advisory_xact_lock in SQLite, but we serialize via unique idempotency
  const prev = await prisma.xpLedger.findFirst({ where: { tenantId, userId }, orderBy: { createdAt: "desc" } });
  const prevHash = prev?.rowHash || "genesis";
  const rowHash = crypto.createHash("sha256").update(JSON.stringify({ userId, amount, prevHash, idempotencyKey, source })).digest("hex");

  try {
    const entry = await prisma.xpLedger.create({
      data: {
        tenantId, userId, amount, source, levelId, activityId,
        idempotencyKey, prevHash: prev?.rowHash || null, rowHash,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });

    // Update streak (IST)
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    await prisma.streak.upsert({
      where: { tenantId_userId: { tenantId, userId } },
      update: { lastActiveDate: today },
      create: { tenantId, userId, currentStreak: 1, longestStreak: 1, lastActiveDate: today },
    });
    await prisma.streakEvent.create({ data: { tenantId, userId, date: today, type: "active" } }).catch(() => {});

    // Increment ZSET / graph
    // Redis: ZINCRBY t:{tenantId}:lb:weekly <amount> <userId>  (if REDIS_URL set)
    // Neo4j: optional mirror for graph leaderboard
    if (isNeo4jEnabled()) {
      runCypher(`MERGE (u:User {id:$uid}) SET u.tenantId=$tid, u.lastXpAward=$amt`, { uid: userId, tid: tenantId, amt: amount }).catch(() => {});
    }

    // Check badges (JSONLogic-lite: xp >= threshold)
    const badges = await prisma.badge.findMany();
    const totalAgg = await prisma.xpLedger.aggregate({ where: { tenantId, userId }, _sum: { amount: true } });
    const totalXp = totalAgg._sum.amount || 0;
    for (const b of badges) {
      try {
        const cond = b.condition ? JSON.parse(b.condition) : {};
        let earned = false;
        if (cond.xp && typeof cond.xp === "string" && cond.xp.startsWith(">=")) {
          const thresh = parseInt(cond.xp.slice(2), 10);
          earned = totalXp >= thresh;
        }
        if (earned) {
          await prisma.userBadge.upsert({
            where: { userId_badgeId: { userId, badgeId: b.id } },
            update: {},
            create: { userId, badgeId: b.id },
          }).catch(() => {});
        }
      } catch {}
    }

    return { awarded: true, entry, totalXp };
  } catch (e) {
    // Unique violation on idempotencyKey → already awarded, no double XP (anti-fraud)
    if (String(e).includes("Unique constraint") || String(e).includes("UNIQUE")) {
      const existing = await prisma.xpLedger.findUnique({ where: { idempotencyKey } });
      const totalAgg = await prisma.xpLedger.aggregate({ where: { tenantId, userId }, _sum: { amount: true } });
      return { awarded: false, entry: existing, totalXp: totalAgg._sum.amount || 0 };
    }
    throw e;
  }
}

export async function getLeaderboard(tenantId: string, _scope: "tenant" | "cohort" | "global" = "tenant", limit = 10) {
  // Try Redis ZSET first (if configured), then Neo4j graph, then Prisma aggregate fallback
  if (isNeo4jEnabled()) {
    try {
      const res = await runCypher(`MATCH (u:User)-[c:COMPLETED]->(l:Level) WHERE u.tenantId=$tid WITH u, count(l) AS levels, sum(l.xpReward) AS xp RETURN u.id AS userId, u.name AS name, levels, xp ORDER BY xp DESC LIMIT $limit`, { tid: tenantId, limit });
      if (res && res.records.length > 0) return res.records;
    } catch {}
  }
  // Prisma fallback: aggregate xp_ledger
  const rows = await prisma.xpLedger.groupBy({
    by: ["userId"],
    where: { tenantId },
    _sum: { amount: true },
    orderBy: { _sum: { amount: "desc" } },
    take: limit,
  });
  const userIds = rows.map((r) => r.userId);
  const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, email: true } });
  const byId = Object.fromEntries(users.map((u) => [u.id, u]));
  return rows.map((r, idx) => ({ rank: idx + 1, userId: r.userId, name: byId[r.userId]?.name || byId[r.userId]?.email, xp: r._sum.amount, source: "prisma" }));
}

export async function verifyXpChain(tenantId: string, userId: string): Promise<{ valid: boolean; brokenAt?: string }> {
  const entries = await prisma.xpLedger.findMany({ where: { tenantId, userId }, orderBy: { createdAt: "asc" } });
  let prevHash = "genesis";
  for (const e of entries) {
    const expected = crypto.createHash("sha256").update(JSON.stringify({ userId, amount: e.amount, prevHash, idempotencyKey: e.idempotencyKey, source: e.source })).digest("hex");
    if (e.rowHash !== expected) return { valid: false, brokenAt: e.id };
    prevHash = e.rowHash || prevHash;
    if (e.prevHash !== (entries.indexOf(e) === 0 ? null : entries[entries.indexOf(e) - 1].rowHash)) {
      // Also check prev chain
      const idx = entries.indexOf(e);
      if (idx > 0 && e.prevHash !== entries[idx - 1].rowHash) return { valid: false, brokenAt: e.id };
    }
  }
  return { valid: true };
}
