/**
 * Agent Lab setup facts and the step-by-step guide builder (docs/AGENT_LAB_SETUP_GUIDE_SPEC.md).
 *
 * Pure module: no database, no network. Used by the server (validation) and the browser (visual guide).
 * Every command, key and sample output below comes from the source listed on the card; see the spec §6.
 * Facts were checked on VERIFIED_ON. Program staff re-check each cohort (spec §7).
 */
import type { AgentCode } from './personalise';

export const VERIFIED_ON = '2026-11-07';
export type OS = 'macos' | 'windows' | 'linux';
export type Need = 'node' | 'brew' | 'vscode';

export type InstallMethod = {
  id: string; label: string; cmd?: string; shell?: 'sh' | 'ps';
  needs: Need[]; minNode?: number;
  check: { cmd?: string; how: string; pattern: string; sample?: string };
};
export type AgentInfo = {
  code: AgentCode; name: string; maker: string; licence: string; surfaces: string;
  install: Record<OS, InstallMethod[]>;
  start: string; access: string; freeOption: string | null; safety: string; source: string[];
};

const CLAUDE_CHECK = { cmd: 'claude --version', how: 'Open a new terminal and run claude --version.', pattern: '\\d+\\.\\d+\\.\\d+\\s*\\(Claude Code\\)', sample: '2.1.211 (Claude Code)' };
const CODEX_CHECK = { cmd: 'codex', how: 'Start codex. The banner at the top shows the version. Paste that line.', pattern: 'codex[^\\n]{0,20}v?\\d+\\.\\d+\\.\\d+' };
const SEMVER = '\\d+\\.\\d+\\.\\d+';

export const AGENTS: Record<AgentCode, AgentInfo> = {
  claude_code: {
    code: 'claude_code', name: 'Claude Code', maker: 'Anthropic', licence: 'Proprietary', surfaces: 'Terminal, desktop app, VS Code and JetBrains',
    install: {
      macos: [
        { id: 'native', label: 'Native installer (recommended)', cmd: 'curl -fsSL https://claude.ai/install.sh | bash', shell: 'sh', needs: [], check: CLAUDE_CHECK },
        { id: 'brew', label: 'Homebrew', cmd: 'brew install --cask claude-code', shell: 'sh', needs: ['brew'], check: CLAUDE_CHECK },
      ],
      linux: [{ id: 'native', label: 'Native installer (recommended)', cmd: 'curl -fsSL https://claude.ai/install.sh | bash', shell: 'sh', needs: [], check: CLAUDE_CHECK }],
      windows: [
        { id: 'powershell', label: 'PowerShell installer (recommended)', cmd: 'irm https://claude.ai/install.ps1 | iex', shell: 'ps', needs: [], check: CLAUDE_CHECK },
        { id: 'winget', label: 'WinGet', cmd: 'winget install Anthropic.ClaudeCode', shell: 'ps', needs: [], check: CLAUDE_CHECK },
      ],
    },
    start: 'Open a terminal in your project folder and run claude. A browser window opens for you to log in.',
    access: 'Needs a Pro, Max, Ultra, Team, Enterprise or Console account. The free claude.ai plan does not include Claude Code.',
    freeOption: null,
    safety: 'Log in through the browser prompt. If you use an API key, keep it in an environment variable — never in your code or a screenshot.',
    source: ['https://code.claude.com/docs/en/setup', 'https://code.claude.com/docs/en/terminal-guide'],
  },
  codex_cli: {
    code: 'codex_cli', name: 'Codex CLI', maker: 'OpenAI', licence: 'Apache-2.0', surfaces: 'Terminal',
    install: {
      macos: [
        { id: 'script', label: 'Installer script', cmd: 'curl -fsSL https://chatgpt.com/codex/install.sh | sh', shell: 'sh', needs: [], check: CODEX_CHECK },
        { id: 'brew', label: 'Homebrew', cmd: 'brew install --cask codex', shell: 'sh', needs: ['brew'], check: CODEX_CHECK },
        { id: 'npm', label: 'npm', cmd: 'npm install -g @openai/codex', shell: 'sh', needs: ['node'], minNode: 16, check: CODEX_CHECK },
      ],
      linux: [
        { id: 'script', label: 'Installer script', cmd: 'curl -fsSL https://chatgpt.com/codex/install.sh | sh', shell: 'sh', needs: [], check: CODEX_CHECK },
        { id: 'npm', label: 'npm', cmd: 'npm install -g @openai/codex', shell: 'sh', needs: ['node'], minNode: 16, check: CODEX_CHECK },
      ],
      windows: [
        { id: 'powershell', label: 'PowerShell installer', cmd: 'powershell -ExecutionPolicy ByPass -c "irm https://chatgpt.com/codex/install.ps1 | iex"', shell: 'ps', needs: [], check: CODEX_CHECK },
        { id: 'npm', label: 'npm', cmd: 'npm install -g @openai/codex', shell: 'ps', needs: ['node'], minNode: 16, check: CODEX_CHECK },
      ],
    },
    start: 'Run codex, then choose "Sign in with ChatGPT".',
    access: 'Sign in with a ChatGPT Plus, Pro, Business, Edu or Enterprise plan, or use an API key (extra setup).',
    freeOption: null,
    safety: 'Prefer "Sign in with ChatGPT" over pasting an API key. Never commit keys to Git.',
    source: ['https://github.com/openai/codex', 'https://www.npmjs.com/package/@openai/codex'],
  },
  opencode: {
    code: 'opencode', name: 'OpenCode', maker: 'Open-source project (github.com/anomalyco/opencode)', licence: 'MIT', surfaces: 'Terminal (TUI) and desktop app',
    install: {
      macos: [
        { id: 'script', label: 'Install script', cmd: 'curl -fsSL https://opencode.ai/v2/install | bash', shell: 'sh', needs: [], check: { cmd: 'ls ~/.opencode/bin', how: 'The script installs OpenCode to ~/.opencode/bin. List that folder and paste what it prints.', pattern: 'opencode' } },
        { id: 'brew', label: 'Homebrew (recommended by OpenCode)', cmd: 'brew install anomalyco/tap/opencode-v2', shell: 'sh', needs: ['brew'], check: { cmd: 'brew list --versions opencode-v2', how: 'Ask Homebrew which version it installed and paste the line.', pattern: `opencode-v2\\s+${SEMVER}`, sample: 'opencode-v2 2.2.6' } },
        { id: 'npm', label: 'npm', cmd: 'npm i -g @opencode/cli@latest', shell: 'sh', needs: ['node'], check: { cmd: 'npm ls -g @opencode/cli', how: 'Ask npm which version is installed and paste the line that names @opencode/cli.', pattern: `@opencode/cli@${SEMVER}`, sample: '└── @opencode/cli@2.2.6' } },
      ],
      linux: [
        { id: 'script', label: 'Install script', cmd: 'curl -fsSL https://opencode.ai/v2/install | bash', shell: 'sh', needs: [], check: { cmd: 'ls ~/.opencode/bin', how: 'The script installs OpenCode to ~/.opencode/bin. List that folder and paste what it prints.', pattern: 'opencode' } },
        { id: 'npm', label: 'npm', cmd: 'npm i -g @opencode/cli@latest', shell: 'sh', needs: ['node'], check: { cmd: 'npm ls -g @opencode/cli', how: 'Ask npm which version is installed and paste the line that names @opencode/cli.', pattern: `@opencode/cli@${SEMVER}`, sample: '└── @opencode/cli@2.2.6' } },
      ],
      windows: [
        { id: 'desktop', label: 'Desktop app download (Windows package managers are not supported)', needs: [], check: { how: 'Download the Windows build from opencode.ai/download, run it, and paste the file name you downloaded.', pattern: 'opencode-desktop-win-(x64|arm64)', sample: 'opencode-desktop-win-x64.exe' } },
      ],
    },
    start: 'In your project folder run opencode, then type /connect to connect a model provider.',
    access: 'Works with many model providers through their API keys. OpenCode Models needs billing details on opencode.ai.',
    freeOption: null,
    safety: 'Paste provider keys only into the OpenCode /connect prompt on your own computer.',
    source: ['https://opencode.ai/docs/', 'https://github.com/anomalyco/opencode'],
  },
  kilo_code: {
    code: 'kilo_code', name: 'Kilo Code', maker: 'Open-source project (github.com/Kilo-Org/kilocode)', licence: 'MIT', surfaces: 'VS Code extension, JetBrains plugin and CLI',
    install: Object.fromEntries((['macos', 'windows', 'linux'] as OS[]).map(os => [os, [
      { id: 'vscode', label: 'VS Code extension (pre-release, VS Code 1.84+)', needs: ['vscode'], check: { how: 'In the Extensions view, open Kilo Code and paste the version number shown.', pattern: SEMVER } },
      { id: 'cli', label: 'CLI', cmd: 'npm install -g @kilocode/cli', shell: os === 'windows' ? 'ps' : 'sh', needs: ['node'], check: { cmd: 'kilo --version', how: 'Run kilo --version and paste what it prints.', pattern: SEMVER } },
    ]])) as Record<OS, InstallMethod[]>,
    start: 'In VS Code open the Kilo Code panel, or run kilo in your project folder. Pick a model marked "(free)" — in the CLI, /models switches model.',
    access: 'Free models are available through the Kilo Gateway; some may be rate limited. Paid models are charged at the provider’s rate.',
    freeOption: 'Choose a model labelled "(free)" or Auto Free.',
    safety: 'Auto Free may route prompts to providers that log data. Do not send personal or confidential data.',
    source: ['https://kilo.ai/docs/getting-started/installing', 'https://kilo.ai/docs/cli', 'https://kilo.ai/docs/getting-started/using-kilo-for-free'],
  },
};

export function findMethod(agent: AgentCode, os: OS, id: string): InstallMethod | null {
  return AGENTS[agent]?.install[os]?.find(m => m.id === id) || null;
}

/** Parses "v24.22.2" or "24.22.2" and returns the major version, or null. */
export function nodeMajor(v: string): number | null {
  const m = /^\s*v?(\d+)\.\d+\.\d+\s*$/.exec(v || '');
  return m ? Number(m[1]) : null;
}

// ── Guide building blocks ──────────────────────────────────────────────
export type DoItem = { text: string; keys?: string[]; cmd?: string; shell?: 'sh' | 'ps' };
export type SeeItem = { text: string; cmd?: string; sample?: string };
export type FixItem = { problem: string; solution: string; cmd?: string; shell?: 'sh' | 'ps' };
export type GuideStep = { id: string; kind: 'vscode' | 'terminal' | 'brew' | 'node' | 'install' | 'check' | 'start'; title: string; why: string; do: DoItem[]; see: SeeItem[]; fix: FixItem[]; source: string[] };

const SRC = {
  terminal: 'https://code.claude.com/docs/en/terminal-guide',
  npmDocs: 'https://docs.npmjs.com/downloading-and-installing-node-js-and-npm',
  nvm: 'https://github.com/nvm-sh/nvm',
  nodeDl: 'https://nodejs.org/en/download',
  nodeIdx: 'https://nodejs.org/dist/index.json',
  psPolicy: 'https://learn.microsoft.com/powershell/module/microsoft.powershell.core/about/about_execution_policies',
  brew: 'https://brew.sh',
  vscode: 'https://code.visualstudio.com/docs/setup/setup-overview',
  vscodeTerm: 'https://code.visualstudio.com/docs/terminal/getting-started',
  kiloInstall: 'https://kilo.ai/docs/getting-started/installing',
};
/** Example only (newest LTS in the Node.js release index on VERIFIED_ON). Instructions always say "the LTS version". */
export const NODE_LTS_EXAMPLE = { node: 'v24.22.2', npm: '11.19.1' };
const NVM_INSTALL = 'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.41.0/install.sh | bash';

function terminalStep(os: OS): GuideStep {
  const common = { id: 'terminal', kind: 'terminal' as const, title: 'Open a terminal', why: 'A terminal is a window where you type commands. Every install step below is typed here.', source: [SRC.terminal] };
  if (os === 'macos') return { ...common, do: [{ text: 'Open Spotlight Search, type Terminal and press Enter.', keys: ['⌘', 'Space'] }, { text: 'To paste a command later, use', keys: ['⌘', 'V'] }], see: [{ text: 'A window with a blinking cursor. This is your terminal.' }], fix: [] };
  if (os === 'linux') return { ...common, do: [{ text: 'Press the shortcut, or search for "Terminal" in your application menu.', keys: ['Ctrl', 'Alt', 'T'] }, { text: 'To paste a command later, use', keys: ['Ctrl', 'Shift', 'V'] }], see: [{ text: 'A window with a blinking cursor. This is your terminal.' }], fix: [] };
  return { ...common, title: 'Open PowerShell', why: 'PowerShell is Windows’ built-in terminal for typing commands. Every install step below is typed here.',
    do: [{ text: 'Press the shortcut and select Windows PowerShell (or Terminal).', keys: ['Win', 'X'] }, { text: 'To paste a command later, use Ctrl + V or right-click.', keys: ['Ctrl', 'V'] }],
    see: [{ text: 'Each line starts with PS — that means you are in PowerShell, not CMD.', sample: 'PS C:\\Users\\YourName>' }],
    fix: [{ problem: 'The line starts with C:\\Users\\YourName> without PS', solution: 'You opened CMD. Close it and open PowerShell with Win + X.' }] };
}

function nodeStep(os: OS, minNode?: number): GuideStep {
  const min = minNode ? ` This agent needs Node.js ${minNode} or newer.` : '';
  const see: SeeItem[] = [
    { text: 'Check Node.js. It prints a version that starts with v.', cmd: 'node -v', sample: NODE_LTS_EXAMPLE.node },
    { text: 'Check npm. It prints a version number.', cmd: 'npm -v', sample: NODE_LTS_EXAMPLE.npm },
  ];
  const base = { id: 'node', kind: 'node' as const, title: 'Install Node.js and npm', why: `The install command uses npm, and npm comes with Node.js. Install Node.js first.${min}`, see };
  if (os === 'windows') return { ...base,
    do: [
      { text: 'Open nodejs.org/en/download, choose the LTS version and download the Windows Installer (.msi).' },
      { text: 'Run the installer and keep the default options.' },
      { text: 'Close PowerShell and open a new PowerShell window, so it can find node and npm.', keys: ['Win', 'X'] },
    ],
    fix: [
      { problem: 'PowerShell says running scripts is disabled on this system when you run npm', solution: 'Allow locally installed scripts for your user only (Microsoft’s documented command), then try again.', cmd: 'Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser', shell: 'ps' },
      { problem: 'node is not recognized', solution: 'Close every PowerShell window and open a new one after the installer finishes.' },
    ],
    source: [SRC.nodeDl, SRC.nodeIdx, SRC.npmDocs, SRC.psPolicy] };
  return { ...base,
    do: [
      { text: 'Install nvm, the Node version manager that npm recommends. Copy this line, paste it into the terminal and press Enter.', cmd: NVM_INSTALL, shell: 'sh' },
      { text: 'Close the terminal and open a new one, so it can find nvm.' },
      { text: 'Install the current LTS (long-term support) version of Node.js. npm comes with it.', cmd: 'nvm install --lts', shell: 'sh' },
      ...(os === 'macos' ? [{ text: 'Prefer a normal installer? Download the LTS macOS Installer (.pkg) from nodejs.org/en/download instead of using nvm.' }] : []),
    ],
    fix: [
      { problem: 'nvm: command not found', solution: 'Close the terminal, open a new one and try again.' },
      { problem: 'A permission error (EACCES) when installing a package with -g', solution: 'Do not use sudo. Install Node.js with nvm, which keeps global packages in your home folder.' },
    ],
    source: [SRC.npmDocs, SRC.nvm, SRC.nodeIdx] };
}

const brewStep: GuideStep = { id: 'brew', kind: 'brew', title: 'Install Homebrew', why: 'This install method uses Homebrew, a package manager for macOS. Homebrew supports macOS Sequoia 15 and newer.',
  do: [{ text: 'Paste this in the terminal and press Enter. Follow the prompts, including any "Next steps" it prints at the end.', cmd: '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"', shell: 'sh' }],
  see: [{ text: 'Check Homebrew is ready. It prints a version.', cmd: 'brew --version' }],
  fix: [{ problem: 'Your macOS is older than Sequoia 15', solution: 'Choose another install method from the list above.' }],
  source: [SRC.brew] };

function vscodeStep(os: OS): GuideStep {
  return { id: 'vscode', kind: 'vscode', title: 'Install VS Code and open Extensions', why: 'Kilo Code runs inside VS Code. It needs VS Code 1.84.0 or later.',
    do: [
      { text: os === 'macos' ? 'Download VS Code from code.visualstudio.com, open the .dmg and drag Visual Studio Code to Applications.' : os === 'windows' ? 'Download the VS Code User Setup installer from code.visualstudio.com and run it.' : 'Download VS Code for your Linux distribution from code.visualstudio.com and install it.' },
      { text: 'Open VS Code, then open the Extensions view.', keys: os === 'macos' ? ['⇧', '⌘', 'X'] : ['Ctrl', 'Shift', 'X'] },
    ],
    see: [{ text: 'A search box at the top of the Extensions view.' }],
    fix: [{ problem: 'You need a terminal inside VS Code later', solution: 'Use View → Terminal.', }],
    source: [SRC.vscode, SRC.vscodeTerm, SRC.kiloInstall] };
}

/** Builds the ordered guide for one agent + OS + install method. Deterministic; no AI involved. */
export function buildGuide(agent: AgentCode, os: OS, methodId: string): GuideStep[] {
  const info = AGENTS[agent]; const m = findMethod(agent, os, methodId);
  if (!info || !m) return [];
  const steps: GuideStep[] = [];
  if (m.needs.includes('vscode')) steps.push(vscodeStep(os));
  if (m.cmd || m.needs.includes('node') || m.needs.includes('brew') || m.check.cmd) steps.push(terminalStep(os));
  if (m.needs.includes('brew')) steps.push(brewStep);
  if (m.needs.includes('node')) steps.push(nodeStep(os, m.minNode));
  const shell = m.shell || (os === 'windows' ? 'ps' : 'sh');
  steps.push(m.id === 'vscode'
    ? { id: 'install', kind: 'install', title: `Install ${info.name}`, why: 'Add the agent to VS Code.', do: [{ text: 'Search for "Kilo Code".' }, { text: 'Click the arrow next to Install and choose Install Pre-Release Version.' }], see: [{ text: 'A Kilo Code icon appears in the VS Code sidebar.' }], fix: [{ problem: 'There is no pre-release option', solution: 'Check that VS Code is version 1.84.0 or later (Help → About / Code → About).' }], source: info.source }
    : m.cmd
      ? { id: 'install', kind: 'install', title: `Install ${info.name}`, why: `Download and install ${info.name} with ${m.label.replace(/ \(.*\)$/, '')}.`, do: [{ text: 'Copy this line, paste it into the terminal and press Enter. Leave the window open until it finishes.', cmd: m.cmd, shell }], see: m.needs.includes('node') ? [{ text: 'npm lists what it added and the prompt comes back. The numbers vary.', sample: 'added 3 packages in 708ms' }, { text: 'If npm also prints “npm warn allow-scripts …”, open Stuck on this step? below — there is a one-line fix.' }] : [{ text: 'The command finishes and the prompt comes back. Some installers show no progress while downloading — wait.' }], fix: agent === 'claude_code' ? [{ problem: os === 'windows' ? '\'irm\' is not recognized' : 'command not found: claude (after installing)', solution: os === 'windows' ? 'You are in CMD, not PowerShell. Open PowerShell with Win + X.' : 'Open a new terminal window. If it still fails, follow the PATH fix the installer printed under "Setup notes".' }] : [{ problem: 'command not found', solution: 'Open a new terminal window and try again.' }], source: info.source }
      : { id: 'install', kind: 'install', title: `Install ${info.name}`, why: 'Download the official build for your computer.', do: [{ text: 'Open opencode.ai/download, download the Windows build and run it.' }], see: [{ text: 'OpenCode opens as a desktop app.' }], fix: [], source: info.source });
  steps.push({ id: 'check', kind: 'check', title: 'Check it worked', why: 'Prove the install worked before you use it. Paste the result in the box below.',
    do: m.check.cmd ? [{ text: m.check.how, cmd: m.check.cmd, shell }] : [{ text: m.check.how }],
    see: [{ text: 'Example of a working result:', sample: m.check.sample }].filter(s => s.sample), fix: [], source: info.source });
  steps.push({ id: 'start', kind: 'start', title: `Start ${info.name}`, why: 'Open the agent in a project folder so it can read and change your files.', do: [{ text: info.start }], see: info.freeOption ? [{ text: info.freeOption }] : [], fix: [], source: info.source });
  return steps;
}
