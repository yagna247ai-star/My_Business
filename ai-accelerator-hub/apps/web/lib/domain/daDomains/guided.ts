/**
 * Guided steps for the domain journeys (all 23): concept → do → check → points, per step.
 * Module suffix → day index (0–4) → steps. Days without an entry keep their plain step list for now.
 * Written once here; every journey gets them with its own problem, people, KPIs, tables and columns.
 */
import type { DomainSpec } from './types';
import type { GuidedStep } from '../guidedSteps';
import { labCols, DIALECTS, checkInstall, createDatabase, ddl, loadCsv, checkData, copyClean, kpiQueries, excelKpiFormulas, excelDailyFormulas } from './dataLab';

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const perDb = (fn: (x: (typeof DIALECTS)[number]['id']) => string) => DIALECTS.map(d => `-- ${d.name}\n${fn(d.id)}`).join('\n\n');
type Gen = (d: DomainSpec) => GuidedStep[];

export const GUIDED: Record<string, Record<number, Gen>> = {
  FRAMING: {
    0: d => [
      { title: 'Read the problem like an analyst', concept: `Every analytics project starts from a decision someone must make, not from data. In ${d.name}, the decision here is: ${d.problem.decisions[0].toLowerCase()}. The nouns in the problem (people, places, events, amounts) are the things your data will describe.`,
        do: ['Read the problem statement at the top of this page twice.', `Underline every noun that could become data, for example ${d.entity}.`], check: { kind: 'answer', prompt: 'List five nouns from the problem that could become data, and what each one would record', hint: `${d.entity}, ${d.kpis[0].name.toLowerCase()}` } },
      { title: 'Who decides what', concept: 'A stakeholder is anyone who acts on your result. If you do not know who decides what, you will build a report nobody uses.', do: [`For each stakeholder (${d.problem.stakeholders.join(', ')}), write the one decision they make with your work.`],
        check: { kind: 'answer', prompt: 'Name each stakeholder and the decision they make', hint: d.problem.stakeholders.join(', ') } },
      { title: 'The outcome in one sentence', concept: 'If you cannot say what changes when the problem is solved, you cannot measure success. One sentence keeps the whole project honest.', do: ['Complete this sentence: “If this works, … will change from … to …”.'],
        check: { kind: 'answer', prompt: 'What changes if this problem is solved', hint: d.problem.title } },
      { title: 'What you do not know yet', concept: 'Good analysts write down their unknowns on Day 1 and answer them on purpose later, instead of guessing.', do: ['Write three questions about this business that you cannot answer yet.'],
        check: { kind: 'answer', prompt: 'Three things you do not yet know about this business' } },
    ],
    1: d => [
      { title: 'Measure, period, breakdown', concept: 'A question data can answer has three parts: a measure (what you count), a period (when) and a breakdown (by what). “Are we doing badly?” has none; two analysts would answer it differently.',
        do: [`Take this question: “${d.problem.questions[0]}”.`, 'Mark its measure, its period and its breakdown.'], check: { kind: 'answer', prompt: 'The measure, the period and the breakdown in the first question', hint: d.problem.questions[0] } },
      { title: 'Rewrite a vague question', concept: 'Stakeholders ask vague questions. Your job is to turn them into precise ones and check the new wording with them.', do: [`Rewrite this vague question so it has a measure, a period and a breakdown: “Is ${d.problem.title.toLowerCase()} getting worse?”`],
        check: { kind: 'answer', prompt: `A measurable version of “is ${d.problem.title.toLowerCase()} getting worse”`, hint: d.problem.questions[1] ?? d.problem.questions[0] } },
      { title: 'Your own question', concept: 'The best questions often come from the people closest to the work. Asking one yourself shows you understand the business.', do: [`Write one more question that ${d.problem.stakeholders[0].toLowerCase()} would ask, with a measure, a period and a breakdown.`],
        check: { kind: 'answer', prompt: `A measurable question ${d.problem.stakeholders[0].toLowerCase()} would ask` } },
      { title: 'Can data answer it?', concept: 'A question with no data source cannot be answered, however good it is. Drop it or find the source now, not in week 5.', do: ['For each question, name the source that would answer it. Cross out any question with no source.'], check: { kind: 'tick', prompt: 'Every question I kept has a data source' } },
    ],
    2: d => [
      { title: 'The KPI tree', concept: 'A KPI is a number tied to a goal, with one fixed formula. A KPI tree puts the main outcome at the top and the drivers that move it underneath, so everyone sees how the numbers connect.',
        do: ['Put the main outcome at the top of a page.', ...d.kpis.map(k => `Under it, add ${k.name}: ${k.definition}.`)], check: { kind: 'answer', prompt: 'Your KPI tree: the top outcome and each KPI with its formula', hint: d.kpis.map(k => k.name).join(', ') } },
      { title: 'Columns for each KPI', concept: 'Every formula needs columns. Listing them now tells you exactly what data to collect in Module 2.', do: ['Under each KPI, write the columns you need to calculate it.'],
        check: { kind: 'answer', prompt: 'The columns each KPI needs', hint: d.dataset.columns.map(c => c.name).slice(0, 5).join(', ') } },
      { title: 'The business case', concept: 'Projects get funded when they move a KPI by a known amount worth known money. Estimate honestly and write every assumption down; never invent facts.', do: ['Write which KPI moves, by how much, and what that is worth, with your assumptions.'],
        check: { kind: 'answer', prompt: 'Your business case: which KPI moves, by how much, what it is worth, and your assumptions', hint: d.kpis[0].name } },
      { title: 'Service level and scale', concept: `A service level (SLA) is a promise of when the data is ready. Here: ${d.enterprise.sla}. Production scale (${d.enterprise.scale}) decides how you build it.`, do: ['Write the SLA and the production scale at the bottom of your KPI page.'], check: { kind: 'tick', prompt: 'My KPI page shows the SLA and the production scale' } },
    ],
    3: d => [
      { title: 'Three kinds of data', concept: 'Structured data has fixed columns (a register), semi-structured data has nested tags (JSON, XML), unstructured data has no fixed shape (notes, photos). Real problems need all three.',
        do: [...d.sources.structured.map(s => `Structured: ${s.name}.`), ...d.sources.semi.map(s => `Semi-structured (${s.format}): ${s.name}.`), ...d.sources.unstructured.map(s => `Unstructured: ${s.name}.`)], check: { kind: 'answer', prompt: 'Each source labelled structured, semi-structured or unstructured', hint: `${d.sources.structured[0].name} structured, ${d.sources.semi[0].name} semi-structured` } },
      { title: 'A data contract', concept: 'A data contract is an agreement with a source owner: which columns and types arrive, when, with which quality rules, and whom to call when it breaks. It stops pipelines failing silently.', do: [`Write one contract for ${d.sources.structured[0].name}: owner, columns and types, refresh time, quality rules, and the contact when it breaks.`],
        check: { kind: 'answer', prompt: `Your data contract for ${d.sources.structured[0].name}: owner, columns and types, refresh time, quality rules, contact`, hint: 'owner, columns, refresh time, quality rules' } },
      { title: 'Personal data', concept: `Personal data must be protected from the start. In production here that means ${d.enterprise.piiColumns.join(', ')}, which will be masked downstream.`, do: ['Mark every source that holds personal data.'], check: { kind: 'answer', prompt: 'Which sources hold personal data, and which columns', hint: d.enterprise.piiColumns.join(', ') } },
    ],
    4: d => [
      { title: 'The one-page canvas', concept: 'A problem canvas puts everything on one page: problem, stakeholders and decisions, questions, KPIs and SLA, data sources, and compliance. It is what you show on Day 1 of any real project.',
        do: ['Draw six boxes: Problem, Stakeholders and decisions, Questions, KPIs and SLA, Data sources, Compliance.', `Fill them in for ${d.problem.title}.`], check: { kind: 'tick', prompt: 'All six boxes are filled in' } },
      { title: 'Compliance', concept: `Projects that ignore regulation get stopped by legal. These apply here: ${d.enterprise.regulations.join('; ')}.`, do: ['Write the regulations in the Compliance box, and add: synthetic data only for this course.'], check: { kind: 'answer', prompt: 'The regulations that apply and what each means for your project', hint: d.enterprise.regulations[0] } },
      { title: 'Show your canvas', concept: 'A clear screenshot is your evidence; it is also what a reviewer reads first.', do: ['Take a clear screenshot of the whole canvas.'], check: { kind: 'screenshot', prompt: 'Your problem canvas, readable, with no real personal data' } },
    ],
  },
  COLLECTION: {
    0: d => [
      { title: 'Plan the three files', concept: `${d.problem.title} needs a table, a semi-structured feed and free-text notes. Planning which fields you need for your KPIs keeps the data small and useful.`, do: ['Write the fields you need from each source for your KPIs, and which you can leave out.'], check: { kind: 'answer', prompt: 'The fields you need from each source, and why', hint: d.dataset.columns.slice(0, 4).map(c => c.name).join(', ') } },
      { title: 'Make the JSON file', concept: 'JSON stores records with nested objects and arrays. One object per line (JSON Lines) is how apps and APIs usually send it.', do: ['Copy AI prompt 1 from the lesson into ChatGPT, Gemini or Claude.', 'Save the answer as a .json file, one object per line.'],
        check: { kind: 'paste', prompt: 'Paste the first record of your JSON file', pattern: '^\\s*[\\[{]', sample: '{"id": "…", "…": {…}}', fail: 'A JSON record starts with { (or [ for a list). Paste the first line of your file.' } },
      { title: 'Make the text notes', concept: 'Unstructured notes often explain why the numbers move. Tags (a reason, a sentiment, an issue type) turn them into something you can count.', do: ['Run AI prompt 2 and save the notes as a .txt file, one per line.', 'Read them and choose five tags.'], check: { kind: 'answer', prompt: 'Your five tags and one note that shows each', hint: 'reason, sentiment, issue type' } },
    ],
    1: d => { const c = labCols(d); const header = d.dataset.columns.map(x => x.name).join(','); return [
      { title: 'Create the CSV', concept: 'CSV is plain text: one line per row, commas between values, and the first line is the header. If the header is wrong, every later step breaks.', do: ['Copy the AI prompt from the lesson and ask for CSV only.', `Paste it into Notepad (Windows) or TextEdit in plain-text mode (Mac) and save as ${c.table}.csv with UTF-8.`],
        check: { kind: 'paste', prompt: 'Paste the first line (the header) of your CSV', pattern: `^\\s*${esc(header)}\\s*$`, sample: header, fail: `The header must be exactly: ${header}` } },
      { title: 'Load it into Excel', concept: 'Opening a CSV by double-clicking can change dates and drop leading zeros. Data → From Text/CSV loads it safely and lets you set each column’s type.', do: ['Excel: Data → Get Data → From Text/CSV (Mac: File → Import).', 'File origin 65001 UTF-8, delimiter Comma, then Transform Data.', `Set ${c.key.name} to Text, ${c.date.name} to Date, ${c.num.name} to Decimal, then Close & Load.`, `Rename the table to tbl_${c.table} (Table Design → Table Name).`],
        check: { kind: 'screenshot', prompt: `Excel with tbl_${c.table} loaded and its name visible` } },
      { title: 'Count the rows', concept: 'The row count is your first check: SQL must give the same number on Day 10. A different number means rows were lost or duplicated.', do: [`Click the ${c.key.name} column header and read Count in the status bar.`],
        check: { kind: 'paste', prompt: 'How many rows does your table have?', pattern: '^\\s*\\d{3,}\\s*$', sample: '120', fail: 'Type the row count as a number. It should be at least 100.' } },
    ]; },
    2: d => { const c = labCols(d); const k = excelKpiFormulas(c); const dd = excelDailyFormulas(c); return [
      { title: 'A formula for every KPI', concept: 'A KPI calculated with a formula can be checked and repeated; a number typed by hand cannot. COUNTIFS, SUMIFS and AVERAGEIFS calculate under conditions.', do: ['Add a sheet named KPIs.', ...k.slice(0, 4).map(f => `${f.label}: ${f.formula}`), ...d.kpis.map(x => `Your KPI ${x.name}: ${x.definition}. Write its formula.`)],
        check: { kind: 'screenshot', prompt: 'Your KPIs sheet with Formulas → Show Formulas turned on' } },
      { title: 'The per-day table', concept: 'Looking per day shows patterns that totals hide: a bad Monday, a spike after a holiday. UNIQUE and SORT list the days; COUNTIFS and AVERAGEIFS fill them in.', do: ['Add a sheet named Daily and type these into row 2:', ...dd.map(f => `${f.cell}: ${f.formula} (${f.meaning})`), 'Insert a line chart of rows per day.'],
        check: { kind: 'screenshot', prompt: 'Your Daily sheet and its line chart' } },
      { title: 'Find out why', concept: 'A number only matters when you can explain it. FILTER lists the rows of the worst day; COUNTIFS with two conditions breaks it down by category; a PivotTable shows it all at once.', do: [`Find the day that stands out, then break it down by ${c.cat.name} with COUNTIFS and FILTER.`],
        check: { kind: 'answer', prompt: `Which day stood out, which ${c.cat.name} drove it, and how your formulas show it`, hint: `${c.date.name}, ${c.cat.name}` } },
    ]; },
    3: d => { const c = labCols(d); return [
      { title: 'Choose and install a database', concept: 'A database keeps structured data safely, for many users, at any size. MySQL and PostgreSQL are servers you install; SQLite is a single file; PGlite runs in your browser. All four speak SQL.', do: ['Pick one database (SQLite or PGlite if unsure) and install it with the steps in the lesson.', 'Run the check for your database:'], code: { lang: 'sql', text: perDb(checkInstall) },
        check: { kind: 'paste', prompt: 'Paste the version line your database printed', pattern: '\\d+\\.\\d+', sample: 'PostgreSQL 16.4 … / 8.0.39 / 3.45.1', fail: 'That does not show a version number. Run the check command and paste what it printed.' } },
      { title: `Create the ${c.db} database`, concept: 'A database groups your tables, like a folder. Keeping each project in its own database keeps names and permissions clean.', do: ['Run the statements for your database:'], code: { lang: 'sql', text: perDb(x => createDatabase(x, c)) },
        check: { kind: 'paste', prompt: 'Paste the output that shows your current database', pattern: esc(c.db), sample: c.db, fail: `The output should name your database, ${c.db}.` } },
      { title: 'Write the DDL', concept: `DDL (CREATE TABLE) defines tables. ${c.table}_raw keeps every value as text so the CSV always loads; ${c.table} has real types, a primary key and the allowed values, so bad data cannot get in.`, do: ['Run the DDL for your database from the lesson, then describe the clean table.'], code: { lang: 'sql', text: perDb(x => ddl(x, c).split('\n-- 3.')[0]) },
        check: { kind: 'paste', prompt: `Paste the description of ${c.table} (DESCRIBE / \\d / .schema)`, pattern: `(?=[\\s\\S]*${esc(c.key.name)})(?=[\\s\\S]*${esc(c.num.name)})`, sample: `${c.key.name} … ${c.num.name} …`, fail: `The description should list your columns, including ${c.key.name} and ${c.num.name}.` } },
    ]; },
    4: d => { const c = labCols(d); return [
      { title: 'Load the CSV', concept: 'Loading moves your file into the database. The raw table accepts everything as text, so even messy rows arrive and can be checked with SQL.', do: [`Load ${c.table}.csv into ${c.table}_raw with the command for your database, then count the rows.`], code: { lang: 'sql', text: perDb(x => loadCsv(x, c)) },
        check: { kind: 'paste', prompt: `Paste the result of SELECT COUNT(*) FROM ${c.table}_raw`, pattern: '\\b\\d{3,}\\b', sample: '122', fail: 'Paste the count. It should be at least 100 and match your Excel count from Day 7.' } },
      { title: 'Find the problems with SQL', concept: 'GROUP BY with HAVING COUNT(*) > 1 finds duplicate keys; a pattern test finds typos in number columns. Measuring problems first tells you what cleaning must fix.', do: ['Run the check queries from the lesson.'], code: { lang: 'sql', text: checkData('postgres', c) },
        check: { kind: 'answer', prompt: 'How many duplicate keys and bad values you found, and in which columns', hint: `${c.key.name}, ${c.num.name}` } },
      { title: 'Keep the clean rows', concept: 'INSERT … SELECT copies only rows that pass every rule into the typed table. Counting rejected rows proves nothing was lost silently.', do: ['Run the INSERT … SELECT for your database from the lesson.'], code: { lang: 'sql', text: copyClean('postgres', c) },
        check: { kind: 'paste', prompt: 'Paste the clean_rows and rejected_rows result', pattern: '\\d+[^\\d]+\\d+', sample: 'clean_rows 119 | rejected_rows 3', fail: 'Paste both numbers: clean rows and rejected rows.' } },
      { title: 'Match SQL with Excel', concept: 'When SQL and Excel give the same numbers for the clean rows, you have proved both are right. A difference points straight to a bug.', do: ['Run the KPI and per-day queries and put the results next to your Excel sheets.'], code: { lang: 'sql', text: kpiQueries(c) },
        check: { kind: 'screenshot', prompt: 'SQL results next to your Excel KPI and Daily sheets' } },
      { title: 'The data dictionary', concept: 'A data dictionary says what every column means, its type and allowed values. It is the contract every later stage relies on.', do: ['Write one line per column: name, meaning, type and allowed values. Then upload your CSV to the dataset check (activity 3).'],
        check: { kind: 'answer', prompt: 'Your data dictionary: one line per column with meaning, type and allowed values', hint: d.dataset.columns.map(x => x.name).slice(0, 4).join(', ') } },
    ]; },
  },
};

/* ───────── Modules 3–9 (Days 11–45) ───────── */
const has = (...words: string[]) => words.map(w => `(?=[\\s\\S]*${esc(w)})`).join('');
const runIt = 'Run the code from the lesson above (Hard and Critical tracks: run the PySpark version too and keep that notebook).';

Object.assign(GUIDED, {
  UNITY_CATALOG: {
    0: (d: DomainSpec) => [
      { title: 'Create your workspace', concept: `Databricks is where the ${d.name} data will be stored, cleaned and modelled. Free Edition gives you a real workspace with serverless compute and no payment.`, do: ['Sign up for Databricks Free Edition with your email.', 'Find Workspace (notebooks), Catalog (data), SQL Editor and Compute.'], check: { kind: 'screenshot', prompt: 'Your workspace home with the left menu visible' } },
      { title: 'Your first query', concept: 'Every table lives at catalog.schema.table. current_catalog() and current_schema() tell you where your queries run.', do: ['Open the SQL Editor and run: SELECT current_catalog(), current_schema();'], check: { kind: 'paste', prompt: 'Paste the result row', pattern: '\\b[a-z_][a-z0-9_]*\\b[\\s|,]+\\b[a-z_][a-z0-9_]*\\b', sample: 'workspace | default', fail: 'Paste the two names the query returned (a catalog and a schema).' } },
    ],
    1: (d: DomainSpec) => [
      { title: 'Catalogs per environment', concept: 'Companies keep one catalog per environment (dev, prod) so a test can never overwrite production data. In this course your catalog is your dev environment.', do: [runIt, `If CREATE CATALOG is not allowed in your edition, use the workspace catalog and prefix schemas with ${d.catalog}_.`], check: { kind: 'paste', prompt: `Paste the output of SHOW CATALOGS LIKE '${d.catalog}*' (or SELECT current_catalog())`, pattern: `${esc(d.catalog)}|workspace`, sample: d.catalog, fail: `The output should show ${d.catalog} (or workspace if you could not create a catalog).` } },
      { title: 'Why dev and prod', concept: 'Promotion means code moves from dev to prod only after checks pass. Data is never copied by hand between them.', do: ['Write how a change would move from your dev catalog to a prod catalog.'], check: { kind: 'answer', prompt: 'How a change moves from dev to prod, and why tests can never touch prod', hint: `${d.catalog}_dev, ${d.catalog}_prod` } },
    ],
    2: (d: DomainSpec) => [
      { title: 'Bronze, silver and gold schemas', concept: 'The medallion layers separate raw data (bronze), cleaned data (silver) and business-ready tables (gold). Errors become traceable and permissions simple.', do: [runIt], check: { kind: 'paste', prompt: `Paste the output of SHOW SCHEMAS IN ${d.catalog}`, pattern: has('bronze', 'silver', 'gold'), sample: 'bronze\nsilver\ngold', fail: 'The list should show bronze, silver and gold.' } },
      { title: 'Comments as documentation', concept: 'A comment on every schema and table is documentation that travels with the data and shows in Catalog Explorer and lineage.', do: ['Open Catalog Explorer and check each schema has its comment.'], check: { kind: 'tick', prompt: 'Each schema shows its comment in Catalog Explorer' } },
    ],
    3: (d: DomainSpec) => { const c = labCols(d); return [
      { title: 'A governed landing folder', concept: 'A volume stores files (CSV, JSON, text) under the same permissions and audit as tables. Paths look like /Volumes/catalog/schema/volume/file.', do: [runIt, `Upload ${c.table}.csv, your JSON file and your text notes into the volume.`], check: { kind: 'paste', prompt: `Paste the output of LIST '/Volumes/${d.catalog}/bronze/raw_files/'`, pattern: esc(`${c.table}.csv`), sample: `/Volumes/${d.catalog}/bronze/raw_files/${c.table}.csv`, fail: `The listing should show ${c.table}.csv.` } },
    ]; },
    4: (d: DomainSpec) => [
      { title: 'Grants to groups', concept: 'Permissions go to groups, never to people one by one, so access follows a role. GRANT and SHOW GRANTS are how you set and prove them.', do: [runIt], check: { kind: 'paste', prompt: `Paste the output of SHOW GRANTS ON SCHEMA ${d.catalog}.gold`, pattern: 'SELECT|USE', sample: 'account users | SELECT | SCHEMA', fail: 'The output should show the SELECT or USE grant you added.' } },
      { title: 'Masks and row filters', concept: `A column mask hides personal data (${d.enterprise.piiColumns.join(', ')}) from people who should not see it; a row filter shows each person only their rows. Both are enforced by Unity Catalog, everywhere.`, do: ['Read the mask and row-filter functions in the lesson and write which column and which rows you would protect.'], check: { kind: 'answer', prompt: 'Which column you would mask and which rows you would filter, for whom', hint: d.enterprise.piiColumns[0] } },
    ],
  },
  BRONZE: {
    0: (d: DomainSpec) => [
      { title: 'Why keep raw data', concept: `If a ${d.name} report is ever questioned, bronze proves exactly what arrived and when. Nothing is changed or deleted in bronze.`, do: ['Write when you would go back to bronze in a real project.'], check: { kind: 'answer', prompt: 'When and why you would go back to the raw bronze data', hint: 'audit, reprocess, a disputed number' } },
    ],
    1: (d: DomainSpec) => { const c = labCols(d); return [
      { title: 'Ingest the CSV', concept: 'read_files (SQL) or spark.read (PySpark) loads files from a volume into a Delta table. _ingested_at and _source_file let you trace every row back to its file.', do: [runIt], check: { kind: 'paste', prompt: `Paste the result of SELECT COUNT(*) FROM ${d.catalog}.bronze.${c.table}_raw`, pattern: '\\b\\d{3,}\\b', sample: '122', fail: 'Paste the row count; it should match your CSV.' } },
    ]; },
    2: () => [
      { title: 'Ingest the JSON', concept: 'Nested fields stay as STRUCT or ARRAY in bronze; you flatten them in silver. Keeping them nested means nothing is lost.', do: [runIt], check: { kind: 'paste', prompt: 'Paste the schema of the JSON table (DESCRIBE or printSchema)', pattern: 'struct|array|string', sample: 'items array<struct<…>>', fail: 'Paste the column list with its types.' } },
    ],
    3: () => [
      { title: 'Incremental loads with Auto Loader', concept: 'In production new files arrive every day. Auto Loader reads only the new ones and remembers what it loaded in a checkpoint, so nothing is loaded twice.', do: [runIt, 'Upload one more file and run it again.'], check: { kind: 'answer', prompt: 'What happened on the second run, and why nothing was loaded twice', hint: 'checkpoint, only new files' } },
    ],
    4: (d: DomainSpec) => { const c = labCols(d); return [
      { title: 'Prove bronze is complete', concept: 'DESCRIBE HISTORY lists every write to a Delta table: when, how and how many rows. It is your first audit trail.', do: [runIt], check: { kind: 'paste', prompt: `Paste the output of DESCRIBE HISTORY ${d.catalog}.bronze.${c.table}_raw`, pattern: 'WRITE|CREATE|STREAMING UPDATE|MERGE', sample: '0 | … | CREATE TABLE AS SELECT', fail: 'The history should show at least one WRITE or CREATE operation.' } },
    ]; },
  },
  SILVER: {
    0: (d: DomainSpec) => { const c = labCols(d); return [
      { title: 'Profile before you clean', concept: 'You cannot fix what you have not measured. Counts of rows, unique keys, empty values and bad numbers are your baseline.', do: [runIt], check: { kind: 'paste', prompt: 'Paste the rows and unique_keys result', pattern: '\\d+\\D+\\d+', sample: '122 | 119', fail: `Paste both numbers: rows and unique ${c.key.name} values.` } },
    ]; },
    1: (d: DomainSpec) => { const c = labCols(d); return [
      { title: 'Remove duplicates', concept: `ROW_NUMBER() OVER (PARTITION BY ${c.key.name} ORDER BY the load time DESC) keeps the newest version of each key. A rule written down is repeatable; a manual fix is not.`, do: [runIt], check: { kind: 'paste', prompt: 'Paste how many duplicate rows were removed', pattern: '\\b\\d+\\b', sample: '3', fail: 'Paste the number of duplicates removed.' } },
      { title: 'Your cleansing rules', concept: 'One rule per data problem, each with the reason. Reviewers and the next analyst read these rules, not your code.', do: ['Write one rule per issue you found while profiling.'], check: { kind: 'answer', prompt: 'Your cleansing rules, one per issue, with the reason', hint: d.quality[0] } },
    ]; },
    2: (d: DomainSpec) => { const c = labCols(d); return [
      { title: 'Standardise categories', concept: 'Five spellings of one value split one group into five on the dashboard. Map every variant to one allowed value; send unknowns to quarantine instead of guessing.', do: [runIt], check: { kind: 'paste', prompt: `Paste SELECT ${c.cat.name}, COUNT(*) … GROUP BY ${c.cat.name} after standardising`, pattern: esc(c.cat.values[0]), sample: `${c.cat.values[0]} | 41`, fail: `The result should list your allowed values, such as ${c.cat.values[0]}.` } },
    ]; },
    3: () => [
      { title: 'Expectations and quarantine', concept: 'Expectations are quality rules the pipeline enforces itself; failing rows go to a quarantine table with the reason, so bad data cannot reach silver and nothing is lost silently.', do: [runIt, 'Open the pipeline graph and the data quality tab.'], check: { kind: 'screenshot', prompt: 'The pipeline graph or data quality tab showing your expectations' } },
    ],
    4: (d: DomainSpec) => { const c = labCols(d); return [
      { title: 'Build silver and pass the check', concept: 'Silver is the single cleaned version everyone uses. MERGE makes re-runs safe: the same key never appears twice.', do: [runIt, `Export a sample of ${d.catalog}.silver.${c.table} as CSV and upload it to the dataset check (activity 3).`], check: { kind: 'paste', prompt: `Paste SELECT COUNT(*), COUNT(DISTINCT ${c.key.name}) FROM ${d.catalog}.silver.${c.table}`, pattern: '(\\d+)\\D+\\1\\b', sample: '119 | 119', fail: 'Both numbers should be equal: one row per key in silver.' } },
    ]; },
  },
  GOLD: {
    0: (d: DomainSpec) => [
      { title: 'Grain first', concept: 'The grain is what one row means. Facts hold numbers at that grain; dimensions describe them. Mixing grains double-counts.', do: ['Design your fact and dimension tables and state the grain of each in one sentence.'], check: { kind: 'answer', prompt: 'Your fact and dimension tables, and the grain of each', hint: `one row per ${d.entity} per day` } },
    ],
    1: (d: DomainSpec) => [
      { title: 'Dimensions with history', concept: `SCD Type 2 keeps history: when an attribute changes (${d.enterprise.scdDimension}), the old row is closed and a new current row is added, so past reports stay correct.`, do: [runIt], check: { kind: 'paste', prompt: 'Paste SELECT is_current, COUNT(*) … GROUP BY is_current on your dimension', pattern: 'true', sample: 'true | 119\nfalse | 4', fail: 'The result should show current rows (true), and closed rows (false) once something changed.' } },
    ],
    2: (d: DomainSpec) => [
      { title: 'Every KPI, once', concept: 'Calculated once in gold, a KPI shows the same number in every report. Keep the formula in the table comment.', do: [runIt, ...d.kpis.map(k => `${k.name}: ${k.definition}.`)], check: { kind: 'paste', prompt: 'Paste one row of your KPI table', pattern: '\\d', sample: '2026-07-01 | 120 | 4.2 | …', fail: 'Paste a row with your KPI numbers.' } },
    ],
    3: (d: DomainSpec) => [
      { title: `Build ${d.gold.name}`, concept: 'Liquid clustering and statistics make the dashboard fast for many users at once; the key must stay unique.', do: [runIt], check: { kind: 'paste', prompt: `Paste DESCRIBE DETAIL ${d.catalog}.gold.${d.gold.name} (the clusteringColumns line)`, pattern: esc(d.gold.columns.find(c => c.key)!.name), sample: `clusteringColumns: ["${d.gold.columns.find(c => c.key)!.name}"]`, fail: 'The detail should show your clustering column.' } },
    ],
    4: () => [
      { title: 'Reconcile gold with silver', concept: 'Totals in gold must equal silver. A difference means a join or filter is wrong, and the dashboard would be wrong too.', do: [runIt], check: { kind: 'paste', prompt: 'Paste the silver total and the gold total side by side', pattern: '(\\d+)\\D+\\1\\b', sample: '119 | 119', fail: 'The two totals should be equal. If not, find the join or filter that changes them.' } },
    ],
  },
  POWER_BI: {
    0: (d: DomainSpec) => [
      { title: 'Connect Power BI', concept: 'Power BI reads the gold tables through a SQL warehouse, so every page shows governed, current numbers.', do: ['Power BI Desktop → Get Data → Azure Databricks; use your SQL warehouse’s server and HTTP path.', `Load ${d.gold.name}.`], check: { kind: 'screenshot', prompt: `Power BI with ${d.gold.name} in the Data pane` } },
    ],
    1: () => [
      { title: 'Star model and row-level security', concept: 'Relationships from dimensions to the fact make filters work; a date table makes time intelligence work; row-level security shows each role only its rows.', do: ['Create the relationships and mark the date table.', 'Create one role with a row filter and test it with View as role.'], check: { kind: 'screenshot', prompt: 'Model view with relationships, or the View as role result' } },
    ],
    2: (d: DomainSpec) => [
      { title: 'DAX measures', concept: 'Measures calculated in DAX give one number everywhere; numbers calculated inside visuals disagree from page to page.', do: d.dashboard.measures.map(m => `${m.name} = ${m.dax}`), check: { kind: 'paste', prompt: 'Paste one of your DAX measures', pattern: 'CALCULATE|DIVIDE|SUM|AVERAGE|COUNTROWS', sample: d.dashboard.measures[0]?.dax ?? 'DIVIDE(…)', fail: 'Paste the DAX formula of one measure.' } },
    ],
    3: (d: DomainSpec) => [
      { title: 'The report pages', concept: 'One page per audience, each answering one decision. A crowded page serves nobody.', do: d.dashboard.pages.map(p => `${p.name}: ${p.visuals.join(', ')}.`), check: { kind: 'screenshot', prompt: 'Your main report page' } },
    ],
    4: () => [
      { title: 'Publish safely', concept: 'Enterprises release reports through Dev, Test and Prod workspaces with a scheduled refresh, so nobody edits the live report.', do: ['Publish to a workspace and set a scheduled refresh.'], check: { kind: 'paste', prompt: 'Paste the link to your published report (or the workspace name)', pattern: 'powerbi\\.com|workspace|app\\.', sample: 'https://app.powerbi.com/groups/…', fail: 'Paste the Power BI link or workspace name.' } },
    ],
  },
  ML_AI: {
    0: (d: DomainSpec) => [
      { title: 'Frame the prediction', concept: `A model is useful only if someone acts on it. Here: predict ${d.enterprise.ml.target} (${d.enterprise.ml.task}) so that ${d.enterprise.ml.why.toLowerCase()}.`, do: ['Write the target, who acts on the prediction, and what a wrong prediction costs.'], check: { kind: 'answer', prompt: 'The target, who acts on it, and the cost of a wrong prediction', hint: d.enterprise.ml.target } },
    ],
    1: (d: DomainSpec) => [
      { title: 'The feature table', concept: 'One governed feature table means every experiment uses the same numbers. Split by time (train on older, test on newer) to avoid leakage.', do: [runIt, `Features: ${d.enterprise.ml.features.join(', ')}.`], check: { kind: 'paste', prompt: 'Paste the column list of your feature table', pattern: esc(d.enterprise.ml.features[0]), sample: d.enterprise.ml.features.join(', '), fail: `The columns should include ${d.enterprise.ml.features[0]}.` } },
    ],
    2: () => [
      { title: 'Train and track', concept: 'MLflow records data, parameters, metrics and the model for every run, so results are reproducible and auditable. A baseline tells you whether the model is any better than guessing.', do: [runIt, 'Train a baseline and one better model; register the better one.'], check: { kind: 'paste', prompt: 'Paste the MLflow run ID of your registered model', pattern: '\\b[0-9a-f]{32}\\b', sample: 'a3f1c2d4e5b6978812ab34cd56ef7890', fail: 'An MLflow run ID is 32 letters and digits (0–9, a–f). Copy it from the run page.' } },
    ],
    3: () => [
      { title: 'Score every day', concept: 'Batch scoring writes predictions back to gold on a schedule, so the dashboard and the business always see fresh predictions.', do: [runIt], check: { kind: 'paste', prompt: 'Paste how many predictions were written', pattern: '\\b\\d{2,}\\b', sample: '119', fail: 'Paste the number of prediction rows.' } },
      { title: 'Ask in plain English', concept: 'AI/BI Genie lets business users ask questions of your gold tables in plain English, governed by the same permissions.', do: ['Create a Genie space on your gold tables and ask one business question.'], check: { kind: 'screenshot', prompt: 'Genie answering a business question' } },
    ],
    4: () => [
      { title: 'Fair, explainable, watched', concept: 'A model must work equally well for different groups, explain its reasons, and be monitored for drift after go-live.', do: ['Compare model performance across two groups; list the top reasons for predictions; write what you would monitor.'], check: { kind: 'answer', prompt: 'Your fairness check, the main reasons the model uses, and what you would monitor', hint: 'recall by group, top features, drift' } },
    ],
  },
  CAPSTONE: {
    0: (d: DomainSpec) => [
      { title: 'The insight', concept: 'An insight is a finding with evidence that changes a decision. Numbers without a “so what” are not insights.', do: ['Answer each measurable question from Day 6 with evidence from your dashboard.'], check: { kind: 'answer', prompt: 'Your main insight, the evidence, and the decision it changes', hint: d.insight.slice(0, 80) } },
    ],
    1: (d: DomainSpec) => [
      { title: 'Recommendations', concept: 'Every recommendation needs an owner, a KPI it moves, a date and an expected value, or nothing happens on Monday.', do: [`Write one recommendation for each stakeholder: ${d.problem.stakeholders.join(', ')}.`], check: { kind: 'answer', prompt: 'Your recommendations with owner, KPI, date and expected value', hint: d.problem.stakeholders[0] } },
    ],
    2: () => [
      { title: 'Productionise', concept: 'A Databricks Asset Bundle keeps jobs, pipelines and settings in version control, so the same pipeline deploys to dev and prod the same way.', do: [runIt, 'Run: databricks bundle validate'], check: { kind: 'paste', prompt: 'Paste the output of databricks bundle validate', pattern: 'Validation OK|OK!?', sample: 'Validation OK!', fail: 'The output should end with Validation OK.' } },
    ],
    3: () => [
      { title: 'The runbook', concept: 'A runbook tells whoever is on call what to do when a job fails at 7 am: how to check, how to rerun, whom to call.', do: ['Write the runbook: schedule, checks, how to rerun, and contacts.'], check: { kind: 'answer', prompt: 'Your runbook: schedule, checks, how to rerun, contacts', hint: 'job, SLA, rerun, owner' } },
    ],
    4: () => [
      { title: 'Go-live review', concept: 'A go-live review checks data quality, security, cost, monitoring and ownership before real users depend on the solution.', do: ['Complete the go-live checklist in the lesson and record your presentation.'], check: { kind: 'screenshot', prompt: 'Your completed go-live checklist (every item ticked) or the first slide of your recorded presentation' } },
    ],
  },
});
