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
