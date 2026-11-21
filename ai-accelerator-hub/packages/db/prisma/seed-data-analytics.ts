/**
 * Seed — AI-Powered Data Analytics journey (45 days, 9 modules).
 *
 * Built in sync with the AI journey (seed-v3.ts): the same Journey → Stage → Level → Activity → Content
 * tables, the same six-activity framework, the same tenant. It is a second journey, not a track.
 *
 * Source of truth for content: docs/data-analytics-journey/ (00-INDEX.md, modules/, days/).
 * Day files are read from disk and stored as Content rows (kind 'md'), so the docs and the app do not drift.
 *
 * Authoring rule (same as AI journey Levels 2–15): only Module 1 has authored activities. Modules 2–9
 * have six slots marked 'unauthored' until a program reviewer signs off their checks and answer keys.
 *
 * Idempotent. Never deletes learner progress. Content rows are updated in place by (level, position).
 * Run:  DATABASE_URL=file:./dev.db TENANT_SLUG=demo npx tsx prisma/seed-data-analytics.ts
 */
import { PrismaClient } from '@prisma/client';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { MODULES, buildModule } from './data-analytics-activities';
import { GENERIC_GUIDED } from '../../../apps/web/lib/domain/genericGuided';

const prisma = new PrismaClient();
const JOURNEY_SLUG = 'data-analytics-journey';
const TENANT_SLUG = process.env.TENANT_SLUG || 'demo';
const DAYS_DIR = resolve(__dirname, '../../../docs/data-analytics-journey/days');
const VERIFIED_ON = '2026-11-18';

const STAGES = [
  { idx: 1, code: 'STAGE_DA_FOUNDATIONS', title: 'Data Foundations' },
  { idx: 2, code: 'STAGE_DA_PROGRAMMING', title: 'Programming for Data' },
  { idx: 3, code: 'STAGE_DA_INSIGHT', title: 'Insight and AI-Assisted Analysis' },
  { idx: 4, code: 'STAGE_DA_MODELLING', title: 'Prediction and Data Quality' },
  { idx: 5, code: 'STAGE_DA_CAREER', title: 'Capstone and Career Readiness' },
];

// Modules from docs/data-analytics-journey/modules/. Days are the PDF day ranges.
const LEVELS = [
  { idx: 1, stage: 1, code: 'DA01_FUNDAMENTALS', title: 'Data Analytics Fundamentals', days: [1, 4], xp: 120, topics: ['What data is', 'Types of data', 'The analytics lifecycle', 'Domains, Excel and CSV'] },
  { idx: 2, stage: 1, code: 'DA02_SQL', title: 'SQL for Data Analytics', days: [5, 11], xp: 160, topics: ['Databases and keys', 'SELECT, WHERE, ORDER BY', 'Operators and NULL', 'Aggregates and GROUP BY', 'Joins', 'Subqueries, CTEs, CASE', 'Window functions'] },
  { idx: 3, stage: 2, code: 'DA03_PYTHON_FUNDAMENTALS', title: 'Python Fundamentals', days: [12, 16], xp: 170, topics: ['Variables and types', 'Conditionals', 'Loops', 'Data structures', 'Functions, exceptions and files'] },
  { idx: 4, stage: 2, code: 'DA04_PYTHON_ANALYTICS', title: 'Python for Data Analytics', days: [17, 22], xp: 190, topics: ['NumPy', 'pandas and reading files', 'Data inspection', 'Data cleaning', 'Filter, groupby and merge', 'Dates, strings and EDA'] },
  { idx: 5, stage: 3, code: 'DA05_POWER_BI', title: 'Power BI', days: [23, 27], xp: 200, topics: ['Power BI Desktop and Service', 'Power Query', 'Star schema', 'DAX measures', 'Dashboard design'] },
  { idx: 6, stage: 3, code: 'DA06_AI_FOR_ANALYTICS', title: 'AI for Data Analytics', days: [28, 31], xp: 220, topics: ['GenAI and LLMs in analytics', 'Prompting for SQL and Python', 'AI-assisted cleaning and insight', 'AI reports, hallucinations and privacy'] },
  { idx: 7, stage: 4, code: 'DA07_MACHINE_LEARNING', title: 'Machine Learning', days: [32, 36], xp: 240, topics: ['AI vs ML', 'Features, labels and splits', 'Linear regression', 'Classification metrics', 'Clustering'] },
  { idx: 8, stage: 4, code: 'DA08_ETL_DATA_QUALITY', title: 'ETL and Data Quality', days: [37, 41], xp: 250, topics: ['ETL and ELT pipelines', 'Extraction', 'Transformation', 'Loading, facts and dimensions', 'Data quality and reconciliation'] },
  { idx: 9, stage: 5, code: 'DA09_CAPSTONE_READINESS', title: 'Capstone and Industry Readiness', days: [42, 45], xp: 300, topics: ['Problem definition', 'Data preparation', 'Analysis and dashboard', 'Presentation, viva and interviews'] },
];

// ── Module 1 — authored activities (same six-slot framework as AI Level 1) ──

const M1_ACTIVITIES = [
  { idx: 1, code: 'MISSION_BRIEFING', title: 'Mission Briefing: The Vague Owner Question', xp: 5, config: {
    kind: 'briefing', estMinutes: 10,
    problem: 'Sunita Stores has two branches and 12 staff. Last month, the owner said sales "felt slow" but had no report. The data is in a paper billing book, a staff WhatsApp group and a bank statement. She asks: was it really slow, and why?',
    objective: 'Turn a vague business question into a measurable one, and say which data would answer it.',
    outcome: 'A one-page sheet: three data sources, one measurable question with a time period and a breakdown.',
    criteria: ['Write a measurable question with a measure, a period and a breakdown', 'Name the data source that answers it', 'Explain why "Are we doing badly?" cannot be answered'],
    check: { q: 'Which question can a data analyst actually answer from the billing book?', options: ['Are we doing badly?', 'How did weekly revenue change between September and October, by branch?', 'Is the owner happy with the business?'], answer: 1, why: 'It has a measure (revenue), a period (September to October) and a breakdown (branch). The other two cannot be counted.' },
  } },
  { idx: 2, code: 'LEARN', title: 'Learn: Data, Types and the Analytics Lifecycle', xp: 18, config: {
    kind: 'learn', estMinutes: 45, passPct: 60,
    lessons: [
      { title: 'What data and analytics are', minutes: 8, body: 'Data is recorded fact: every bill, delivery and WhatsApp message is data. Analytics is asking questions of data and getting answers that change a decision. A data analyst turns a business question into a checked answer and explains it.' },
      { title: 'Structured, semi-structured and unstructured', minutes: 8, body: 'Structured data has fixed rows and columns (a spreadsheet of visits). Semi-structured data has tags or nested fields (a JSON export). Unstructured data has no fixed schema (a WhatsApp chat, an X-ray image). Quick test: can it go straight into a table with one row per event? If yes, it is structured.' },
      { title: 'Quantitative and qualitative data', minutes: 6, body: 'Quantitative data is numbers you can add up (bill amount, visit count). Qualitative data is categories or descriptions (treatment name, patient feedback).' },
      { title: 'The analytics lifecycle', minutes: 8, body: 'Collection, cleaning, processing, analysis, visualisation and reporting. A break in an early step quietly spoils every later step. The most common cause of a wrong report is a cleaning step that was skipped.' },
    ],
    resources: [],
    quiz: [
      { q: 'A question that can be answered with data must have which three parts?', options: ['A measure, a period and a breakdown', 'A colour, a font and a logo', 'A question mark and a deadline only', 'A chart and a title'], answer: 0 },
      { q: 'A JSON export from a booking app is which type of data?', options: ['Structured', 'Semi-structured', 'Unstructured', 'Qualitative'], answer: 1 },
      { q: 'Bill amount is which kind of data?', options: ['Qualitative', 'Unstructured', 'Quantitative', 'Semi-structured'], answer: 2 },
      { q: 'In the analytics lifecycle, which step should come before analysis?', options: ['Reporting', 'Visualisation', 'Cleaning', 'Collection is never needed'], answer: 2 },
      { q: 'A WhatsApp chat about orders is best described as…', options: ['Structured data', 'Unstructured data', 'A database key', 'A dashboard'], answer: 1 },
    ],
  } },
  { idx: 3, code: 'EXPLORE_DATASET', title: 'Explore: Read a Real Open Dataset', xp: 10, config: {
    kind: 'explore', estMinutes: 30, passMin: 2,
    repo: { fullName: 'datasets/covid-19', url: 'https://github.com/datasets/covid-19', description: 'Novel Coronavirus 2019 time series data on cases. Used here only to practise reading a dataset\'s structure.', difficulty: 'Beginner', prerequisites: 'None', license: 'Not detected by GitHub. Check the repository before any reuse.', lastVerified: VERIFIED_ON },
    architecture: [
      'Each file is a table: one header row, then one record per row.',
      'Look at one row and ask: what does this row stand for? (One day? One country? One case?)',
      'Check the date and number columns: their types decide what you can count.',
    ],
    task: 'Open the repository, find one CSV file, and read its first rows. Then answer three questions about its structure.',
    questions: [
      { q: 'In a CSV file, what does one row usually represent?', options: ['One record (for example, one day in one place)', 'One column name', 'One chart', 'The whole file'], answer: 0 },
      { q: 'Why check the data types of the number and date columns first?', options: ['They decide what you can add up and sort by correctly', 'They change the file colour', 'They are not needed', 'They only matter for Power BI'], answer: 0 },
      { q: 'What is the first thing to write down about a dataset?', options: ['What one row stands for (one day, one case, one person)', 'The final dashboard', 'A joke', 'The file size only'], answer: 0 },
    ],
  } },
  { idx: 4, code: 'BUILD', title: 'Build: Your Data Inventory', xp: 35, config: {
    kind: 'build', estMinutes: 60,
    tools: ['Excel', 'Google Sheets', 'CSV editor', 'Notepad', 'Other'],
    fields: [
      { key: 'question', label: 'The measurable question', hint: 'Measure, period and breakdown. Use Sunita Stores or your own small business.', minWords: 20 },
      { key: 'sources', label: 'Your data sources', hint: 'List each source and its type: structured, semi-structured or unstructured.', minWords: 30 },
      { key: 'lifecycle', label: 'The lifecycle for your question', hint: 'For each step (collection to reporting), say what you would do and one check.', minWords: 40 },
      { key: 'limits', label: 'What the data cannot tell you', hint: 'Missing months, one branch only, no customer history, and so on.', minWords: 15 },
    ],
    iterations: 0,
    iterationRules: { promptMinWords: 10, outputMinWords: 15, changeMinWords: 10, maxSimilarity: 0.85 },
  } },
  { idx: 5, code: 'SUBMIT_PROOF', title: 'Submit Proof: Share Your Inventory', xp: 5, config: {
    kind: 'proof', estMinutes: 15, minWords: 50,
    evidenceTypes: ['Public document link (Google Docs, Notion, GitHub)', 'Spreadsheet link with view access', 'Video walkthrough link'],
    checklist: ['My inventory is complete and the link is viewable by reviewers', 'I removed all personal data about real people', 'I can name the lifecycle step where a mistake is most likely'],
  } },
  { idx: 6, code: 'EVALUATION_BOSS', title: 'Evaluation + Boss: The First Step Trial', xp: 47, config: {
    kind: 'boss', estMinutes: 30, rubric: 'DA01_FUNDAMENTALS_RUBRIC', attempts: 3, xpSplit: { base: 20, bossBonus: 27 },
    intro: 'Four situations. For each, choose the right first step and say why in one sentence. You get three attempts; your best result goes to your reviewer.',
    choices: ['Write a measurable question, then check the data', 'Make a chart first and decide what it means later', 'Accept the first answer without checking it'],
    scenarios: [
      { s: 'The owner says sales felt slow last month.', correct: [0] },
      { s: 'A colleague sends a dashboard with no question or date range on it.', correct: [0] },
      { s: 'An AI tool says monthly revenue rose 30%, with no source.', correct: [0] },
      { s: 'You are given two files from two branches and told to "find the trend".', correct: [0] },
    ],
    minWhyWords: 6,
  } },
];

// ── Modules 2–9: six slots, unauthored until reviewed (same as AI Levels 2–15) ──

const UNAUTHORED = [
  ['MISSION_BRIEFING', 'Mission Briefing'],
  ['LEARN', 'Learn'],
  ['EXPLORE_DATASET', 'Explore Dataset'],
  ['BUILD', 'Build'],
  ['SUBMIT_PROOF', 'Submit Proof'],
  ['EVALUATION_BOSS', 'Evaluation + Boss'],
];

// ── Day content from docs ──

function loadDays(): { day: number; title: string; body: string }[] {
  if (!existsSync(DAYS_DIR)) throw new Error(`Day docs not found at ${DAYS_DIR}`);
  return readdirSync(DAYS_DIR)
    .filter(f => /^D\d{2}-.*\.md$/.test(f))
    .sort()
    .map(f => {
      const body = readFileSync(join(DAYS_DIR, f), 'utf8');
      const m = body.match(/^# Day (\d+) — (.+)$/m);
      if (!m) throw new Error(`No "# Day N — Title" heading in ${f}`);
      return { day: Number(m[1]), title: m[2].trim(), body };
    });
}

async function setupJourney() {
  const tenant = await prisma.tenant.upsert({ where: { slug: TENANT_SLUG }, update: {}, create: { slug: TENANT_SLUG, name: TENANT_SLUG === 'demo' ? 'Demo Institute' : TENANT_SLUG, plan: 'pro' } });
  const journey = await prisma.journey.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: JOURNEY_SLUG } },
    update: { title: 'AI-Powered Data Analytics Journey', description: '45 days, 9 modules, built from the 45-Day Data Analytics syllabus.' }, // never touch isPublished on re-seed: a Super Admin controls it
    create: { tenantId: tenant.id, slug: JOURNEY_SLUG, title: 'AI-Powered Data Analytics Journey', description: '45 days, 9 modules, built from the 45-Day Data Analytics syllabus.', isPublished: true },
  });

  const stageIds: Record<number, string> = {};
  for (const s of STAGES) {
    const st = await prisma.stage.upsert({ where: { journeyId_idx: { journeyId: journey.id, idx: s.idx } }, update: { code: s.code, title: s.title }, create: { journeyId: journey.id, idx: s.idx, code: s.code, title: s.title } });
    stageIds[s.idx] = st.id;
  }
  return { tenant, journey, stageIds };
}

async function seedLevels(ctx: Awaited<ReturnType<typeof setupJourney>>, days: ReturnType<typeof loadDays>) {
  const levelIds: Record<number, string> = {};
  for (const l of LEVELS) {
    const data = {
      code: l.code, title: l.title,
      summary: l.topics.join(' · '),
      description: `Days ${l.days[0]}–${l.days[1]} of the 45-day syllabus.`,
      xpReward: l.xp, stageId: ctx.stageIds[l.stage],
      tags: JSON.stringify(l.topics),
    };
    const lv = await prisma.level.upsert({ where: { journeyId_idx: { journeyId: ctx.journey.id, idx: l.idx } }, update: data, create: { isPublished: l.idx === 1 /* only level 1 starts published; admins publish the rest after review, and re-seeding never unpublishes */, tenantId: ctx.tenant.id, journeyId: ctx.journey.id, idx: l.idx, ...data } });
    levelIds[l.idx] = lv.id;
    if (l.idx > 1) await prisma.levelPrerequisite.upsert({ where: { levelId_prerequisiteLevelId: { levelId: lv.id, prerequisiteLevelId: levelIds[l.idx - 1] } }, update: {}, create: { levelId: lv.id, prerequisiteLevelId: levelIds[l.idx - 1] } });

    // Day content: update in place by position, create missing, never delete (keeps learner progress intact).
    const dayRows = days.filter(d => d.day >= l.days[0] && d.day <= l.days[1]);
    for (const d of dayRows) {
      const position = d.day;
      const steps = GENERIC_GUIDED[d.day];
      const payload = JSON.stringify({ body: d.body, day: d.day, module: l.code, ...(steps ? { steps } : {}) });
      const existing = await prisma.content.findFirst({ where: { levelId: lv.id, kind: 'md', position } });
      if (existing) await prisma.content.update({ where: { id: existing.id }, data: { title: `Day ${d.day} — ${d.title}`, payload, durationMin: 270 } });
      else await prisma.content.create({ data: { levelId: lv.id, kind: 'md', position, title: `Day ${d.day} — ${d.title}`, payload, durationMin: 270 } });
    }
  }
  return levelIds;
}

async function seedActivities(ctx: Awaited<ReturnType<typeof setupJourney>>, levelIds: Record<number, string>) {
  for (const a of M1_ACTIVITIES) {
    await prisma.activity.upsert({
      where: { levelId_idx: { levelId: levelIds[1], idx: a.idx } },
      update: { code: a.code, title: a.title, xpReward: a.xp, config: JSON.stringify(a.config) },
      create: { tenantId: ctx.tenant.id, levelId: levelIds[1], idx: a.idx, code: a.code, title: a.title, xpReward: a.xp, position: a.idx, config: JSON.stringify(a.config) },
    });
  }
  // Modules 2–9: drafted activities (data-analytics-activities.ts). A module with no draft keeps unauthored slots.
  for (const l of LEVELS.filter(x => x.idx > 1)) {
    const spec = MODULES.find(m => m.code === l.code);
    const rows = spec ? buildModule(spec) : UNAUTHORED.map(([code, title], i) => ({ idx: i + 1, code, title, xp: 0, config: { kind: 'unauthored' } }));
    for (const r of rows) {
      await prisma.activity.upsert({
        where: { levelId_idx: { levelId: levelIds[l.idx], idx: r.idx } },
        update: { code: r.code, title: r.title, xpReward: r.xp, config: JSON.stringify(r.config) },
        create: { tenantId: ctx.tenant.id, levelId: levelIds[l.idx], idx: r.idx, code: r.code, title: r.title, position: r.idx, xpReward: r.xp, config: JSON.stringify(r.config) },
      });
    }
  }
}

// Shared rubric for applied tasks (docs/data-analytics-journey/00-INDEX.md §5). Dimension weights sum to 1.
const RUBRIC_DA = {
  code: 'DA01_FUNDAMENTALS_RUBRIC',
  title: 'Data Analytics — Applied Task Rubric',
  passThreshold: 3.0,
  dimensions: {
    correct_result: { name: 'Correct result', weight: 0.35, l1: 'Result is wrong or missing.', l3: 'Mostly right; one step is off.', l5: 'Matches the expected result exactly.' },
    business_reading: { name: 'Business reading', weight: 0.25, l1: 'No meaning given for the owner.', l3: 'States a meaning but not what to do.', l5: 'Explains the meaning and one action for the owner.' },
    method: { name: 'Method', weight: 0.20, l1: 'Unclear steps.', l3: 'Steps work but are hard to follow.', l5: 'Clear steps, uses the taught concept, no magic numbers.' },
    data_checks: { name: 'Data checks', weight: 0.10, l1: 'No checks.', l3: 'One check named.', l5: 'Names limits and checks the numbers.' },
    reflection: { name: 'Reflection', weight: 0.10, l1: 'Missing.', l3: 'Short reflection.', l5: 'Names one change and one question for the owner.' },
  },
};

/** One rubric per module (same dimensions and weights), named <LEVEL_CODE>_RUBRIC. */
async function seedRubric() {
  for (const l of LEVELS) {
    const code = `${l.code}_RUBRIC`;
    const title = `${l.title} — Applied Task Rubric`;
    await prisma.rubric.upsert({
      where: { code },
      update: { title, dimensions: JSON.stringify(RUBRIC_DA.dimensions), passThreshold: RUBRIC_DA.passThreshold },
      create: { code, title, dimensions: JSON.stringify(RUBRIC_DA.dimensions), passThreshold: RUBRIC_DA.passThreshold },
    });
  }
}

async function main() {
  const days = loadDays();
  if (days.length !== 45) throw new Error(`Expected 45 day files, found ${days.length}`);
  await seedRubric();
  const ctx = await setupJourney();
  const levelIds = await seedLevels(ctx, days);
  await seedActivities(ctx, levelIds);
  const counts = {
    levels: await prisma.level.count({ where: { journeyId: ctx.journey.id } }),
    contents: await prisma.content.count({ where: { level: { journeyId: ctx.journey.id } } }),
    activities: await prisma.activity.count({ where: { level: { journeyId: ctx.journey.id } } }),
  };
  console.log(`✓ seed-data-analytics complete (tenant ${TENANT_SLUG}): ${counts.levels} levels, ${counts.contents} day contents, ${counts.activities} activity slots. all nine modules have activities (2–9 are drafts for review).`);
}

main()
  .catch(e => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
