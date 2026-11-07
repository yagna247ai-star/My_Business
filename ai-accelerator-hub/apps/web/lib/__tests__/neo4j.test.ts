import { describe, it, expect, vi } from "vitest";

describe("Neo4j graph — fallback when disabled", () => {
  it("isNeo4jEnabled false when NEO4J_URI absent", async () => {
    const orig = process.env.NEO4J_URI;
    delete process.env.NEO4J_URI;
    const { isNeo4jEnabled } = await import("../neo4j");
    expect(isNeo4jEnabled()).toBe(false);
    process.env.NEO4J_URI = orig;
  });

  it("runCypher returns null when disabled (no throw)", async () => {
    const orig = process.env.NEO4J_URI;
    delete process.env.NEO4J_URI;
    // Need fresh import to re-evaluate
    vi.resetModules();
    const { runCypher } = await import("../neo4j");
    const res = await runCypher("MATCH (n) RETURN n");
    expect(res).toBeNull();
    process.env.NEO4J_URI = orig;
  });

  it("graph DAG helpers are defined", async () => {
    const mod = await import("../neo4j");
    expect(mod.addPrerequisite).toBeDefined();
    expect(mod.getPrerequisites).toBeDefined();
    expect(mod.canUnlockViaGraph).toBeDefined();
    expect(mod.markLevelCompleted).toBeDefined();
    expect(mod.followUser).toBeDefined();
    expect(mod.getLeaderboardGraph).toBeDefined();
  });
});
