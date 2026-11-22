/**
 * Detailed instructions for the domain journeys' guided steps, like the Agent Lab setup guide. The module templates
 * (guided.ts) say *what* to do; this turns "run the code from the lesson" into exact clicks in Databricks, the day's own
 * code in copy boxes (SQL, notebook, PySpark for Hard/Critical, CLI for bundles), what you should see, and fixes for the
 * errors learners actually hit. Every step also gets a time estimate.
 */
import type { DoItem, FixItem, GuidedStep, SeeItem } from '../guidedSteps';

type DayCode = { code?: { lang: string; text: string }; pyspark?: string };

export const RUN_IT = 'Run the code from the lesson above (Hard and Critical tracks: run the PySpark version too and keep that notebook).';

export const DATABRICKS_FIX: FixItem[] = [
  { problem: '[TABLE_OR_VIEW_NOT_FOUND] or SCHEMA_NOT_FOUND', solution: 'An earlier day’s code has not been run in this workspace, or the catalog name differs. Run the previous days’ code first, and check the catalog and schema picked at the top of the editor.' },
  { problem: 'PERMISSION_DENIED when creating a catalog', solution: 'Free Edition may not allow CREATE CATALOG. Use the workspace catalog and put your catalog name in front of each schema, as the lesson explains.' },
  { problem: 'The query keeps spinning on “Starting warehouse” / “Connecting”', solution: 'Serverless compute takes up to a minute to start the first time each day. Wait, then run again.' },
  { problem: '[PARSE_SYNTAX_ERROR]', solution: 'Part of the code was not copied. Clear the editor, click Copy on the box again and paste once.' },
  { problem: 'PATH_NOT_FOUND for a /Volumes/… path', solution: 'Upload the file into the volume first (Catalog → your catalog → bronze → raw_files → Upload to this volume), and check the file name matches exactly.' },
];

const sqlRun = (sql: string): DoItem[] => [
  'Open your Databricks workspace and sign in.',
  'Click SQL Editor in the left menu, then + to open a new query tab.',
  'At the top of the editor choose the Serverless Starter Warehouse (any running warehouse is fine).',
  { text: 'Copy the SQL and paste it into the editor:', cmd: sql, lang: 'sql' },
  { text: 'Run it: click Run, or press', keys: ['Ctrl', 'Enter'], os: 'windows' },
  { text: 'Run it: click Run, or press', keys: ['⌘', 'Enter'], os: 'macos' },
];

const notebookRun = (code: string, label: string): DoItem[] => [
  `Open a notebook for ${label}: Workspace → Create → Notebook (or reuse today’s notebook).`,
  'Click Connect at the top right and choose Serverless.',
  { text: 'Paste the code into a cell:', cmd: code, lang: 'python' },
  { text: 'Run the cell: click ▶, or press', keys: ['Shift', 'Enter'] },
];

const bundleRun = (yaml: string): DoItem[] => [
  { text: 'Install the Databricks CLI:', cmd: 'winget install Databricks.DatabricksCLI', lang: 'ps', os: 'windows' },
  { text: 'Install the Databricks CLI:', cmd: 'brew tap databricks/tap && brew install databricks', lang: 'sh', os: 'macos' },
  { text: 'Log in (paste your workspace URL; a browser window opens to confirm):', cmd: 'databricks auth login --host https://<your-workspace>.cloud.databricks.com' },
  { text: 'Make a project folder, and save this as databricks.yml inside it:', cmd: yaml, lang: 'yaml' },
  { text: 'In that folder, check the bundle:', cmd: 'databricks bundle validate' },
];

/** The instructions for "run the code" on a day, from the day's own code. */
export function runItems(x: DayCode, advanced: boolean): { do: DoItem[]; see: SeeItem[]; fix: FixItem[] } {
  const items: DoItem[] = [];
  const see: SeeItem[] = [];
  if (x.code?.lang === 'yaml') {
    items.push(...bundleRun(x.code.text));
    see.push({ text: 'The CLI checks the bundle and ends with Validation OK.', sample: 'Name: …\nTarget: dev\nWorkspace: …\n\nValidation OK!' });
    return { do: items, see, fix: [{ problem: '“databricks: command not found”', solution: 'Open a new terminal after installing. On Windows, close and reopen PowerShell.' }, { problem: 'Error: cannot resolve bundle auth', solution: 'Run databricks auth login again with your workspace URL.' }, ...DATABRICKS_FIX.slice(0, 1)] };
  }
  if (x.code?.lang === 'sql') { items.push(...sqlRun(x.code.text)); see.push({ text: 'The result appears under the editor with no red error. Statements like CREATE or INSERT show a short status (OK, or rows affected).' }); }
  else if (x.code) { items.push(...notebookRun(x.code.text, 'today’s Python')); see.push({ text: 'The output appears under the cell with a green tick and no red error.' }); }
  if (advanced && x.pyspark) {
    items.push(...notebookRun(x.pyspark, 'the PySpark version (Hard and Critical tracks: this is the version you submit)'));
    see.push({ text: 'The PySpark cell finishes and gives the same numbers as the SQL.' });
  }
  if (!items.length) items.push('Follow the code in the lesson above, in order.');
  return { do: items, see, fix: DATABRICKS_FIX };
}

const MINUTES: Record<string, number> = { tick: 5, answer: 10, paste: 15, screenshot: 15 };

/** Turn a template step into a detailed one: real run instructions, what you should see, fixes, and a time estimate. */
export function detailStep(s: GuidedStep, x: DayCode, advanced: boolean): GuidedStep {
  const runs = s.do.some(d => d === RUN_IT);
  if (!runs) return { ...s, minutes: s.minutes ?? MINUTES[s.check.kind] };
  const r = runItems(x, advanced);
  return {
    ...s,
    do: s.do.flatMap(d => (d === RUN_IT ? r.do : [d])),
    see: [...(s.see ?? []), ...r.see],
    fix: [...(s.fix ?? []), ...r.fix],
    minutes: s.minutes ?? (x.pyspark && advanced ? 30 : 20),
  };
}

/* ---------- Power BI with Databricks (Module 7) ---------- */

export const PBI_FIX: FixItem[] = [
  { problem: 'You use a Mac', solution: 'Power BI Desktop runs only on Windows. Use a Windows computer at your institute or a Windows virtual machine; the steps are the same.' },
  { problem: 'Power BI asks how to sign in to Azure Databricks', solution: 'Choose Personal Access Token and paste the token you generated. Never share the token.' },
  { problem: '“The credentials provided are invalid”', solution: 'The token expired or was copied with a space. Generate a new one (Settings → Developer → Access tokens) and paste it again.' },
  { problem: 'Power BI cannot reach the server', solution: 'Copy Server hostname without https:// and the HTTP path exactly from the warehouse’s Connection details tab, and start the warehouse first.' },
];

export const PBI_CONNECT: DoItem[] = [
  'In Databricks: SQL Warehouses (left menu) → click your warehouse → Connection details tab. Keep Server hostname and HTTP path open.',
  'In Databricks: your profile (top right) → Settings → Developer → Access tokens → Generate new token. Copy it now; it is shown once.',
  'Open Power BI Desktop (Windows) → Home → Get data → More… → search “Azure Databricks” → Connect.',
  'Paste Server hostname and HTTP path, choose Import, click OK. Sign in with Personal Access Token and paste the token.',
];
