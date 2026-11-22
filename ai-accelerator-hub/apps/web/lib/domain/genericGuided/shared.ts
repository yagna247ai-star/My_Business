/**
 * Building blocks for the AI-Powered Data Analytics journey's guided steps, written like the Agent Lab setup guide:
 * why → do (with copyable commands and code, per computer where it differs) → what you should see → fixes → check.
 * The tools: DB Browser for SQLite (SQL, Module 2), Python with IDLE (Modules 3–4, 7–8), Power BI Desktop (Module 5),
 * and any AI chat tool (Module 6). Everything is free.
 */
import type { DoItem, FixItem, GuidedStep, SeeItem, StepCheck } from '../guidedSteps';

export const ans = (prompt: string, hint?: string): StepCheck => ({ kind: 'answer', prompt, ...(hint ? { hint } : {}) });
export const shot = (prompt: string): StepCheck => ({ kind: 'screenshot', prompt });
export const tick = (prompt: string): StepCheck => ({ kind: 'tick', prompt });
/** All of these must appear (any order, any case). */
export const look = (...w: string[]) => w.map(x => `(?=[\\s\\S]*${x})`).join('');
export const paste = (prompt: string, pattern: string, sample: string, fail: string): StepCheck => ({ kind: 'paste', prompt, pattern, sample, fail });

type Extra = { see?: SeeItem[]; fix?: FixItem[]; minutes?: number; code?: { lang: string; text: string } };
export const S = (title: string, concept: string, d: DoItem | DoItem[], check: StepCheck, x: Extra = {}): GuidedStep =>
  ({ title, concept, do: Array.isArray(d) ? d : [d], check, ...x });

/* ---------- SQL in DB Browser for SQLite ---------- */

export const FOLDER = 'AnalyticsCourse';

export const INSTALL_DB_BROWSER: GuidedStep = S('Install DB Browser for SQLite',
  'SQLite is a small, free database that lives in one file on your computer. DB Browser for SQLite gives it buttons and a box to type SQL, so you can practise real SQL without setting up a server.',
  [
    { text: 'Open sqlitebrowser.org/dl in your browser and download the Windows installer (64-bit, the .msi file).', os: 'windows' },
    { text: 'Run the installer. Click Next on each screen; on the Shortcuts screen tick “DB Browser (SQLite)” on the Desktop.', os: 'windows' },
    { text: 'Open sqlitebrowser.org/dl in your browser and download the macOS .dmg file (Intel or Apple Silicon to match your Mac).', os: 'macos' },
    { text: 'Open the .dmg and drag DB Browser for SQLite into Applications. The first time, right-click it in Applications and choose Open.', os: 'macos' },
    `Make a folder called ${FOLDER} in your Documents folder. Everything you build in this course goes there.`,
    `Open DB Browser for SQLite, click New Database, go to Documents → ${FOLDER}, and save it as practice.db. Click Cancel on the “Edit table definition” window that opens.`,
  ],
  shot('DB Browser for SQLite with practice.db open (the file name shows in the title bar)'),
  {
    minutes: 15,
    see: [{ text: 'The title bar says “DB Browser for SQLite - …/AnalyticsCourse/practice.db”, with tabs Database Structure, Browse Data, Edit Pragmas and Execute SQL.' }],
    fix: [
      { problem: 'Windows says “Windows protected your PC”', solution: 'Click More info → Run anyway. The installer is the official one from sqlitebrowser.org.' },
      { problem: 'Mac says the app “cannot be opened because the developer cannot be verified”', solution: 'Right-click the app in Applications → Open → Open. You only need to do this once.' },
      { problem: 'You cannot find practice.db later', solution: `Use File → Open Database and go to Documents → ${FOLDER}. Recent files are also under File → recent list.` },
    ],
  });

/** Open practice.db, paste a setup script, run it and save. */
export const RUN_SQL: DoItem[] = [
  `Open DB Browser for SQLite. Click Open Database and choose Documents → ${FOLDER} → practice.db.`,
  'Click the Execute SQL tab.',
  'Click Copy on the SQL box below, then click in the Execute SQL editor and paste.',
  { text: 'Run all of it: click the ▶ (Execute all) button, or press', keys: ['Ctrl', 'Return'], os: 'windows' },
  { text: 'Run all of it: click the ▶ (Execute all) button, or press', keys: ['⌘', 'Return'], os: 'macos' },
  { text: 'Save the changes to the file: Write Changes, or press', keys: ['Ctrl', 'S'], os: 'windows' },
  { text: 'Save the changes to the file: Write Changes, or press', keys: ['⌘', 'S'], os: 'macos' },
];

export const SQL_FIX: FixItem[] = [
  { problem: 'Nothing happens when you press the keys', solution: 'Click inside the SQL editor first, then press the keys again, or use the ▶ button above the editor.' },
  { problem: '“no such table: …”', solution: 'Run today’s setup script first (step 1), and check that practice.db is the open file (title bar).' },
  { problem: '“near …: syntax error”', solution: 'Something was not copied whole. Delete everything in the editor, click Copy on the box again, and paste once.' },
  { problem: 'Only one query ran', solution: 'If you selected some text, only the selection runs. Click once in the editor so nothing is selected, then run again; or use Execute current line (Shift+F5) to run just the query under the cursor.' },
];

/** The first step of an SQL day: create and fill today's tables. */
export const sqlSetup = (what: string, script: string, countSql: string, count: number, table: string): GuidedStep => S(
  'Set up today’s practice tables',
  `Today’s questions are about ${what}. This script creates the tables and fills them with practice rows, so everyone works on the same data and can check their numbers. Running it again simply starts the tables fresh.`,
  [...RUN_SQL, `To check it worked, delete the editor text, paste this line and run it: ${countSql}`],
  paste(`Paste the result of ${countSql}`, `\\b${count}\\b`, String(count), `The ${table} table should have ${count} rows. Run the setup script again, then the count.`),
  { minutes: 5, code: { lang: 'sql', text: script },
    see: [{ text: 'The message pane under the editor says the execution finished without errors.', sample: 'Execution finished without errors.\nResult: query executed successfully. Took 0ms' }, { text: `The count query shows one number: ${count}.` }],
    fix: SQL_FIX });

/** A query step: write it (with a hint of the shape), run it, paste the query and the result line. */
export const sqlStep = (title: string, concept: string, task: string, needs: string[], shape: string, rows: string, fail: string, x: Extra = {}): GuidedStep => S(
  title, concept,
  [task, 'Start from the shape below and fill in the gaps. Type it yourself; that is how SQL sticks.', 'Run only this query: click in it and press Shift+F5 (Execute current line), or select it and run.', 'Copy your query and the line from the message pane that says how many rows came back.'],
  paste('Paste your query and the “rows returned” line', look('SELECT', ...needs), `${shape.replace(/…/g, '').trim()}\nResult: ${rows}`, fail),
  { minutes: 10, code: { lang: 'sql', text: shape }, see: [{ text: `The result grid shows the rows; the message pane says: Result: ${rows}.` }], fix: SQL_FIX, ...x });

/* ---------- Python with IDLE ---------- */

export const INSTALL_PYTHON: GuidedStep = S('Install Python',
  'Python is the language most analysts use after SQL. The installer from python.org also gives you IDLE, a simple editor where you type a program and run it with one key.',
  [
    { text: 'Open python.org/downloads and click “Download Python 3.13” (any 3.12 or newer is fine).', os: 'windows' },
    { text: 'Run the installer. On the first screen, tick “Add python.exe to PATH” at the bottom. This is easy to miss.', os: 'windows' },
    { text: 'Click Install Now and wait until it says “Setup was successful”.', os: 'windows' },
    { text: 'Open Command Prompt (press the Windows key, type cmd, press Enter) and run:', cmd: 'py --version', lang: 'ps', os: 'windows' },
    { text: 'Open python.org/downloads and click “Download Python 3.13” (the macOS installer, a .pkg file).', os: 'macos' },
    { text: 'Open the .pkg and click Continue → Agree → Install. When it finishes, a Finder window opens: double-click “Install Certificates.command”.', os: 'macos' },
    { text: 'Open Terminal (press ⌘ Space, type Terminal, press Enter) and run:', cmd: 'python3 --version', lang: 'sh', os: 'macos' },
  ],
  paste('Paste the version line you got', 'Python 3\\.(1[2-9]|[2-9]\\d)', 'Python 3.13.1', 'It should say Python 3.12 or newer. If it shows an older version, install the newest one from python.org.'),
  {
    minutes: 15,
    see: [{ text: 'One line with the version number.', sample: 'Python 3.13.1' }],
    fix: [
      { problem: '“py is not recognized” or “python is not recognized” (Windows)', solution: 'Run the installer again, choose Modify → Next, tick “Add Python to environment variables”, finish, then open a new Command Prompt.' },
      { problem: 'The Microsoft Store opens when you type python (Windows)', solution: 'Use py instead of python, or turn off the “App execution aliases” for python in Settings → Apps → Advanced app settings.' },
      { problem: '“command not found: python” (Mac)', solution: 'On a Mac the command is python3, not python.' },
      { problem: 'Mac asks to install “command line developer tools”', solution: 'Click Cancel and run the python3 command again in a new Terminal window; the python.org Python is used once its installer has finished.' },
    ],
  });

export const pyFile = (name: string): DoItem[] => [
  { text: 'Open IDLE: press the Windows key, type IDLE, and open “IDLE (Python 3.13)”.', os: 'windows' },
  { text: 'Open IDLE: Applications → Python 3.13 → IDLE.', os: 'macos' },
  'In IDLE choose File → New File. Click Copy on the code box below and paste it into the new window.',
  `Choose File → Save, go to Documents → ${FOLDER}, and save it as ${name}.`,
  { text: 'Run it: Run → Run Module, or press', keys: ['F5'], os: 'windows' },
  { text: 'Run it: Run → Run Module, or press', keys: ['fn', 'F5'], os: 'macos' },
  'The output appears in the IDLE Shell window.',
];

export const PY_FIX: FixItem[] = [
  { problem: 'IndentationError or “unexpected indent”', solution: 'Python uses the spaces at the start of a line. Paste the whole box again into an empty file instead of typing over it.' },
  { problem: 'ModuleNotFoundError: No module named …', solution: 'That package is not installed for this Python yet. Do the install step for today, then run again.' },
  { problem: 'FileNotFoundError', solution: `The program looks for its files in the folder where you saved it. Save every file for this course in Documents → ${FOLDER}, and run the “make the practice file” program first.` },
  { problem: 'F5 does nothing (Mac)', solution: 'Use the menu: Run → Run Module. Some Mac keyboards need fn + F5.' },
];

export const PIP_INSTALL = (pkgs: string): GuidedStep => S(`Install ${pkgs}`,
  'Python comes with the basics. Extra tools (packages) such as pandas are installed once with pip, Python’s installer. After that, every program can use them.',
  [
    { text: 'Open Command Prompt and run:', cmd: `py -m pip install ${pkgs}`, lang: 'ps', os: 'windows' },
    { text: 'Open Terminal and run:', cmd: `python3 -m pip install ${pkgs}`, lang: 'sh', os: 'macos' },
    'Wait until the prompt comes back. It can take a few minutes the first time.',
  ],
  paste('Paste the last line pip printed', 'Successfully installed|Requirement already satisfied', `Successfully installed ${pkgs.split(' ').map(p => `${p}-x.y`).join(' ')}`, 'Paste the line that starts with “Successfully installed” (or “Requirement already satisfied” if it was already there).'),
  {
    minutes: 5,
    see: [{ text: 'pip downloads the packages and finishes with a line like this. Version numbers vary.', sample: `Successfully installed ${pkgs.split(' ').map(p => `${p}-x.y`).join(' ')}` }],
    fix: [
      { problem: '“pip is not recognized”', solution: 'Type it exactly as shown, starting with py -m (Windows) or python3 -m (Mac). That always uses the Python you installed.' },
      { problem: 'error: externally-managed-environment (Mac)', solution: 'This Python came from Homebrew. Install Python from python.org (day 12) and use its python3, or add --user at the end of the command.' },
      { problem: 'IDLE still says “No module named …” after installing', solution: 'IDLE is using another Python. In IDLE run import sys; print(sys.executable), then run that path followed by -m pip install … in the terminal.' },
    ],
  });

/* ---------- Power BI Desktop (Windows) ---------- */

export const PBI_MAC: FixItem = { problem: 'You use a Mac', solution: 'Power BI Desktop runs only on Windows. Use a Windows computer at your institute, or a Windows virtual machine (Parallels, UTM). The steps are the same there.' };

export const saveCsv = (name: string): DoItem[] => [
  { text: 'Open Notepad (Windows key, type Notepad).', os: 'windows' },
  { text: 'Open TextEdit and choose Format → Make Plain Text.', os: 'macos' },
  'Click Copy on the box below and paste it into the empty file.',
  `Save it in Documents → ${FOLDER} as ${name}. In Notepad, set “Save as type” to All files and Encoding to UTF-8.`,
];

/* ---------- AI tools ---------- */

export const AI_TOOL = 'Open any AI chat tool you have, for example ChatGPT, Gemini, Claude or Microsoft Copilot. A free account is enough.';
