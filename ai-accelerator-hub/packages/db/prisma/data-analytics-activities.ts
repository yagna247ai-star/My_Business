/**
 * Activities for Modules 2–9 of the AI-Powered Data Analytics journey (Module 1 lives in seed-data-analytics.ts).
 * Each module has the same six-slot framework as the AI journey: Briefing, Learn, Explore, Build, Proof, Boss.
 *
 * Status: DRAFT for reviewer sign-off (owner decision 2026-11-18: write all nine now).
 * Explore repositories were checked through the GitHub API on 2026-11-18; questions only use facts from each
 * repository's own description. The same file feeds the seed and the Playwright proof (answers are read here).
 */

export const VERIFIED_ON = '2026-11-18';

type Quiz = { q: string; options: string[]; answer: number };
export type ModuleSpec = {
  code: string;
  xp: number;
  briefing: { title: string; problem: string; objective: string; outcome: string; criteria: string[]; check: { q: string; options: string[]; answer: number; why: string } };
  learn: { title: string; lessons: { title: string; minutes: number; body: string }[]; quiz: Quiz[] };
  explore: { title: string; repo: { fullName: string; url: string; description: string; difficulty: string; prerequisites: string; license: string }; architecture: string[]; task: string; questions: Quiz[] };
  build: { title: string; tools: string[]; fields: { key: string; label: string; hint: string; minWords: number }[] };
  proof: { title: string; checklist: string[] };
  boss: { title: string; intro: string; choices: string[]; scenarios: { s: string; correct: number[] }[] };
};

/** Split a module's XP over the six activities, the same shape as Module 1 (5/18/10/35/5/47 of 120). */
export function xpSplit(total: number) {
  const briefing = Math.round(total * 0.04), learn = Math.round(total * 0.15), explore = Math.round(total * 0.08);
  const build = Math.round(total * 0.29), proof = Math.round(total * 0.04);
  const boss = total - briefing - learn - explore - build - proof;
  const base = Math.round(boss * 0.43);
  return { briefing, learn, explore, build, proof, boss, bossBase: base, bossBonus: boss - base };
}

const describe = (desc: string) => `According to its own description, what is this repository?`;

export const MODULES: ModuleSpec[] = [
  // ───────────── M2 SQL ─────────────
  {
    code: 'DA02_SQL', xp: 160,
    briefing: {
      title: 'Mission Briefing: The Messy Sales Sheet',
      problem: 'Sunita Stores keeps every sale in one big Excel sheet. Customer names are typed three different ways and prices are copied on every row. The owner wants the top products by branch, but the sheet makes that slow and full of mistakes.',
      objective: 'Store the data in linked tables and answer the owner with SQL.',
      outcome: 'A small database (customers, products, orders) and three queries that answer the owner.',
      criteria: ['Split one sheet into linked tables with keys', 'Filter, group and join with SQL', 'Check that totals match the source'],
      check: { q: 'Why split the sales sheet into customers, products and orders tables?', options: ['To make the file look bigger', 'So each fact is stored once and tables link by keys', 'Because SQL cannot read one table'], answer: 1, why: 'Storing each fact once (one price, one customer) avoids copy mistakes; keys link the tables back together.' },
    },
    learn: {
      title: 'Learn: Tables, Keys, Filters and Joins',
      lessons: [
        { title: 'Tables and keys', minutes: 8, body: 'A primary key is a unique number for each row, like a roll number. A foreign key is a number that points to a row in another table, like an order pointing to its customer.' },
        { title: 'Asking for exactly what you need', minutes: 8, body: 'SELECT picks columns, WHERE keeps rows, ORDER BY sorts, LIMIT shows only a few. A missing value is NULL, and you test it with IS NULL, never = NULL.' },
        { title: 'Grouping and joining', minutes: 10, body: 'GROUP BY makes one pile per group so you can SUM or COUNT it; HAVING filters the piles. A LEFT JOIN keeps every row on the left and leaves a blank where nothing matches.' },
      ],
      quiz: [
        { q: 'A primary key must be…', options: ['Unique for every row', 'The same for every row', 'Always a name', 'Optional'], answer: 0 },
        { q: 'How do you find rows where closed_on is missing?', options: ['closed_on = NULL', 'closed_on IS NULL', 'closed_on = 0', "closed_on = ''"], answer: 1 },
        { q: 'Which filters groups after GROUP BY?', options: ['WHERE', 'ORDER BY', 'HAVING', 'LIMIT'], answer: 2 },
        { q: 'Which join keeps every customer, even those with no orders?', options: ['INNER JOIN', 'LEFT JOIN from customers', 'No join', 'UNION'], answer: 1 },
        { q: 'LIMIT 10 is only meaningful together with…', options: ['ORDER BY', 'DISTINCT', 'NULL', 'A view'], answer: 0 },
      ],
    },
    explore: {
      title: 'Explore: A Real Sample Database',
      repo: { fullName: 'lerocha/chinook-database', url: 'https://github.com/lerocha/chinook-database', description: 'Sample database for SQL Server, Oracle, MySQL, PostgreSQL, SQLite, DB2.', difficulty: 'Beginner', prerequisites: 'Module 2 lessons', license: 'Not stated as a standard licence on GitHub. Check the repository before any reuse.' },
      architecture: ['The repository ships the same sample database for several database systems.', 'Tables are linked by keys, like customers, invoices and invoice lines.', 'Practise reading which table holds which fact before writing a query.'],
      task: 'Open the repository and read its README. Then answer three questions.',
      questions: [
        { q: describe(''), options: ['A sample database for several SQL systems', 'A web browser', 'A game engine', 'A photo editor'], answer: 0 },
        { q: 'Which of these systems is listed in its description?', options: ['SQLite', 'Photoshop', 'Excel only', 'None'], answer: 0 },
        { q: 'What should you do first with any new sample database?', options: ['Read which table holds which fact, and how they link', 'Delete the tables', 'Write a dashboard', 'Rename every column'], answer: 0 },
      ],
    },
    build: {
      title: 'Build: Your Query Pack',
      tools: ['SQLite', 'DB Browser for SQLite', 'PostgreSQL', 'MySQL', 'Other'],
      fields: [
        { key: 'tables', label: 'Your tables and keys', hint: 'Name each table, its primary key and its foreign keys.', minWords: 30 },
        { key: 'queries', label: 'Three queries and what they answer', hint: 'Write each query and one line on what it tells the owner.', minWords: 40 },
        { key: 'check', label: 'How you checked the totals', hint: 'Compare one total with a hand count or the source file.', minWords: 20 },
        { key: 'limits', label: 'What the data cannot tell you', hint: 'Missing months, one branch only, and so on.', minWords: 15 },
      ],
    },
    proof: { title: 'Submit Proof: Share Your Query Pack', checklist: ['My query pack is complete and the link is viewable', 'I removed all personal data about real people', 'I checked one total by hand'] },
    boss: {
      title: 'Evaluation + Boss: The Right Query Trial',
      intro: 'Four situations. For each, choose the right SQL move and say why in one sentence.',
      choices: ['Filter, group or join correctly, then check the total', 'Copy the numbers by hand into a new sheet', 'Trust the first result without checking'],
      scenarios: [
        { s: 'The owner wants revenue per branch for October.', correct: [0] },
        { s: 'A list of customers who never ordered is needed.', correct: [0] },
        { s: 'A query shows 2,000 more orders than the bills in the book.', correct: [0] },
        { s: 'Loans with no closing date must be counted.', correct: [0] },
      ],
    },
  },
  // ───────────── M3 Python fundamentals ─────────────
  {
    code: 'DA03_PYTHON_FUNDAMENTALS', xp: 170,
    briefing: {
      title: 'Mission Briefing: The Calculator at Closing Time',
      problem: 'Every evening Sunita\'s staff add cash, card and UPI sales on a calculator, and mistakes happen. The co-op also gets loan files with bad rows that stop everything.',
      objective: 'Write small Python programs that do the daily sums and check files without crashing.',
      outcome: 'Two short programs: a daily sales counter and a file checker with a reject list.',
      criteria: ['Use variables, conditions and loops correctly', 'Store records in the right structure', 'Handle bad rows without crashing'],
      check: { q: 'What should a file checker do when one row is bad?', options: ['Stop the whole program', 'Write the row to a reject list with the reason and keep going', 'Delete the file'], answer: 1, why: 'One bad row should not stop the run. Log it with a reason so a person can fix it.' },
    },
    learn: {
      title: 'Learn: Variables, Decisions, Loops and Functions',
      lessons: [
        { title: 'Variables and types', minutes: 8, body: 'A variable is a named box. input() always gives text, so use float() before doing maths.' },
        { title: 'Decisions and loops', minutes: 8, body: 'if/elif/else checks rules top to bottom; the first true rule wins. for repeats a job for each item; break stops, continue skips.' },
        { title: 'Functions and safety nets', minutes: 10, body: 'A function does one job and returns a result. try/except catches an error so the program keeps going.' },
      ],
      quiz: [
        { q: 'What type does input() return?', options: ['Text', 'A whole number', 'A decimal', 'A list'], answer: 0 },
        { q: 'With if/elif/else, which branch runs?', options: ['All true branches', 'The first true one', 'The last one', 'None'], answer: 1 },
        { q: 'Which structure removes repeats automatically?', options: ['List', 'Tuple', 'Set', 'String'], answer: 2 },
        { q: 'What does try/except do?', options: ['Makes code faster', 'Catches an error so the program can continue', 'Deletes errors from the file', 'Repeats code'], answer: 1 },
        { q: 'range(2, 8) gives how many numbers?', options: ['6', '8', '7', '2'], answer: 0 },
      ],
    },
    explore: {
      title: 'Explore: Reading Real Python Code',
      repo: { fullName: 'TheAlgorithms/Python', url: 'https://github.com/TheAlgorithms/Python', description: 'All Algorithms implemented in Python.', difficulty: 'Beginner', prerequisites: 'Module 3 lessons', license: 'MIT' },
      architecture: ['Code is grouped into folders by topic.', 'Each file is one small program you can read top to bottom.', 'Look for the function, its inputs and what it returns.'],
      task: 'Open the repository, pick one small file, and read it. Then answer three questions.',
      questions: [
        { q: describe(''), options: ['Algorithms implemented in Python', 'A spreadsheet', 'A music app', 'A video course'], answer: 0 },
        { q: 'When you read a function, what three things should you find first?', options: ['Its inputs, what it does, and what it returns', 'Its colour and font', 'Only its name', 'The author'], answer: 0 },
        { q: 'Which licence does the repository use?', options: ['MIT', 'None', 'Paid only', 'Unknown'], answer: 0 },
      ],
    },
    build: {
      title: 'Build: Your Two Programs',
      tools: ['VS Code', 'IDLE', 'Jupyter', 'Command Prompt', 'Other'],
      fields: [
        { key: 'counter', label: 'The daily sales counter', hint: 'What it asks for, what it prints, and how it handles a zero day.', minWords: 30 },
        { key: 'checker', label: 'The file checker', hint: 'Which rules it checks and where good and bad rows go.', minWords: 40 },
        { key: 'tests', label: 'Your test runs', hint: 'Three inputs you tried and what happened.', minWords: 20 },
        { key: 'limits', label: 'What your programs do not handle yet', hint: 'Be honest: dates in other formats, very large files, and so on.', minWords: 15 },
      ],
    },
    proof: { title: 'Submit Proof: Share Your Programs', checklist: ['My code link is viewable by reviewers', 'I removed all personal data about real people', 'My checker does not crash on a bad row'] },
    boss: {
      title: 'Evaluation + Boss: The Safe Program Trial',
      intro: 'Four situations. Choose the right Python move and say why.',
      choices: ['Use the right structure or check, and handle the error', 'Let the program crash and fix it later', 'Copy-paste the same code many times'],
      scenarios: [
        { s: 'A loan file has a row where the amount is a word.', correct: [0] },
        { s: 'You need every unique skill in a team, with no repeats.', correct: [0] },
        { s: 'The same grading rule is needed in three places.', correct: [0] },
        { s: 'Total sales is zero and you need a share percentage.', correct: [0] },
      ],
    },
  },
  // ───────────── M4 Python for data ─────────────
  {
    code: 'DA04_PYTHON_ANALYTICS', xp: 190,
    briefing: {
      title: 'Mission Briefing: The Staff List Nobody Trusts',
      problem: 'Pinnacle Tools has a staff file with salaries written three ways, the same worker twice, and blank dates. HR needs headcount and average pay they can trust.',
      objective: 'Load, inspect, clean and explore the data with pandas, and log every change.',
      outcome: 'A cleaned file, a cleaning log with counts, and three insights with limits.',
      criteria: ['Profile the data before changing it', 'Clean in a fixed order and log each step', 'Write insights with a number and a limit'],
      check: { q: 'What should you do before cleaning a new file?', options: ['Delete the odd rows', 'Profile it: shape, types and missing values', 'Make a chart'], answer: 1, why: 'Profiling shows what is wrong before you change anything.' },
    },
    learn: {
      title: 'Learn: pandas, Cleaning and Exploring',
      lessons: [
        { title: 'Looking before touching', minutes: 8, body: 'shape, head, tail, info and describe show the size, types and blanks. A number stored as text is a warning sign.' },
        { title: 'Cleaning with a log', minutes: 10, body: 'Standardise text, convert types, handle blanks, remove repeats, and write down how many rows each step changed.' },
        { title: 'Grouping, merging, exploring', minutes: 10, body: 'groupby makes piles; merge joins tables by a key. Check the row count after every merge. Do not delete outliers without a reason.' },
      ],
      quiz: [
        { q: 'Which shows the number of non-blank values per column?', options: ['info()', 'head()', 'shape', 'sum()'], answer: 0 },
        { q: 'errors="coerce" in to_numeric turns bad values into…', options: ['Zero', 'Blanks (NaN)', 'Errors that stop the code', 'Text'], answer: 1 },
        { q: 'Why check the row count after a merge?', options: ['To spot repeated keys that add extra rows', 'To make it faster', 'It is not needed', 'To rename columns'], answer: 0 },
        { q: 'What should every cleaning step have?', options: ['A log entry with a count', 'A new file name', 'A chart', 'Nothing'], answer: 0 },
        { q: 'An outlier is…', options: ['A value far from the rest', 'A missing value', 'A column name', 'A duplicate'], answer: 0 },
      ],
    },
    explore: {
      title: 'Explore: The pandas Project',
      repo: { fullName: 'pandas-dev/pandas', url: 'https://github.com/pandas-dev/pandas', description: 'Flexible and powerful data analysis / manipulation library for Python.', difficulty: 'Intermediate', prerequisites: 'Module 4 lessons', license: 'BSD-3-Clause' },
      architecture: ['The README explains what the library is for and how to install it.', 'The documentation explains each function with examples.', 'Read the "getting started" part before the reference pages.'],
      task: 'Open the repository and read the README. Then answer three questions.',
      questions: [
        { q: describe(''), options: ['A data analysis and manipulation library for Python', 'A database server', 'A dashboard tool', 'A spreadsheet'], answer: 0 },
        { q: 'Which licence does pandas use?', options: ['BSD-3-Clause', 'No licence', 'Paid only', 'GPL only'], answer: 0 },
        { q: 'Where should a beginner start in a big library?', options: ['The getting-started guide', 'The test folder', 'The release notes only', 'The licence file only'], answer: 0 },
      ],
    },
    build: {
      title: 'Build: Your Cleaning Log and Insights',
      tools: ['Jupyter', 'VS Code', 'Google Colab', 'Other'],
      fields: [
        { key: 'profile', label: 'Your data profile', hint: 'Rows, columns, types, and blanks per column.', minWords: 30 },
        { key: 'cleaning', label: 'Your cleaning log', hint: 'Each step, the rule, and how many rows changed.', minWords: 40 },
        { key: 'insights', label: 'Three insights', hint: 'Each with a number from your table.', minWords: 30 },
        { key: 'limits', label: 'Limits of the data', hint: 'What it cannot prove.', minWords: 15 },
      ],
    },
    proof: { title: 'Submit Proof: Share Your Notebook', checklist: ['My notebook link is viewable', 'I removed all personal data about real people', 'Every cleaning step has a count'] },
    boss: {
      title: 'Evaluation + Boss: The Clean Data Trial',
      intro: 'Four situations. Choose the right data move and say why.',
      choices: ['Profile, clean with a logged rule, and check the count', 'Delete anything that looks odd', 'Analyse the raw file as it is'],
      scenarios: [
        { s: 'Salaries are written as "₹ 32,000" and "32k".', correct: [0] },
        { s: 'After a merge, the row count went up by 40.', correct: [0] },
        { s: 'One bill is 400 times larger than the others.', correct: [0] },
        { s: 'Dates are written in two different formats.', correct: [0] },
      ],
    },
  },
  // ───────────── M5 Power BI ─────────────
  {
    code: 'DA05_POWER_BI', xp: 200,
    briefing: {
      title: 'Mission Briefing: Five Tabs Every Morning',
      problem: 'Sunita opens five spreadsheets every morning to see yesterday\'s sales, the trend and which branch is ahead. She wants one page that updates with one click.',
      objective: 'Connect, clean, model and show the data in one Power BI page.',
      outcome: 'A one-page dashboard with KPI cards, a trend, a branch comparison and slicers.',
      criteria: ['Clean in Power Query, not in the source', 'Model a star schema', 'Write measures that follow the slicers'],
      check: { q: 'Where should cleaning happen so it repeats on every refresh?', options: ['In the source Excel file by hand', 'In Power Query applied steps', 'In a screenshot'], answer: 1, why: 'Power Query steps run again on each refresh, so the source stays untouched.' },
    },
    learn: {
      title: 'Learn: Power Query, Star Schema and DAX',
      lessons: [
        { title: 'Power Query', minutes: 8, body: 'Each cleaning step is recorded in Applied Steps and repeats on refresh. Set data types early.' },
        { title: 'Star schema', minutes: 8, body: 'One fact table of events in the middle, dimension tables of descriptions around it, linked one-to-many.' },
        { title: 'Measures and design', minutes: 10, body: 'A measure is worked out when you look at it, so it follows the slicers. Each chart answers one question in its title.' },
      ],
      quiz: [
        { q: 'A measure is better than a calculated column for totals because…', options: ['It changes with the slicers', 'It is stored per row', 'It is faster to type', 'It needs no table'], answer: 0 },
        { q: 'In a star schema, the fact table is on which side of each relationship?', options: ['The many side', 'The one side', 'Neither', 'Both'], answer: 0 },
        { q: 'DIVIDE is used instead of / because…', options: ['It returns blank instead of an error on zero', 'It is shorter', 'It rounds numbers', 'It sorts'], answer: 0 },
        { q: 'A good chart title is…', options: ['The question the chart answers', 'Chart 1', 'The file name', 'Blank'], answer: 0 },
        { q: 'Power BI Desktop runs on…', options: ['Windows', 'Any phone', 'Only Mac', 'Only Linux'], answer: 0 },
      ],
    },
    explore: {
      title: 'Explore: Official Power BI Samples',
      repo: { fullName: 'microsoft/powerbi-desktop-samples', url: 'https://github.com/microsoft/powerbi-desktop-samples', description: 'Power BI Desktop sample files for the monthly release.', difficulty: 'Beginner', prerequisites: 'Module 5 lessons', license: 'MIT' },
      architecture: ['Sample report files are grouped by release.', 'Open a sample to see how pages, visuals and models are built.', 'Compare the model view with the report view.'],
      task: 'Open the repository and read the README. Then answer three questions.',
      questions: [
        { q: describe(''), options: ['Power BI Desktop sample files', 'A Python library', 'A database', 'A game'], answer: 0 },
        { q: 'Which licence does the repository use?', options: ['MIT', 'None', 'Paid only', 'Unknown'], answer: 0 },
        { q: 'When you open a sample report, what should you compare?', options: ['The model view with the report view', 'Only the colours', 'Only the file size', 'Nothing'], answer: 0 },
      ],
    },
    build: {
      title: 'Build: Your Morning Dashboard',
      tools: ['Power BI Desktop', 'Power BI Service', 'Other'],
      fields: [
        { key: 'model', label: 'Your model', hint: 'Fact table, dimensions, and the links between them.', minWords: 30 },
        { key: 'measures', label: 'Your measures', hint: 'Each measure, its formula and what it shows.', minWords: 30 },
        { key: 'page', label: 'Your page layout', hint: 'Each visual and the question in its title.', minWords: 40 },
        { key: 'limits', label: 'Limits of the dashboard', hint: 'What it cannot show yet.', minWords: 15 },
      ],
    },
    proof: { title: 'Submit Proof: Share Your Dashboard', checklist: ['My dashboard link or PDF is viewable', 'I removed all personal data about real people', 'Every measure changes with the slicers'] },
    boss: {
      title: 'Evaluation + Boss: The Dashboard Trial',
      intro: 'Four situations. Choose the right Power BI move and say why.',
      choices: ['Use Power Query, a star model and measures, then check one number', 'Type the numbers onto the page by hand', 'Add as many charts as possible'],
      scenarios: [
        { s: 'Dates load as text and sort in the wrong order.', correct: [0] },
        { s: 'The revenue card does not change when a branch is picked.', correct: [0] },
        { s: 'Totals double after linking two description tables directly.', correct: [0] },
        { s: 'The owner cannot tell what a chart is for.', correct: [0] },
      ],
    },
  },
  // ───────────── M6 AI for data ─────────────
  {
    code: 'DA06_AI_FOR_ANALYTICS', xp: 220,
    briefing: {
      title: 'Mission Briefing: "Just Paste It Into AI"',
      problem: 'Sunita\'s nephew wants to paste the whole sales file, with customer phone numbers, into an AI chatbot. An AI report already claimed "late loans rose 30%" with no check.',
      objective: 'Use AI as a fast helper, check every claim, and keep personal data out.',
      outcome: 'A strong prompt, a checked AI answer, and a report with a privacy line.',
      criteria: ['Write a five-part prompt with the schema', 'Check each AI claim against the data', 'Remove personal data before any prompt'],
      check: { q: 'What must you do before pasting data into an AI tool?', options: ['Nothing', 'Remove names, phone numbers and ID numbers; share totals', 'Paste the whole file'], answer: 1, why: 'Personal data must never go into a public AI tool. Share totals, not people.' },
    },
    learn: {
      title: 'Learn: Prompts, Checks and Privacy',
      lessons: [
        { title: 'What an LLM does', minutes: 8, body: 'It predicts likely next words, so it can sound sure and be wrong (a hallucination). Ask it for the query, then run the query.' },
        { title: 'The five-part prompt', minutes: 8, body: 'Context, schema, task, rules, output. The schema stops the AI from guessing column names.' },
        { title: 'Checking claims', minutes: 10, body: '"30% more" can hide a small change. Give the counts, the base and the period, and list limits.' },
      ],
      quiz: [
        { q: 'A confident answer that the data does not support is called…', options: ['A hallucination', 'A measure', 'A join', 'A key'], answer: 0 },
        { q: 'Which part of a prompt stops the AI guessing column names?', options: ['The schema', 'The greeting', 'The font', 'The emoji'], answer: 0 },
        { q: 'Late loans went from 10 to 13. What should the report say?', options: ['Only "up 30%"', 'Up by 3 loans (30%), with the base and period', 'Nothing changed', 'Up 300%'], answer: 1 },
        { q: 'Who should do exact counting?', options: ['Code or a query', 'The AI chatbot', 'Nobody', 'A guess'], answer: 0 },
        { q: 'Which may never be pasted into an AI tool?', options: ['A customer\'s phone number', 'A question about SQL', 'A public headline', 'Your own sentence'], answer: 0 },
      ],
    },
    explore: {
      title: 'Explore: Generative AI for Beginners',
      repo: { fullName: 'microsoft/generative-ai-for-beginners', url: 'https://github.com/microsoft/generative-ai-for-beginners', description: '21 Lessons, Get Started Building with Generative AI.', difficulty: 'Beginner', prerequisites: 'Module 6 lessons', license: 'MIT' },
      architecture: ['Each lesson is a numbered folder with a README.', 'Early lessons need no code: concepts, responsible AI and prompting.', 'Later lessons add code samples.'],
      task: 'Open the repository and read its README. Then answer three questions.',
      questions: [
        { q: describe(''), options: ['Lessons to get started building with generative AI', 'A database', 'A Power BI file', 'A game'], answer: 0 },
        { q: 'How many lessons does its description mention?', options: ['21', '5', '100', '2'], answer: 0 },
        { q: 'Which licence does it use?', options: ['MIT', 'None', 'Paid only', 'Unknown'], answer: 0 },
      ],
    },
    build: {
      title: 'Build: Your Checked AI Report',
      tools: ['The institution\'s approved AI tool', 'Other'],
      fields: [
        { key: 'prompt', label: 'Your five-part prompt', hint: 'Context, schema, task, rules and output.', minWords: 40 },
        { key: 'claims', label: 'Claim check', hint: 'Each AI claim, the query that checks it, and your verdict.', minWords: 40 },
        { key: 'privacy', label: 'What you removed for privacy', hint: 'Names, phone numbers, ID numbers.', minWords: 15 },
        { key: 'limits', label: 'Limits of the report', hint: 'Period, sample size, missing branches.', minWords: 15 },
      ],
    },
    proof: { title: 'Submit Proof: Share Your Report', checklist: ['My report link is viewable', 'No personal data went into any prompt', 'Every claim has a checking query'] },
    boss: {
      title: 'Evaluation + Boss: The Trust-but-Check Trial',
      intro: 'Four situations. Choose the right AI move and say why.',
      choices: ['Use AI to draft, then check against the data and protect privacy', 'Accept the AI answer as it is', 'Paste everything into the AI to save time'],
      scenarios: [
        { s: 'AI says revenue rose 30% with no source.', correct: [0] },
        { s: 'AI writes a query using a column that does not exist.', correct: [0] },
        { s: 'A file with phone numbers needs a summary.', correct: [0] },
        { s: 'AI suggests "attendance drops on Fridays".', correct: [0] },
      ],
    },
  },
  // ───────────── M7 Machine learning ─────────────
  {
    code: 'DA07_MACHINE_LEARNING', xp: 240,
    briefing: {
      title: 'Mission Briefing: Can the Computer Learn It?',
      problem: 'Ravi Textiles wants to know which customers will stop buying, and Sunita wants a sales forecast. A model that looks 99% accurate turned out to be cheating.',
      objective: 'Frame a prediction, avoid leakage, and report honest metrics.',
      outcome: 'A one-page model report: question, label, features, split, metric, result and one limit.',
      criteria: ['Pick rule, regression, classification or clustering', 'Split train and test honestly', 'Choose the metric from the business cost'],
      check: { q: 'A model is 99% accurate because one feature already holds the answer. This is…', options: ['Great work', 'Leakage — remove the feature', 'Clustering'], answer: 1, why: 'A clue that secretly contains the answer makes the model look great and fail on new data.' },
    },
    learn: {
      title: 'Learn: Features, Splits and Metrics',
      lessons: [
        { title: 'Which kind of problem', minutes: 8, body: 'A number to predict is regression; a category is classification; groups with no answers is clustering. A simple rule is sometimes better.' },
        { title: 'Honest testing', minutes: 8, body: 'Keep a hidden test set. Remove any feature known only after the outcome (leakage).' },
        { title: 'Metrics', minutes: 10, body: 'Precision: of those flagged, how many were right. Recall: of the real cases, how many were found. Accuracy can lie when cases are rare.' },
      ],
      quiz: [
        { q: 'Predicting next month\'s revenue is…', options: ['Regression', 'Classification', 'Clustering', 'A join'], answer: 0 },
        { q: 'Why keep a hidden test set?', options: ['To check the model honestly on unseen data', 'To make training faster', 'It is not needed', 'To store backups'], answer: 0 },
        { q: 'If only 10% of customers leave, a model that says "nobody leaves" has…', options: ['High accuracy but zero recall', 'Zero accuracy', 'Perfect recall', 'No predictions'], answer: 0 },
        { q: 'Before K-Means, you should…', options: ['Scale the features', 'Delete half the rows', 'Sort by name', 'Nothing'], answer: 0 },
        { q: 'Which may never be used as a feature?', options: ['A protected personal trait like religion', 'Days since last order', 'Average order value', 'Orders last year'], answer: 0 },
      ],
    },
    explore: {
      title: 'Explore: scikit-learn',
      repo: { fullName: 'scikit-learn/scikit-learn', url: 'https://github.com/scikit-learn/scikit-learn', description: 'scikit-learn: machine learning in Python.', difficulty: 'Intermediate', prerequisites: 'Module 7 lessons', license: 'BSD-3-Clause' },
      architecture: ['The README explains installation and the main uses.', 'The documentation has a user guide and worked examples.', 'Start from an example close to your problem.'],
      task: 'Open the repository and read the README. Then answer three questions.',
      questions: [
        { q: describe(''), options: ['Machine learning in Python', 'A database', 'A dashboard tool', 'A text editor'], answer: 0 },
        { q: 'Which licence does it use?', options: ['BSD-3-Clause', 'None', 'Paid only', 'GPL only'], answer: 0 },
        { q: 'Where is a good place to start?', options: ['A worked example close to your problem', 'The test folder', 'The build scripts', 'The licence only'], answer: 0 },
      ],
    },
    build: {
      title: 'Build: Your Model Report',
      tools: ['Jupyter', 'Google Colab', 'VS Code', 'Other'],
      fields: [
        { key: 'question', label: 'The question and the label', hint: 'What you predict and the answer you learn from.', minWords: 30 },
        { key: 'features', label: 'Features and the leak check', hint: 'Each feature, and whether it was known before the outcome.', minWords: 30 },
        { key: 'results', label: 'Metric and result', hint: 'Which metric, why, and the number against a baseline.', minWords: 40 },
        { key: 'limits', label: 'Limits and fairness', hint: 'What the model cannot do, and the features you refused to use.', minWords: 15 },
      ],
    },
    proof: { title: 'Submit Proof: Share Your Model Report', checklist: ['My report link is viewable', 'I removed all personal data about real people', 'I used no protected traits as features'] },
    boss: {
      title: 'Evaluation + Boss: The Honest Model Trial',
      intro: 'Four situations. Choose the right ML move and say why.',
      choices: ['Frame it, split honestly, and report a fair metric with a limit', 'Report the highest number you can get', 'Use every column you have, whatever it is'],
      scenarios: [
        { s: 'A churn model shows 99% accuracy.', correct: [0] },
        { s: 'Only 10% of customers leave; which metric?', correct: [0] },
        { s: 'A column "orders in the next 60 days" is in the features.', correct: [0] },
        { s: 'Someone suggests using religion as a feature.', correct: [0] },
      ],
    },
  },
  // ───────────── M8 ETL and data quality ─────────────
  {
    code: 'DA08_ETL_DATA_QUALITY', xp: 250,
    briefing: {
      title: 'Mission Briefing: The Totals Do Not Match',
      problem: 'The co-op\'s warehouse total is ₹4,82,300 less than the core banking total, and three branches send data in three formats. The board meets on Friday.',
      objective: 'Move data from source to target safely, and prove the totals match.',
      outcome: 'A pipeline drawing, load logs, and a reconciliation summary that explains the gap.',
      criteria: ['Keep a raw staging copy', 'Make loads safe to rerun', 'Reconcile source and target, then explain any gap'],
      check: { q: 'The warehouse total does not match the source. What first?', options: ['Change the total by hand', 'Reconcile: compare counts and totals, then find the missing rows', 'Ignore it'], answer: 1, why: 'Reconciliation finds exactly which rows are missing or wrong.' },
    },
    learn: {
      title: 'Learn: Extract, Transform, Load and Check',
      lessons: [
        { title: 'The delivery route', minutes: 8, body: 'Extract from each source without changing it, keep a raw staging copy, transform to one format, then load the checked data.' },
        { title: 'Safe loads', minutes: 8, body: 'An incremental load adds only new rows after a watermark. A safe load can run twice without adding rows twice.' },
        { title: 'Data quality', minutes: 10, body: 'Complete, accurate, consistent, unique, valid, reconciled. A LEFT JOIN with IS NULL finds rows missing from the target.' },
      ],
      quiz: [
        { q: 'Why keep a raw staging copy?', options: ['To rerun without going back to the source', 'To save space', 'To delete the source', 'It is not needed'], answer: 0 },
        { q: 'A load that can run twice without adding rows twice is…', options: ['Idempotent', 'Broken', 'Faster', 'Manual'], answer: 0 },
        { q: 'Which finds rows in the source but not in the target?', options: ['LEFT JOIN … WHERE target.id IS NULL', 'INNER JOIN', 'ORDER BY', 'LIMIT'], answer: 0 },
        { q: 'SCD Type 2 keeps…', options: ['History, with start and end dates', 'Only the latest value', 'Nothing', 'Only deletes'], answer: 0 },
        { q: 'Which check comes first when totals differ?', options: ['Reconciliation of counts and totals', 'Changing the colours', 'Deleting the target', 'A new dashboard'], answer: 0 },
      ],
    },
    explore: {
      title: 'Explore: Apache Airflow',
      repo: { fullName: 'apache/airflow', url: 'https://github.com/apache/airflow', description: 'Apache Airflow - A platform to programmatically author, schedule, and monitor workflows.', difficulty: 'Intermediate', prerequisites: 'Module 8 lessons', license: 'Apache-2.0' },
      architecture: ['A workflow is a set of steps run in order, on a schedule.', 'Each step is a task; failures are logged and can be retried.', 'Read how a simple example workflow is defined.'],
      task: 'Open the repository and read the README. Then answer three questions.',
      questions: [
        { q: describe(''), options: ['A platform to author, schedule and monitor workflows', 'A spreadsheet', 'A chatbot', 'A photo app'], answer: 0 },
        { q: 'Which licence does it use?', options: ['Apache-2.0', 'None', 'Paid only', 'MIT'], answer: 0 },
        { q: 'Why does a pipeline tool log each step?', options: ['So failures can be found and retried', 'To make files bigger', 'It does not', 'For decoration'], answer: 0 },
      ],
    },
    build: {
      title: 'Build: Your Validation Pack',
      tools: ['Python', 'SQLite', 'PostgreSQL', 'Other'],
      fields: [
        { key: 'pipeline', label: 'Your pipeline', hint: 'Sources, staging, transform, target, and the logs at each stop.', minWords: 30 },
        { key: 'loads', label: 'Your loads', hint: 'Full or incremental, the watermark, and the rerun test.', minWords: 30 },
        { key: 'reconcile', label: 'Reconciliation summary', hint: 'Source total, target total, difference, and what explains it.', minWords: 40 },
        { key: 'limits', label: 'Limits of the pipeline', hint: 'What is not automated or monitored yet.', minWords: 15 },
      ],
    },
    proof: { title: 'Submit Proof: Share Your Validation Pack', checklist: ['My pack link is viewable', 'No real account numbers appear anywhere', 'My reconciliation explains the whole difference'] },
    boss: {
      title: 'Evaluation + Boss: The Reconciliation Trial',
      intro: 'Four situations. Choose the right pipeline move and say why.',
      choices: ['Stage, check, reconcile, and make the load safe to rerun', 'Fix the totals by hand', 'Skip the check this month'],
      scenarios: [
        { s: 'The warehouse total is ₹4,82,300 short.', correct: [0] },
        { s: 'Running last night\'s load again would double the orders.', correct: [0] },
        { s: 'A customer moved city; old orders must keep the old city.', correct: [0] },
        { s: 'One branch sends dates in a format the transform rejects.', correct: [0] },
      ],
    },
  },
  // ───────────── M9 Capstone ─────────────
  {
    code: 'DA09_CAPSTONE_READINESS', xp: 300,
    briefing: {
      title: 'Mission Briefing: Your Big Project',
      problem: 'An owner says "help us understand our sales" and gives you four days. A vague request can swallow the whole time.',
      objective: 'Define the problem, prepare the data, answer it, show it, and present it.',
      outcome: 'A problem definition, a frozen dataset, a dashboard with checked findings, and a five-minute talk.',
      criteria: ['Turn a vague request into a measurable question', 'Freeze and document the dataset', 'Present one finding, one limit and one action'],
      check: { q: 'Which is a strong project question?', options: ['Analyse sales', 'Which five products earned most in each branch last quarter, and how did that change?', 'Make a dashboard'], answer: 1, why: 'It has a measure, a period, a breakdown and a decision behind it.' },
    },
    learn: {
      title: 'Learn: Define, Prepare, Answer, Present',
      lessons: [
        { title: 'Problem definition', minutes: 8, body: 'Question, audience, decision, data, success, and what is out of scope.' },
        { title: 'Freeze the data', minutes: 8, body: 'Filter in SQL, clean in Python with a log, save one versioned file, and write a data dictionary.' },
        { title: 'Tell the story', minutes: 10, body: 'The question, what you did, what you found, how sure you are, and what to do next. Use STAR for interview stories.' },
      ],
      quiz: [
        { q: 'A problem definition must name…', options: ['The decision the answer supports', 'Only the topic', 'The font', 'The tool only'], answer: 0 },
        { q: 'Why analyse only the frozen file?', options: ['So answers stay the same if raw data changes', 'It is smaller', 'It is prettier', 'No reason'], answer: 0 },
        { q: 'What does STAR stand for?', options: ['Situation, Task, Action, Result', 'Start, Test, Add, Run', 'Sort, Table, Average, Rank', 'None'], answer: 0 },
        { q: 'A finding must include…', options: ['A number, its query, and a limit', 'Only an opinion', 'Only a chart', 'Nothing'], answer: 0 },
        { q: 'A prediction should be compared with…', options: ['A simple baseline', 'Nothing', 'A random colour', 'Last year\'s font'], answer: 0 },
      ],
    },
    explore: {
      title: 'Explore: Data Science for Beginners',
      repo: { fullName: 'microsoft/Data-Science-For-Beginners', url: 'https://github.com/microsoft/Data-Science-For-Beginners', description: '10 Weeks, 20 Lessons, Data Science for All!', difficulty: 'Beginner', prerequisites: 'Modules 1–8', license: 'MIT' },
      architecture: ['Lessons are grouped into sections, from defining data science to working with real data.', 'Each lesson has a README and practice.', 'Use it to review any topic before your capstone.'],
      task: 'Open the repository and read the README. Then answer three questions.',
      questions: [
        { q: describe(''), options: ['A data science course with lessons', 'A database server', 'A game', 'A chatbot'], answer: 0 },
        { q: 'How many lessons does its description mention?', options: ['20', '3', '100', '45'], answer: 0 },
        { q: 'Which licence does it use?', options: ['MIT', 'None', 'Paid only', 'Unknown'], answer: 0 },
      ],
    },
    build: {
      title: 'Build: Your Capstone Pack',
      tools: ['SQL', 'Python', 'Power BI', 'Other'],
      fields: [
        { key: 'definition', label: 'Problem definition', hint: 'Question, audience, decision, data, success, out of scope.', minWords: 40 },
        { key: 'data', label: 'Data preparation', hint: 'Your extracts, cleaning steps with counts, and the frozen file.', minWords: 30 },
        { key: 'findings', label: 'Three findings', hint: 'Each with a number, its query, and a limit.', minWords: 40 },
        { key: 'limits', label: 'Limits and next steps', hint: 'What you would do with one more week.', minWords: 15 },
      ],
    },
    proof: { title: 'Submit Proof: Share Your Capstone', checklist: ['My capstone link is viewable', 'I removed all personal data about real people', 'My talk names one finding, one limit and one action'] },
    boss: {
      title: 'Evaluation + Boss: The Viva Trial',
      intro: 'Four situations from a viva. Choose the right answer move and say why.',
      choices: ['Give the reason, the number and the limit', 'Say "the tool did it"', 'Change the subject'],
      scenarios: [
        { s: 'The reviewer asks why you used a LEFT JOIN.', correct: [0] },
        { s: 'The owner asks how sure you are about a finding.', correct: [0] },
        { s: 'An interviewer asks about a time AI gave you a wrong answer.', correct: [0] },
        { s: 'The reviewer asks why your model beats the baseline.', correct: [0] },
      ],
    },
  },
];

// ───────────── Builder: spec → six activity rows, with options shuffled deterministically ─────────────

/** Small string hash for a stable shuffle (same text → same order on every run). */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/** Shuffle options with a seed; return the new order and where the old correct index went. */
export function shuffle<T>(items: T[], seed: string): { items: T[]; map: number[] } {
  const idx = items.map((_, i) => i);
  let h = hash(seed);
  for (let i = idx.length - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 15), 2246822519) >>> 0;
    const j = h % (i + 1);
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  const map: number[] = []; // map[oldIndex] = newIndex
  idx.forEach((oldI, newI) => { map[oldI] = newI; });
  return { items: idx.map(i => items[i]), map };
}

const shuffleQuiz = (q: Quiz): Quiz => { const s = shuffle(q.options, q.q); return { q: q.q, options: s.items, answer: s.map[q.answer] }; };

export type ActivityRow = { idx: number; code: string; title: string; xp: number; config: Record<string, unknown> };

export function buildModule(m: ModuleSpec): ActivityRow[] {
  const x = xpSplit(m.xp);
  const check = (() => { const s = shuffle(m.briefing.check.options, m.briefing.check.q); return { ...m.briefing.check, options: s.items, answer: s.map[m.briefing.check.answer] }; })();
  const bossChoices = shuffle(m.boss.choices, m.code + ':boss');
  return [
    { idx: 1, code: 'MISSION_BRIEFING', title: m.briefing.title, xp: x.briefing, config: { kind: 'briefing', estMinutes: 10, problem: m.briefing.problem, objective: m.briefing.objective, outcome: m.briefing.outcome, criteria: m.briefing.criteria, check, draft: true } },
    { idx: 2, code: 'LEARN', title: m.learn.title, xp: x.learn, config: { kind: 'learn', estMinutes: 45, passPct: 60, lessons: m.learn.lessons, resources: [], quiz: m.learn.quiz.map(shuffleQuiz), draft: true } },
    { idx: 3, code: 'EXPLORE_DATASET', title: m.explore.title, xp: x.explore, config: { kind: 'explore', estMinutes: 30, passMin: 2, repo: { ...m.explore.repo, lastVerified: VERIFIED_ON }, architecture: m.explore.architecture, task: m.explore.task, questions: m.explore.questions.map(shuffleQuiz), draft: true } },
    { idx: 4, code: 'BUILD', title: m.build.title, xp: x.build, config: { kind: 'build', estMinutes: 90, tools: m.build.tools, fields: m.build.fields, iterations: 0, iterationRules: { promptMinWords: 10, outputMinWords: 15, changeMinWords: 10, maxSimilarity: 0.85 }, draft: true } },
    { idx: 5, code: 'SUBMIT_PROOF', title: m.proof.title, xp: x.proof, config: { kind: 'proof', estMinutes: 15, minWords: 50, evidenceTypes: ['Public document link (Google Docs, Notion, GitHub)', 'Spreadsheet or notebook link with view access', 'Video walkthrough link'], checklist: m.proof.checklist, draft: true } },
    { idx: 6, code: 'EVALUATION_BOSS', title: m.boss.title, xp: x.boss, config: { kind: 'boss', estMinutes: 30, rubric: `${m.code}_RUBRIC`, attempts: 3, xpSplit: { base: x.bossBase, bossBonus: x.bossBonus }, intro: m.boss.intro, choices: bossChoices.items, scenarios: m.boss.scenarios.map(s => ({ s: s.s, correct: s.correct.map(c => bossChoices.map[c]) })), minWhyWords: 6, draft: true } },
  ];
}
