/**
 * Journey Service — canUnlock with Neo4j graph first, Prisma fallback
 * Implements §8, §6, §10: 15-level DAG, 6 activities, competence-gated unlocking
 */

import { prisma } from "./prisma";
import { isNeo4jEnabled, canUnlockViaGraph } from "./neo4j";

export type UnlockGate = "prereq" | "linear" | "minXp" | "badge" | "entitlement" | "time";
export type UnlockResult = { canUnlock: boolean; reason?: string; missingPrereqs?: string[]; gates: Record<UnlockGate, boolean> };

/**
 * Check if user can unlock target level
 * Order: prereq DAG (graph) → linear → minXp → badge → entitlement → no time gate
 * Returns detailed gates for UI
 */
export async function canUnlock(params: {
  tenantId: string;
  userId: string;
  targetLevelIdx: number;
  journeyId: string;
}): Promise<UnlockResult> {
  const { tenantId, userId, targetLevelIdx, journeyId } = params;

  // Fetch target level
  const targetLevel = await prisma.level.findUnique({ where: { journeyId_idx: { journeyId, idx: targetLevelIdx } } });
  if (!targetLevel) return { canUnlock: false, reason: "Level not found", gates: { prereq: false, linear: false, minXp: false, badge: false, entitlement: false, time: true } };

  // Gate 1: Prereq DAG — try Neo4j first
  let prereqOk = true;
  let missingPrereqs: string[] = [];
  if (isNeo4jEnabled()) {
    try {
      const res = await canUnlockViaGraph(userId, targetLevel.code);
      prereqOk = res.can;
      missingPrereqs = res.missing;
    } catch (e) {
      console.warn("[journey] Neo4j canUnlock failed, falling back to Prisma:", e);
      // fallback below
      const prereqs = await prisma.levelPrerequisite.findMany({ where: { levelId: targetLevel.id }, include: { prerequisite: true } });
      for (const p of prereqs) {
        const prog = await prisma.progress.findFirst({ where: { userId, levelId: p.prerequisiteLevelId, state: "approved" } });
        if (!prog) {
          prereqOk = false;
          missingPrereqs.push(p.prerequisite.code);
        }
      }
    }
  } else {
    // Prisma fallback: check all level_prerequisites are approved
    const prereqs = await prisma.levelPrerequisite.findMany({ where: { levelId: targetLevel.id }, include: { prerequisite: true } });
    for (const p of prereqs) {
      const prog = await prisma.progress.findFirst({ where: { userId, levelId: p.prerequisiteLevelId, state: "approved" } });
      if (!prog) {
        prereqOk = false;
        missingPrereqs.push(p.prerequisite.code);
      }
    }
  }

  // Gate 2: Linear — must have approved previous idx (except L01)
  let linearOk = true;
  if (targetLevelIdx > 1) {
    const prevLevel = await prisma.level.findUnique({ where: { journeyId_idx: { journeyId, idx: targetLevelIdx - 1 } } });
    if (prevLevel) {
      const prevProg = await prisma.progress.findFirst({ where: { userId, levelId: prevLevel.id, state: "approved" } });
      linearOk = Boolean(prevProg);
    }
  }

  // Gate 3: minXp (from unlockCondition JSON, default 0)
  let minXpOk = true;
  try {
    const cond = targetLevel.unlockCondition ? JSON.parse(targetLevel.unlockCondition) : {};
    const minXp = cond.minXp || 0;
    if (minXp > 0) {
      const agg = await prisma.xpLedger.aggregate({ where: { tenantId, userId }, _sum: { amount: true } });
      minXpOk = (agg._sum.amount || 0) >= minXp;
    }
  } catch {}

  // Gate 4: badge (if condition requires)
  let badgeOk = true;
  try {
    const cond = targetLevel.unlockCondition ? JSON.parse(targetLevel.unlockCondition) : {};
    if (cond.requiredBadge) {
      const badge = await prisma.badge.findUnique({ where: { code: cond.requiredBadge } });
      if (badge) {
        const ub = await prisma.userBadge.findUnique({ where: { userId_badgeId: { userId, badgeId: badge.id } } });
        badgeOk = Boolean(ub);
      }
    }
  } catch {}

  // Gate 5: entitlement (level_access)
  let entitlementOk = true;
  const ent = await prisma.entitlement.findUnique({ where: { userId_tenantId_feature: { userId, tenantId, feature: "level_access" } } });
  if (ent && ent.remaining !== null) {
    entitlementOk = ent.remaining > 0 || targetLevelIdx === 1; // L01 always
  }

  // Gate 6: time — never time-gated per §8 (no time gates)
  const timeOk = true;

  const canUnlock = prereqOk && linearOk && minXpOk && badgeOk && entitlementOk && timeOk;
  const gates = { prereq: prereqOk, linear: linearOk, minXp: minXpOk, badge: badgeOk, entitlement: entitlementOk, time: timeOk };
  const reason = !canUnlock
    ? !prereqOk
      ? `Missing prerequisites: ${missingPrereqs.join(", ")}`
      : !linearOk
        ? `Complete L${targetLevelIdx - 1} first`
        : !minXpOk
          ? "Insufficient XP"
          : !badgeOk
            ? "Required badge not earned"
            : !entitlementOk
              ? "No level_access entitlement — upgrade plan"
              : "Locked"
    : undefined;

  return { canUnlock, reason, missingPrereqs, gates };
}

export async function unlockLevel(params: { tenantId: string; userId: string; levelIdx: number; journeyId: string; reason?: string }) {
  const res = await canUnlock({ tenantId: params.tenantId, userId: params.userId, targetLevelIdx: params.levelIdx, journeyId: params.journeyId });
  if (!res.canUnlock) return res;

  const targetLevel = await prisma.level.findUnique({ where: { journeyId_idx: { journeyId: params.journeyId, idx: params.levelIdx } } });
  if (!targetLevel) return { canUnlock: false, reason: "Level not found", gates: res.gates };

  const enrollment = await prisma.enrollment.findUnique({ where: { tenantId_userId_journeyId: { tenantId: params.tenantId, userId: params.userId, journeyId: params.journeyId } } });
  if (!enrollment) return { canUnlock: false, reason: "Not enrolled", gates: res.gates };

  // Create or update progress to available
  const progress = await prisma.progress.upsert({
    where: { enrollmentId_levelId: { enrollmentId: enrollment.id, levelId: targetLevel.id } },
    update: { state: "available", unlockedAt: new Date() },
    create: { tenantId: params.tenantId, enrollmentId: enrollment.id, levelId: targetLevel.id, userId: params.userId, state: "available", unlockedAt: new Date() },
  });

  // Ensure boss challenge row
  await prisma.bossChallengeProgress.upsert({
    where: { progressId: progress.id },
    update: {},
    create: { progressId: progress.id, state: "locked" },
  });

  // Audit + unlock_events
  await prisma.unlockEvent.create({
    data: { tenantId: params.tenantId, userId: params.userId, levelId: targetLevel.id, reason: params.reason || "canUnlock" },
  });
  await prisma.auditLog.create({
    data: { tenantId: params.tenantId, actorUserId: params.userId, action: "level.unlock", resourceType: "Level", resourceId: targetLevel.id, after: JSON.stringify({ levelCode: targetLevel.code }) },
  });

  // If Neo4j enabled, also mark unlock in graph (for canUnlockViaGraph to use COMPLETED later, unlock is implicit)
  if (isNeo4jEnabled()) {
    try {
      const { runCypher } = await import("./neo4j");
      await runCypher(`MATCH (u:User {id:$uid}), (l:Level {code:$code}) MERGE (u)-[:UNLOCKED {at: datetime()}]->(l)`, { uid: params.userId, code: targetLevel.code });
    } catch {}
  }

  return { canUnlock: true, progress, gates: res.gates };
}
