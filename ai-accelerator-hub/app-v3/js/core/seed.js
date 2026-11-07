/* AI Accelerator Hub v3 — reference data.
   Sources: docs/AI_ACCELERATOR_HUB_JOURNEY_GAMIFICATION_MODEL.md (levels, stages,
   6-activity framework, L01 rubric, badges, tracks, streak rules) and
   docs/ai-accelerator-hub-architecture.md (roles, AI assistants).
   People, posts and projects are fictional demo data. */
(function (AH) {
  'use strict';
  const D = (AH.D = {});
  const NOW = Date.now(), DAY = 86400000, H = 3600000;

  D.WORKSPACE = { tenant: 'Northstar Institute', cohort: 'GenAI Cohort 07', city: 'Hyderabad', size: 38, reviewSlaHours: 72 };

  D.PERSONAS = {
    learner: { id: 'u-me', name: 'Ishaan Verma', first: 'Ishaan', city: 'Hyderabad', role: 'learner', title: 'Learner' },
    reviewer: { id: 'u-rev', name: 'Priya Raman', first: 'Priya', city: 'Bengaluru', role: 'reviewer', title: 'Reviewer' },
    pm: { id: 'u-pm', name: 'Sanjay Kapoor', first: 'Sanjay', city: 'Hyderabad', role: 'pm', title: 'Program Manager' }
  };

  D.STAGES = [
    { code: 'IGNITION', name: 'Ignition', from: 1, to: 3, metaphor: 'Spark', gate: 'L3 Boss: session store passes the 3-test harness' },
    { code: 'CRAFT', name: 'Craft', from: 4, to: 6, metaphor: 'Hands & memory', gate: 'L6 Boss: hybrid RAG answers 8 of 10 golden questions with citations' },
    { code: 'SHIP', name: 'Ship', from: 7, to: 9, metaphor: 'Vessel', gate: 'L9 Boss: deployed URL scores 3.5+ on the Ship rubric' },
    { code: 'SPECIALIZE', name: 'Specialize', from: 10, to: 13, metaphor: 'Forge', gate: 'L13 team review: peer + mentor sign-off on the track project' },
    { code: 'LAUNCH', name: 'Launch', from: 14, to: 15, metaphor: 'Orbit', gate: 'L15 Boss: a verified job offer, paid client, SaaS revenue or merged OSS PR' }
  ];

  D.LEVELS = [
    { idx: 1, code: 'L01_AWAKENING', title: 'AI Awakening', sub: 'The Mould & the Cookie', short: 'Awakening', xp: 120, effort: '6–8 h', capability: 'Classes and objects, git init, first proof submission' },
    { idx: 2, code: 'L02_PROMPT', title: 'Prompt Craft', sub: 'Talking to Giants', short: 'Prompt', xp: 140, effort: '8 h', capability: 'System and role prompts, few-shot, chain of thought, eval harness' },
    { idx: 3, code: 'L03_MEMORY', title: 'Memory & State', sub: 'Agents That Remember', short: 'Memory', xp: 150, effort: '8–10 h', capability: 'SQLite session store, conversation memory, session IDs' },
    { idx: 4, code: 'L04_MCP', title: 'Tools & Bridges', sub: 'MCP Unlocked', short: 'MCP', xp: 160, effort: '10 h', capability: 'MCP tools vs resources, Pydantic validation, desktop bridge' },
    { idx: 5, code: 'L05_RAG_FOUND', title: 'RAG Foundations', sub: 'Chunk & Retrieve', short: 'RAG', xp: 170, effort: '10 h', capability: 'Chunking, embeddings, cosine retrieval, citations' },
    { idx: 6, code: 'L06_RAG_ADV', title: 'Advanced RAG', sub: 'Hybrid & Re-ranking', short: 'RAG+', xp: 180, effort: '10–12 h', capability: 'BM25 + vector, re-ranking, HyDE, metadata filters' },
    { idx: 7, code: 'L07_AGENTS', title: 'Agent Architectures', sub: 'ReAct & Teams', short: 'Agents', xp: 200, effort: '12 h', capability: 'ReAct, planning, tool loops, multi-agent orchestration' },
    { idx: 8, code: 'L08_GUARDRAILS', title: 'Guardrails & Evals', sub: 'Ship Safely', short: 'Evals', xp: 190, effort: '10 h', capability: 'Guardrails, moderation, eval sets, LLM-as-judge, budgets' },
    { idx: 9, code: 'L09_SHIP', title: 'Ship It', sub: 'Your First GenAI App', short: 'Ship', xp: 250, effort: '14–16 h', capability: 'Full stack + gateway + deploy + tracing' },
    { idx: 10, code: 'L10_CAPSTONE1', title: 'Capstone I', sub: 'Real-World Use Case', short: 'Capstone', xp: 300, effort: '16–20 h', capability: 'End-to-end domain app from a real brief, stakeholder demo' },
    { idx: 11, code: 'L11_SPEC_DIVE', title: 'Specialization Deep-Dive', sub: 'Go deep, not wide', short: 'Deep-dive', xp: 220, effort: '12 h', capability: 'Track-specific theory and repo' },
    { idx: 12, code: 'L12_SPEC_BUILD', title: 'Specialization Build', sub: 'Project II', short: 'Build II', xp: 280, effort: '16 h', capability: 'Track capstone, production hardening, cost report' },
    { idx: 13, code: 'L13_SCALE', title: 'Team & Scale', sub: 'From Solo to Squad', short: 'Team', xp: 260, effort: '14 h', capability: 'Team project, code review, scaling' },
    { idx: 14, code: 'L14_PORTFOLIO', title: 'Portfolio & Open Source', sub: 'Launch in Public', short: 'Portfolio', xp: 300, effort: '14 h', capability: 'Portfolio, merged OSS PR, blog post, demo video' },
    { idx: 15, code: 'L15_CAREER', title: 'Career Launch', sub: 'Get Paid for AI', short: 'Career', xp: 350, effort: '14 h + ongoing', capability: 'Interviews, proposals or SaaS launch; monetisation plan' }
  ];
  D.stageOf = idx => D.STAGES.find(s => idx >= s.from && idx <= s.to);

  /* The 6-activity framework — identical shape for every level */
  D.ACTIVITY_TYPES = [
    { n: 1, code: 'MISSION_BRIEFING', name: 'Mission Briefing', verb: 'Understand', icon: 'scroll' },
    { n: 2, code: 'LEARN', name: 'Learn', verb: 'Watch & read', icon: 'book' },
    { n: 3, code: 'EXPLORE_GITHUB', name: 'Explore GitHub', verb: 'Clone & run', icon: 'fork' },
    { n: 4, code: 'BUILD', name: 'Build', verb: 'Code', icon: 'hammer' },
    { n: 5, code: 'SUBMIT_PROOF', name: 'Submit Proof', verb: 'Submit', icon: 'inbox' },
    { n: 6, code: 'EVALUATION_BOSS', name: 'Review & Boss', verb: 'Defend', icon: 'trophy' }
  ];

  /* Level 1 — fully authored (other levels: authoring pending; never fabricated) */
  D.L1 = {
    acts: {
      1: { title: 'The Cookie Factory', xp: 5,
        story: 'The factory\'s only cookie mould just cracked. Every cookie is now shaped by hand and no two match. Your job: design a mould in code, so the factory can make as many identical-but-personal cookies as it needs.',
        criteria: ['Explain the difference between a class and an object', 'Write a class with one shared and one personal attribute', 'Pass the Mould Trial: count every cookie ever baked'],
        check: { q: 'In this story, what does "instantiation" mean?', options: ['Pressing the mould to make one real cookie', 'Repairing the broken mould', 'Writing the recipe on paper'], answer: 0, why: 'Instantiation is creating one object (a cookie) from a class (the mould).' } },
      2: { title: 'Classes, Objects, Attributes', xp: 18, passPct: 60,
        lessons: [
          { kind: 'video', title: 'The mould and the cookie', meta: '9 min', body: 'A class is a blueprint. An object is one thing built from it. Each cookie has its own shape, but they all come out of the same mould at the same oven temperature.' },
          { kind: 'notes', title: 'Shared or personal?', meta: '4 min read', body: 'Attributes defined on the class body are shared by every object. Attributes set on self inside __init__ belong to one object only. Change a shared attribute and every cookie sees it.' }
        ],
        quiz: [
          { q: 'A class is best described as…', options: ['One finished cookie', 'The mould that defines how cookies are made', 'The oven', 'A list of cookies'], answer: 1 },
          { q: 'Creating an object from a class is called…', options: ['Inheritance', 'Instantiation', 'Iteration', 'Importing'], answer: 1 },
          { q: 'oven_temp is written in the class body, not in __init__. It is…', options: ['Shared by every cookie', 'Different for every cookie', 'Only on the first cookie', 'Deleted after use'], answer: 0 },
          { q: 'Which line creates two separate cookies?', options: ['c1 = c2 = Cookie("star")', 'c1, c2 = Cookie("star"), Cookie("heart")', 'Cookie = Cookie("star")', 'cookies = Cookie'], answer: 1 }
        ] },
      3: { title: 'Read the cookie-demo repo', xp: 10, repo: 'northstar-labs/cookie-demo', file: 'cookie.py',
        code: ['class Cookie:', '    oven_temp = 180          # shared by every cookie', '', '    def __init__(self, shape):', '        self.shape = shape   # personal to each cookie', '', 'star = Cookie("star")', 'heart = Cookie("heart")', 'print(star.shape, heart.oven_temp)'],
        questions: [
          { q: 'Which line defines the shared (class) attribute?', options: ['Line 2', 'Line 5', 'Line 7'], answer: 0, line: 2 },
          { q: 'What does line 9 print?', options: ['star 180', 'heart 180', 'star star', 'An error'], answer: 0, line: 9 }
        ], passMin: 1 },
      4: { title: 'Build your Cookie class', xp: 35,
        todos: ['Create class Cookie', 'Add __init__(self, shape) that stores shape', 'Add the class attribute oven_temp = 180', 'Create two cookies with different shapes'],
        harness: 'pytest tests/test_cookie.py' },
      5: { title: 'Package your proof', xp: 5, minWords: 50,
        checklist: ['My repo is public and has a README', 'pytest passes locally', 'My reflection names one struggle and how I fixed it'] },
      6: { title: 'The Mould Trial', xp: 47, baseXp: 20, bossXp: 27, attempts: 3,
        boss: 'Add a class attribute Cookie.count that goes up every time a cookie is made, and a @classmethod total_baked() that returns it.',
        tests: ['count starts at 0', 'count goes up by 1 per cookie', 'total_baked() returns count'] }
    }
  };

  /* Rubric L01_RUBRIC (A6). PASS if weighted avg >= 3.0 AND boss >= 2 */
  D.RUBRIC = {
    code: 'L01_RUBRIC', threshold: 3.0, bossMin: 2,
    dims: [
      { key: 'correctness', name: 'Correctness', weight: 0.30, l1: 'Class missing or does not run', l3: 'Class + 2 objects run, attributes correct', l5: 'Handles edge cases, clean __repr__' },
      { key: 'oop', name: 'OOP understanding', weight: 0.25, l1: 'Confuses class and instance', l3: 'Distinguishes them and explains it', l5: 'Uses classmethod/staticmethod idiomatically' },
      { key: 'quality', name: 'Code quality', weight: 0.20, l1: 'Unformatted, hard-coded', l3: 'Readable, PEP 8, good names', l5: 'Modular, docstrings, tests' },
      { key: 'reflection', name: 'Reflection', weight: 0.15, l1: 'Under 50 words or generic', l3: '50+ words, one struggle and fix', l5: 'Insightful, links to agent/tool design' },
      { key: 'boss', name: 'Boss challenge', weight: 0.10, l1: 'Not attempted', l3: 'Passes 2 of 3 tests', l5: '3 of 3 plus a creative extension' }
    ]
  };
  D.weighted = scores => Math.round(D.RUBRIC.dims.reduce((s, d) => s + (scores[d.key] || 0) * d.weight, 0) * 100) / 100;
  D.passes = scores => D.weighted(scores) >= D.RUBRIC.threshold && (scores.boss || 0) >= D.RUBRIC.bossMin;

  /* 12 canonical badges — conditions evaluated against learner metrics */
  D.BADGES = [
    { code: 'first-proof', name: 'First Proof', tier: 'bronze', icon: '📬', xp: 30, desc: 'Get your first submission approved', cond: m => m.approvedCount >= 1 },
    { code: 'oop-master', name: 'OOP Done', tier: 'bronze', icon: '🍪', xp: 20, desc: 'Complete Level 1', cond: m => m.approvedLevels.includes(1) },
    { code: 'mcp-unlocked', name: 'MCP Done', tier: 'bronze', icon: '🔌', xp: 25, desc: 'Complete Level 4', cond: m => m.approvedLevels.includes(4) },
    { code: 'memory-keeper', name: 'Agents That Remember', tier: 'silver', icon: '🧠', xp: 40, desc: 'Complete Level 3 with a 3-day streak', cond: m => m.approvedLevels.includes(3) && m.longest >= 3 },
    { code: 'rag-explorer', name: 'RAG Explorer', tier: 'bronze', icon: '🔎', xp: 35, desc: 'Complete Levels 5 and 6', cond: m => m.approvedLevels.includes(5) && m.approvedLevels.includes(6) },
    { code: 'ship-it', name: 'Ship It', tier: 'silver', icon: '🚀', xp: 50, desc: 'Get your Level 9 deployed URL approved', cond: m => m.approvedLevels.includes(9) },
    { code: 'streak-7', name: 'Week Warrior', tier: 'silver', icon: '🔥', xp: 50, desc: 'Reach a 7-day streak', cond: m => m.longest >= 7 },
    { code: 'streak-30', name: 'Month Master', tier: 'gold', icon: '🌋', xp: 100, desc: 'Reach a 30-day streak', cond: m => m.longest >= 30 },
    { code: 'top-10-weekly', name: 'Top 10 Weekly', tier: 'silver', icon: '🏅', xp: 40, desc: 'Finish a week in your cohort\'s top 10', cond: m => m.weeklyTop10 },
    { code: 'github-pr-merged', name: 'OSS Contributor', tier: 'gold', icon: '🌱', xp: 80, desc: 'Get a pull request merged upstream', cond: m => m.prMerged },
    { code: 'track-chosen', name: 'Path Chosen', tier: 'silver', icon: '🧭', xp: 30, desc: 'Choose your career track at Level 11', cond: m => !!m.track },
    { code: 'career-launched', name: 'Career Launched', tier: 'legendary', icon: '👑', xp: 150, desc: 'Complete Level 15', cond: m => m.approvedLevels.includes(15) }
  ];

  D.TRACKS = [
    { code: 'APP_DEV', name: 'GenAI Application Developer', promise: 'Ship full-stack GenAI apps end to end', for: 'Full-stack devs, founders', gate: 'L10 approved + L9 Ship rubric 3.5+ + Ship It badge', capstone: 'Deployed SaaS with auth, RAG, billing and observability + cost report', color: '#3878F6', icon: 'code' },
    { code: 'AGENT_ENG', name: 'AI Agent Engineer', promise: 'Autonomous agents that plan and act', for: 'Backend and automation engineers', gate: 'L7 approved + L8 evals 3.0+ + Agents That Remember badge', capstone: 'Planner + executor + critic system with an eval harness', color: '#8658E8', icon: 'brain' },
    { code: 'RAG_ENG', name: 'RAG & Knowledge Systems Engineer', promise: 'Knowledge systems at scale', for: 'Data and ML engineers', gate: 'L5 + L6 approved + golden set 7/10', capstone: 'Enterprise RAG: 1k+ docs, hybrid search, citations, <800 ms', color: '#0F8A6A', icon: 'layers' },
    { code: 'AUTO_NOCODE', name: 'AI Automation & No-Code Specialist', promise: 'Automate a business with AI and no-code', for: 'Ops teams, solopreneurs, SMBs', gate: 'L4 approved + an automation proof', capstone: '3 live automations (lead → CRM → invoice) with error handling', color: '#D97706', icon: 'zap' },
    { code: 'AI_PRODUCT', name: 'AI Product & Prompt Engineer', promise: 'AI experiences and prompt systems that delight', for: 'PMs, designers, writers', gate: 'L2 4.0+ + L8 guardrails 3.0+ + portfolio review', capstone: 'Prompt system + eval suite + AI UX case study', color: '#DB2777', icon: 'sparkle' },
    { code: 'DATA_EVAL', name: 'AI Data & Evaluation Engineer', promise: 'Data flywheels and evals you can trust', for: 'Data, ML and QA engineers', gate: 'L6 + L8 approved + eval harness', capstone: '500+ row dataset, synthetic-data pipeline and eval dashboard', color: '#0E7490', icon: 'chart' },
    { code: 'CONTENT_CREATOR', name: 'AI Content & Growth Creator', promise: '10× content with GenAI', for: 'Creators, marketers, founders', gate: 'L2 + L10 approved + a published content proof', capstone: '30-day content engine with brand voice and analytics', color: '#B45309', icon: 'video' },
    { code: 'CONSULTANT', name: 'AI Consultant / Solution Architect', promise: 'Sell and architect AI for enterprises', for: 'Consultants, tech leads, freelancers', gate: 'L10 approved + L13 team bonus + pitch badge', capstone: 'Enterprise proposal, architecture and ROI model for a real client', color: '#1E3A8A', icon: 'briefcase' }
  ];

  D.TIERS = [{ name: 'Bronze', min: 0 }, { name: 'Silver', min: 500 }, { name: 'Gold', min: 1500 }, { name: 'Diamond', min: 2970 }];
  D.RANKS = [{ name: 'Newcomer', min: 0 }, { name: 'Builder', min: 200 }, { name: 'Engineer', min: 800 }, { name: 'Architect', min: 1800 }];
  D.pick = (arr, xp) => arr.reduce((a, t) => (xp >= t.min ? t : a), arr[0]);
  D.next = (arr, xp) => arr.find(t => t.min > xp) || null;

  /* Cohort peers (for standings, feed, review queue, PM analytics) */
  D.PEERS = [
    { id: 'p1', name: 'Ananya Rao', city: 'Bengaluru', xp: 1340, lvl: 7, act: 3, streak: 21, status: 'active', last: 0 },
    { id: 'p2', name: 'Karthik Iyer', city: 'Chennai', xp: 890, lvl: 5, act: 2, streak: 9, status: 'active', last: 0 },
    { id: 'p3', name: 'Meera Joshi', city: 'Pune', xp: 612, lvl: 4, act: 4, streak: 6, status: 'frozen', last: 1 },
    { id: 'p4', name: 'Farhan Ali', city: 'Hyderabad', xp: 455, lvl: 3, act: 5, streak: 4, status: 'active', last: 0 },
    { id: 'p5', name: 'Sneha Kulkarni', city: 'Mumbai', xp: 310, lvl: 3, act: 1, streak: 0, status: 'recovery', last: 4, prev: 11 },
    { id: 'p6', name: 'Rahul Verma', city: 'Delhi', xp: 198, lvl: 2, act: 2, streak: 2, status: 'active', last: 0 },
    { id: 'p7', name: 'Divya Nair', city: 'Kochi', xp: 140, lvl: 1, act: 6, streak: 5, status: 'active', last: 0 },
    { id: 'p8', name: 'Arjun Mehta', city: 'Ahmedabad', xp: 62, lvl: 1, act: 4, streak: 1, status: 'grace', last: 2 },
    { id: 'p9', name: 'Pooja Singh', city: 'Jaipur', xp: 35, lvl: 1, act: 3, streak: 3, status: 'active', last: 0 },
    { id: 'p10', name: 'Vikram Das', city: 'Kolkata', xp: 12, lvl: 1, act: 2, streak: 0, status: 'recovery', last: 6, prev: 4 },
    { id: 'p11', name: 'Nisha Patel', city: 'Surat', xp: 730, lvl: 4, act: 6, streak: 12, status: 'active', last: 0 },
    { id: 'p12', name: 'Rohan Gupta', city: 'Delhi', xp: 270, lvl: 2, act: 4, streak: 0, status: 'grace', last: 2 }
  ];

  /* Peer submissions for the reviewer queue (L1) */
  D.PEER_SUBMISSIONS = [
    { id: 'sub-k1', who: 'p7', levelIdx: 1, at: NOW - 52 * H, attempt: 1, state: 'pending',
      repo: 'https://github.com/divya-nair/cookie-factory', deploy: '',
      reflection: 'I mixed up class and instance attributes at first, because I set oven_temp inside __init__ and then wondered why changing Cookie.oven_temp did nothing to my existing cookies. Moving it to the class body fixed it. The Mould Trial made me understand why a classmethod is the right place for total_baked, since it belongs to the factory, not one cookie.',
      boss: { passed: 3, total: 3 }, ai: { correctness: 4, oop: 4, quality: 3, reflection: 4, boss: 4 } },
    { id: 'sub-k2', who: 'p9', levelIdx: 1, at: NOW - 20 * H, attempt: 1, state: 'pending',
      repo: 'https://github.com/pooja-singh/cookies', deploy: '',
      reflection: 'Class is like a template and object is the thing. I made two cookies star and heart. It works and tests pass. I learned about self and init and the class variable for temperature and it was fun to do this level of the program.',
      boss: { passed: 2, total: 3 }, ai: { correctness: 3, oop: 3, quality: 2, reflection: 2, boss: 3 } },
    { id: 'sub-k3', who: 'p8', levelIdx: 1, at: NOW - 5 * H, attempt: 2, state: 'pending',
      repo: 'https://github.com/arjun-mehta/oop-cookie', deploy: 'https://arjun-cookie.example.app',
      reflection: 'After the first review I added a __repr__, docstrings and a test for the count. My struggle was that count went up when I created cookies inside the tests, so tests depended on order. I reset Cookie.count in a pytest fixture. This is the same problem agents have with shared state between runs.',
      boss: { passed: 3, total: 3 }, ai: { correctness: 4, oop: 4, quality: 4, reflection: 5, boss: 4 },
      history: [{ at: NOW - 3 * DAY, verdict: 'needs_changes', avg: 2.7, by: 'Priya Raman', feedback: 'Good start. Add a __repr__ and a test for Cookie.count, and say more about what you struggled with.' }] }
  ];
  D.DECIDED = [
    { id: 'sub-d1', who: 'p4', levelIdx: 3, at: NOW - 6 * DAY, decidedAt: NOW - 5 * DAY, verdict: 'approved', avg: 3.8, by: 'Priya Raman' },
    { id: 'sub-d2', who: 'p11', levelIdx: 4, at: NOW - 9 * DAY, decidedAt: NOW - 7 * DAY, verdict: 'approved', avg: 3.45, by: 'Priya Raman' },
    { id: 'sub-d3', who: 'p6', levelIdx: 2, at: NOW - 11 * DAY, decidedAt: NOW - 10 * DAY, verdict: 'needs_changes', avg: 2.6, by: 'Priya Raman' }
  ];

  /* Programme analytics (cohort-level aggregates; demo values) */
  D.ANALYTICS = {
    funnelL1: [38, 35, 31, 22, 18, 12],               // learners who completed A1..A6 of Level 1
    weeklyActive: [21, 24, 27, 26, 29, 31, 30, 33],    // last 8 weeks
    medianApproveHours: 41, aiPreReviewAgreement: 0.82, completionL1: 12
  };

  /* Weekly cadence — Mon–Fri prep, Sat workshop, Sun 4-hour build sprint */
  D.WEEK = [
    { d: 'Mon', e: 'Prep: Learn + Explore' }, { d: 'Tue', e: 'Prep' }, { d: 'Wed', e: 'Office hours 7 pm' },
    { d: 'Thu', e: 'Prep: Build' }, { d: 'Fri', e: 'Proof window opens' },
    { d: 'Sat', e: 'Live workshop 10:00', event: true }, { d: 'Sun', e: '4-hour build sprint', event: true }
  ];

  /* AI assistants (architecture doc §10: 5 seed assistants; 3 exposed to learners here) */
  D.COACHES = {
    'concept-explainer': { name: 'Concept Coach', icon: 'bulb', tile: '', desc: 'Explains ideas and app steps in plain words', ph: 'Ask about a concept or a step…',
      sugg: ['What is the difference between a class and an object?', 'How do I unlock Level 2?', 'How is my XP calculated?'] },
    'code-mentor': { name: 'Code Mentor', icon: 'code', tile: 'gold', desc: 'Socratic debugging — hints, never full answers', ph: 'Paste an error or describe the bug…',
      sugg: ['pytest says "no tests ran"', 'My count stays at 0', 'Why do I get "missing 1 required positional argument"?'] },
    'career-coach': { name: 'Career Coach', icon: 'compass', tile: '', desc: 'Tracks, portfolio and next career move', ph: 'Ask about your path…',
      sugg: ['Which track suits a backend developer?', 'How should my GitHub look to recruiters?', 'When do I choose a track?'] }
  };
  D.AI_DAILY_QUOTA = 40;
  D.REPLIES = {
    'concept-explainer': [
      [/class.*object|object.*class|instance/i, 'Think of the class as the mould and each object as one cookie pressed from it.\n\nThe mould decides what every cookie has (a shape, an oven temperature). Each cookie then holds its own values: one is a star, one is a heart.\n\nIn code: `Cookie` is the class, `Cookie("star")` creates one object.'],
      [/unlock|level 2|next level|locked/i, 'A level unlocks when the one before it is approved. That means a reviewer has scored your proof on the rubric (weighted average 3.0 or more) and your Boss challenge scored at least 2.\n\nTime spent and videos watched never unlock a level. Proof does.'],
      [/xp|point|streak|rank|tier/i, 'XP comes only from the server, from finishing activities and approved reviews. Every award is written to an append-only ledger, so the same step can never pay twice.\n\nYour streak counts one per day when you finish a real activity. Miss a day and a freeze token protects it; with none left you get a 48-hour grace window, then a 7-day recovery quest. It never silently drops to zero.']
    ],
    'code-mentor': [
      [/no tests ran|pytest/i, 'Let\'s narrow it down with one question: what is your test file called?\n\npytest only collects files named test_*.py or *_test.py, and functions that start with test_. Check both, then run `pytest -v` and tell me what it lists.'],
      [/count|stays? at 0|zero/i, 'Good bug. Where do you increase the count: in the class body, or inside __init__?\n\nHint: the class body runs once, when the class is defined. Something that must happen per cookie belongs in __init__. And make sure you write to Cookie.count, not self.count — what is the difference?'],
      [/positional argument|missing 1 required/i, 'That error usually means a method is missing `self`, or you called the class without the argument __init__ expects.\n\nWhich line raises it? Read it out loud: what does Python pass in automatically, and what must you pass yourself?']
    ],
    'career-coach': [
      [/backend|track|which/i, 'For a backend developer, two tracks fit naturally: AI Agent Engineer (agents that plan and call tools) and RAG & Knowledge Systems (search over company data).\n\nTracks open at Level 11. Until then, the best career move is to ship clean repos for every level — they become your portfolio.'],
      [/github|recruit|portfolio/i, 'Recruiters skim. Pin your best 3 repos. Each README should answer, in the first screen: what it does, how to run it, one screenshot, and what you would improve next.\n\nAt Level 14 you turn these into a public portfolio.'],
      [/when|choose/i, 'You choose a track after Capstone I, at Level 11. Each track has a competence gate — for example the Agent track needs Level 7 approved and an eval score of 3.0+ at Level 8.']
    ]
  };
  D.REPLY_DEFAULT = {
    'concept-explainer': 'I can explain any idea from your current level, or how the platform works: unlocking, XP, streaks and reviews. What would you like to understand?',
    'code-mentor': 'Paste the exact error and the line it points to. I will ask a few questions and give hints — you write the fix, so the reviewer sees your work.',
    'career-coach': 'Tell me what kind of work you want next — a job, freelance clients or your own product — and I will map it to tracks and proof you can start building now.'
  };

  /* Community feed (fictional) */
  D.POSTS = [
    { who: 'p1', tag: 0, d: 0.2, likes: 6, text: 'Tip for Windows: install Python from python.org and tick "Add to PATH" on the first screen. Saved me an hour of confusion. #setup', replies: [['p2', 'This fixed it for me too, thanks!', 0.15], ['p3', 'Also restart the terminal after installing.', 0.1]] },
    { who: 'p2', tag: 1, d: 1, likes: 1, text: 'Stuck on the pytest step: it says "no tests ran". My file is called cookie_test.py. Any idea?', replies: [['p1', 'pytest looks for test_*.py by default. Rename it to test_cookie.py.', 0.9]] },
    { who: 'p3', tag: 2, d: 2, likes: 4, text: 'Few-shot tip: put your 2–3 examples in exactly the format you want back. My eval score went from 5/10 to 8/10.', replies: [] },
    { who: 'p4', tag: 0, d: 3, likes: 3, text: 'Saturday\'s workshop recording is in the Library under Level 1 → Sessions.', replies: [] },
    { who: 'p11', tag: 1, d: 4, likes: 5, text: 'Approved on Level 1! The reviewer pushed me to explain *why* total_baked is a classmethod. Worth it.', replies: [['p6', 'Congrats! Any tips for the reflection?', 3.8]] },
    { who: 'p6', tag: 3, d: 6, likes: 2, text: 'Memory level: pass the same session_id on every call. Otherwise each message starts a fresh conversation.', replies: [] },
    { who: 'p7', tag: 0, d: 7, likes: 1, text: 'Anyone in Kochi want to pair for Sunday\'s build sprint?', replies: [] },
    { who: 'p8', tag: 1, d: 9, likes: 0, text: 'The Boss preview looks tough. Should Cookie.count be a class attribute or a method?', replies: [['p3', 'A class attribute, increased in __init__. The Code Mentor will nudge you without spoiling it.', 8.7]] }
  ].map((p, i) => ({ ...p, id: 'post-' + (i + 1), at: NOW - p.d * DAY }));

  /* Launch wall — reviewed capstones from earlier cohorts (fictional) */
  D.PROJECTS = [
    { name: 'Lakshmi Menon', city: 'Kochi', d: 6, cat: 'Knowledge search', brief: 'Search over a company handbook', title: 'HandbookGPT with page citations', desc: 'Staff ask HR the same policy questions every week. An assistant that answers from the handbook and shows the page it used.', track: 'RAG_ENG', video: true, score: 4.2 },
    { name: 'Imran Siddiqui', city: 'Lucknow', d: 12, cat: 'Support', brief: 'A ticket triage bot for a SaaS help desk', title: 'TriageMate', desc: 'Tags each ticket, sets its priority and drafts a first reply for a human to approve.', track: 'AGENT_ENG', video: false, score: 3.9 },
    { name: 'Aditi Bose', city: 'Kolkata', d: 15, cat: 'Healthcare', brief: 'A clinic appointment assistant', title: 'ClinicDesk', desc: 'Books, moves and cancels visits in chat, checks the doctor\'s calendar and sends reminders.', track: 'APP_DEV', video: true, score: 4.0 },
    { name: 'Kavya Shetty', city: 'Mangaluru', d: 19, cat: 'Retail', brief: 'An inventory reorder helper for a small shop', title: 'ReorderBuddy', desc: 'Reads the sales sheet, flags low stock and drafts the supplier order on WhatsApp.', track: 'AUTO_NOCODE', video: false, score: 3.7 },
    { name: 'Suresh Pillai', city: 'Chennai', d: 26, cat: 'Knowledge search', brief: 'Search over a company handbook', title: 'Policy Pal', desc: 'Hybrid search with re-ranking; answers in Tamil or English with citations.', track: 'RAG_ENG', video: false, score: 4.4 },
    { name: 'Manish Tiwari', city: 'Indore', d: 33, cat: 'Finance', brief: 'Invoice reconciliation for a CA firm', title: 'LedgerLens', desc: 'Matches bank lines to invoices, explains mismatches and exports a GST-ready summary.', track: 'DATA_EVAL', video: true, score: 3.8 }
  ].map((p, i) => ({ ...p, id: 'proj-' + (i + 1), at: NOW - p.d * DAY }));
})(window.AH = window.AH || {});
