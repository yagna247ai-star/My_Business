/**
 * Agent Lab step-by-step setup guide (docs/AGENT_LAB_SETUP_GUIDE_SPEC.md §8 acceptance criteria G1–G8).
 */
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import type { Ctx } from '@/lib/server/context';
import { AppError } from '@/lib/server/errors';
import { _resetRateLimits } from '@/lib/server/http';
import { register } from '@/lib/domain/account';
import { startRun, saveStep } from '@/lib/domain/agentLab';
import { AGENTS, buildGuide, findMethod, nodeMajor, type OS } from '@/lib/domain/setupGuide';
import type { AgentCode } from '@/lib/domain/personalise';

const OSES: OS[] = ['macos', 'windows', 'linux'];
const all = () => (Object.keys(AGENTS) as AgentCode[]).flatMap(a => OSES.flatMap(os => AGENTS[a].install[os].map(m => ({ a, os, m }))));
const errOf = async (p: Promise<unknown>) => { try { await p; return null; } catch (e) { return e as AppError; } };

describe('Guide builder (pure)', () => {
  it('G1: starts with opening a terminal, or with VS Code for the extension', () => {
    for (const { a, os, m } of all()) {
      const g = buildGuide(a, os, m.id);
      expect(g.length).toBeGreaterThanOrEqual(3);
      if (m.needs.includes('vscode')) expect(g[0].kind).toBe('vscode');
      else if (m.cmd) expect(g[0].kind).toBe('terminal');
      expect(g.at(-2)!.kind).toBe('check');
      expect(g.at(-1)!.kind).toBe('start');
    }
  });

  it('G2: every npm method has a Node.js + npm card before the install card, with node -v and npm -v', () => {
    const npm = all().filter(x => x.m.needs.includes('node'));
    expect(npm.length).toBeGreaterThanOrEqual(6);
    for (const { a, os, m } of npm) {
      const g = buildGuide(a, os, m.id); const kinds = g.map(s => s.kind);
      expect(kinds.indexOf('node')).toBeGreaterThan(-1);
      expect(kinds.indexOf('node')).toBeLessThan(kinds.indexOf('install'));
      expect(kinds.indexOf('terminal')).toBeLessThan(kinds.indexOf('node'));
      const node = g.find(s => s.kind === 'node')!;
      expect(node.see.map(s => s.cmd)).toEqual(['node -v', 'npm -v']);
      expect(m.cmd).toMatch(/^npm (install|i) -g /);
    }
    expect(buildGuide('codex_cli', 'macos', 'npm').find(s => s.kind === 'node')!.why).toContain('Node.js 16 or newer');
  });

  it('G3: Homebrew methods get a Homebrew card; the native installer gets neither Node nor Homebrew', () => {
    for (const { a, os, m } of all().filter(x => x.m.needs.includes('brew'))) expect(buildGuide(a, os, m.id).map(s => s.kind)).toContain('brew');
    expect(buildGuide('claude_code', 'macos', 'native').map(s => s.kind)).toEqual(['terminal', 'install', 'check', 'start']);
  });

  it('G4: Windows Node uses the .msi and the documented execution-policy fix; macOS and Linux use nvm', () => {
    const win = buildGuide('kilo_code', 'windows', 'cli').find(s => s.kind === 'node')!;
    expect(win.do.map(d => d.text).join(' ')).toContain('Windows Installer (.msi)');
    expect(win.fix.map(f => f.cmd)).toContain('Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser');
    for (const os of ['macos', 'linux'] as OS[]) {
      const n = buildGuide('kilo_code', os, 'cli').find(s => s.kind === 'node')!;
      expect(n.do.map(d => d.cmd)).toContain('nvm install --lts');
      expect(n.do[0].cmd).toMatch(/^curl -o- https:\/\/raw\.githubusercontent\.com\/nvm-sh\/nvm\/v\d+\.\d+\.\d+\/install\.sh \| bash$/);
    }
    expect(buildGuide('kilo_code', 'windows', 'cli').find(s => s.kind === 'terminal')!.title).toBe('Open PowerShell');
  });

  it('G5: every card has why, at least one action, and an https source', () => {
    for (const { a, os, m } of all()) for (const s of buildGuide(a, os, m.id)) {
      expect(s.why.length).toBeGreaterThan(10);
      expect(s.do.length).toBeGreaterThan(0);
      expect(s.source.length).toBeGreaterThan(0);
      for (const u of s.source) expect(u).toMatch(/^https:\/\//);
      for (const d of s.do) if (d.cmd) expect(d.cmd.trim()).toBe(d.cmd);
    }
  });

  it('G6: OpenCode on Windows offers no npm, Scoop or Chocolatey method (vendor: "Windows package managers are not supported")', () => {
    const cmds = AGENTS.opencode.install.windows.map(m => `${m.id} ${m.cmd || ''}`).join(' ');
    expect(cmds).not.toMatch(/npm|scoop|choco/);
    expect(AGENTS.opencode.install.macos.find(m => m.id === 'npm')!.cmd).toContain('@opencode/cli');
    expect(JSON.stringify(AGENTS.opencode)).not.toContain('opencode-ai');
  });

  it('parses Node versions', () => {
    expect(nodeMajor('v24.22.2')).toBe(24); expect(nodeMajor('16.0.0')).toBe(16);
    expect(nodeMajor('node 24')).toBeNull(); expect(nodeMajor('')).toBeNull();
    expect(findMethod('kilo_code', 'macos', 'nope')).toBeNull();
  });
});

describe('Server checks for the install step', () => {
  let ctx: Ctx;
  beforeAll(async () => {
    const year = new Date().getFullYear();
    await register({ name: 'Guide Tester', email: 'guide.tester@example.test', password: 'Guidetest@123', birthYear: year - 28, inviteCode: 'DEMO-COHORT-07', acceptTerms: true });
    const u = await prisma.user.findUniqueOrThrow({ where: { email: 'guide.tester@example.test' } });
    const m = await prisma.membership.findFirstOrThrow({ where: { userId: u.id }, include: { role: true, tenant: true } });
    ctx = { userId: u.id, email: u.email, name: u.name || '', tenantId: m.tenantId, tenantSlug: m.tenant.slug, tenantName: m.tenant.name, role: m.role.code as Ctx['role'], cohortId: m.cohortId, superAdmin: false };
  });
  beforeEach(() => _resetRateLimits());

  it('G7: unknown method, missing or too-old Node version are rejected; a valid Node version passes', async () => {
    const r = await startRun(ctx, { agent: 'codex_cli', os: 'macos' });
    await saveStep(ctx, r.id, 'prepare', { checked: [] });
    const banner = 'OpenAI Codex (v0.167.0)';
    expect((await errOf(saveStep(ctx, r.id, 'install', { method: 'Native', versionOutput: banner })))?.status).toBe(400);
    const noNode = await errOf(saveStep(ctx, r.id, 'install', { method: 'npm', versionOutput: banner }));
    expect(noNode?.status).toBe(400); expect((noNode?.details as Record<string, string>).nodeVersion).toContain('node -v');
    const old = await errOf(saveStep(ctx, r.id, 'install', { method: 'npm', versionOutput: banner, nodeVersion: 'v14.21.3' }));
    expect((old?.details as Record<string, string>).nodeVersion).toContain('Node.js 16 or newer');
    const ok = await saveStep(ctx, r.id, 'install', { method: 'npm', versionOutput: banner, nodeVersion: 'v22.11.0' });
    expect(ok.steps.install.data).toMatchObject({ method: 'npm', methodLabel: 'npm', nodeVersion: 'v22.11.0' });
    // Native script needs no Node version.
    expect((await saveStep(ctx, r.id, 'install', { method: 'script', versionOutput: banner })).steps.install.data).toEqual({ method: 'script', methodLabel: 'Installer script' });
  });

  it('G8: the version output must match the chosen method’s own check', async () => {
    const r = await startRun(ctx, { agent: 'opencode', os: 'macos' });
    await saveStep(ctx, r.id, 'prepare', { checked: [] });
    expect((await errOf(saveStep(ctx, r.id, 'install', { method: 'npm', nodeVersion: 'v24.22.2', versionOutput: 'opencode-v2 2.2.6' })))?.status).toBe(400);
    expect(((await saveStep(ctx, r.id, 'install', { method: 'npm', nodeVersion: 'v24.22.2', versionOutput: '└── @opencode/cli@2.2.6' })).steps.install.data as { method: string }).method).toBe('npm');
    expect(((await saveStep(ctx, r.id, 'install', { method: 'brew', versionOutput: 'opencode-v2 2.2.6' })).steps.install.data as { method: string }).method).toBe('brew');
    const w = await startRun(ctx, { agent: 'kilo_code', os: 'windows' });
    await saveStep(ctx, w.id, 'prepare', { checked: [] });
    expect((await errOf(saveStep(ctx, w.id, 'install', { method: 'cli', nodeVersion: 'v24.22.2', versionOutput: 'sk-ant-api03-abcdefghijklmnopqrst' })))?.status).toBe(400);
    expect(((await saveStep(ctx, w.id, 'install', { method: 'vscode', versionOutput: '7.8.27' })).steps.install.data as { method: string }).method).toBe('vscode');
  });
});
