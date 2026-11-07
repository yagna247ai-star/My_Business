import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    level: { findUnique: vi.fn() },
    levelPrerequisite: { findMany: vi.fn().mockResolvedValue([]) },
    progress: { findFirst: vi.fn(), findUnique: vi.fn(), upsert: vi.fn().mockResolvedValue({}), create: vi.fn().mockResolvedValue({}) },
    enrollment: { findUnique: vi.fn() },
    xpLedger: { aggregate: vi.fn().mockResolvedValue({ _sum: { amount: 0 } }) },
    badge: { findUnique: vi.fn().mockResolvedValue(null) },
    userBadge: { findUnique: vi.fn().mockResolvedValue(null) },
    entitlement: { findUnique: vi.fn().mockResolvedValue({ remaining: 15 }) },
    unlockEvent: { create: vi.fn().mockResolvedValue({}) },
    auditLog: { create: vi.fn().mockResolvedValue({}) },
    bossChallengeProgress: { upsert: vi.fn().mockResolvedValue({}) },
  },
}));

vi.mock("@/lib/neo4j", () => ({
  isNeo4jEnabled: vi.fn(() => false),
  canUnlockViaGraph: vi.fn().mockResolvedValue({ can: true, missing: [] }),
  runCypher: vi.fn().mockResolvedValue(null),
}));

import { canUnlock } from "../journey";
import { prisma } from "@/lib/prisma";
import * as neo from "@/lib/neo4j";

describe("canUnlock — competence-gated, no time gates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(neo.isNeo4jEnabled).mockReturnValue(false);
    vi.mocked(neo.canUnlockViaGraph).mockResolvedValue({ can: true, missing: [] });
  });

  it("L01 always unlockable (no prereqs)", async () => {
    (prisma.level.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "l1", code: "L01_AWAKENING", idx: 1, journeyId: "j1", unlockCondition: null });
    const res = await canUnlock({ tenantId: "t1", userId: "u1", targetLevelIdx: 1, journeyId: "j1" });
    expect(res.canUnlock).toBe(true);
    expect(res.gates.prereq).toBe(true);
  });

  it("blocks L02 when L01 not approved (linear gate)", async () => {
    (prisma.level.findUnique as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ id: "l2", code: "L02_PROMPT", idx: 2, journeyId: "j1", unlockCondition: null }) // target
      .mockResolvedValueOnce({ id: "l1", code: "L01_AWAKENING", idx: 1, journeyId: "j1" }); // prev
    (prisma.progress.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null); // no L01 approved
    const res = await canUnlock({ tenantId: "t1", userId: "u1", targetLevelIdx: 2, journeyId: "j1" });
    expect(res.canUnlock).toBe(false);
    expect(res.gates.linear).toBe(false);
  });

  it("uses Neo4j graph when enabled — missing prereqs block", async () => {
    vi.mocked(neo.isNeo4jEnabled).mockReturnValue(true);
    vi.mocked(neo.canUnlockViaGraph).mockResolvedValue({ can: false, missing: ["L01_AWAKENING"] });
    (prisma.level.findUnique as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ id: "l3", code: "L03_MEMORY", idx: 3, journeyId: "j1", unlockCondition: null })
      .mockResolvedValueOnce({ id: "l2", code: "L02_PROMPT", idx: 2, journeyId: "j1" });
    (prisma.progress.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "p1" }); // linear ok
    const res = await canUnlock({ tenantId: "t1", userId: "u1", targetLevelIdx: 3, journeyId: "j1" });
    expect(res.gates.prereq).toBe(false);
    expect(res.missingPrereqs).toContain("L01_AWAKENING");
  });

  it("entitlement gate — no remaining blocks L02", async () => {
    (prisma.level.findUnique as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ id: "l2", code: "L02_PROMPT", idx: 2, journeyId: "j1", unlockCondition: null })
      .mockResolvedValueOnce({ id: "l1", code: "L01_AWAKENING", idx: 1, journeyId: "j1" });
    (prisma.progress.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "p1" }); // linear ok
    (prisma.entitlement.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ remaining: 0 });
    const res = await canUnlock({ tenantId: "t1", userId: "u1", targetLevelIdx: 2, journeyId: "j1" });
    expect(res.gates.entitlement).toBe(false);
  });
});
