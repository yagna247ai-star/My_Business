/**
 * Neo4j Graph Seed — mirrors Prisma seed for graph layer
 * Creates: Tenant, User, Journey, Level nodes + REQUIRES edges (DAG) + COMPLETED for demo progress
 * Run: npx tsx prisma/seed-neo4j.ts  (requires NEO4J_URI)
 */
import { ensureGraphConstraints, runCypher } from "../../apps/web/lib/neo4j";

async function main() {
  if (!process.env.NEO4J_URI) {
    console.log("⚠️  NEO4J_URI not set — skipping graph seed (Prisma-only mode). Set NEO4J_URI=bolt://localhost:7687 to enable.");
    return;
  }
  console.log("🌱 Seeding Neo4j graph...");

  await ensureGraphConstraints();

  // Tenant
  await runCypher(`MERGE (t:Tenant {slug: $slug}) SET t.id=$id, t.name=$name, t.plan=$plan`, {
    slug: "demo",
    id: "demo-tenant-id",
    name: "Demo Institute",
    plan: "pro",
  });

  // Users (demo)
  const users = [
    { id: "user-admin", email: "admin@aihub.in", name: "Super Admin" },
    { id: "user-student", email: "student@aihub.in", name: "Demo Learner" },
    { id: "user-mentor", email: "mentor@aihub.in", name: "Demo Mentor" },
  ];
  for (const u of users) {
    await runCypher(`MERGE (u:User {email:$email}) SET u.id=$id, u.name=$name, u.tenantId='demo-tenant-id'`, u);
  }

  // Journey
  await runCypher(`MERGE (j:Journey {slug:$slug}) SET j.id=$id, j.title=$title, j.tenantId='demo-tenant-id'`, {
    slug: "genai-career-accelerator",
    id: "journey-genai",
    title: "GenAI Career Accelerator",
  });

  // Levels 1-15
  const levels = [
    { code: "L01_AWAKENING", idx: 1, title: "Level 1 — AI Awakening", xpReward: 120, stage: "STAGE_IGNITION" },
    { code: "L02_PROMPT", idx: 2, title: "Level 2 — Prompt Craft", xpReward: 140, stage: "STAGE_IGNITION" },
    { code: "L03_MEMORY", idx: 3, title: "Level 3 — Memory & State", xpReward: 150, stage: "STAGE_IGNITION" },
    { code: "L04_MCP", idx: 4, title: "Level 4 — Tools & Bridges", xpReward: 160, stage: "STAGE_CRAFT" },
    { code: "L05_RAG_FOUND", idx: 5, title: "Level 5 — RAG Foundations", xpReward: 170, stage: "STAGE_CRAFT" },
    { code: "L06_RAG_ADV", idx: 6, title: "Level 6 — Advanced RAG", xpReward: 180, stage: "STAGE_CRAFT" },
    { code: "L07_AGENTS", idx: 7, title: "Level 7 — Agents", xpReward: 200, stage: "STAGE_SHIP" },
    { code: "L08_EVAL", idx: 8, title: "Level 8 — Evaluation", xpReward: 210, stage: "STAGE_SHIP" },
    { code: "L09_WORKFLOW", idx: 9, title: "Level 9 — Workflow Automation", xpReward: 220, stage: "STAGE_SHIP" },
    { code: "L10_PROJECT", idx: 10, title: "Level 10 — Capstone I", xpReward: 250, stage: "STAGE_SHIP" },
    { code: "L11_TRACK_A", idx: 11, title: "Level 11 — Specialization", xpReward: 280, stage: "STAGE_SPECIALIZE" },
    { code: "L12_TRACK_B", idx: 12, title: "Level 12 — Deep Dive", xpReward: 300, stage: "STAGE_SPECIALIZE" },
    { code: "L13_TRACK_C", idx: 13, title: "Level 13 — Expert", xpReward: 320, stage: "STAGE_SPECIALIZE" },
    { code: "L14_HACKATHON", idx: 14, title: "Level 14 — Hackathon", xpReward: 350, stage: "STAGE_LAUNCH" },
    { code: "L15_CAREER", idx: 15, title: "Level 15 — Career Launch", xpReward: 350, stage: "STAGE_LAUNCH" },
  ];
  for (const l of levels) {
    await runCypher(
      `MERGE (l:Level {code:$code}) SET l.id=$id, l.idx=$idx, l.title=$title, l.xpReward=$xpReward, l.stage=$stage, l.journeyId='journey-genai', l.tenantId='demo-tenant-id'`,
      { id: `level-${l.code}`, ...l }
    );
    await runCypher(`MATCH (j:Journey {slug:'genai-career-accelerator'}), (l:Level {code:$code}) MERGE (j)-[:CONTAINS]->(l)`, { code: l.code });
  }

  // DAG edges: L02 requires L01, etc. (linear)
  for (let i = 2; i <= 15; i++) {
    const code = levels[i - 1].code;
    const prereq = levels[i - 2].code;
    await runCypher(`MATCH (l:Level {code:$code}), (p:Level {code:$prereq}) MERGE (l)-[:REQUIRES]->(p)`, { code, prereq });
  }

  // Enrollments: student -> journey
  await runCypher(`MATCH (u:User {email:'student@aihub.in'}), (j:Journey {slug:'genai-career-accelerator'}) MERGE (u)-[:ENROLLED_IN {currentLevelIdx:1, state:'active'}]->(j)`);

  // Progress: student marked L01 available (not yet completed)
  // Completed edge only when approved — demo seeding does NOT auto-complete, keeps canUnlock accurate

  // Team demo
  await runCypher(`MERGE (t:Team {id:'team-demo-1'}) SET t.name='Demo Squad', t.tenantId='demo-tenant-id', t.cohortId='cohort-jan-2026'`);
  await runCypher(`MATCH (u:User {email:'student@aihub.in'}), (t:Team {id:'team-demo-1'}) MERGE (u)-[:MEMBER_OF]->(t)`);

  // Verify
  const count = await runCypher(`MATCH (l:Level) RETURN count(l) AS c`);
  console.log("✓ Graph levels:", (count?.records[0] as unknown as { c: number })?.c);
  const dag = await runCypher(`MATCH (l:Level)-[:REQUIRES]->(p) RETURN l.code AS l, p.code AS p ORDER BY l.code LIMIT 3`);
  console.log("✓ DAG sample:", dag?.records);

  console.log("✅ Neo4j graph seed complete");
  console.log("   Browser: http://localhost:7474  (neo4j / aihud_dev_password)");
  console.log("   Try: MATCH (l:Level {code:'L02_PROMPT'})-[:REQUIRES*]->(p) RETURN p");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .then(() => process.exit(0));
