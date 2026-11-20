/**
 * Module 2 hands-on lab: the learner's own CSV, opened in Excel, then loaded into a SQL database of their choice
 * (MySQL, PostgreSQL, SQLite or PGlite). Every formula, DDL statement, load command and query here is generated
 * from the journey's real dataset columns, so the steps match the file the learner made on Day 7.
 */
import type { ColumnRule } from './datasetCheck';
import type { DomainSpec } from './types';

export type Dialect = 'mysql' | 'postgres' | 'sqlite' | 'pglite';
export const DIALECTS: { id: Dialect; name: string; when: string }[] = [
  { id: 'mysql', name: 'MySQL 8', when: 'The most common database in Indian companies and web apps. A server you install once and start.' },
  { id: 'postgres', name: 'PostgreSQL 16', when: 'The most-used open-source database for analytics; the SQL you write here works in Databricks and most clouds.' },
  { id: 'sqlite', name: 'SQLite', when: 'Nothing to run: the whole database is one file. Best on a slow laptop or a shared computer.' },
  { id: 'pglite', name: 'PGlite (PostgreSQL in your browser)', when: 'No install at all: real PostgreSQL inside a browser tab. Best if you cannot install software.' },
];

export type LabCols = { table: string; db: string; key: ColumnRule; date: ColumnRule; num: ColumnRule; cat: ColumnRule & { values: string[] }; all: ColumnRule[] };

/** The columns the worked examples use: the key, the first date, the best numeric measure and the first category. */
export function labCols(d: DomainSpec): LabCols {
  const all = d.dataset.columns;
  const key = all.find(c => c.key) ?? all[0];
  const date = all.find(c => c.type === 'date') ?? all[1];
  const nums = all.filter(c => !c.key && (c.type === 'number' || c.type === 'integer'));
  const num = nums.find(c => c.type === 'number') ?? nums.find(c => !/^(grade|age)$/.test(c.name)) ?? nums[0] ?? all[1];
  const cat = (all.find(c => c.type === 'category' && (c.values?.length ?? 0) > 1) ?? all.find(c => c.type === 'category')) as LabCols['cat'];
  return { table: d.dataset.name, db: d.catalog, key, date, num, cat: cat ?? { ...all[1], values: ['A'] } as LabCols['cat'], all };
}

const excelCol = (i: number) => { let s = ''; for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s; return s; };
const T = (c: LabCols) => `tbl_${c.table}`;
const ref = (c: LabCols, col: ColumnRule) => `${T(c)}[${col.name}]`;

/* ───────── Excel ───────── */

export function excelLoadSteps(c: LabCols): string[] {
  return [
    'Open Excel (Microsoft 365, Excel 2021 or Excel on the web). Google Sheets also works: File → Import → Upload.',
    `Windows: **Data → Get Data → From File → From Text/CSV** and choose ${c.table}.csv. Mac: **File → Import → CSV file**.`,
    'In the preview, set **File origin: 65001 Unicode (UTF-8)** and **Delimiter: Comma**, then click **Transform Data** (Power Query).',
    `In Power Query, set the column types: ${c.key.name} → Text (keeps leading zeros), ${c.date.name} → Date, ${c.num.name} → Decimal Number. Leave messy values as they are; you will find them on Day 8.`,
    'Click **Close & Load**. The data lands on a new sheet as an Excel Table.',
    `Click inside the table → **Table Design → Table Name** and rename it to **${T(c)}**. Every formula this week uses that name.`,
    `Check the row count: click the ${c.key.name} column header and read **Count** in the status bar. Write it down; SQL must give the same number on Day 10.`,
    'View → Freeze Panes → Freeze Top Row, then save the workbook as **.xlsx** next to your CSV.',
  ];
}

export function excelKpiFormulas(c: LabCols): { label: string; formula: string }[] {
  const v = c.cat.values[0];
  return [
    { label: 'Rows in the file', formula: `=ROWS(${ref(c, c.key)})` },
    { label: `Distinct ${c.key.name} (duplicates = rows − distinct)`, formula: `=COUNTA(UNIQUE(${ref(c, c.key)}))` },
    { label: `Average ${c.num.name}`, formula: `=AVERAGE(${ref(c, c.num)})` },
    { label: `Total ${c.num.name}`, formula: `=SUM(${ref(c, c.num)})` },
    { label: `Rows where ${c.cat.name} = "${v}"`, formula: `=COUNTIFS(${ref(c, c.cat)},"${v}")` },
    { label: `Share of "${v}"`, formula: `=COUNTIFS(${ref(c, c.cat)},"${v}")/ROWS(${ref(c, c.key)})` },
    { label: `Blank ${c.num.name} values`, formula: `=COUNTBLANK(${ref(c, c.num)})` },
    { label: `Non-numbers in ${c.num.name} (typos such as "AB")`, formula: `=SUMPRODUCT(--NOT(ISNUMBER(${ref(c, c.num)})))-COUNTBLANK(${ref(c, c.num)})` },
  ];
}

export function excelDailyFormulas(c: LabCols): { cell: string; formula: string; meaning: string }[] {
  const v = c.cat.values[0];
  return [
    { cell: 'A2', formula: `=SORT(UNIQUE(${ref(c, c.date)}))`, meaning: `every ${c.date.name}, one per row (it spills down by itself)` },
    { cell: 'B2', formula: `=COUNTIFS(${ref(c, c.date)},A2#)`, meaning: 'rows on that day' },
    { cell: 'C2', formula: `=AVERAGEIFS(${ref(c, c.num)},${ref(c, c.date)},A2#)`, meaning: `average ${c.num.name} that day` },
    { cell: 'D2', formula: `=SUMIFS(${ref(c, c.num)},${ref(c, c.date)},A2#)`, meaning: `total ${c.num.name} that day` },
    { cell: 'E2', formula: `=COUNTIFS(${ref(c, c.date)},A2#,${ref(c, c.cat)},"${v}")`, meaning: `rows with ${c.cat.name} = "${v}" that day` },
    { cell: 'F2', formula: `=E2#/B2#`, meaning: `share of "${v}" that day (format as %)` },
  ];
}

export function excelWhyFunctions(c: LabCols): { fn: string; use: string; example: string }[] {
  const v = c.cat.values[0];
  return [
    { fn: 'MAXIFS / MINIFS', use: 'the highest or lowest value under a condition', example: `=MAXIFS(${ref(c, c.num)},${ref(c, c.cat)},"${v}")` },
    { fn: 'XLOOKUP', use: 'which day had the highest daily count (looks up across your Daily sheet)', example: '=XLOOKUP(MAX(Daily!B2#),Daily!B2#,Daily!A2#)' },
    { fn: 'COUNTIFS (two conditions)', use: `break the worst day down by ${c.cat.name}`, example: `=COUNTIFS(${ref(c, c.date)},$H$1,${ref(c, c.cat)},G2)` },
    { fn: 'FILTER', use: 'list every row of the worst day to read them', example: `=FILTER(${T(c)},${ref(c, c.date)}=$H$1)` },
    { fn: 'IF', use: 'flag rows that need a look', example: `=IF(ISNUMBER([@${c.num.name}]),"OK","Check")` },
    { fn: 'TEXT + WEEKDAY', use: 'is it always the same weekday?', example: `=TEXT([@${c.date.name}],"dddd")` },
    { fn: 'PivotTable', use: `Insert → PivotTable: Rows = ${c.date.name}, Columns = ${c.cat.name}, Values = Count of ${c.key.name}`, example: 'Right-click a date → Group → Days or Months' },
  ];
}

/** Excel formula that turns one row into an INSERT statement (the no-import route for PGlite, or any database).
 *  Every value is quoted: the _raw table is all text, and an empty cell must become '' rather than broken SQL. */
export function excelInsertFormula(c: LabCols): string {
  const parts = c.all.map((col, i) => {
    const cell = `${excelCol(i)}2`;
    if (col.type === 'date') return `"'"&TEXT(${cell},"yyyy-mm-dd")&"'"`;
    return `"'"&SUBSTITUTE(${cell},"'","''")&"'"`;
  });
  return `="INSERT INTO ${c.table}_raw VALUES ("&${parts.join('&", "&')}&");"`;
}

/* ───────── SQL ───────── */

export const INSTALL: Record<Dialect, { os: string; steps: string[] }[]> = {
  mysql: [
    { os: 'Windows', steps: ['Download **MySQL Installer (Community)** from dev.mysql.com/downloads/installer.', 'Choose **Server only** (or Developer Default to get MySQL Workbench too), click Execute, then Next.', 'Set a root password you will remember. Keep "Start the MySQL Server at System Startup" ticked.', 'Open **MySQL 8.0 Command Line Client** from the Start menu and type the root password.'] },
    { os: 'Mac', steps: ['Install Homebrew from brew.sh if you do not have it.', 'In Terminal: `brew install mysql` then `brew services start mysql`.', 'Set a root password: `mysql_secure_installation`.', 'Connect: `mysql -u root -p`.'] },
    { os: 'Ubuntu / WSL', steps: ['`sudo apt update && sudo apt install mysql-server`', '`sudo systemctl start mysql` (on WSL: `sudo service mysql start`)', 'Connect: `sudo mysql`'] },
  ],
  postgres: [
    { os: 'Windows', steps: ['Download the **EDB installer** for PostgreSQL 16 from postgresql.org/download/windows.', 'Keep the default port 5432 and set a password for the postgres user.', 'Untick Stack Builder at the end; you do not need it.', 'Open **SQL Shell (psql)** from the Start menu and press Enter four times, then type your password.'] },
    { os: 'Mac', steps: ['Easiest: install **Postgres.app** from postgresapp.com, open it and click Initialize.', 'Or with Homebrew: `brew install postgresql@16` then `brew services start postgresql@16`.', 'Connect: `psql postgres`.'] },
    { os: 'Ubuntu / WSL', steps: ['`sudo apt update && sudo apt install postgresql`', '`sudo service postgresql start`', 'Connect: `sudo -u postgres psql`'] },
  ],
  sqlite: [
    { os: 'Windows', steps: ['Download **sqlite-tools-win-x64** from sqlite.org/download.html and unzip it to C:\\sqlite.', 'Open Command Prompt in the folder with your CSV and run `C:\\sqlite\\sqlite3.exe`.', 'Prefer a window? **DB Browser for SQLite** (sqlitebrowser.org) does the same with buttons.'] },
    { os: 'Mac', steps: ['SQLite is already installed. Open Terminal in the folder with your CSV and run `sqlite3`.'] },
    { os: 'Ubuntu / WSL', steps: ['`sudo apt install sqlite3`, then run `sqlite3` in the folder with your CSV.'] },
  ],
  pglite: [
    { os: 'Any computer (browser)', steps: ['Open **pglite.dev/repl** in Chrome, Edge or Firefox. A real PostgreSQL starts inside the tab; nothing is installed.', 'Type `SELECT version();` and press Ctrl+Enter (Cmd+Enter on Mac).', 'Your data lives only in this tab: keep your SQL in a text file so you can paste it again.'] },
    { os: 'With Node.js (optional)', steps: ['`npx @electric-sql/pglite-socket` starts PGlite as a local server on port 5432.', 'Connect with any PostgreSQL client, for example `psql -h localhost -p 5432 -U postgres`.'] },
  ],
};

export function checkInstall(x: Dialect): string {
  return { mysql: 'SELECT VERSION();\nSHOW DATABASES;', postgres: 'SELECT version();\n\\l', sqlite: '.version\n.databases', pglite: 'SELECT version();' }[x];
}

export function createDatabase(x: Dialect, c: LabCols): string {
  return {
    mysql: `CREATE DATABASE ${c.db};\nUSE ${c.db};\nSELECT DATABASE();   -- shows ${c.db}`,
    postgres: `CREATE DATABASE ${c.db};\n\\c ${c.db}\nSELECT current_database();   -- shows ${c.db}`,
    sqlite: `-- In SQLite the database is a file. Quit (.quit) and start again with the file name:\nsqlite3 ${c.db}.db\n.databases   -- shows ${c.db}.db`,
    pglite: `-- PGlite has one database per tab. Use a schema to keep your tables together:\nCREATE SCHEMA ${c.db};\nSET search_path TO ${c.db};\nSELECT current_schema();   -- shows ${c.db}`,
  }[x];
}

function sqlType(x: Dialect, col: ColumnRule): string {
  const my = x === 'mysql', lite = x === 'sqlite';
  if (col.type === 'integer') return lite ? 'INTEGER' : 'INT';
  if (col.type === 'number') return lite ? 'REAL' : my ? 'DECIMAL(14,2)' : 'NUMERIC(14,2)';
  if (col.type === 'date') return lite ? 'TEXT' : 'DATE';
  if (col.type === 'category') return lite ? 'TEXT' : 'VARCHAR(40)';
  return lite ? 'TEXT' : 'VARCHAR(100)';
}

/** Two tables: _raw takes the CSV exactly as it is (all text), the typed table only accepts clean rows. */
export function ddl(x: Dialect, c: LabCols): string {
  const text = x === 'mysql' ? 'VARCHAR(255)' : 'TEXT';
  const raw = `CREATE TABLE ${c.table}_raw (\n${c.all.map(col => `  ${col.name} ${text}`).join(',\n')}\n);`;
  const lines = c.all.map(col => {
    const checks: string[] = [];
    if (col.type === 'category' && col.values?.length) checks.push(`CHECK (${col.name} IN (${col.values.map(v => `'${v.replace(/'/g, "''")}'`).join(', ')}))`);
    if ((col.type === 'number' || col.type === 'integer') && col.min !== undefined && col.max !== undefined) checks.push(`CHECK (${col.name} BETWEEN ${col.min} AND ${col.max})`);
    return `  ${col.name} ${sqlType(x, col)}${col.key ? ' PRIMARY KEY' : col.required ? ' NOT NULL' : ''}${checks.length ? ' ' + checks.join(' ') : ''}`;
  });
  const typed = `CREATE TABLE ${c.table} (\n${lines.join(',\n')}\n);`;
  const show = { mysql: `SHOW TABLES;\nDESCRIBE ${c.table};`, postgres: `\\dt\n\\d ${c.table}`, sqlite: `.tables\n.schema ${c.table}`, pglite: `SELECT table_name FROM information_schema.tables WHERE table_schema = '${c.db}';` }[x];
  return `-- 1. Landing table: every column is text, so the CSV loads even with typos\n${raw}\n\n-- 2. Clean table: real types, a primary key and the allowed values\n${typed}\n\n-- 3. Check both tables exist\n${show}`;
}

export function loadCsv(x: Dialect, c: LabCols): string {
  return {
    mysql: `-- Start the client with file loading allowed:  mysql --local-infile=1 -u root -p ${c.db}\nSET GLOBAL local_infile = 1;\nLOAD DATA LOCAL INFILE '/full/path/to/${c.table}.csv'\nINTO TABLE ${c.table}_raw\nFIELDS TERMINATED BY ',' OPTIONALLY ENCLOSED BY '"'\nLINES TERMINATED BY '\\r\\n'   -- a file saved on Windows (Notepad). Saved on a Mac or Linux? Use '\\n'\nIGNORE 1 LINES;\n-- Windows paths use forward slashes: 'C:/Users/you/Downloads/${c.table}.csv'`,
    postgres: `\\copy ${c.table}_raw FROM '/full/path/to/${c.table}.csv' WITH (FORMAT csv, HEADER true)`,
    sqlite: `.import --csv --skip 1 ${c.table}.csv ${c.table}_raw`,
    pglite: `-- The browser cannot read files from your disk, so make INSERT statements in Excel:\n-- in the first empty column of ${T(c)}, row 2, paste this formula and fill it down:\n${excelInsertFormula(c)}\n-- Copy the whole column, paste it into the REPL and run it.`,
  }[x];
}

const isNum = (x: Dialect, e: string) => x === 'mysql' ? `${e} REGEXP '^-?[0-9]+(\\\\.[0-9]+)?$'` : x === 'sqlite' ? `(${e} <> '' AND ${e} NOT GLOB '*[^0-9.-]*')` : `${e} ~ '^-?[0-9]+(\\.[0-9]+)?$'`;
const isDate = (x: Dialect, e: string) => x === 'mysql' ? `${e} REGEXP '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'` : x === 'sqlite' ? `${e} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'` : `${e} ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'`;
const castNum = (x: Dialect, col: ColumnRule, e: string) => `CAST(${e} AS ${x === 'sqlite' ? (col.type === 'integer' ? 'INTEGER' : 'REAL') : x === 'mysql' ? (col.type === 'integer' ? 'SIGNED' : 'DECIMAL(14,2)') : (col.type === 'integer' ? 'INT' : 'NUMERIC(14,2)')})`;

export function checkData(x: Dialect, c: LabCols): string {
  const r = `${c.table}_raw`;
  return [
    `-- How many rows arrived? It must match the Excel count from Day 7.\nSELECT COUNT(*) AS rows_loaded FROM ${r};`,
    `-- Look at the first rows\nSELECT * FROM ${r} LIMIT 10;`,
    `-- Duplicate keys\nSELECT ${c.key.name}, COUNT(*) AS copies FROM ${r} GROUP BY ${c.key.name} HAVING COUNT(*) > 1;`,
    `-- Values in ${c.num.name} that are not numbers (for example "AB")\nSELECT ${c.num.name}, COUNT(*) FROM ${r} WHERE NOT (${isNum(x, c.num.name)}) GROUP BY ${c.num.name};`,
    `-- ${c.cat.name} values outside the allowed list\nSELECT ${c.cat.name}, COUNT(*) FROM ${r} WHERE ${c.cat.name} NOT IN (${c.cat.values.map(v => `'${v}'`).join(', ')}) GROUP BY ${c.cat.name};`,
  ].join('\n\n');
}

/** Copy only clean rows into the typed table. CASE guards make every cast safe, in every database. */
export function copyClean(x: Dialect, c: LabCols): string {
  const r = `${c.table}_raw`;
  const conds: string[] = [`${c.key.name} IN (SELECT ${c.key.name} FROM ${r} GROUP BY ${c.key.name} HAVING COUNT(*) = 1)`];
  const sel = c.all.map(col => {
    if (col.type === 'number' || col.type === 'integer') {
      const safe = `CASE WHEN ${isNum(x, col.name)} THEN ${castNum(x, col, col.name)} END`;
      conds.push(col.min !== undefined && col.max !== undefined ? `${safe} BETWEEN ${col.min} AND ${col.max}` : `${safe} IS NOT NULL`);
      return `  ${castNum(x, col, col.name)}`;
    }
    if (col.type === 'date') { conds.push(isDate(x, col.name)); return x === 'sqlite' ? `  ${col.name}` : `  CAST(${col.name} AS DATE)`; }
    if (col.type === 'category' && col.values?.length) conds.push(`${col.name} IN (${col.values.map(v => `'${v.replace(/'/g, "''")}'`).join(', ')})`);
    else if (col.required) conds.push(`${col.name} <> ''`);
    return `  ${col.name}`;
  });
  return `INSERT INTO ${c.table}\nSELECT\n${sel.join(',\n')}\nFROM ${r}\nWHERE ${conds.join('\n  AND ')};\n\n-- Rows kept and rows rejected\nSELECT (SELECT COUNT(*) FROM ${c.table}) AS clean_rows, (SELECT COUNT(*) FROM ${r}) - (SELECT COUNT(*) FROM ${c.table}) AS rejected_rows;`;
}

export function kpiQueries(c: LabCols): string {
  const v = c.cat.values[0];
  return [
    `-- Overall numbers (compare with your Excel KPI sheet)\nSELECT COUNT(*) AS rows_total, COUNT(DISTINCT ${c.key.name}) AS distinct_keys,\n       ROUND(AVG(${c.num.name}), 2) AS avg_${c.num.name}, SUM(${c.num.name}) AS total_${c.num.name}\nFROM ${c.table};`,
    `-- Per day (the same table as your Excel Daily sheet)\nSELECT ${c.date.name} AS day, COUNT(*) AS rows_that_day,\n       ROUND(AVG(${c.num.name}), 2) AS avg_${c.num.name},\n       SUM(CASE WHEN ${c.cat.name} = '${v}' THEN 1 ELSE 0 END) AS ${c.cat.name}_${v.toLowerCase().replace(/[^a-z0-9]+/g, '_')}\nFROM ${c.table}\nGROUP BY ${c.date.name}\nORDER BY ${c.date.name};`,
    `-- Breakdown by ${c.cat.name}\nSELECT ${c.cat.name}, COUNT(*) AS rows_n, ROUND(AVG(${c.num.name}), 2) AS avg_${c.num.name}\nFROM ${c.table}\nGROUP BY ${c.cat.name}\nORDER BY rows_n DESC;`,
    `-- The busiest day, then what it was made of\nSELECT ${c.date.name}, COUNT(*) AS rows_n FROM ${c.table} GROUP BY ${c.date.name} ORDER BY rows_n DESC LIMIT 1;\nSELECT ${c.cat.name}, COUNT(*) FROM ${c.table}\nWHERE ${c.date.name} = (SELECT ${c.date.name} FROM ${c.table} GROUP BY ${c.date.name} ORDER BY COUNT(*) DESC LIMIT 1)\nGROUP BY ${c.cat.name};`,
  ].join('\n\n');
}

/** One markdown section per database, so the learner reads only their own. */
export function perDialect(title: string, fn: (x: Dialect) => string): string {
  return DIALECTS.map(d => `### ${title} · ${d.name}\n\`\`\`sql\n${fn(d.id)}\n\`\`\``).join('\n\n');
}
