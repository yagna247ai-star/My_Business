/**
 * AI Accelerator Hub — Seed
 * Seeds: 10 roles, demo tenant, 5 stages, 15 levels (L01 fully detailed, L02-15 placeholders), 6 activities for L01 + 90 canonical, rubrics, badges, 5 AI assistants, plans, demo users (admin/student/mentor)
 * Idempotent: upserts by unique keys
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding AI Accelerator Hub...');

  // ── Roles (10 canonical per architecture) ──
  const roles = [
    { code: 'super_admin', name: 'Super Admin', description: 'Platform owner — tenants, billing, global audit' },
    { code: 'tenant_admin', name: 'Institution Admin', description: 'Manage users, branding, cohorts for tenant' },
    { code: 'program_mgr', name: 'Program Manager', description: 'Design journeys, publish levels, analytics' },
    { code: 'instructor', name: 'Instructor', description: 'Author content, assignments, grading' },
    { code: 'mentor', name: 'Cohort Mentor', description: '1:1 guidance, office hours' },
    { code: 'reviewer', name: 'Reviewer', description: 'Approve submissions, QA' },
    { code: 'learner', name: 'Learner', description: 'Progress through journey (default)' },
    { code: 'team_lead', name: 'Team Lead', description: 'View team progress, approve team submissions' },
    { code: 'finance', name: 'Finance', description: 'Invoices, refunds, Razorpay reconciliation, GST' },
    { code: 'support', name: 'Support/Moderator', description: 'Tickets, moderation, audited impersonation' },
  ];
  for (const r of roles) {
    await prisma.role.upsert({ where: { code: r.code }, update: {}, create: r });
  }
  console.log('✓ Roles (10)');

  // ── Tenant (demo) ──
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      slug: 'demo',
      name: 'Demo Institute',
      plan: 'pro',
      settings: JSON.stringify({
        branding: { primary: '#3878F6', logoUrl: '/logo.svg', name: 'AI Accelerator Hub' },
        feature_flags: { github_lab: true, ai_coach: true, payments: true },
      }),
      isolation: 'shared',
      status: 'active',
    },
  });
  console.log('✓ Tenant demo:', tenant.id);

  // ── Users (admin / student / mentor) ──
  const hash = (p: string) => bcrypt.hashSync(p, 10);
  const usersData = [
    { email: 'admin@aihub.in', name: 'Super Admin', password: 'Admin@12345', globalRole: 'super_admin' },
    { email: 'student@aihub.in', name: 'Demo Learner', password: 'Student@12345', globalRole: null },
    { email: 'mentor@aihub.in', name: 'Demo Mentor', password: 'Mentor@12345', globalRole: null },
    { email: 'instructor@aihub.in', name: 'Demo Instructor', password: 'Instructor@12345', globalRole: null },
    { email: 'finance@aihub.in', name: 'Finance Team', password: 'Finance@12345', globalRole: null },
  ];
  const users: Record<string, any> = {};
  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name },
      create: {
        email: u.email,
        name: u.name,
        passwordHash: hash(u.password),
        emailVerified: true,
        globalRole: u.globalRole,
      },
    });
    users[u.email] = user;
  }
  console.log('✓ Users (5)');

  // ── Memberships (tie users to demo tenant) ──
  const roleMap = Object.fromEntries((await prisma.role.findMany()).map(r => [r.code, r.id]));
  const memberships = [
    { email: 'admin@aihub.in', role: 'super_admin' },
    { email: 'student@aihub.in', role: 'learner' },
    { email: 'mentor@aihub.in', role: 'mentor' },
    { email: 'instructor@aihub.in', role: 'instructor' },
    { email: 'finance@aihub.in', role: 'finance' },
  ];
  for (const m of memberships) {
    const user = users[m.email];
    await prisma.membership.upsert({
      where: { tenantId_userId: { tenantId: tenant.id, userId: user.id } },
      update: { roleId: roleMap[m.role] },
      create: { tenantId: tenant.id, userId: user.id, roleId: roleMap[m.role], status: 'active' },
    });
  }
  console.log('✓ Memberships');

  // ── Journey + Stages (5 stages per journey model) ──
  const journey = await prisma.journey.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: 'genai-career-accelerator' } },
    update: {},
    create: {
      tenantId: tenant.id,
      slug: 'genai-career-accelerator',
      title: 'GenAI Career Accelerator',
      description: '15-level journey — Foundations → Productivity → App Dev → Agents → OSS → Career',
      isPublished: true,
      config: JSON.stringify({ totalLevels: 15, totalXp: 2970 }),
    },
  });
  const stagesData = [
    { code: 'STAGE_IGNITION', title: 'Ignition', idx: 1 },
    { code: 'STAGE_CRAFT', title: 'Craft', idx: 2 },
    { code: 'STAGE_SHIP', title: 'Ship', idx: 3 },
    { code: 'STAGE_SPECIALIZE', title: 'Specialize', idx: 4 },
    { code: 'STAGE_LAUNCH', title: 'Launch', idx: 5 },
  ];
  const stages: Record<string, any> = {};
  for (const s of stagesData) {
    const stage = await prisma.stage.upsert({
      where: { journeyId_idx: { journeyId: journey.id, idx: s.idx } },
      update: {},
      create: { journeyId: journey.id, code: s.code, title: s.title, idx: s.idx },
    });
    stages[s.code] = stage;
  }
  console.log('✓ Journey + Stages');

  // ── Levels (15) — L01 fully detailed, L02-15 placeholders with correct XP/stage ──
  const levelsSpec = [
    { idx: 1, code: 'L01_AWAKENING', title: 'Level 1 — AI Awakening: The Mould & the Cookie', summary: 'Think in objects — the mental model behind every agent/tool/RAG chunk.', stage: 'STAGE_IGNITION', xp: 120, tags: ['oop', 'git', 'classes'] },
    { idx: 2, code: 'L02_PROMPT', title: 'Level 2 — Prompt Craft: Talking to Giants', summary: 'Prompt engineering as a superpower — system/role, few-shot, CoT, eval harness.', stage: 'STAGE_IGNITION', xp: 140, tags: ['prompt', 'llm'] },
    { idx: 3, code: 'L03_MEMORY', title: 'Level 3 — Memory & State: Agents That Remember', summary: 'Why stateless agents forget — session stores, conversation memory.', stage: 'STAGE_IGNITION', xp: 150, tags: ['memory', 'state'] },
    { idx: 4, code: 'L04_MCP', title: 'Level 4 — Tools & Bridges: MCP Unlocked', summary: 'Give the model hands — MCP tools vs resources, Pydantic, Claude Desktop.', stage: 'STAGE_CRAFT', xp: 160, tags: ['mcp', 'tools'] },
    { idx: 5, code: 'L05_RAG_FOUND', title: 'Level 5 — RAG Foundations: Chunk & Retrieve', summary: 'Ground answers in your data — chunking, embeddings, cosine, citation.', stage: 'STAGE_CRAFT', xp: 170, tags: ['rag', 'embeddings'] },
    { idx: 6, code: 'L06_RAG_ADV', title: 'Level 6 — Advanced RAG: Hybrid & Re-ranking', summary: 'When naive RAG fails — hybrid, re-ranking, HyDE, pgvector HNSW.', stage: 'STAGE_CRAFT', xp: 180, tags: ['hybrid', 'rerank'] },
    { idx: 7, code: 'L07_AGENTS', title: 'Level 7 — Agents: From Chain to Autonomy', summary: 'ReAct, tool-calling, multi-agent orchestration, guardrails.', stage: 'STAGE_SHIP', xp: 200, tags: ['agents', 'react'] },
    { idx: 8, code: 'L08_EVAL', title: 'Level 8 — Evaluation: Prove It Works', summary: 'Evals, tracing, hallucination detection, cost/latency tradeoffs.', stage: 'STAGE_SHIP', xp: 210, tags: ['eval', 'observability'] },
    { idx: 9, code: 'L09_WORKFLOW', title: 'Level 9 — Workflow Automation: Ship Fast', summary: 'n8n, Make, Zapier-style workflows, webhooks & APIs.', stage: 'STAGE_SHIP', xp: 220, tags: ['workflow', 'automation'] },
    { idx: 10, code: 'L10_PROJECT', title: 'Level 10 — Capstone I: Your AI App', summary: 'Ship an AI app — auth, DB, deploy, demo day.', stage: 'STAGE_SHIP', xp: 250, tags: ['capstone', 'fullstack'] },
    { idx: 11, code: 'L11_TRACK_A', title: 'Level 11 — Specialization: Choose Your Track', summary: 'Pick 1 of 8 tracks — App Dev, Agent Eng, RAG, Automation, Product, Data, Creator, Consultant.', stage: 'STAGE_SPECIALIZE', xp: 280, tags: ['specialization'] },
    { idx: 12, code: 'L12_TRACK_B', title: 'Level 12 — Deep Dive: Master Your Craft', summary: 'Intermediate pathway — ship 2 track-specific projects.', stage: 'STAGE_SPECIALIZE', xp: 300, tags: ['deep-dive'] },
    { idx: 13, code: 'L13_TRACK_C', title: 'Level 13 — Expert: Production Grade', summary: 'Advanced pathway — scale, eval, cost, security, open-source.', stage: 'STAGE_SPECIALIZE', xp: 320, tags: ['expert'] },
    { idx: 14, code: 'L14_HACKATHON', title: 'Level 14 — Hackathon: Team Ship', summary: '4-person team hackathon — industry problem, mentor-judged.', stage: 'STAGE_LAUNCH', xp: 350, tags: ['hackathon', 'team'] },
    { idx: 15, code: 'L15_CAREER', title: 'Level 15 — Career Launch: Portfolio & Proof', summary: 'Portfolio review, mock interviews, talent marketplace, career-readiness score.', stage: 'STAGE_LAUNCH', xp: 350, tags: ['career', 'portfolio'] },
  ];
  const levels: Record<string, any> = {};
  for (const l of levelsSpec) {
    const level = await prisma.level.upsert({
      where: { journeyId_idx: { journeyId: journey.id, idx: l.idx } },
      update: {},
      create: {
        tenantId: tenant.id,
        journeyId: journey.id,
        stageId: stages[l.stage].id,
        idx: l.idx,
        code: l.code,
        title: l.title,
        summary: l.summary,
        xpReward: l.xp,
        tags: JSON.stringify(l.tags),
        isPublished: l.idx === 1, // only L1 published; L02-15 placeholders hidden until admin publishes
      },
    });
    levels[l.code] = level;
  }
  // DAG prerequisites: L02 requires L01, L03 requires L02, etc. (linear for now)
  for (let i = 2; i <= 15; i++) {
    const lvl = levels[`L${String(i).padStart(2, '0')}_${levelsSpec[i-1].code.split('_').slice(1).join('_')}`];
    const prev = levels[`L${String(i-1).padStart(2, '0')}_${levelsSpec[i-2].code.split('_').slice(1).join('_')}`];
    // Use codes directly
    const codes = Object.keys(levels);
    // Simpler: get by idx
    const level = await prisma.level.findUnique({ where: { journeyId_idx: { journeyId: journey.id, idx: i } } });
    const prereq = await prisma.level.findUnique({ where: { journeyId_idx: { journeyId: journey.id, idx: i-1 } } });
    if (level && prereq) {
      await prisma.levelPrerequisite.upsert({
        where: { levelId_prerequisiteLevelId: { levelId: level.id, prerequisiteLevelId: prereq.id } },
        update: {},
        create: { levelId: level.id, prerequisiteLevelId: prereq.id },
      });
    }
  }
  console.log('✓ Levels (15) + DAG');

  // ── Rubrics ──
  const rubrics = [
    {
      code: 'L01_RUBRIC',
      title: 'L01 — AI Awakening Rubric',
      dimensions: JSON.stringify({
        correctness: { weight: 0.30, scale: '1-5', desc: 'Cookie class instantiates, attributes correct' },
        oop: { weight: 0.25, scale: '1-5', desc: 'Understands class vs instance, shared vs personal' },
        quality: { weight: 0.20, scale: '1-5', desc: 'Code quality, naming, structure' },
        reflection: { weight: 0.15, scale: '1-5', desc: 'Reflection ≥50 words, insight' },
        boss: { weight: 0.10, scale: '1-5', desc: 'Boss harness 3/3' },
      }),
      passThreshold: 3.0,
    },
    {
      code: 'GENERIC_RUBRIC',
      title: 'Generic Project Rubric (10 dims)',
      dimensions: JSON.stringify({
        problem: { weight: 0.12 }, tech: { weight: 0.12 }, innovation: { weight: 0.10 }, functionality: { weight: 0.12 }, ux: { weight: 0.10 }, reliability: { weight: 0.10 }, responsible_ai: { weight: 0.08 }, docs: { weight: 0.08 }, github: { weight: 0.10 }, business: { weight: 0.08 }
      }),
      passThreshold: 3.0,
    },
  ];
  for (const r of rubrics) {
    await prisma.rubric.upsert({ where: { code: r.code }, update: {}, create: r });
  }
  console.log('✓ Rubrics');

  // ── Activities: L01 6 canonical + 84 placeholders for L02-15 (idx 1..6 each) ──
  const l01 = levels['L01_AWAKENING'];
  const l01Activities = [
    { idx: 1, code: 'MISSION_BRIEFING', title: 'Mission Briefing: The Cookie Factory', xp: 5, config: { estMinutes: 8, checks: [{ type: 'viewed' }, { type: 'quiz', question: 'What does instantiation mean?', graded: false }], story: 'mould broken, model cookies as objects' } },
    { idx: 2, code: 'LEARN', title: 'Learn: Classes, Objects, Attributes', xp: 18, config: { estMinutes: 45, contentIds: ['video-mould-cookie-9m', 'md-shared-personal'], checks: [{ type: 'watchPct', min: 80 }, { type: 'quiz', passPct: 60, questions: 4 }] } },
    { idx: 3, code: 'EXPLORE_GITHUB', title: 'Explore: Cookie Demo Repo', xp: 10, config: { estMinutes: 30, repos: ['org/cookie-demo'], mustRun: 'python demo.py', checks: [{ type: 'github_clone_or_attest' }, { type: 'quiz', minCorrect: 1, questions: 2 }] } },
    { idx: 4, code: 'BUILD', title: 'Build: Your Cookie Class', xp: 35, config: { estMinutes: 90, scaffold: 'level01-scaffold', todos: ['class Cookie', '__init__(self,shape)', 'oven_temp class attr', '2 instances'], checks: [{ type: 'pytest', cmd: 'pytest tests/test_cookie.py -q' }, { type: 'git_push' }] } },
    { idx: 5, code: 'SUBMIT_PROOF', title: 'Submit: Link Your Cookie', xp: 5, config: { estMinutes: 10, proofTypes: ['repo', 'link'], required: ['repo_url', 'reflection_md>=50w'], checks: [{ type: 'submission_created' }] } },
    { idx: 6, code: 'EVALUATION_BOSS', title: 'Evaluation + Boss: The Mould Trial', xp: 47, config: { estMinutes: 60, rubric: 'L01_RUBRIC', boss: { challenge: 'Cookie.count + total_baked()', harness: 'tests/test_boss.py', tests: 3, attempts: 3 }, xpSplit: { base: 20, boss_bonus: 27 } } },
  ];
  for (const a of l01Activities) {
    await prisma.activity.upsert({
      where: { levelId_idx: { levelId: l01.id, idx: a.idx } },
      update: {},
      create: { tenantId: tenant.id, levelId: l01.id, idx: a.idx, code: a.code, title: a.title, xpReward: a.xp, config: JSON.stringify(a.config) },
    });
  }
  // Placeholders for L02-15
  for (let idx = 2; idx <= 15; idx++) {
    const lvl = await prisma.level.findUnique({ where: { journeyId_idx: { journeyId: journey.id, idx } } });
    if (!lvl) continue;
    const placeholders = [
      { idx: 1, code: 'MISSION_BRIEFING', title: `L${idx} Mission Briefing`, xp: 5 },
      { idx: 2, code: 'LEARN', title: `L${idx} Learn`, xp: 15 },
      { idx: 3, code: 'EXPLORE_GITHUB', title: `L${idx} Explore GitHub`, xp: 10 },
      { idx: 4, code: 'BUILD', title: `L${idx} Build`, xp: 30 },
      { idx: 5, code: 'SUBMIT_PROOF', title: `L${idx} Submit Proof`, xp: 5 },
      { idx: 6, code: 'EVALUATION_BOSS', title: `L${idx} Evaluation + Boss`, xp: 40 },
    ];
    for (const ph of placeholders) {
      await prisma.activity.upsert({
        where: { levelId_idx: { levelId: lvl.id, idx: ph.idx } },
        update: {},
        create: { tenantId: tenant.id, levelId: lvl.id, idx: ph.idx, code: ph.code, title: ph.title, xpReward: ph.xp, config: JSON.stringify({ placeholder: true, note: 'Admin will publish real content' }) },
      });
    }
  }
  console.log('✓ Activities (6 for L01 + 84 placeholders = 90)');

  // ── Badges ──
  const badges = [
    { code: 'oop-master', name: 'OOP Master', tier: 'bronze', condition: JSON.stringify({ xp: '>=120' }), xpBonus: 20, icon: '🏆' },
    { code: 'first-proof', name: 'First Proof', tier: 'bronze', condition: JSON.stringify({ submissions: '>=1' }), xpBonus: 10, icon: '📦' },
    { code: 'streak-7', name: 'Week Warrior', tier: 'silver', condition: JSON.stringify({ streak: '>=7' }), xpBonus: 30, icon: '🔥' },
    { code: 'streak-30', name: 'Month Master', tier: 'gold', condition: JSON.stringify({ streak: '>=30' }), xpBonus: 100, icon: '🌟' },
    { code: 'level-1-complete', name: 'Awakened', tier: 'bronze', condition: JSON.stringify({ level: 'L01_AWAKENING-approved' }), xpBonus: 15, icon: '✨' },
  ];
  for (const b of badges) {
    await prisma.badge.upsert({ where: { code: b.code }, update: {}, create: b });
  }
  console.log('✓ Badges (5)');

  // ── AI Assistants (5 seed per spec §14) ──
  const assistants = [
    { code: 'code-mentor', name: 'AI Project Mentor', systemPromptMd: 'You are an encouraging project mentor. Help debug, explain concepts, suggest improvements, but let students solve — never write full solutions. Ask Socratic questions.', model: 'gpt-4o-mini', tools: JSON.stringify(['rag_search', 'code_analysis']) },
    { code: 'career-coach', name: 'AI Career Mentor', systemPromptMd: 'You map competencies to career tracks (8 specializations), suggest projects, identify gaps, prep for interviews. India + global market aware.', model: 'gpt-4o-mini', tools: JSON.stringify(['track_recommend', 'skill_gap']) },
    { code: 'project-reviewer', name: 'AI Assessment Engine', systemPromptMd: 'You evaluate against rubrics, check code/proof, produce weighted feedback, identify skill gaps. Be fair, specific, actionable.', model: 'gpt-4o', tools: JSON.stringify(['rubric_score', 'harness_run']) },
    { code: 'concept-explainer', name: 'AI Learning Coach', systemPromptMd: 'You explain concepts simply, guide through lessons, answer questions, personalize study suggestions. Adapt to Hindi/Telugu/Tamil/Kannada/Malayalam when asked.', model: 'gpt-4o-mini', tools: JSON.stringify(['rag_search', 'content_lookup']) },
    { code: 'debug-assistant', name: 'AI Hackathon Judge', systemPromptMd: 'You judge hackathon projects for innovation, functionality, UX, business impact. Provide structured scores + constructive feedback.', model: 'gpt-4o', tools: JSON.stringify(['rubric_score']) },
  ];
  for (const a of assistants) {
    await prisma.aiAssistant.upsert({ where: { code: a.code }, update: {}, create: a });
  }
  console.log('✓ AI Assistants (5)');

  // ── Plans (Razorpay) ──
  const plans = [
    { slug: 'free', name: 'Free Foundation', amountPaise: 0, interval: 'one_time', features: JSON.stringify({ ai_credits: 20, max_levels: 1 }) },
    { slug: 'cohort-pro', name: 'Cohort Pro', amountPaise: 499900, interval: 'monthly', features: JSON.stringify({ ai_credits: 200, max_levels: 15, mentor: true }) },
    { slug: 'cohort-annual', name: 'Cohort Annual', amountPaise: 4999000, interval: 'yearly', features: JSON.stringify({ ai_credits: 200, max_levels: 15, mentor: true, discount: '17%' }) },
  ];
  for (const p of plans) {
    await prisma.plan.upsert({ where: { slug: p.slug }, update: {}, create: p });
  }
  console.log('✓ Plans (3)');

  // ── Enrollment (student into journey) + Cohort demo ──
  const cohort = await prisma.cohort.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: 'cohort-jan-2026' } },
    update: {},
    create: { tenantId: tenant.id, name: 'Cohort Jan 2026', slug: 'cohort-jan-2026', startDate: new Date('2026-01-15'), endDate: new Date('2026-06-15'), maxSize: 100 },
  });
  const enrollment = await prisma.enrollment.upsert({
    where: { tenantId_userId_journeyId: { tenantId: tenant.id, userId: users['student@aihub.in'].id, journeyId: journey.id } },
    update: {},
    create: { tenantId: tenant.id, userId: users['student@aihub.in'].id, journeyId: journey.id, cohortId: cohort.id, currentLevelIdx: 1, state: 'active' },
  });
  // Progress for L01 = available
  const l01Level = await prisma.level.findUnique({ where: { journeyId_idx: { journeyId: journey.id, idx: 1 } } });
  if (l01Level) {
    await prisma.progress.upsert({
      where: { enrollmentId_levelId: { enrollmentId: enrollment.id, levelId: l01Level.id } },
      update: {},
      create: { tenantId: tenant.id, enrollmentId: enrollment.id, levelId: l01Level.id, userId: users['student@aihub.in'].id, state: 'available' },
    });
    // ActivityProgress for L01 A1 pending
    const a1 = await prisma.activity.findUnique({ where: { levelId_idx: { levelId: l01Level.id, idx: 1 } } });
    if (a1) {
      const prog = await prisma.progress.findUnique({ where: { enrollmentId_levelId: { enrollmentId: enrollment.id, levelId: l01Level.id } } });
      if (prog) {
        await prisma.activityProgress.upsert({
          where: { progressId_activityId: { progressId: prog.id, activityId: a1.id } },
          update: {},
          create: { progressId: prog.id, activityId: a1.id, userId: users['student@aihub.in'].id, enrollmentId: enrollment.id, state: 'pending' },
        });
      }
    }
    // BossChallengeProgress for L01
    const progress = await prisma.progress.findUnique({ where: { enrollmentId_levelId: { enrollmentId: enrollment.id, levelId: l01Level.id } } });
    if (progress) {
      await prisma.bossChallengeProgress.upsert({
        where: { progressId: progress.id },
        update: {},
        create: { progressId: progress.id, state: 'locked', attempts: 0, maxAttempts: 3 },
      });
    }
  }
  // Streak for student
  await prisma.streak.upsert({
    where: { tenantId_userId: { tenantId: tenant.id, userId: users['student@aihub.in'].id } },
    update: {},
    create: { tenantId: tenant.id, userId: users['student@aihub.in'].id, currentStreak: 3, longestStreak: 7, lastActiveDate: new Date().toISOString().split('T')[0], freezeTokens: 1 },
  });
  // Entitlements
  await prisma.entitlement.upsert({
    where: { userId_tenantId_feature: { userId: users['student@aihub.in'].id, tenantId: tenant.id, feature: 'level_access' } },
    update: {},
    create: { userId: users['student@aihub.in'].id, tenantId: tenant.id, feature: 'level_access', remaining: 15 },
  });
  await prisma.entitlement.upsert({
    where: { userId_tenantId_feature: { userId: users['student@aihub.in'].id, tenantId: tenant.id, feature: 'ai_credits' } },
    update: {},
    create: { userId: users['student@aihub.in'].id, tenantId: tenant.id, feature: 'ai_credits', remaining: 50 },
  });

  console.log('✓ Enrollment + Progress (L01 available) + Streak + Entitlements');
  console.log('\n✅ Seed complete');
  console.log('   Super Admin: admin@aihub.in / Admin@12345');
  console.log('   Student:     student@aihub.in / Student@12345 (enrolled L01)');
  console.log('   Mentor:      mentor@aihub.in / Mentor@12345');
  console.log('   Tenant: demo (pro)');
  console.log('   Journey: genai-career-accelerator (15 levels, L01 published)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
