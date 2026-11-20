/**
 * 45-day domain journey generator (spec: docs/DOMAIN_ANALYTICS_JOURNEYS_SPEC.md).
 * One curriculum template × one domain spec = one complete journey: 9 modules × 5 days, 6 graded activities per module.
 * Pure and deterministic (the seed and the tests call it). No '@/…' imports.
 */
import type { DomainSpec } from './types';
import type { ColumnRule, DatasetSchema } from './datasetCheck';

export const DOMAIN_FAMILY = 'data-analytics-domain';

export type DayPage = { day: number; title: string; body: string };
export type ActivityRow = { idx: number; code: string; title: string; xp: number; config: Record<string, any> };
export type LevelRow = { idx: number; code: string; title: string; summary: string; xp: number; days: DayPage[]; activities: ActivityRow[] };
export type DomainJourney = {
  slug: string; title: string; description: string;
  config: { family: string; domain: string; code: string; name: string; problem: string; catalog: string };
  schemas: { dataset: DatasetSchema; silver: DatasetSchema; gold: DatasetSchema };
  levels: LevelRow[];
};

/* ───────────── schemas per layer ───────────── */

/** Raw collection (Module 2): structure is enforced (columns, types, key, rows); category values are cleaned later. */
export function rawSchema(d: DomainSpec): DatasetSchema {
  const nonKeyRequired = d.dataset.columns.filter(c => !c.key && c.required !== false).slice(0, 2).map(c => c.name);
  return {
    name: `${d.dataset.name}_raw`, minRows: 100,
    columns: d.dataset.columns.map(c => ({
      ...c,
      ...(c.type === 'category' ? { type: 'string' as const, values: undefined } : {}),
      required: c.key || nonKeyRequired.includes(c.name),
    })),
  };
}
/** Silver (Module 5): every rule enforced, categories standardised, plus lineage columns. */
export function silverSchema(d: DomainSpec): DatasetSchema {
  return {
    name: `silver_${d.dataset.name}`, minRows: 100,
    columns: [...d.dataset.columns, { name: 'load_date', type: 'date', required: true }, { name: 'source_file', type: 'string', required: true }],
  };
}

/* ───────────── sample data (proves every schema can be met; used by tests and e2e) ───────────── */

export function sampleValue(c: ColumnRule, i: number): string {
  const lo = c.min !== undefined && c.max !== undefined && c.min < 0 && c.max > 0 ? 0 : (c.min ?? 0);
  const hi = c.max ?? lo + 1000;
  const span = Math.max(0, Math.min(hi - lo, 99_999));
  if (c.key) return `${c.name.replace(/[^a-z]/gi, '').slice(0, 3).toUpperCase() || 'ID'}${String(i + 1).padStart(5, '0')}`;
  switch (c.type) {
    case 'integer': return String(Math.round(lo + ((i * 37) % (Math.floor(span) + 1))));
    case 'number': return (lo + ((i * 53) % 1000) / 1000 * span).toFixed(2);
    case 'date': { const dt = new Date(Date.UTC(2026, 0, 1 + (i % 300))); return dt.toISOString().slice(0, 10); }
    case 'boolean': return i % 3 === 0 ? 'true' : 'false';
    case 'category': return c.values?.length ? c.values[i % c.values.length] : `Group ${(i % 4) + 1}`;
    default: return `${c.name.replace(/_/g, ' ')} ${(i % 12) + 1}`;
  }
}
export function sampleCsv(schema: DatasetSchema, rows = 120): string {
  const esc = (v: string) => /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  const lines = [schema.columns.map(c => c.name).join(',')];
  for (let i = 0; i < Math.max(rows, schema.minRows); i++) lines.push(schema.columns.map(c => esc(sampleValue(c, i))).join(','));
  return lines.join('\n') + '\n';
}

/* ───────────── helpers ───────────── */

const numbered = (xs: string[]) => xs.map((x, i) => `${i + 1}. ${x}`).join('\n');
const colDoc = (c: ColumnRule) => {
  const t = c.type === 'category' && c.values?.length ? `one of: ${c.values.join(', ')}` : c.type === 'integer' || c.type === 'number' ? `${c.type === 'integer' ? 'whole number' : 'number'}${c.min !== undefined ? ` from ${c.min}` : ''}${c.max !== undefined ? ` to ${c.max}` : ''}` : c.type === 'date' ? 'date YYYY-MM-DD' : c.type === 'boolean' ? 'true or false' : 'text';
  return `\`${c.name}\` — ${t}${c.key ? ' (unique key)' : ''}${c.required === false ? ' (optional)' : ''}${c.description ? `. ${c.description}` : ''}`;
};
/** Deterministic shuffle so correct answers are not always in the same position. */
function seeded(seed: string) { let h = 2166136261; for (const ch of seed) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 10000) / 10000; }; }
function shuffleQ(q: { q: string; options: string[]; answer: number; why?: string }, seed: string) {
  const r = seeded(seed + q.q); const order = q.options.map((_, i) => i).sort(() => r() - 0.5);
  return { ...q, options: order.map(i => q.options[i]), answer: order.indexOf(q.answer) };
}
function xpSplit(total: number) {
  const briefing = Math.round(total * 0.04), learn = Math.round(total * 0.15), evidence = Math.round(total * 0.08);
  const build = Math.round(total * 0.29), proof = Math.round(total * 0.04);
  const boss = total - briefing - learn - evidence - build - proof; const base = Math.round(boss * 0.43);
  return { briefing, learn, evidence, build, proof, boss, bossBase: base, bossBonus: boss - base };
}

const PROMPT_RULES = 'Use made-up (synthetic) data only. No real names, phone numbers, emails or ID numbers.';

/* ───────────── the 9-module template ───────────── */

type Ctx = { d: DomainSpec; s: DomainJourney['schemas'] };
type ModuleTemplate = {
  suffix: string; title: (d: DomainSpec) => string; stage: string; xp: number; evidence: 'dataset' | 'screenshot'; layer?: 'dataset' | 'silver' | 'gold';
  days: ((c: Ctx) => { title: string; goal: string; why: string; steps: string[]; prompt?: string; code?: { lang: string; text: string }; submit?: string })[];
  briefing: (c: Ctx) => { problem: string; objective: string; outcome: string; criteria: string[]; check: { q: string; options: string[]; answer: number; why: string } };
  lessons: (c: Ctx) => { title: string; minutes: number; body: string }[];
  quiz: (c: Ctx) => { q: string; options: string[]; answer: number }[];
  evidenceCfg: (c: Ctx) => Record<string, any>;
  build: (c: Ctx) => { title: string; fields: { key: string; label: string; hint: string; minWords: number }[] };
  proof: (c: Ctx) => string[];
  boss: (c: Ctx) => { intro: string; choices: string[]; scenarios: { s: string; correct: number[] }[] };
};

const SHOT = (shows: string[], checklist: string[]) => ({ kind: 'screenshot', estMinutes: 20, minWidth: 800, minHeight: 450, shows, checklist });

export const MODULE_PLAN: ModuleTemplate[] = [
  /* ── M1 Problem framing ── */
  {
    suffix: 'FRAMING', stage: 'Stage 1 of 9 · Domain and problem framing', xp: 120, evidence: 'screenshot',
    title: d => `Frame the ${d.name} Problem`,
    days: [
      ({ d }) => ({ title: `Meet the ${d.name} problem: ${d.problem.title}`, goal: 'Understand the business, the people involved and the decision this project supports.', why: d.problem.statement,
        steps: [`Read the problem statement twice and underline every noun that could become data (for example, ${d.entity}).`, `List the stakeholders and what each needs to decide: ${d.problem.stakeholders.join(', ')}.`, 'Write, in one sentence, what would change if this problem were solved.', 'Write three things you do not yet know about this business. You will answer them during the journey.'],
        submit: 'Keep your notes; they become the problem canvas on Day 5.' }),
      ({ d }) => ({ title: 'From vague questions to measurable ones', goal: 'Turn the business worry into questions that data can answer.', why: `A question like "are we doing badly?" cannot be answered. "${d.problem.questions[0]}" can, because it has a measure, a period and a breakdown.`,
        steps: ['For each question below, mark the measure, the period and the breakdown.', ...d.problem.questions.map(q => `Question: ${q}`), 'Add one question of your own that a stakeholder would ask.', 'Cross out any question that has no data source.'],
        prompt: `I am a data analyst in ${d.name}. Our problem: ${d.problem.title}. Rewrite these questions so each has a measure, a time period and a breakdown, and explain which data would answer each: ${d.problem.questions.join(' | ')}` }),
      ({ d }) => ({ title: 'KPI tree, business case and SLA', goal: 'Define the numbers, the value of moving them, and when the business needs them.', why: 'Enterprises fund data products that move a KPI by a known amount, delivered on a promised schedule. Formulas, value and SLA are agreed before any build.',
        steps: ['Put the main outcome at the top of a tree.', ...d.kpis.map(k => `KPI — ${k.name}: ${k.definition}.`), 'Under each KPI, write the columns you need to calculate it.', 'Write the business case: which KPI moves, by how much, and what that is worth. Estimate it and state your assumptions; never invent facts.', `Agree the service level (SLA): ${d.enterprise.sla}.`, `Design for production scale: ${d.enterprise.scale}.`] }),
      ({ d }) => ({ title: 'Data inventory and data contracts', goal: 'List every source and agree a data contract with each owner.', why: `In ${d.name}, data is spread across systems owned by different teams. A data contract says what each source must deliver, so pipelines do not break silently.`,
        steps: [...d.sources.structured.map(s => `Structured source — ${s.name}: ${s.description}.`), ...d.sources.semi.map(s => `Semi-structured source (${s.format}) — ${s.name}: ${s.description}.`), ...d.sources.unstructured.map(s => `Unstructured source — ${s.name}: ${s.description}.`), 'For each source, write a data contract: owner, columns and types, refresh time, quality rules, and who to call when it breaks.', 'Mark which sources hold personal data and must be masked downstream.'] }),
      ({ d }) => ({ title: 'Problem canvas, compliance and data ethics', goal: 'Put the whole problem on one page and record the rules you must comply with.', why: 'In production, a project that ignores regulation is stopped by legal, however good the dashboard. Compliance is designed in from Day 1.',
        steps: ['Draw a one-page canvas with six boxes: Problem, Stakeholders and decisions, Questions, KPIs and SLA, Data sources, Compliance.', `Fill it in for ${d.problem.title}.`, `Compliance box — regulations that apply: ${d.enterprise.regulations.join('; ')}.`, `Personal data in production systems that must be masked: ${d.enterprise.piiColumns.join(', ')}.`, 'For this course, use synthetic data only: no names, phone numbers, emails or ID numbers.', 'Take a clear screenshot of the canvas and upload it in activity 3.'],
        submit: 'Screenshot of your problem canvas (activity 3).' }),
    ],
    briefing: ({ d }) => ({ problem: d.problem.statement, objective: 'Turn the business problem into measurable questions, KPIs and a data inventory.', outcome: 'A one-page problem canvas with stakeholders, questions, KPIs and data sources.', criteria: ['Each question has a measure, a period and a breakdown', 'Each KPI has an exact formula', 'Every data source is labelled structured, semi-structured or unstructured'],
      check: { q: `Which of these is a measurable question for "${d.problem.title}"?`, options: [d.problem.questions[0], `Is our ${d.name.toLowerCase()} business doing badly?`, 'Can we use AI for this?', 'Which dashboard colours look best?'], answer: 0, why: 'It names a measure, a period and a breakdown, so data can answer it.' } }),
    lessons: ({ d }) => [
      { title: 'Problem before data', minutes: 8, body: `Analytics starts with a decision, not a dataset. In ${d.name}, the decision is: ${d.problem.decisions[0].toLowerCase()}. Every table and chart you build should help someone make that decision.` },
      { title: 'Measurable questions', minutes: 8, body: 'A good analytics question has a measure (what you count), a period (when) and a breakdown (by what). Without all three, two analysts will answer it differently.' },
      { title: 'KPIs and KPI trees', minutes: 10, body: `A KPI is a number tied to a goal, with a fixed formula. A KPI tree links the top outcome to the drivers below it. For this project the KPIs include ${d.kpis.slice(0, 3).map(k => k.name).join(', ')}.` },
      { title: 'Types of data', minutes: 8, body: 'Structured data has fixed rows and columns (a register or a database table). Semi-structured data has tags or nested fields (JSON, XML). Unstructured data has no fixed shape (notes, PDFs, photos). Most real problems need all three.' },
    ],
    quiz: ({ d }) => [
      { q: 'A measurable question must contain…', options: ['A measure, a period and a breakdown', 'A chart type', 'A tool name', 'A stakeholder name'], answer: 0 },
      { q: `${d.kpis[0].name} is best described as…`, options: ['A KPI with a fixed formula', 'A data source', 'A stakeholder', 'A dashboard page'], answer: 0 },
      { q: `"${d.sources.semi[0].name}" (${d.sources.semi[0].format}) is which type of data?`, options: ['Structured', 'Semi-structured', 'Unstructured', 'Not data'], answer: 1 },
      { q: `"${d.sources.unstructured[0].name}" is which type of data?`, options: ['Structured', 'Semi-structured', 'Unstructured', 'A KPI'], answer: 2 },
      { q: 'Why agree KPI formulas before building anything?', options: ['So everyone calculates them the same way', 'To make the project longer', 'Because tools require it', 'It is not needed'], answer: 0 },
    ],
    evidenceCfg: ({ d }) => SHOT(['The problem statement in your own words', 'Stakeholders and their decisions', 'At least three measurable questions', `KPIs with formulas (for example ${d.kpis[0].name})`, 'Data sources labelled by type'], ['The canvas is about ' + d.problem.title, 'It contains no real personal data', 'The text in the screenshot is readable']),
    build: ({ d }) => ({ title: 'Build: Problem Brief with AI', fields: [{ key: 'question', label: 'Your main measurable question', hint: d.problem.questions[0], minWords: 12 }, { key: 'kpis', label: 'Your KPIs and formulas', hint: d.kpis.map(k => k.name).join(', '), minWords: 25 }, { key: 'risks', label: 'Data risks and privacy rules', hint: 'What could go wrong with the data, and how you protect people', minWords: 20 }] }),
    proof: () => ['My canvas names stakeholders and the decision they make', 'Each question has a measure, a period and a breakdown', 'Each KPI has an exact formula', 'I used synthetic data only'],
    boss: ({ d }) => ({ intro: `You are presenting the problem framing for ${d.problem.title}. Pick the best move for each situation.`,
      choices: ['Rewrite it with a measure, a period and a breakdown', 'Add the source to the inventory with its type', 'Agree one formula and write it down', 'Remove the personal data and use synthetic data', 'Start building the dashboard straight away'],
      scenarios: [{ s: 'A stakeholder asks: "Are things getting worse?"', correct: [0] }, { s: `Two teams calculate "${d.kpis[0].name}" differently.`, correct: [2] }, { s: `You find a spreadsheet of real ${d.entity} contact details.`, correct: [3] }] }),
  },
  /* ── M2 Data collection ── */
  {
    suffix: 'COLLECTION', stage: 'Stage 2 of 9 · Data collection: structured, semi-structured and unstructured data', xp: 160, evidence: 'dataset', layer: 'dataset',
    title: () => 'Collect Structured, Semi-structured and Unstructured Data',
    days: [
      ({ d }) => ({ title: 'Three kinds of data in this domain', goal: 'Plan which structured, semi-structured and unstructured data you will collect.', why: `${d.problem.title} needs more than one table. The richest insights come from joining registers, app exports and notes.`,
        steps: [`Structured: ${d.sources.structured.map(s => s.name).join('; ')}.`, `Semi-structured: ${d.sources.semi.map(s => `${s.name} (${s.format})`).join('; ')}.`, `Unstructured: ${d.sources.unstructured.map(s => s.name).join('; ')}.`, 'For each, write the fields you need for your KPIs and which ones you can leave out.'] }),
      ({ d, s }) => ({ title: 'Generate the structured dataset with AI', goal: `Create a realistic synthetic table of at least ${s.dataset.minRows} rows for ${d.problem.title}.`, why: 'Real data from this domain is private. A well-designed synthetic dataset lets you practise every step safely, with realistic messiness.',
        steps: ['Copy the prompt below into ChatGPT, Gemini or Claude.', 'Ask for the output as CSV, then save it as a .csv file (or paste it into Excel and save as .xlsx).', 'Open it and check the header row matches the column names exactly.', 'Upload it to the dataset check in activity 3. Fix anything it reports and upload again.'],
        prompt: `Create a synthetic dataset as CSV with exactly these columns and at least ${s.dataset.minRows} rows, for a ${d.name} analytics project on "${d.problem.title}":\n${d.dataset.columns.map(c => `- ${colDoc(c)}`).join('\n')}\nMake it realistic: include a few typical data problems such as ${d.quality.slice(0, 2).join(' and ').toLowerCase()}. ${PROMPT_RULES} Output only the CSV.`,
        submit: 'Upload the CSV or Excel file to the dataset check (activity 3).' }),
      ({ d }) => ({ title: 'Collect semi-structured data (JSON)', goal: 'Create a semi-structured sample and understand nested fields.', why: `Apps and APIs in ${d.name} send JSON. Knowing how nested fields map to columns is essential for ingestion.`,
        steps: ['Generate the JSON sample with the prompt below and save it as a .json file (one object per line = JSON Lines).', 'Identify which fields are nested and how you would flatten them.', `Note how this file links to your structured dataset (which key joins them, for example the ${d.entity} reference).`],
        prompt: `Create 50 records of semi-structured ${d.sources.semi[0].format} data for "${d.sources.semi[0].name}" (${d.sources.semi[0].description}) in a ${d.name} project. Use nested objects and arrays where natural, and include a key that links to the main table. ${PROMPT_RULES}` }),
      ({ d }) => ({ title: 'Collect unstructured data (text)', goal: 'Create unstructured notes and plan how text becomes analysable.', why: `${d.sources.unstructured[0].name} often explain the "why" behind the numbers.`,
        steps: ['Generate 20 short notes with the prompt below and save them as a .txt file, one note per line.', 'Read them and list 5 themes or tags you could extract (for example a reason, a sentiment or an issue type).', 'Decide which unstructured fields you will keep and which you will drop.'],
        prompt: `Write 20 realistic, short "${d.sources.unstructured[0].name}" entries for a ${d.name} organisation working on "${d.problem.title}". Each entry should mention a reference ID and a specific observation. ${PROMPT_RULES}` }),
      ({ d, s }) => ({ title: 'Data dictionary and the dataset check', goal: `Document every column of the ${d.name} dataset and pass the structured dataset check.`, why: 'A data dictionary makes your dataset usable by others and is the contract for the next stages.',
        steps: ['Write one line per column: name, meaning, type and allowed values.', ...s.dataset.columns.map(colDoc), 'Run the dataset check (activity 3) until every check is green.', 'Save all three files (CSV/XLSX, JSON, TXT); you will ingest them into Databricks next.'],
        submit: 'Passing dataset check and your data dictionary (proof link in activity 5).' }),
    ],
    briefing: ({ d }) => ({ problem: `To answer "${d.problem.questions[0]}" you need data from several systems: ${d.sources.structured[0].name}, ${d.sources.semi[0].name} and ${d.sources.unstructured[0].name}.`, objective: 'Collect a structured dataset, a semi-structured file and unstructured notes, all synthetic and documented.', outcome: 'Three files and a data dictionary; the structured file passes the dataset check.', criteria: ['The structured dataset has every required column and at least 100 rows', 'Semi-structured JSON links to the main table by a key', 'No real personal data anywhere'],
      check: { q: 'Why generate synthetic data for this project?', options: ['Real domain data is private; synthetic data lets you practise safely', 'Synthetic data is always more accurate', 'Databricks cannot read real data', 'It is required by Power BI'], answer: 0, why: 'Real records contain personal and commercial data you must not use for practice.' } }),
    lessons: ({ d }) => [
      { title: 'Structured data', minutes: 8, body: `Rows and columns with a fixed schema, such as ${d.sources.structured[0].name}. Each column has one type, and one column (the key) identifies each row.` },
      { title: 'Semi-structured data', minutes: 8, body: `Data with tags or nesting but no fixed table, such as ${d.sources.semi[0].name} in ${d.sources.semi[0].format}. Fields can be missing or nested; you flatten them during ingestion.` },
      { title: 'Unstructured data', minutes: 8, body: `Free text, documents and images, such as ${d.sources.unstructured[0].name}. You extract tags, entities or sentiment from them to join with the numbers.` },
      { title: 'Synthetic data and privacy', minutes: 8, body: 'Generate data with AI to practise safely. Ask for realistic messiness (typos, missing values, duplicates) so cleaning is meaningful later, but never real names, phone numbers or ID numbers.' },
    ],
    quiz: ({ d }) => [
      { q: 'A CSV export of a register is…', options: ['Structured', 'Semi-structured', 'Unstructured', 'A dashboard'], answer: 0 },
      { q: 'JSON Lines means…', options: ['One JSON object per line', 'A JSON file with no data', 'A CSV with quotes', 'An Excel sheet'], answer: 0 },
      { q: `What links the semi-structured file to the main ${d.entity} table?`, options: ['A shared key column', 'The file name', 'The colour of the chart', 'Nothing is needed'], answer: 0 },
      { q: 'Why ask the AI to include some data problems?', options: ['So the cleaning stage is realistic', 'To make the file bigger', 'To fail the dataset check on purpose', 'Because AI cannot avoid it'], answer: 0 },
      { q: 'Which of these must never be in your practice data?', options: ['Real phone numbers and ID numbers', 'Category values', 'Dates', 'Numeric measures'], answer: 0 },
    ],
    evidenceCfg: ({ s }) => ({ kind: 'dataset', estMinutes: 30, schema: s.dataset, accept: ['.csv', '.xlsx'], instructions: 'Upload the structured dataset you generated (CSV or Excel). It is checked against the column list, types, key and privacy rules.' }),
    build: ({ d }) => ({ title: 'Build: Data Collection Plan with AI', fields: [{ key: 'prompt', label: 'The prompt you used for the structured data', hint: 'Paste and improve the prompt from Day 7', minWords: 25 }, { key: 'semi', label: 'How the semi-structured file links to the main table', hint: `Which key joins them for ${d.problem.title}`, minWords: 15 }, { key: 'unstructured', label: 'Themes you will extract from the text', hint: 'Five tags or themes and why they matter', minWords: 20 }] }),
    proof: () => ['My structured dataset passed every check', 'I created a semi-structured JSON file that links by a key', 'I created unstructured notes without personal data', 'My data dictionary describes every column'],
    boss: ({ d }) => ({ intro: `Collecting data for ${d.problem.title}. Choose the right action.`,
      choices: ['Treat it as semi-structured and flatten nested fields later', 'Fix the header so it matches the data dictionary', 'Replace the real values with synthetic ones', 'Keep it as unstructured text and extract tags', 'Ignore it'],
      scenarios: [{ s: 'The app export has nested lists inside each record.', correct: [0] }, { s: 'The dataset check says a required column is missing because it is spelled differently.', correct: [1] }, { s: `The notes contain real ${d.entity} phone numbers.`, correct: [2] }] }),
  },
  /* ── M3 Databricks + Unity Catalog ── */
  {
    suffix: 'UNITY_CATALOG', stage: 'Stage 3 of 9 · Databricks workspace and Unity Catalog setup', xp: 170, evidence: 'screenshot',
    title: () => 'Set Up Databricks and Unity Catalog',
    days: [
      ({ d }) => ({ title: 'Your Databricks workspace', goal: 'Create a free Databricks workspace and find your way around.', why: `Databricks is where the ${d.name} data will be stored, cleaned and modelled. Unity Catalog governs who can see what.`,
        steps: ['Sign up for Databricks Free Edition with your email (no payment needed).', 'Open the workspace and find: Workspace (notebooks), Catalog (data), SQL Editor and Compute (serverless).', 'Create a folder named after your project and a first notebook.', 'Run SELECT current_catalog(), current_schema(); to see where you are.'] }),
      ({ d }) => ({ title: 'Unity Catalog: catalogs per environment', goal: `Create the ${d.catalog} catalog, and learn how enterprises separate dev and prod.`, why: 'Unity Catalog uses three-level names: catalog.schema.table. Companies keep one catalog per environment, so a test run can never overwrite production data.',
        steps: ['Open the SQL Editor.', `In a company you would create ${d.catalog}_dev and ${d.catalog}_prod and promote code between them. In this course, ${d.catalog} is your dev catalog.`, 'Run the code below to create the catalog.', 'If your edition does not let you create a catalog, use the workspace catalog and prefix your schemas instead.', 'Open Catalog Explorer and find your catalog.'],
        code: { lang: 'sql', text: `CREATE CATALOG IF NOT EXISTS ${d.catalog} COMMENT '${d.problem.title}';\nUSE CATALOG ${d.catalog};\n-- Enterprise pattern (needs admin rights):\n-- CREATE CATALOG ${d.catalog}_dev;  CREATE CATALOG ${d.catalog}_prod;\n-- If CREATE CATALOG is not allowed: USE CATALOG workspace; and name schemas ${d.catalog}_bronze, ${d.catalog}_silver, ${d.catalog}_gold` } }),
      ({ d }) => ({ title: 'Schemas for the medallion layers', goal: 'Create bronze, silver and gold schemas in Unity Catalog.', why: 'Separating raw, cleaned and business-ready data makes errors traceable and permissions simple.',
        steps: ['Run the code below.', 'Add a comment to each schema describing what belongs there.', 'Refresh Catalog Explorer and check all three schemas appear.'],
        code: { lang: 'sql', text: `CREATE SCHEMA IF NOT EXISTS ${d.catalog}.bronze COMMENT 'Raw data as received';\nCREATE SCHEMA IF NOT EXISTS ${d.catalog}.silver COMMENT 'Cleaned and standardised';\nCREATE SCHEMA IF NOT EXISTS ${d.catalog}.gold COMMENT 'Business-ready KPI marts for ${d.problem.title}';` } }),
      ({ d, s }) => ({ title: 'Volumes for raw files', goal: 'Create a Unity Catalog volume and upload your three files.', why: 'Volumes store files (CSV, JSON, text) under the same governance as tables, so raw files are never lost or uncontrolled.',
        steps: ['Run the code below to create the volume.', 'In Catalog Explorer, open the volume and click Upload to this volume.', `Upload your files: ${s.dataset.name}.csv (or .xlsx saved as CSV), your JSON file and your text notes.`, 'Copy each file path (it starts with /Volumes/).'],
        code: { lang: 'sql', text: `CREATE VOLUME IF NOT EXISTS ${d.catalog}.bronze.raw_files COMMENT 'Landing zone for ${d.name} source files';\nLIST '/Volumes/${d.catalog}/bronze/raw_files/';` } }),
      ({ d }) => ({ title: 'Governance: groups, column masks, row filters and tags', goal: 'Grant access to groups and protect personal data with column masks and row filters.', why: `${d.enterprise.regulations[0]} requires that only people who need personal data can see it. Unity Catalog enforces that in the table itself, for every tool that reads it.`,
        steps: ['Grant privileges to groups, never to individuals (code below).', `Production tables hold personal data such as ${d.enterprise.piiColumns.join(', ')}. Apply a column mask so only an approved group sees real values.`, 'Apply a row filter so each regional team sees only its own rows.', 'Add a tag such as domain = the domain name, and mark PII columns with a pii tag.', 'Take a screenshot of Catalog Explorer showing the catalog, the three schemas and the volume, and upload it in activity 3.'],
        code: { lang: 'sql', text: `GRANT USE CATALOG ON CATALOG ${d.catalog} TO \`account users\`;\nGRANT USE SCHEMA, SELECT ON SCHEMA ${d.catalog}.gold TO \`account users\`;\nALTER CATALOG ${d.catalog} SET TAGS ('domain' = '${d.slug}');\n-- Column mask for personal data (production tables):\nCREATE OR REPLACE FUNCTION ${d.catalog}.gold.mask_pii(v STRING) RETURN CASE WHEN is_account_group_member('pii_readers') THEN v ELSE '****' END;\n-- ALTER TABLE ${d.catalog}.silver.<table> ALTER COLUMN ${d.enterprise.piiColumns[0]} SET MASK ${d.catalog}.gold.mask_pii;\n-- Row filter: each region sees only its rows\nCREATE OR REPLACE FUNCTION ${d.catalog}.gold.region_filter(region STRING) RETURN is_account_group_member('national') OR is_account_group_member(concat('region_', region));\n-- ALTER TABLE ${d.catalog}.gold.<table> SET ROW FILTER ${d.catalog}.gold.region_filter ON (<region_column>);` },
        submit: 'Screenshot of Catalog Explorer (activity 3).' }),
    ],
    briefing: ({ d }) => ({ problem: `The ${d.name} data needs a governed home before anyone can trust it. You will set up Databricks and Unity Catalog for ${d.problem.title}.`, objective: `Create the ${d.catalog} catalog with bronze, silver and gold schemas and a volume for raw files.`, outcome: 'A governed catalog visible in Catalog Explorer, with permissions and comments.', criteria: ['Three schemas: bronze, silver, gold', 'A volume holding the raw files', 'Permissions granted and documented'],
      check: { q: 'In Unity Catalog, what is the full name of a table?', options: ['catalog.schema.table', 'schema.table only', 'database/table', 'table@catalog'], answer: 0, why: 'Unity Catalog uses a three-level namespace.' } }),
    lessons: ({ d }) => [
      { title: 'What Databricks is', minutes: 8, body: 'A cloud platform for data engineering, analytics and AI on top of a lakehouse: files stored cheaply in open Delta format, queried with SQL or Python.' },
      { title: 'Unity Catalog', minutes: 10, body: `Unity Catalog is the governance layer: one place for permissions, lineage, comments and tags. Everything is addressed as catalog.schema.object, for example ${d.catalog}.gold.${d.gold.name}.` },
      { title: 'Volumes', minutes: 6, body: 'A volume is a governed folder for files inside a schema. Paths look like /Volumes/catalog/schema/volume/file.csv.' },
      { title: 'The medallion architecture', minutes: 8, body: 'Bronze keeps raw data as received, silver holds cleaned and standardised data, gold holds business-ready tables for dashboards. Each layer is a schema.' },
    ],
    quiz: ({ d }) => [
      { q: `Which name refers to the gold mart in this project?`, options: [`${d.catalog}.gold.${d.gold.name}`, `${d.gold.name}.gold`, `gold/${d.catalog}`, `${d.catalog}-${d.gold.name}`], answer: 0 },
      { q: 'A Unity Catalog volume stores…', options: ['Files such as CSV and JSON', 'Only dashboards', 'Passwords', 'Python packages'], answer: 0 },
      { q: 'Which layer should analysts and dashboards read from?', options: ['Gold', 'Bronze', 'The raw volume', 'Any layer'], answer: 0 },
      { q: 'Why create one catalog per project?', options: ['Clean permissions and lineage', 'It is faster to type', 'Databricks requires one per user', 'To store photos'], answer: 0 },
      { q: 'GRANT SELECT on the gold schema lets users…', options: ['Read gold tables', 'Delete bronze tables', 'Create catalogs', 'Change the metastore'], answer: 0 },
    ],
    evidenceCfg: ({ d }) => SHOT([`Catalog Explorer showing the ${d.catalog} catalog`, 'The bronze, silver and gold schemas', 'The raw_files volume with your uploaded files'], ['The catalog name is visible', 'All three schemas are visible', 'No access tokens or passwords are visible']),
    build: ({ d }) => ({ title: 'Build: Unity Catalog Design', fields: [{ key: 'naming', label: 'Your naming convention', hint: `How you name tables in ${d.catalog}.bronze, silver and gold`, minWords: 20 }, { key: 'permissions', label: 'Who gets which permission and why', hint: 'Engineers, analysts, business users', minWords: 20 }, { key: 'issues', label: 'Problems you hit and how you solved them', hint: 'Errors, edition limits, upload issues', minWords: 15 }] }),
    proof: () => ['My catalog has bronze, silver and gold schemas', 'My raw files are in a Unity Catalog volume', 'I granted read access on gold only to analysts', 'My screenshot shows no secrets'],
    boss: () => ({ intro: 'Setting up Unity Catalog. Choose the best action.',
      choices: ['Use the workspace catalog and prefix the schemas', 'Upload the files to a Unity Catalog volume', 'Grant SELECT on gold only', 'Share your personal access token in chat', 'Put every table in one schema'],
      scenarios: [{ s: 'Your edition does not allow CREATE CATALOG.', correct: [0] }, { s: 'Raw CSV files are sitting on your laptop.', correct: [1] }, { s: 'Business users need to read KPIs but not raw data.', correct: [2] }] }),
  },
  /* ── M4 Bronze ── */
  {
    suffix: 'BRONZE', stage: 'Stage 4 of 9 · Ingestion to the bronze layer', xp: 180, evidence: 'screenshot',
    title: () => 'Ingest Raw Data into the Bronze Layer',
    days: [
      ({ d }) => ({ title: 'What the bronze layer is for', goal: 'Understand why raw data is kept exactly as received.', why: `If a ${d.name} report is ever questioned, bronze lets you prove what the source sent and replay any step.`,
        steps: ['Bronze is append-only: never edit bronze rows.', 'Add ingestion metadata: when it arrived and from which file.', `Plan one bronze table per source: ${[d.sources.structured[0].name, d.sources.semi[0].name, d.sources.unstructured[0].name].join(', ')}.`] }),
      ({ d, s }) => ({ title: 'Ingest the structured CSV', goal: 'Load the structured dataset into a bronze Delta table.', why: 'read_files reads files from a volume and infers the schema; keeping everything as received is the bronze rule.',
        steps: ['Run the code below in the SQL Editor or a notebook.', 'Check the row count matches the file.', 'Open the table in Catalog Explorer and look at the inferred column types.'],
        code: { lang: 'sql', text: `CREATE OR REPLACE TABLE ${d.catalog}.bronze.${s.dataset.name} AS\nSELECT *, current_timestamp() AS _ingested_at, _metadata.file_path AS _source_file\nFROM read_files('/Volumes/${d.catalog}/bronze/raw_files/${s.dataset.name}.csv', format => 'csv', header => true);\nSELECT COUNT(*) FROM ${d.catalog}.bronze.${s.dataset.name};` } }),
      ({ d }) => ({ title: 'Ingest the semi-structured JSON', goal: 'Load the JSON file into bronze, keeping nested fields.', why: 'Nested fields stay as STRUCT or ARRAY in bronze; you flatten them in silver.',
        steps: ['Run the code below.', 'Inspect a nested column with column.field syntax.', 'Note which fields are sometimes missing.'],
        code: { lang: 'sql', text: `CREATE OR REPLACE TABLE ${d.catalog}.bronze.${d.sources.semi[0].name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40)} AS\nSELECT *, current_timestamp() AS _ingested_at, _metadata.file_path AS _source_file\nFROM read_files('/Volumes/${d.catalog}/bronze/raw_files/', format => 'json', fileNamePattern => '*.json');` } }),
      ({ d }) => ({ title: 'Unstructured text and incremental loads with Auto Loader', goal: 'Load text notes, then switch to production-grade incremental ingestion.', why: `At production scale (${d.enterprise.scale}) you cannot reload everything daily. Auto Loader processes only new files and handles schema evolution when a source adds a column.`,
        steps: ['Load the text file into bronze (SQL below).', 'Create a notebook and run the Auto Loader code below: it ingests only new CSV files and records progress in a checkpoint.', 'Add a new column to a copy of your CSV, drop it in the volume and run again: schema evolution adds the column instead of failing.', 'Write down which sources would run this way every day to meet the SLA.'],
        code: { lang: 'python', text: `spark.sql("""CREATE OR REPLACE TABLE ${d.catalog}.bronze.text_notes AS\nSELECT value AS note_text, current_timestamp() AS _ingested_at, _metadata.file_path AS _source_file\nFROM read_files('/Volumes/${d.catalog}/bronze/raw_files/', format => 'text', fileNamePattern => '*.txt')""")\n\n# Auto Loader: incremental, with schema evolution\n(spark.readStream.format('cloudFiles')\n  .option('cloudFiles.format', 'csv').option('header', 'true')\n  .option('cloudFiles.schemaLocation', '/Volumes/${d.catalog}/bronze/raw_files/_schemas/${d.dataset.name}')\n  .option('cloudFiles.schemaEvolutionMode', 'addNewColumns')\n  .load('/Volumes/${d.catalog}/bronze/raw_files/')\n  .selectExpr('*', 'current_timestamp() AS _ingested_at', '_metadata.file_path AS _source_file')\n  .writeStream.option('checkpointLocation', '/Volumes/${d.catalog}/bronze/raw_files/_checkpoints/${d.dataset.name}')\n  .trigger(availableNow=True)\n  .toTable('${d.catalog}.bronze.${d.dataset.name}_raw'))` } }),
      ({ d }) => ({ title: 'Bronze checks and evidence', goal: 'Prove bronze is complete and traceable.', why: 'Row counts and history are the first quality gate. A missing file here becomes a wrong number in the dashboard.',
        steps: ['Compare row counts in bronze with your files.', 'Run DESCRIBE HISTORY on a bronze table to see the ingestion operation.', 'Open Catalog Explorer showing the bronze tables and a sample of rows.', 'Take a screenshot and upload it in activity 3.'],
        code: { lang: 'sql', text: `SHOW TABLES IN ${d.catalog}.bronze;\nDESCRIBE HISTORY ${d.catalog}.bronze.${d.dataset.name}_raw;` },
        submit: 'Screenshot of bronze tables with row counts (activity 3).' }),
    ],
    briefing: ({ d }) => ({ problem: `Your three ${d.name} sources are sitting in a volume. Nothing downstream can be trusted until they are loaded, unchanged, into bronze.`, objective: 'Ingest structured, semi-structured and unstructured files into bronze Delta tables with ingestion metadata.', outcome: 'Bronze tables with row counts that match the source files.', criteria: ['One bronze table per source', 'Every table has _ingested_at and _source_file', 'Row counts reconciled with the files'],
      check: { q: 'What is the main rule of the bronze layer?', options: ['Keep data exactly as received, append-only', 'Fix every error immediately', 'Only keep aggregated KPIs', 'Delete old files'], answer: 0, why: 'Bronze is the raw, replayable record of what the source sent.' } }),
    lessons: () => [
      { title: 'Delta tables', minutes: 8, body: 'Delta is the open table format in Databricks: ACID transactions, schema enforcement and time travel. DESCRIBE HISTORY shows every change.' },
      { title: 'read_files', minutes: 8, body: 'read_files reads CSV, JSON, text or Parquet from a path and infers the schema. The _metadata column tells you which file each row came from.' },
      { title: 'Incremental ingestion', minutes: 8, body: 'COPY INTO loads only new files into a table. Auto Loader (cloudFiles) does the same continuously for streams of files.' },
      { title: 'Ingestion metadata', minutes: 6, body: 'Adding _ingested_at and _source_file to every bronze row lets you trace any number back to its file and load time.' },
    ],
    quiz: () => [
      { q: 'Which column tells you which file a row came from?', options: ['_metadata.file_path', 'row_number()', 'current_user()', '_id'], answer: 0 },
      { q: 'COPY INTO is useful because it…', options: ['Loads only files it has not loaded before', 'Deletes old data', 'Creates dashboards', 'Encrypts passwords'], answer: 0 },
      { q: 'Nested JSON fields in bronze should be…', options: ['Kept as they are and flattened in silver', 'Deleted', 'Converted to images', 'Renamed randomly'], answer: 0 },
      { q: 'DESCRIBE HISTORY shows…', options: ['Every operation on a Delta table', 'Only the latest row', 'User passwords', 'Power BI pages'], answer: 0 },
      { q: 'Why check bronze row counts against the files?', options: ['To prove nothing was lost on load', 'To make queries faster', 'To create gold tables', 'It is not needed'], answer: 0 },
    ],
    evidenceCfg: ({ d }) => SHOT([`The ${d.catalog}.bronze schema with your bronze tables`, 'A sample of rows or the row count', 'The _ingested_at and _source_file columns'], ['At least the structured table is in bronze', 'Row counts are visible', 'No access tokens are visible']),
    build: ({ d }) => ({ title: 'Build: Ingestion Runbook', fields: [{ key: 'sql', label: 'The ingestion SQL you ran (summarised)', hint: 'read_files, COPY INTO or Auto Loader', minWords: 25 }, { key: 'counts', label: 'Row counts: file vs bronze', hint: 'Per source', minWords: 12 }, { key: 'incremental', label: `How new ${d.name} data would be loaded daily`, hint: 'Which sources, which method', minWords: 20 }] }),
    proof: () => ['Each source has a bronze table', 'Every bronze row has ingestion metadata', 'Row counts match the source files', 'I documented how new data will be loaded'],
    boss: () => ({ intro: 'Running bronze ingestion. Choose the best action.',
      choices: ['Use COPY INTO so already-loaded files are skipped', 'Keep the nested JSON as is and flatten it in silver', 'Investigate the missing file before moving on', 'Edit the bronze rows to fix typos', 'Skip ingestion metadata'],
      scenarios: [{ s: 'A new file arrives every day in the same folder.', correct: [0] }, { s: 'Bronze has 20% fewer rows than the source file.', correct: [2] }, { s: 'The JSON has deeply nested arrays.', correct: [1] }] }),
  },
  /* ── M5 Silver ── */
  {
    suffix: 'SILVER', stage: 'Stage 5 of 9 · Cleansing to the silver layer', xp: 200, evidence: 'dataset', layer: 'silver',
    title: () => 'Cleanse and Standardise into the Silver Layer',
    days: [
      ({ d }) => ({ title: 'Profile the bronze data', goal: 'Measure the data problems before fixing them.', why: `You cannot fix what you have not measured. Profiling shows exactly which ${d.name} issues are present and how big they are.`,
        steps: ['Count nulls per column, distinct values for categories and duplicates on the key.', 'Write down the top five issues you find.', `Compare with the typical ${d.name} issues: ${d.quality.join('; ')}.`],
        code: { lang: 'sql', text: `SELECT COUNT(*) AS rows, COUNT(DISTINCT ${d.dataset.columns.find(c => c.key)!.name}) AS unique_keys\nFROM ${d.catalog}.bronze.${d.dataset.name}_raw;` } }),
      ({ d }) => ({ title: 'Cleansing rules', goal: 'Write one rule per issue and apply them in SQL.', why: 'Rules written down are repeatable and reviewable; ad-hoc fixes are not.',
        steps: ['Remove exact duplicates and keep the latest version of each key (ROW_NUMBER).', 'Trim spaces, fix capitalisation and cast every column to its type.', 'Convert all dates to YYYY-MM-DD.', ...d.quality.slice(0, 3).map(q => `Rule for: ${q}.`)],
        code: { lang: 'sql', text: `CREATE OR REPLACE TEMP VIEW deduped AS\nSELECT * EXCEPT (rn) FROM (\n  SELECT *, ROW_NUMBER() OVER (PARTITION BY ${d.dataset.columns.find(c => c.key)!.name} ORDER BY _ingested_at DESC) AS rn\n  FROM ${d.catalog}.bronze.${d.dataset.name}_raw) WHERE rn = 1;` } }),
      ({ d }) => ({ title: 'Standardise categories', goal: 'Map every category to one allowed value.', why: 'Five spellings of the same value split one group into five on the dashboard.',
        steps: [...d.dataset.columns.filter(c => c.type === 'category').map(c => `\`${c.name}\` allowed values: ${c.values!.join(', ')}.`), 'Build a small mapping table from wrong spellings to the right value.', 'Send anything unmapped to a quarantine table instead of guessing.'] }),
      ({ d }) => ({ title: 'Data quality in Lakeflow: expectations and quarantine', goal: 'Enforce quality rules in a declarative pipeline so bad data cannot reach silver.', why: 'In production, quality rules run on every load. Lakeflow Declarative Pipelines (formerly Delta Live Tables) record how many rows passed or failed each expectation, so quality is measured, not assumed.',
        steps: ['Create a Lakeflow Declarative Pipeline (Jobs & Pipelines → Create → ETL pipeline) with the SQL below.', 'Use EXPECT … ON VIOLATION DROP ROW for rules that must hold, and a separate quarantine table for rows that fail.', 'Run the pipeline and open the data quality tab: note the share of rows that failed each rule.', 'Add the expectations to your data contract.'],
        code: { lang: 'sql', text: `CREATE OR REFRESH STREAMING TABLE ${d.dataset.name}_silver (\n  CONSTRAINT valid_key EXPECT (${d.dataset.columns.find(c => c.key)!.name} IS NOT NULL) ON VIOLATION DROP ROW${d.dataset.columns.filter(c => c.type === 'number' && c.max !== undefined).slice(0, 1).map(c => `,\n  CONSTRAINT valid_${c.name} EXPECT (${c.name} BETWEEN ${c.min ?? 0} AND ${c.max}) ON VIOLATION DROP ROW`).join('')}\n) AS SELECT * FROM STREAM(${d.catalog}.bronze.${d.dataset.name}_raw);\n\nCREATE OR REFRESH STREAMING TABLE ${d.dataset.name}_quarantine AS\nSELECT *, 'failed quality rules' AS reason FROM STREAM(${d.catalog}.bronze.${d.dataset.name}_raw)\nWHERE ${d.dataset.columns.find(c => c.key)!.name} IS NULL;` } }),
      ({ d, s }) => ({ title: 'Build the silver table and pass the check', goal: `Create ${d.catalog}.silver.${d.dataset.name} and export a sample.`, why: 'Silver is the single cleaned version every gold table will use. Its export is checked automatically.',
        steps: ['Create the silver table from the cleaned view, adding load_date and source_file.', 'Export at least 100 rows as CSV (Download in the results grid).', 'Upload the export to the dataset check (activity 3). Every check must be green: no duplicate keys, no empty required values, only allowed categories, values in range.', `Columns expected: ${s.silver.columns.map(c => c.name).join(', ')}.`],
        code: { lang: 'sql', text: `CREATE OR REPLACE TABLE ${d.catalog}.silver.${d.dataset.name} AS\nSELECT *, current_date() AS load_date, _source_file AS source_file FROM deduped;` },
        submit: 'Silver export passing the dataset check (activity 3).' }),
    ],
    briefing: ({ d }) => ({ problem: `Bronze ${d.name} data has the usual problems: ${d.quality.slice(0, 3).join('; ').toLowerCase()}. Dashboards built on this would mislead.`, objective: 'Profile, cleanse and standardise the data into a silver table that passes strict checks.', outcome: `${d.catalog}.silver.${d.dataset.name} with quarantine for bad rows, and a sample that passes the dataset check.`, criteria: ['No duplicate keys', 'Only allowed category values', 'Required columns never empty'],
      check: { q: 'Two rows share the same key in bronze. What should silver contain?', options: ['One row per key, chosen by a written rule', 'Both rows', 'Neither row', 'A random row'], answer: 0, why: 'Silver must have one trusted row per key, chosen by a rule you can explain.' } }),
    lessons: () => [
      { title: 'Profiling', minutes: 8, body: 'Before cleaning, count nulls, duplicates, distinct values and out-of-range numbers. These counts are your baseline.' },
      { title: 'Deduplication', minutes: 8, body: 'ROW_NUMBER() OVER (PARTITION BY key ORDER BY load time DESC) keeps the latest version of each key.' },
      { title: 'Standardisation', minutes: 8, body: 'Map spelling variants to one allowed value, cast types, and format dates the same way everywhere.' },
      { title: 'Quality rules and quarantine', minutes: 8, body: 'CHECK constraints and expectations stop bad data; a quarantine table keeps failed rows with the reason so nothing is lost silently.' },
    ],
    quiz: () => [
      { q: 'ROW_NUMBER() with PARTITION BY key is used to…', options: ['Keep one row per key', 'Sort a dashboard', 'Create a catalog', 'Encrypt data'], answer: 0 },
      { q: 'Why quarantine bad rows instead of deleting them?', options: ['So they can be reviewed and fixed', 'To make the table bigger', 'Because delete is not allowed', 'It hides errors'], answer: 0 },
      { q: 'Which belongs in silver?', options: ['Cleaned, typed, deduplicated data', 'Raw files', 'Only KPIs', 'Dashboard images'], answer: 0 },
      { q: 'A CHECK constraint…', options: ['Rejects rows that break a rule', 'Creates a chart', 'Copies files', 'Grants permissions'], answer: 0 },
      { q: 'Category values "Sci", "science" and "SCIENCE" should become…', options: ['One allowed value', 'Three groups', 'Nulls', 'Numbers'], answer: 0 },
    ],
    evidenceCfg: ({ s }) => ({ kind: 'dataset', estMinutes: 30, schema: s.silver, accept: ['.csv', '.xlsx'], instructions: 'Upload a CSV export of your silver table (at least 100 rows). It must have no duplicate keys, no empty required values, only allowed categories and values in range.' }),
    build: ({ d }) => ({ title: 'Build: Cleansing Rulebook with AI', fields: [{ key: 'rules', label: 'Your cleansing rules', hint: `One per issue, for example ${d.quality[0].toLowerCase()}`, minWords: 30 }, { key: 'before_after', label: 'Before and after counts', hint: 'Duplicates, nulls, invalid categories', minWords: 15 }, { key: 'ai', label: 'How you used AI to write or check the SQL', hint: 'Prompt and what you changed', minWords: 20 }] }),
    proof: () => ['Silver has one row per key', 'Every category value is allowed', 'Bad rows are quarantined with a reason', 'My silver export passed the dataset check'],
    boss: () => ({ intro: 'Cleansing to silver. Choose the best action.',
      choices: ['Keep the latest row per key with ROW_NUMBER', 'Map variants to one allowed value', 'Send the row to quarantine with a reason', 'Delete the whole table', 'Leave it for the dashboard to handle'],
      scenarios: [{ s: 'The same key appears three times with small differences.', correct: [0] }, { s: 'A category has five spellings.', correct: [1] }, { s: 'A value is out of the allowed range and you cannot tell the right one.', correct: [2] }] }),
  },
  /* ── M6 Gold ── */
  {
    suffix: 'GOLD', stage: 'Stage 6 of 9 · Transformation to the gold layer', xp: 220, evidence: 'dataset', layer: 'gold',
    title: () => 'Model Business-Ready Gold Tables',
    days: [
      ({ d }) => ({ title: 'Design the dimensional model', goal: 'Choose the grain and design facts and dimensions.', why: `The gold layer turns clean ${d.name} records into the exact tables the dashboard needs, at the right level of detail (grain).`,
        steps: [`Decide the grain of the gold mart: one row per ${d.gold.columns.find(c => c.key)!.name.replace(/_/g, ' ')}.`, 'List dimensions (who, what, where, when) and facts (numbers you add up).', 'Draw a star schema: one fact table in the middle, dimensions around it.'] }),
      ({ d }) => ({ title: 'Dimensions with history: SCD Type 2', goal: 'Build dimension tables that keep history, using MERGE INTO.', why: `When attributes change (${d.enterprise.scdDimension}), reports must show the value that was true at the time. SCD Type 2 keeps every version with valid-from and valid-to dates.`,
        steps: ['Create a date dimension covering your data period.', `Build ${d.enterprise.scdDimension.split(' ')[0]} as SCD Type 2: surrogate key, business key, attributes, valid_from, valid_to, is_current.`, 'Use MERGE INTO to close the old version and insert the new one when an attribute changes (pattern below).', 'Check there is exactly one current row per business key.'],
        code: { lang: 'sql', text: `CREATE OR REPLACE TABLE ${d.catalog}.gold.dim_date AS\nSELECT d AS date, year(d) AS year, month(d) AS month, date_format(d, 'MMM') AS month_name, dayofweek(d) AS day_of_week\nFROM (SELECT explode(sequence(DATE'2025-01-01', DATE'2026-12-31', INTERVAL 1 DAY)) AS d);\n\n-- SCD Type 2 pattern: close changed rows, then insert new versions\nMERGE INTO ${d.catalog}.gold.${d.enterprise.scdDimension.split(' ')[0]} AS t\nUSING staged_changes AS s\n  ON t.business_key = s.business_key AND t.is_current = true\nWHEN MATCHED AND t.attr_hash <> s.attr_hash THEN\n  UPDATE SET t.is_current = false, t.valid_to = current_date()\nWHEN NOT MATCHED THEN\n  INSERT (business_key, attr_hash, valid_from, valid_to, is_current) VALUES (s.business_key, s.attr_hash, current_date(), NULL, true);\n-- Run a second INSERT for the new versions of changed keys.` } }),
      ({ d }) => ({ title: 'Calculate the KPIs', goal: 'Implement every KPI with its agreed formula.', why: 'Calculating KPIs once in gold means every dashboard shows the same number.',
        steps: d.kpis.map(k => `${k.name}: ${k.definition}.`) }),
      ({ d }) => ({ title: `Build the gold mart ${d.gold.name}`, goal: 'Create the business-ready table the dashboard reads, tuned for production.', why: `This one table answers "${d.problem.questions[0]}" and feeds Power BI directly. At ${d.enterprise.scale}, layout matters: liquid clustering keeps queries fast.`,
        steps: [`Create ${d.catalog}.gold.${d.gold.name} with these columns:`, ...d.gold.columns.map(colDoc), 'Use CLUSTER BY on the columns dashboards filter by most (liquid clustering), and run OPTIMIZE after large loads.', 'Check the grain: the key must be unique.'],
        code: { lang: 'sql', text: `CREATE OR REPLACE TABLE ${d.catalog}.gold.${d.gold.name}\nCLUSTER BY (${d.gold.columns.find(c => c.key)!.name})\nAS SELECT /* one row per ${d.gold.columns.find(c => c.key)!.name}; KPI columns calculated from ${d.catalog}.silver.${d.dataset.name} */ *\nFROM ${d.catalog}.silver.${d.dataset.name};\nOPTIMIZE ${d.catalog}.gold.${d.gold.name};\nSELECT COUNT(*), COUNT(DISTINCT ${d.gold.columns.find(c => c.key)!.name}) FROM ${d.catalog}.gold.${d.gold.name};` } }),
      ({ d }) => ({ title: 'Reconcile and pass the gold check', goal: 'Prove gold matches silver and export a sample.', why: 'Totals in gold must reconcile with silver, or the dashboard will be wrong in a way no one notices.',
        steps: [`Compare a total (count or sum) between ${d.catalog}.silver.${d.dataset.name} and ${d.catalog}.gold.${d.gold.name}.`, 'Export at least 50 rows of the gold mart as CSV.', 'Upload it to the dataset check (activity 3).', 'Add a comment to the gold table describing its grain and KPIs.'],
        submit: 'Gold export passing the dataset check (activity 3).' }),
    ],
    briefing: ({ d }) => ({ problem: `The ${d.name} stakeholders do not want raw records; they want ${d.kpis.slice(0, 2).map(k => k.name).join(' and ')} they can trust.`, objective: `Model a star schema and build ${d.catalog}.gold.${d.gold.name} with every KPI calculated once.`, outcome: 'A gold mart with a unique grain, reconciled with silver, ready for Power BI.', criteria: ['The grain is stated and unique', 'Every KPI uses the agreed formula', 'Totals reconcile with silver'],
      check: { q: 'What does "grain" mean for a gold table?', options: ['What one row represents', 'The file size', 'The colour scheme', 'The number of columns'], answer: 0, why: 'The grain says exactly what one row is, so counts and sums are correct.' } }),
    lessons: () => [
      { title: 'Star schema', minutes: 10, body: 'A fact table holds numbers at a chosen grain; dimension tables hold descriptive attributes. Power BI works best with this shape.' },
      { title: 'Grain', minutes: 6, body: 'Decide what one row means before building. Mixing grains (some rows per day, some per month) double-counts.' },
      { title: 'KPIs in gold', minutes: 8, body: 'Calculate KPIs once in gold so every report shows the same number. Keep the formula in the table comment.' },
      { title: 'Reconciliation', minutes: 6, body: 'Compare totals between silver and gold after every change. A difference means a join or filter is wrong.' },
    ],
    quiz: () => [
      { q: 'In a star schema, numbers you add up live in…', options: ['The fact table', 'Dimension tables', 'The volume', 'The bronze layer'], answer: 0 },
      { q: 'A date dimension is used to…', options: ['Filter and group by year, month and day', 'Store passwords', 'Ingest files', 'Delete duplicates'], answer: 0 },
      { q: 'Gold totals differ from silver totals. Most likely…', options: ['A join or filter is wrong', 'Power BI is broken', 'The data is fine', 'Bronze is too big'], answer: 0 },
      { q: 'Why calculate KPIs in gold rather than in each report?', options: ['One formula, same number everywhere', 'Reports cannot calculate', 'It is slower', 'It hides the formula'], answer: 0 },
      { q: 'The gold mart key must be…', options: ['Unique', 'Empty', 'Random', 'The same in every row'], answer: 0 },
    ],
    evidenceCfg: ({ s }) => ({ kind: 'dataset', estMinutes: 30, schema: s.gold, accept: ['.csv', '.xlsx'], instructions: 'Upload a CSV export of your gold KPI mart (at least 50 rows). The key must be unique and every KPI column present and in range.' }),
    build: ({ d }) => ({ title: 'Build: Gold Model Design', fields: [{ key: 'grain', label: 'The grain of your gold mart', hint: `What one row of ${d.gold.name} represents`, minWords: 12 }, { key: 'kpi_sql', label: 'How each KPI is calculated', hint: d.kpis.map(k => k.name).join(', '), minWords: 30 }, { key: 'reconcile', label: 'Your reconciliation result', hint: 'Silver total vs gold total', minWords: 12 }] }),
    proof: () => ['My gold mart has a unique, stated grain', 'Every KPI uses the agreed formula', 'Gold totals reconcile with silver', 'My gold export passed the dataset check'],
    boss: () => ({ intro: 'Modelling gold. Choose the best action.',
      choices: ['Fix the join so the grain stays unique', 'Calculate the KPI once in gold', 'Add a date dimension', 'Copy bronze straight into gold', 'Let each report calculate its own KPI'],
      scenarios: [{ s: 'After a join, the gold row count doubled.', correct: [0] }, { s: 'Two reports show different values for the same KPI.', correct: [1] }, { s: 'The dashboard needs a monthly trend.', correct: [2] }] }),
  },
  /* ── M7 Power BI ── */
  {
    suffix: 'POWER_BI', stage: 'Stage 7 of 9 · Power BI dashboards from the gold layer', xp: 220, evidence: 'screenshot',
    title: () => 'Build Power BI Dashboards from Gold',
    days: [
      ({ d }) => ({ title: 'Connect Power BI to Databricks', goal: 'Connect Power BI Desktop to the gold tables.', why: `Power BI reads ${d.catalog}.gold directly, so the dashboard always shows governed, cleaned numbers.`,
        steps: ['In Databricks, open SQL Warehouses → your warehouse → Connection details and copy the Server hostname and HTTP path.', 'In Power BI Desktop: Get data → Azure Databricks (or Databricks).', 'Paste the hostname and HTTP path, choose Import, and sign in (personal access token or Microsoft Entra ID). Never share the token.', `Select ${d.catalog}.gold.${d.gold.name} and the dimension tables.`] }),
      ({ d }) => ({ title: 'Model: relationships, date table and row-level security', goal: 'Build a clean star model and restrict rows by role.', why: 'Correct relationships make slicers filter every visual. Row-level security (RLS) means a regional manager sees only their region, as data protection rules expect.',
        steps: ['In Model view, connect the fact to each dimension (single direction, many-to-one).', 'Mark the date dimension as a date table.', 'Hide technical columns (_ingested_at, source_file).', 'Create row-level security roles (Modeling → Manage roles), for example one role per region with a DAX filter, and test with View as.', `Rename columns into business names for ${d.name} users.`] }),
      ({ d }) => ({ title: 'DAX measures', goal: 'Create the KPI measures in DAX.', why: 'Measures calculate on the fly for whatever the user filters, unlike calculated columns.',
        steps: [...d.dashboard.measures.map(m => `${m.name} = ${m.dax}`), 'Format each measure (%, decimals, ₹).', 'Test each measure against the number you got in gold.'] }),
      ({ d }) => ({ title: 'Build the report pages', goal: 'Build the pages stakeholders asked for.', why: `Each page answers one of the ${d.name} questions for one audience.`,
        steps: d.dashboard.pages.map(p => `Page "${p.name}": ${p.visuals.join('; ')}.`) }),
      ({ d }) => ({ title: 'Publish like an enterprise: deployment pipeline and scheduled refresh', goal: 'Make the dashboard clear, then release it safely through Dev, Test and Prod.', why: `Business users rely on the numbers every day: ${d.enterprise.sla}. That needs a controlled release path and a refresh schedule, not a file emailed around.`,
        steps: ['Use a consistent colour for each KPI, titles that state the insight, and tooltips.', 'Publish to a Dev workspace in the Power BI Service. Use a deployment pipeline (Dev → Test → Prod) to promote it after review.', `Set a scheduled refresh that meets the SLA (${d.enterprise.sla}), using a service principal or gateway credentials, never a personal password.`, 'Endorse the semantic model as Certified once reviewed. If you have no Power BI licence, export to PDF and describe the release steps instead.', 'Take a screenshot of the main page and upload it in activity 3.'],
        submit: 'Screenshot of the dashboard (activity 3).' }),
    ],
    briefing: ({ d }) => ({ problem: `${d.problem.stakeholders[0]} wants to see ${d.kpis[0].name} and act on it every week.`, objective: `Connect Power BI to ${d.catalog}.gold, model the star schema, write DAX measures and build three pages.`, outcome: 'A Power BI report answering the measurable questions from Module 1.', criteria: ['Connected to the gold layer, not to bronze or files', 'Every KPI is a DAX measure', 'Each page answers one question'],
      check: { q: 'Which layer should Power BI connect to?', options: ['Gold', 'Bronze', 'The raw volume', 'Your laptop CSV'], answer: 0, why: 'Gold holds the governed, reconciled numbers.' } }),
    lessons: () => [
      { title: 'Connecting to Databricks', minutes: 8, body: 'Power BI connects to a Databricks SQL warehouse with its server hostname and HTTP path. Import copies data into the report; DirectQuery reads it live.' },
      { title: 'Modelling in Power BI', minutes: 8, body: 'Relationships from the fact to dimensions, single direction, many-to-one. A marked date table enables time intelligence.' },
      { title: 'DAX measures', minutes: 10, body: 'Measures such as SUM, AVERAGE, DIVIDE and CALCULATE evaluate in the current filter context. Prefer measures over calculated columns for KPIs.' },
      { title: 'Dashboard design', minutes: 8, body: 'One question per page, the most important number top-left, titles that state the finding, and colour used only to highlight.' },
    ],
    quiz: () => [
      { q: 'To connect Power BI to Databricks you need…', options: ['Server hostname and HTTP path', 'The catalog password', 'The CSV file', 'Nothing'], answer: 0 },
      { q: 'DIVIDE(a, b) in DAX is preferred because it…', options: ['Handles division by zero safely', 'Is faster to type only', 'Creates a table', 'Hides data'], answer: 0 },
      { q: 'A measure differs from a calculated column because it…', options: ['Calculates for the current filters', 'Is stored per row', 'Cannot be formatted', 'Only works in Excel'], answer: 0 },
      { q: 'Why mark a date table?', options: ['To enable time intelligence', 'To change colours', 'To publish', 'To connect to Databricks'], answer: 0 },
      { q: 'A good chart title…', options: ['States the finding', 'Is always "Chart 1"', 'Is left empty', 'Lists every column'], answer: 0 },
    ],
    evidenceCfg: ({ d }) => SHOT([`The "${d.dashboard.pages[0].name}" page`, `KPIs such as ${d.dashboard.measures[0].name}`, 'At least one slicer or filter'], ['Data comes from the gold layer', 'Titles state findings', 'No access tokens or personal data are visible']),
    build: ({ d }) => ({ title: 'Build: Dashboard Specification', fields: [{ key: 'pages', label: 'Your pages and the question each answers', hint: d.dashboard.pages.map(p => p.name).join(', '), minWords: 25 }, { key: 'dax', label: 'Your DAX measures', hint: d.dashboard.measures.map(m => m.name).join(', '), minWords: 20 }, { key: 'design', label: 'Design choices', hint: 'Colours, layout, accessibility', minWords: 15 }] }),
    proof: () => ['The report connects to the gold layer', 'Every KPI is a DAX measure', 'Each page answers a measurable question', 'My screenshot shows no secrets or personal data'],
    boss: () => ({ intro: 'Building the dashboard. Choose the best action.',
      choices: ['Write a DAX measure using DIVIDE', 'Connect to the gold mart instead', 'Rewrite the title to state the finding', 'Paste the access token into the report', 'Add every column to one table visual'],
      scenarios: [{ s: 'A ratio shows an error when the denominator is zero.', correct: [0] }, { s: 'The report reads a CSV on your laptop.', correct: [1] }, { s: 'A chart is titled "Chart 3".', correct: [2] }] }),
  },
  /* ── M8 Predictive analytics: ML and AI ── */
  {
    suffix: 'ML_AI', stage: 'Stage 8 of 9 · Predictive analytics with machine learning and AI', xp: 260, evidence: 'screenshot',
    title: () => 'Predict with Machine Learning and AI',
    days: [
      ({ d }) => ({ title: `From KPI to prediction: ${d.enterprise.ml.target}`, goal: 'Frame a machine learning problem the business can act on.', why: `${d.enterprise.ml.why}. A prediction is only useful if someone acts on it before the outcome happens.`,
        steps: [`Target: \`${d.enterprise.ml.target}\` (${d.enterprise.ml.task}).`, `Candidate features: ${d.enterprise.ml.features.map(f => `\`${f}\``).join(', ')}.`, 'Check for leakage: remove any feature that is only known after the outcome.', 'Define the baseline: what would you predict without a model (the most common class, or last month’s value)?', `Choose the metric: ${d.enterprise.ml.task === 'classification' ? 'recall and precision on the class that matters, plus AUC' : 'MAE and RMSE in business units'}.`] }),
      ({ d }) => ({ title: 'Build the feature table', goal: 'Create a governed feature table in Unity Catalog.', why: 'Features computed once, in gold, are reused for training and scoring, so the model sees the same definitions in both.',
        steps: [`Create ${d.catalog}.gold.features_${d.enterprise.ml.target} from silver and gold (code below).`, 'Split by time: train on older records, test on the most recent ones, never randomly across time.', 'Record the feature definitions in the table comment.'],
        code: { lang: 'sql', text: `CREATE OR REPLACE TABLE ${d.catalog}.gold.features_${d.enterprise.ml.target}\nCOMMENT 'Features for predicting ${d.enterprise.ml.target}'\nAS SELECT ${d.enterprise.ml.features.join(', ')}, ${d.enterprise.ml.target}\nFROM ${d.catalog}.gold.${d.gold.name};` } }),
      ({ d }) => ({ title: 'Train and track with MLflow', goal: 'Train a model, track every run with MLflow and register the best one in Unity Catalog.', why: 'MLflow records data, parameters, metrics and the model for every run, so results are reproducible and auditable.',
        steps: ['Open a notebook on serverless compute and run the code below (or use Databricks AutoML for a first baseline).', 'Compare at least two runs in the MLflow experiment and keep the better one on the test set.', `Register it in Unity Catalog as ${d.catalog}.gold.${d.enterprise.ml.target}_model.`],
        code: { lang: 'python', text: `import mlflow\nfrom sklearn.model_selection import train_test_split\nfrom sklearn.ensemble import ${d.enterprise.ml.task === 'classification' ? 'RandomForestClassifier' : 'RandomForestRegressor'} as Model\nmlflow.set_registry_uri('databricks-uc')\nmlflow.autolog()\npdf = spark.table('${d.catalog}.gold.features_${d.enterprise.ml.target}').toPandas()\nX = pd.get_dummies(pdf[${JSON.stringify(d.enterprise.ml.features)}]); y = pdf['${d.enterprise.ml.target}']\nX_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, shuffle=False)\nwith mlflow.start_run(run_name='baseline'):\n    model = Model(n_estimators=200, random_state=42).fit(X_train, y_train)\n    mlflow.sklearn.log_model(model, 'model', registered_model_name='${d.catalog}.gold.${d.enterprise.ml.target}_model', input_example=X_train.head(5))` } }),
      ({ d }) => ({ title: 'Batch scoring and AI/BI Genie', goal: 'Write predictions back to gold every day and let business users ask questions in plain English.', why: `Predictions must land where people work: in ${d.catalog}.gold, on the dashboard and in the daily job that meets the SLA.`,
        steps: ['Load the registered model and batch score the latest data (code below); write the result to a gold scoring table.', 'Add the scoring task to the daily job after the gold build.', `Create an AI/BI Genie space on ${d.catalog}.gold tables and ask: "${d.problem.questions[0]}"`, 'Check Genie’s SQL before trusting the answer.'],
        code: { lang: 'python', text: `import mlflow\nmodel_uri = 'models:/${d.catalog}.gold.${d.enterprise.ml.target}_model@champion'  # set the champion alias in Catalog Explorer\nscore = mlflow.pyfunc.spark_udf(spark, model_uri)\n(spark.table('${d.catalog}.gold.features_${d.enterprise.ml.target}')\n  .withColumn('prediction', score(*[c for c in ${JSON.stringify(d.enterprise.ml.features)}]))\n  .write.mode('overwrite').saveAsTable('${d.catalog}.gold.predictions_${d.enterprise.ml.target}'))` } }),
      ({ d }) => ({ title: 'Responsible AI: bias, fairness, explainability and monitoring', goal: 'Prove the model is fair, explainable and watched in production.', why: `Decisions about ${d.entity}s affect real people. ${d.enterprise.regulations[0]} and good practice require that automated decisions are explainable and do not treat groups unfairly.`,
        steps: ['Compare model performance across groups (for example region or category) to check for bias and fairness gaps.', 'Explain predictions with feature importance (or SHAP) and write the top three drivers in plain words.', 'Add drift monitoring on the feature and prediction tables and alert when it moves.', 'Write a one-page model card: purpose, data, metrics, limits, fairness results, owner.', 'Take a screenshot of the MLflow run and the registered model in Unity Catalog and upload it in activity 3.'],
        submit: 'Screenshot of the MLflow run and registered model (activity 3).' }),
    ],
    briefing: ({ d }) => ({ problem: `${d.enterprise.ml.why}. The dashboard shows what happened; the business now wants to know what will happen.`, objective: `Build, track, register and batch-score a ${d.enterprise.ml.task} model for \`${d.enterprise.ml.target}\`, responsibly.`, outcome: 'A registered model in Unity Catalog, daily predictions in gold, a Genie space and a model card.', criteria: ['No leakage, time-based split, a baseline beaten', 'Every run tracked in MLflow', 'Bias, explainability and drift monitoring documented'],
      check: { q: 'Why split training and test data by time rather than randomly?', options: ['So the test mimics predicting the future', 'Random splits are not allowed', 'It makes training faster', 'MLflow requires it'], answer: 0, why: 'In production the model always predicts records newer than its training data.' } }),
    lessons: ({ d }) => [
      { title: 'Framing an ML problem', minutes: 8, body: `Pick a target the business can act on before it happens, features known at prediction time, a baseline and a metric. Here the target is ${d.enterprise.ml.target}.` },
      { title: 'MLflow and Unity Catalog models', minutes: 8, body: 'MLflow tracks parameters, metrics and artefacts for every run. Registering the model in Unity Catalog (catalog.schema.model) gives versioning, aliases such as champion, permissions and lineage.' },
      { title: 'Batch scoring and Genie', minutes: 8, body: 'Batch scoring applies the model to new data on a schedule and writes predictions to a table. AI/BI Genie lets business users ask questions of governed tables in plain English; always review its SQL.' },
      { title: 'Responsible AI', minutes: 8, body: 'Check performance by group (fairness), explain the main drivers, monitor drift, keep a human in the loop for high-impact decisions and document it all in a model card.' },
    ],
    quiz: () => [
      { q: 'Leakage means…', options: ['A feature uses information only known after the outcome', 'The model is too small', 'Data is encrypted', 'The table has no comment'], answer: 0 },
      { q: 'mlflow.autolog() records…', options: ['Parameters, metrics and the model for each run', 'Only the code', 'User passwords', 'Dashboard colours'], answer: 0 },
      { q: 'A model registered in Unity Catalog is named…', options: ['catalog.schema.model', 'model.pkl', 'gold/model', 'Any file name'], answer: 0 },
      { q: 'Why monitor drift?', options: ['Data changes over time and accuracy can drop', 'To make the job faster', 'To create new catalogs', 'It is not needed'], answer: 0 },
      { q: 'A fairness check compares…', options: ['Model performance across groups', 'Two dashboards', 'File sizes', 'SQL warehouses'], answer: 0 },
    ],
    evidenceCfg: ({ d }) => SHOT([`The MLflow experiment run with metrics for ${d.enterprise.ml.target}`, `The registered model ${d.catalog}.gold.${d.enterprise.ml.target}_model in Catalog Explorer`], ['Metrics are visible', 'The model is registered in Unity Catalog', 'No access tokens or personal data are visible']),
    build: ({ d }) => ({ title: 'Build: Model Card', fields: [{ key: 'purpose', label: 'Purpose and decision supported', hint: d.enterprise.ml.why, minWords: 20 }, { key: 'performance', label: 'Metrics vs baseline', hint: d.enterprise.ml.task === 'classification' ? 'Recall, precision, AUC' : 'MAE, RMSE', minWords: 20 }, { key: 'fairness', label: 'Fairness, explainability and limits', hint: 'Group comparison, top drivers, known limits', minWords: 30 }] }),
    proof: () => ['My split is by time and I removed leaky features', 'Every run is tracked in MLflow and the model is registered in Unity Catalog', 'Predictions are written to gold by a scheduled task', 'My model card covers fairness, explainability and monitoring'],
    boss: () => ({ intro: 'Putting a model into production. Choose the best action.',
      choices: ['Remove the feature that is only known afterwards', 'Compare performance across groups before release', 'Add drift monitoring and an alert', 'Ship the model without a baseline', 'Train on the test set to get a better score'],
      scenarios: [{ s: 'A feature looks perfect, but it is recorded after the outcome.', correct: [0] }, { s: 'The model will affect decisions about people in every region.', correct: [1] }, { s: 'Six months after release, input data has changed shape.', correct: [2] }] }),
  },
  /* ── M9 Capstone ── */
  {
    suffix: 'CAPSTONE', stage: 'Stage 9 of 9 · Capstone: insight, lineage and presentation', xp: 300, evidence: 'screenshot',
    title: d => `Capstone: ${d.problem.title}`,
    days: [
      ({ d }) => ({ title: 'Find the insight', goal: 'Answer your measurable questions with evidence from the dashboard.', why: `The capstone proves you can take ${d.name} data from raw to a decision.`,
        steps: [...d.problem.questions.map(q => `Answer with a number and a chart: ${q}`), `Example of the kind of insight expected: ${d.insight}`] }),
      ({ d }) => ({ title: 'Recommendations', goal: 'Turn insights into decisions for each stakeholder.', why: 'An insight without a recommended action is a fact, not value.',
        steps: [...d.problem.decisions.map(x => `Recommend: ${x}.`), 'Estimate the impact of each recommendation (with the KPI it moves).', 'Note the risks and what data would make you more confident.'] }),
      ({ d }) => ({ title: 'Productionise: Jobs, Asset Bundles, monitoring and lineage', goal: 'Turn notebooks into a scheduled, monitored, version-controlled production pipeline.', why: `A pipeline that someone runs by hand is not production. ${d.enterprise.sla} needs a scheduled job, alerts and code that is deployed the same way every time.`,
        steps: ['Create a Databricks job (Jobs & Pipelines → Create → Job) with tasks: bronze ingestion → silver pipeline → gold build → Power BI refresh.', `Schedule it to meet the SLA (${d.enterprise.sla}) and add email alerts on failure.`, 'Put the SQL, notebooks and job definition in Git and describe them in a Databricks Asset Bundle (databricks.yml) with dev and prod targets, so CI deploys the same code to both.', `Open ${d.catalog}.gold.${d.gold.name} in Catalog Explorer → Lineage and check it shows bronze → silver → gold.`, 'Take a screenshot of the lineage graph and upload it in activity 3.'],
        code: { lang: 'yaml', text: `# databricks.yml (Databricks Asset Bundle)\nbundle:\n  name: ${d.catalog}_pipeline\ntargets:\n  dev:\n    mode: development\n    default: true\n  prod:\n    mode: production\nresources:\n  jobs:\n    ${d.catalog}_daily:\n      name: ${d.catalog} daily refresh\n      schedule: { quartz_cron_expression: '0 0 5 * * ?', timezone_id: Asia/Kolkata }\n      email_notifications: { on_failure: [data-team@example.com] }\n      tasks:\n        - task_key: bronze\n        - task_key: silver\n          depends_on: [{ task_key: bronze }]\n        - task_key: gold\n          depends_on: [{ task_key: silver }]` },
        submit: 'Screenshot of the lineage graph (activity 3).' }),
      ({ d }) => ({ title: 'Runbook, monitoring and the presentation', goal: 'Document how to run and support the solution, then prepare the story.', why: `${d.problem.stakeholders[0]} will ask who fixes it at 6 am when it fails. A runbook answers that before go-live.`,
        steps: ['Write a runbook: what the pipeline does, schedule, owners, how to rerun a failed task, how to backfill a day, who to call, and known issues.', 'Add monitoring: a row-count and freshness check on gold, with an alert if the SLA is missed.', 'Slides: problem, questions, data, architecture (bronze, silver, gold), quality, model, dashboard, insights, recommendations, production setup.', 'Record a 3–5 minute demo video of the dashboard and the job run.'] }),
      ({ d }) => ({ title: 'Go-live readiness review and capstone viva', goal: 'Pass a production go-live review and submit the full solution.', why: 'This is your portfolio piece: an end-to-end, production-grade domain solution employers can see.',
        steps: [`Go-live checklist — SLA met (${d.enterprise.sla}); quality expectations passing; PII masked (${d.enterprise.piiColumns.join(', ')}); access by groups only; job scheduled with alerts; runbook written; cost reviewed; owner named.`, `Compliance check against: ${d.enterprise.regulations.join('; ')}.`, 'Put the README, SQL, bundle, runbook, slides and demo link in one public folder or repository.', 'Submit the proof link in activity 5 and complete the capstone boss challenge.', `Celebrate: you took ${d.problem.title} from raw data to a production-ready solution.`],
        submit: 'Proof link to your complete capstone (activity 5).' }),
    ],
    briefing: ({ d }) => ({ problem: `Present your end-to-end solution for ${d.problem.title} to ${d.problem.stakeholders.slice(0, 2).join(' and ')}.`, objective: 'Answer the questions with evidence, recommend decisions, show lineage and present the solution.', outcome: 'A capstone package: README, SQL, dashboard, slides and demo video.', criteria: ['Every question answered with a number and a chart', 'Recommendations tied to KPIs', 'Lineage from bronze to gold shown'],
      check: { q: 'What makes a capstone recommendation strong?', options: ['It names the action, the KPI it moves and the evidence', 'It is long', 'It uses many colours', 'It avoids numbers'], answer: 0, why: 'Decision-makers need the action, its impact and the proof.' } }),
    lessons: () => [
      { title: 'From insight to recommendation', minutes: 8, body: 'State the finding with a number, explain why it matters, recommend one action and the KPI it should move.' },
      { title: 'Lineage', minutes: 6, body: 'Unity Catalog records lineage automatically: which tables and columns feed each table, across bronze, silver and gold.' },
      { title: 'Storytelling', minutes: 8, body: 'Lead with the answer, then the evidence. One message per slide. End with the decision you want.' },
      { title: 'Handling questions', minutes: 6, body: 'Expect "how do you know this is right?" Answer with reconciliation results, quality rules and lineage.' },
    ],
    quiz: () => [
      { q: 'A strong insight statement includes…', options: ['A number, a comparison and why it matters', 'Only a chart', 'Only the tool name', 'Every column'], answer: 0 },
      { q: 'Lineage shows…', options: ['Which tables feed which', 'Who logged in', 'The dashboard theme', 'Passwords'], answer: 0 },
      { q: 'The first slide of the story should be…', options: ['The answer or problem', 'The tool list', 'Your SQL code', 'A thank-you slide'], answer: 0 },
      { q: 'How do you answer "is this number right?"', options: ['Reconciliation, quality rules and lineage', '"Trust me"', 'Show the colours', 'Change the number'], answer: 0 },
      { q: 'Which belongs in the capstone README?', options: ['Problem, sources, layers, KPIs and refresh steps', 'Your passwords', 'Nothing', 'Only screenshots'], answer: 0 },
    ],
    evidenceCfg: ({ d }) => SHOT([`Unity Catalog lineage for ${d.catalog}.gold.${d.gold.name}`, 'The path from bronze through silver to gold'], ['Bronze, silver and gold tables appear in the graph', 'The gold mart is the end of the path', 'No secrets are visible']),
    build: ({ d }) => ({ title: 'Build: Executive Summary with AI', fields: [{ key: 'insights', label: 'Your three main insights', hint: d.problem.questions.join(' | '), minWords: 40 }, { key: 'recommendations', label: 'Recommendations and expected impact', hint: d.problem.decisions.join(' | '), minWords: 30 }, { key: 'limits', label: 'Limits of your analysis', hint: 'Synthetic data, assumptions, next steps', minWords: 20 }] }),
    proof: () => ['Every question is answered with a number and a chart', 'Recommendations are tied to KPIs', 'Lineage from bronze to gold is shown', 'My folder has README, SQL, slides and demo'],
    boss: ({ d }) => ({ intro: `The capstone review for ${d.problem.title}. Choose the best response.`,
      choices: ['Show the reconciliation and lineage', 'Lead with the answer, then the evidence', 'Tie the recommendation to the KPI it moves', 'Say the data is probably fine', 'Add more charts'],
      scenarios: [{ s: 'A stakeholder asks how you know the KPI is correct.', correct: [0] }, { s: 'Your first slide is a list of tools.', correct: [1] }, { s: 'Your recommendation has no expected impact.', correct: [2] }] }),
  },
];

/* ───────────── journey assembly ───────────── */

function dayMarkdown(d: DomainSpec, stage: string, n: number, x: ReturnType<ModuleTemplate['days'][number]>): string {
  const parts = [
    `# Day ${n} — ${x.title}`, '',
    `**Domain:** ${d.name} · **Problem:** ${d.problem.title}`, '',
    `**${stage}**`, '',
    '## Goal', x.goal, '',
    `## Why it matters for ${d.name}`, x.why, '',
    '## Steps', numbered(x.steps), '',
  ];
  if (x.code) parts.push('## Code', '```' + x.code.lang, x.code.text, '```', '');
  if (x.prompt) parts.push('## AI prompt (copy)', '```text', x.prompt, '```', '');
  if (x.submit) parts.push('## What to submit', x.submit, '');
  parts.push('## Check yourself', `Can you explain today’s work in two sentences to ${d.problem.stakeholders[0].toLowerCase()}?`);
  return parts.join('\n');
}

export function buildDomainJourney(d: DomainSpec): DomainJourney {
  const schemas = { dataset: rawSchema(d), silver: silverSchema(d), gold: d.gold };
  const c: Ctx = { d, s: schemas };
  const levels: LevelRow[] = MODULE_PLAN.map((m, i) => {
    const n = i + 1; const code = `${d.code}_M${n}_${m.suffix}`; const x = xpSplit(m.xp); const seed = `${d.slug}:${n}`;
    const b = m.briefing(c);
    const bossSpec = m.boss(c);
    const days = m.days.map((fn, k) => { const day = i * 5 + k + 1; const r = fn(c); return { day, title: r.title, body: dayMarkdown(d, m.stage, day, r) }; });
    const evidenceTitle = m.evidence === 'dataset' ? `Dataset Check: ${m.layer === 'gold' ? 'Gold KPI Mart' : m.layer === 'silver' ? 'Silver Table' : 'Structured Dataset'}` : 'Screenshot Evidence';
    const activities: ActivityRow[] = [
      { idx: 1, code: 'MISSION_BRIEFING', title: `Mission Briefing: ${m.title(d)}`, xp: x.briefing, config: { kind: 'briefing', estMinutes: 10, problem: b.problem, objective: b.objective, outcome: b.outcome, criteria: b.criteria, check: shuffleQ(b.check, seed) } },
      { idx: 2, code: 'LEARN', title: `Learn: ${m.title(d)}`, xp: x.learn, config: { kind: 'learn', estMinutes: 40, passPct: 60, lessons: m.lessons(c), resources: [], quiz: m.quiz(c).map(q => shuffleQ(q, seed)) } },
      { idx: 3, code: m.evidence === 'dataset' ? 'DATASET_CHECK' : 'SCREENSHOT_EVIDENCE', title: evidenceTitle, xp: x.evidence, config: m.evidenceCfg(c) },
      { idx: 4, code: 'BUILD', title: m.build(c).title, xp: x.build, config: { kind: 'build', estMinutes: 60, tools: ['ChatGPT', 'Gemini', 'Claude', 'Microsoft Copilot', 'Databricks Assistant', 'No AI tool'], fields: m.build(c).fields, iterations: 0, iterationRules: { promptMinWords: 10, outputMinWords: 15, changeMinWords: 10, maxSimilarity: 0.85 } } },
      { idx: 5, code: 'SUBMIT_PROOF', title: `Submit Proof: ${m.title(d)}`, xp: x.proof, config: { kind: 'proof', estMinutes: 15, minWords: 50, evidenceTypes: ['Public folder or repository link (GitHub, Google Drive, OneDrive)', 'Databricks notebook export or SQL file link', 'Power BI publish link or video walkthrough'], checklist: m.proof(c) } },
      { idx: 6, code: 'EVALUATION_BOSS', title: `Boss Challenge: ${m.title(d)}`, xp: x.boss, config: (() => {
        const order = bossSpec.choices.map((_, k) => k).sort((a, z) => { const r = seeded(seed + 'boss' + a + z)(); return r - 0.5; });
        return { kind: 'boss', estMinutes: 25, rubric: `DOMAIN_M${n}_RUBRIC`, attempts: 3, xpSplit: { base: x.bossBase, bossBonus: x.bossBonus }, intro: bossSpec.intro, choices: order.map(k => bossSpec.choices[k]), scenarios: bossSpec.scenarios.map(s => ({ s: s.s, correct: s.correct.map(cc => order.indexOf(cc)) })), minWhyWords: 6 };
      })() },
    ];
    return { idx: n, code, title: m.title(d), summary: `${m.stage.replace(/^Stage \d of \d · /, '')} for ${d.problem.title}.`, xp: m.xp, days, activities };
  });
  return {
    slug: `da-${d.slug}`,
    title: `Data Analytics · ${d.name}: ${d.problem.title}`,
    description: `45 days, 9 modules: solve "${d.problem.title}" end to end with Databricks, Unity Catalog, the medallion architecture and Power BI.`,
    config: { family: DOMAIN_FAMILY, domain: d.slug, code: d.code, name: d.name, problem: d.problem.title, catalog: d.catalog },
    schemas, levels,
  };
}

/* ───────────── registration ───────────── */

type RegJourney = { slug: string; title: string; config: unknown; [k: string]: unknown };
export function groupRegistrationJourneys<T extends RegJourney>(list: T[]) {
  const isDomain = (j: T) => !!j.config && typeof j.config === 'object' && (j.config as { family?: string }).family === DOMAIN_FAMILY;
  const domains = list.filter(isDomain).map(j => { const c = j.config as DomainJourney['config']; return { ...j, name: c.name, domain: c.domain, problem: c.problem }; })
    .sort((a, b) => a.name.localeCompare(b.name));
  return { general: list.filter(j => !isDomain(j)), domains };
}
