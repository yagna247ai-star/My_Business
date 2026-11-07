/**
 * "Get unstuck" error catalogue and deterministic fix finder (docs/AGENT_LAB_GET_UNSTUCK_SPEC.md §3).
 *
 * Pure module (browser + server). Only errors documented by the vendor, or observed by running the real
 * tool, are listed; `provenance` says which. Fixes are copied from the source. No fix uses sudo or disables TLS.
 */
import type { AgentCode } from './personalise';
import type { GuideStep, OS } from './setupGuide';

export type Kind = GuideStep['kind'];
export type KnownError = {
  id: string; title: string; match: string;
  appliesTo: { kinds?: Kind[]; os?: OS[]; agents?: AgentCode[]; methods?: string[] };
  looksLike: string; provenance: 'vendor-doc' | 'observed'; observedWith?: string;
  cause: string; fix: { text: string; cmd?: string; shell?: 'sh' | 'ps' }[]; source: string[];
};

const NPM_ERR = 'https://docs.npmjs.com/common-errors';
const CLAUDE_TERM = 'https://code.claude.com/docs/en/terminal-guide';

export const KNOWN_ERRORS: KnownError[] = [
  { id: 'npm-e404', title: 'npm can’t find the package (E404)', match: 'npm (?:error|ERR!) (?:code E404|404 Not Found)',
    appliesTo: { kinds: ['install'] },
    looksLike: "npm error code E404\nnpm error 404 Not Found - GET https://registry.npmjs.org/greatkilo-code - Not found\nnpm error 404  The requested resource 'greatkilo-code@*' could not be found or you do not have permission to access it.",
    provenance: 'observed', observedWith: 'npm 11.17.0 on macOS',
    cause: 'The package name is misspelled, or a space split it into two names. npm’s docs add that a 404 for a correct name is most likely a temporary registry glitch.',
    fix: [
      { text: 'Use the Copy button on the install card instead of typing. The Kilo Code package is exactly:', cmd: 'npm install -g @kilocode/cli' },
      { text: 'If the name is exactly right, wait a few minutes and try again.' },
    ], source: [NPM_ERR] },
  { id: 'npm-allow-scripts', title: 'npm skipped the package’s setup script (allow-scripts)', match: 'allow-scripts.*(?:install scripts not yet covered|--allow-scripts)',
    appliesTo: { kinds: ['install', 'check'], methods: ['cli', 'npm'] },
    looksLike: 'npm warn allow-scripts 1 package has install scripts not yet covered by allowScripts:\nnpm warn allow-scripts   @kilocode/cli@7.8.27 (postinstall: node ./postinstall.mjs)\nnpm warn allow-scripts Run `npm install -g --allow-scripts=@kilocode/cli` to allow these scripts once, …',
    provenance: 'observed', observedWith: 'npm 11.17.0, @kilocode/cli 7.8.27',
    cause: 'Newer npm versions do not run a package’s install scripts until you allow them. Kilo Code’s script copies the right program for your computer into place (we read it: it copies files and runs kilo --version; it contacts no other service). OpenCode’s npm package also has a postinstall script.',
    fix: [
      { text: 'Run the install again with the flag npm suggests, plus the package name (Kilo Code):', cmd: 'npm install -g --allow-scripts=@kilocode/cli @kilocode/cli' },
      { text: 'For OpenCode installed with npm:', cmd: 'npm i -g --allow-scripts=@opencode/cli @opencode/cli@latest' },
    ], source: ['https://docs.npmjs.com/cli/v11/using-npm/config#allow-scripts'] },
  { id: 'npm-eacces', title: 'Permission denied while installing (EACCES)', match: '\\bEACCES\\b',
    appliesTo: { kinds: ['install', 'node'], os: ['macos', 'linux'] },
    looksLike: 'npm error code EACCES\nnpm error Error: EACCES: permission denied, …',
    provenance: 'vendor-doc',
    cause: 'npm is trying to write to a system folder your user can’t change. This usually happens when Node.js was installed with an installer instead of a version manager.',
    fix: [
      { text: 'Do not use sudo. Recommended: install Node.js with nvm (see the Node.js step), open a new terminal and run the install again.', cmd: 'nvm install --lts' },
      { text: 'Or move npm’s global folder into your home folder, then add ~/.local/bin to your PATH as the npm docs describe:', cmd: 'npm config set prefix ~/.local' },
    ], source: ['https://docs.npmjs.com/resolving-eacces-permissions-errors-when-installing-packages-globally'] },
  { id: 'npm-ebadengine', title: 'Your Node.js is too old for this package (EBADENGINE)', match: 'EBADENGINE|Unsupported engine',
    appliesTo: { kinds: ['install', 'node'] },
    looksLike: 'npm warn EBADENGINE Unsupported engine { … required: { node: ">=16" }, current: { node: "v14.21.3" } }',
    provenance: 'vendor-doc',
    cause: 'The package declares a minimum Node.js version (for example Codex CLI needs 16 or newer) and yours is older.',
    fix: [{ text: 'Install the current LTS version, open a new terminal and check the version.', cmd: 'nvm install --lts' }, { text: 'Then check:', cmd: 'node -v' }],
    source: ['https://code.claude.com/docs/en/setup', 'https://www.npmjs.com/package/@openai/codex'] },
  { id: 'npm-enospc', title: 'Your disk is full (ENOSPC)', match: '\\bENOSPC\\b', appliesTo: { kinds: ['install', 'node'] },
    looksLike: 'npm ERR! Error: ENOSPC, write', provenance: 'vendor-doc',
    cause: 'There is not enough free disk space to finish the install.', fix: [{ text: 'Free up some disk space, then run the install again.' }], source: [NPM_ERR] },
  { id: 'ps-scripts-disabled', title: 'PowerShell blocks npm (running scripts is disabled)', match: 'running scripts is disabled on this system',
    appliesTo: { os: ['windows'] },
    looksLike: 'npm : File C:\\Program Files\\nodejs\\npm.ps1 cannot be loaded because running scripts is disabled on this system.',
    provenance: 'vendor-doc',
    cause: 'On Windows, PowerShell’s execution policy can stop scripts such as npm.ps1 from running.',
    fix: [{ text: 'Allow locally installed scripts for your user only (Microsoft’s documented command), then run npm again:', cmd: 'Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser', shell: 'ps' }],
    source: ['https://learn.microsoft.com/powershell/module/microsoft.powershell.core/about/about_execution_policies'] },
  { id: 'nvm-not-found', title: 'The terminal can’t find nvm', match: 'nvm: command not found|command not found: nvm',
    appliesTo: { kinds: ['node'], os: ['macos', 'linux'] },
    looksLike: 'zsh: command not found: nvm', provenance: 'vendor-doc',
    cause: 'nvm was just installed and this terminal window started before it.', fix: [{ text: 'Close the terminal, open a new one and try again.' }], source: ['https://github.com/nvm-sh/nvm'] },
  { id: 'node-not-found', title: 'The terminal can’t find node or npm', match: "command not found: (?:node|npm)\\b|'(?:node|npm)' is not recognized|(?:node|npm) : The term '(?:node|npm)' is not recognized",
    appliesTo: { kinds: ['node', 'install', 'check'] },
    looksLike: 'zsh: command not found: npm', provenance: 'observed', observedWith: 'zsh on macOS',
    cause: 'Node.js (which includes npm) is not installed yet, or this terminal was opened before you installed it.',
    fix: [{ text: 'Do the “Install Node.js and npm” step, then open a new terminal window and check:', cmd: 'node -v' }], source: ['https://docs.npmjs.com/downloading-and-installing-node-js-and-npm'] },
  { id: 'agent-not-found', title: 'The terminal can’t find the agent you installed', match: "command not found: (?:kilo|codex|opencode)\\b|'(?:kilo|codex|opencode)' is not recognized",
    appliesTo: { kinds: ['check', 'start'], agents: ['kilo_code', 'codex_cli', 'opencode'] },
    looksLike: 'zsh: command not found: kilo', provenance: 'observed', observedWith: 'zsh on macOS',
    cause: 'This terminal was opened before the install finished, or the install did not complete.',
    fix: [{ text: 'Open a new terminal window and try again.' }, { text: 'Check npm installed it (replace the name for your agent):', cmd: 'npm ls -g @kilocode/cli' }, { text: 'If nothing is listed, run the install command again and read the last lines it prints.' }],
    source: ['https://kilo.ai/docs/cli'] },
  { id: 'claude-path', title: 'The terminal can’t find claude', match: "command not found: claude|'claude' is not recognized",
    appliesTo: { agents: ['claude_code'] },
    looksLike: 'zsh: command not found: claude', provenance: 'vendor-doc',
    cause: 'The folder where the installer put claude is not on your PATH yet. The installer prints the exact fix under “Setup notes”.',
    fix: [
      { text: 'Zsh (the macOS default):', cmd: 'echo \'export PATH="$HOME/.local/bin:$PATH"\' >> ~/.zshrc && source ~/.zshrc' },
      { text: 'Bash on Linux:', cmd: 'echo \'export PATH="$HOME/.local/bin:$PATH"\' >> ~/.bashrc && source ~/.bashrc' },
      { text: 'Windows PowerShell: follow “claude is not recognized” in the terminal guide (it adds %USERPROFILE%\\.local\\bin to your PATH), then open a new window.' },
    ], source: [CLAUDE_TERM] },
  { id: 'claude-irm-cmd', title: 'You are in CMD, not PowerShell', match: "'irm' is not recognized|token '&&' is not a valid statement separator",
    appliesTo: { os: ['windows'] },
    looksLike: "'irm' is not recognized as an internal or external command", provenance: 'vendor-doc',
    cause: 'The PowerShell command was typed into CMD (or the CMD command into PowerShell).',
    fix: [{ text: 'Open PowerShell with Win + X, check the line starts with PS, and paste the command again.' }], source: ['https://code.claude.com/docs/en/setup'] },
  { id: 'claude-html', title: 'The installer download returned a web page', match: "syntax error near unexpected token .<.|<!DOCTYPE html>",
    appliesTo: { kinds: ['install'], agents: ['claude_code'] },
    looksLike: "bash: line 1: syntax error near unexpected token `<'", provenance: 'vendor-doc',
    cause: 'The install URL returned a web page instead of the script. If the page says “App unavailable in region”, Claude Code is not available in your country.',
    fix: [{ text: 'Try the command again. If it keeps happening on macOS, install with Homebrew instead:', cmd: 'brew install --cask claude-code' }], source: [CLAUDE_TERM] },
  { id: 'claude-dyld', title: 'Your macOS is too old for Claude Code', match: 'dyld: (?:cannot load|Symbol not found)|built for Mac OS X 13\\.0',
    appliesTo: { os: ['macos'], agents: ['claude_code'] },
    looksLike: 'dyld: cannot load …', provenance: 'vendor-doc',
    cause: 'Claude Code needs macOS 13.0 or later.', fix: [{ text: 'Check Apple menu → About This Mac, and update macOS through Software Update.' }], source: [CLAUDE_TERM] },
  { id: 'claude-tls', title: 'Windows could not create a secure connection', match: 'Could not create SSL/TLS secure channel',
    appliesTo: { os: ['windows'] },
    looksLike: 'Could not create SSL/TLS secure channel', provenance: 'vendor-doc',
    cause: 'This usually happens on older Windows 10 systems.',
    fix: [{ text: 'Run this line first, then the installer again:', cmd: '[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12', shell: 'ps' }], source: [CLAUDE_TERM] },
  { id: 'claude-32bit', title: 'You opened 32-bit PowerShell', match: 'does not support 32-bit Windows',
    appliesTo: { os: ['windows'] },
    looksLike: 'Claude Code does not support 32-bit Windows', provenance: 'vendor-doc',
    cause: 'On a 64-bit machine this means you opened “Windows PowerShell (x86)”.', fix: [{ text: 'Close it, open the Start menu entry without (x86) in its name, and run the install again.' }], source: [CLAUDE_TERM] },
  { id: 'brew-shellenv', title: 'The terminal can’t find brew after installing Homebrew', match: 'command not found: brew|brew: command not found',
    appliesTo: { kinds: ['brew', 'install'], os: ['macos'], methods: ['brew'] },
    looksLike: 'zsh: command not found: brew', provenance: 'vendor-doc',
    cause: 'The Homebrew installer prints “Next steps” to add brew to your shell. Homebrew does not work until you run them.',
    fix: [{ text: 'Run the “Next steps” lines the installer printed. On Apple silicon the line is:', cmd: 'eval "$(/opt/homebrew/bin/brew shellenv)"' }, { text: 'Then open a new terminal and check:', cmd: 'brew --version' }],
    source: ['https://docs.brew.sh/Installation'] },
];

export type Scope = { kind?: Kind; os?: OS; agent?: AgentCode; method?: string };
const fits = (e: KnownError, s: Scope) =>
  (!e.appliesTo.os || !s.os || e.appliesTo.os.includes(s.os)) &&
  (!e.appliesTo.agents || !s.agent || e.appliesTo.agents.includes(s.agent));
const exact = (e: KnownError, s: Scope) =>
  (!e.appliesTo.kinds || (!!s.kind && e.appliesTo.kinds.includes(s.kind))) &&
  (!e.appliesTo.methods || (!!s.method && e.appliesTo.methods.includes(s.method)));

/** The error gallery for one step: entries that apply to this step, OS, agent and method. */
export function errorsFor(s: Scope): KnownError[] {
  return KNOWN_ERRORS.filter(e => fits(e, s) && exact(e, s));
}

/** Deterministic fix finder: entries whose pattern matches the pasted text; this step's entries first. At most 3. */
export function diagnose(text: string, s: Scope): KnownError[] {
  const t = String(text || '').slice(0, 8000);
  if (t.trim().length < 3) return [];
  return KNOWN_ERRORS.filter(e => new RegExp(e.match, 'i').test(t) && fits(e, s))
    .sort((a, b) => Number(exact(b, s)) - Number(exact(a, s)))
    .slice(0, 3);
}
