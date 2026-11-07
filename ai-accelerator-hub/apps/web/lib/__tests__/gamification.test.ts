import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Prisma for unit tests (no DB needed)
vi.mock("@/lib/prisma", () => ({
  prisma: {
    xpLedger: {
      findFirst: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockImplementation((data: unknown) => Promise.resolve({ id: "xp1", ...(data as { data: Record<string, unknown> }).data })),
      aggregate: vi.fn().mockResolvedValue({ _sum: { amount: 0 } }),
      findUnique: vi.fn().mockResolvedValue(null),
      findMany: vi.fn().mockResolvedValue([]),
      groupBy: vi.fn().mockResolvedValue([]),
    },
    streak: { upsert: vi.fn().mockResolvedValue({}), findUnique: vi.fn().mockResolvedValue(null) },
    streakEvent: { create: vi.fn().mockResolvedValue({}) },
    badge: { findMany: vi.fn().mockResolvedValue([]) },
    userBadge: { upsert: vi.fn().mockResolvedValue({}) },
    user: { findMany: vi.fn().mockResolvedValue([]) },
  },
}));

vi.mock("@/lib/neo4j", () => ({
  isNeo4jEnabled: () => false,
  runCypher: vi.fn().mockResolvedValue(null),
}));

import { awardXp, getLeaderboard } from "../gamification";
import { prisma } from "@/lib/prisma";

describe("XP ledger — server-authoritative, idempotent, hash chain", () => {
  beforeEach(() => vi.clearAllMocks());

  it("awards XP with idempotency_key and hash chain", async () => {
    const res = await awardXp({
      tenantId: "t1",
      userId: "u1",
      amount: 5,
      source: "activity_complete",
      idempotencyKey: "idem-1",
    });
    expect(res.awarded).toBe(true);
    expect(prisma.xpLedger.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ idempotencyKey: "idem-1", amount: 5 }) }));
    const call = (prisma.xpLedger.create as ReturnType<typeof vi.fn>).mock.calls[0][0].data;
    expect(call.rowHash).toBeDefined();
    expect(call.prevHash).toBeDefined();
  });

  it("prevents duplicate XP on same idempotency_key (no double award)", async () => {
    // First award
    await awardXp({ tenantId: "t1", userId: "u1", amount: 5, source: "activity_complete", idempotencyKey: "dup-key" });
    // Mock unique violation on second
    (prisma.xpLedger.create as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("Unique constraint failed on the fields: (`idempotencyKey`)"));
    (prisma.xpLedger.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: "existing", amount: 5 });
    (prisma.xpLedger.aggregate as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ _sum: { amount: 5 } });
    const res2 = await awardXp({ tenantId: "t1", userId: "u1", amount: 5, source: "activity_complete", idempotencyKey: "dup-key" });
    expect(res2.awarded).toBe(false); // second is deduped
  });

  it("rejects invalid XP amount (server guard)", async () => {
    await expect(awardXp({ tenantId: "t1", userId: "u1", amount: 9999, source: "activity_complete", idempotencyKey: "bad" })).rejects.toThrow("Invalid XP");
  });
});

describe("Leaderboard — fallback to Prisma when Neo4j disabled", () => {
  it("falls back to Prisma groupBy when Neo4j disabled", async () => {
    (prisma.xpLedger.groupBy as ReturnType<typeof vi.fn>).mockResolvedValue([
      { userId: "u1", _sum: { amount: 100 } },
      { userId: "u2", _sum: { amount: 80 } },
    ]);
    (prisma.user.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: "u1", name: "Alice", email: "a@x" },
      { id: "u2", name: "Bob", email: "b@x" },
    ]);
    const lb = await getLeaderboard("t1", "tenant", 10);
    expect(lb).toHaveLength(2);
    expect(lb[0]).toMatchObject({ userId: "u1", xp: 100 });
  });
});
