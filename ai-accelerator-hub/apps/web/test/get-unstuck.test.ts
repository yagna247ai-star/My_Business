/**
 * Agent Lab "Get unstuck" (docs/AGENT_LAB_GET_UNSTUCK_SPEC.md §6 acceptance criteria U1–U8).
 */
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import type { Ctx } from '@/lib/server/context';
import { AppError } from '@/lib/server/errors';
import { _resetRateLimits } from '@/lib/server/http';
import { register, exportMyData } from '@/lib/domain/account';
import { startRun } from '@/lib/domain/agentLab';
import { KNOWN_ERRORS, diagnose, errorsFor } from '@/lib/domain/troubleshoot';
import { createHelpRequest, myHelpRequests, helpQueue, replyHelp, resolveHelp, MAX_OPEN } from '@/lib/domain/help';
import { ask } from '@/lib/ai/coach';

const status = async (p: Promise<unknown>) => { try { await p; return 200; } catch (e) { return (e as AppError).status; } };
async function ctxFor(email: string): Promise<Ctx> {
  const u = await prisma.user.findUniqueOrThrow({ where: { email } });
  const m = await prisma.membership.findFirstOrThrow({ where: { userId: u.id }, include: { role: true, tenant: true } });
  return { userId: u.id, email, name: u.name || email, tenantId: m.tenantId, tenantSlug: m.tenant.slug, tenantName: m.tenant.name, role: m.role.code as Ctx['role'], cohortId: m.cohortId, superAdmin: u.globalRole === 'super_admin' };
}
// Real outputs observed with npm 11.17.0 on macOS (spec §3).
const E404 = "npm error code E404\nnpm error 404 Not Found - GET https://registry.npmjs.org/greatkilo-code-xyz-notreal - Not found\nnpm error 404  The requested resource 'greatkilo-code-xyz-notreal@*' could not be found or you do not have permission to access it.";
const ALLOW = 'npm warn allow-scripts 1 package has install scripts not yet covered by allowScripts:\nnpm warn allow-scripts   @kilocode/cli@7.8.27 (postinstall: node ./postinstall.mjs)\nnpm warn allow-scripts Run `npm install -g --allow-scripts=@kilocode/cli` to allow these scripts once';

describe('Error catalogue and fix finder (pure)', () => {
  it('U1: every entry is self-consistent, sourced, and never suggests sudo or disabling TLS', () => {
    expect(new Set(KNOWN_ERRORS.map(e => e.id)).size).toBe(KNOWN_ERRORS.length);
    for (const e of KNOWN_ERRORS) {
      expect(new RegExp(e.match, 'i').test(e.looksLike), e.id).toBe(true);
      expect(e.fix.length).toBeGreaterThan(0);
      for (const u of e.source) expect(u).toMatch(/^https:\/\//);
      for (const f of e.fix) expect(`${f.text} ${f.cmd || ''}`).not.toMatch(/\bsudo\s+npm|strict-ssl/);
      if (e.provenance === 'observed') expect(e.observedWith).toBeTruthy();
    }
  });
  it('U2: recognises the real E404 and allow-scripts output, ranks this step first, ignores unrelated text', () => {
    const s = { kind: 'install' as const, os: 'macos' as const, agent: 'kilo_code' as const, method: 'cli' };
    expect(diagnose(E404, s).map(e => e.id)).toEqual(['npm-e404']);
    expect(diagnose(ALLOW, s)[0].id).toBe('npm-allow-scripts');
    expect(diagnose('everything worked fine, thanks', s)).toEqual([]);
    expect(diagnose("zsh: command not found: npm\nnpm error code E404", s).map(e => e.id)).toEqual(expect.arrayContaining(['npm-e404', 'node-not-found']));
    // Windows-only errors are not suggested on macOS.
    expect(diagnose('running scripts is disabled on this system', s)).toEqual([]);
    expect(diagnose('running scripts is disabled on this system', { ...s, os: 'windows' })[0].id).toBe('ps-scripts-disabled');
  });
  it('U3: the gallery shows the right errors for each step', () => {
    const ids = errorsFor({ kind: 'install', os: 'macos', agent: 'kilo_code', method: 'cli' }).map(e => e.id);
    expect(ids).toEqual(expect.arrayContaining(['npm-e404', 'npm-allow-scripts', 'npm-eacces']));
    expect(ids).not.toContain('ps-scripts-disabled');
    expect(errorsFor({ kind: 'node', os: 'windows', agent: 'kilo_code', method: 'cli' }).map(e => e.id)).toContain('ps-scripts-disabled');
    expect(errorsFor({ kind: 'install', os: 'macos', agent: 'claude_code', method: 'native' }).map(e => e.id)).toEqual(expect.arrayContaining(['claude-path', 'claude-html', 'claude-dyld']));
    expect(errorsFor({ kind: 'install', os: 'macos', agent: 'claude_code', method: 'native' }).map(e => e.id)).not.toContain('npm-allow-scripts');
  });
});

describe('Mentor help requests and AI coach on a step', () => {
  let learner: Ctx, kid: Ctx, other: Ctx, mentor: Ctx, reviewer: Ctx, otherAdmin: Ctx, runId: string, kidRun: string;
  beforeAll(async () => {
    const year = new Date().getFullYear();
    await register({ name: 'Stuck Learner', email: 'stuck.learner@example.test', password: 'Stucklearn@123', birthYear: year - 26, inviteCode: 'DEMO-COHORT-07', acceptTerms: true });
    await register({ name: 'Other Learner', email: 'other.learner@example.test', password: 'Otherlearn@123', birthYear: year - 27, inviteCode: 'DEMO-COHORT-07', acceptTerms: true });
    await register({ name: 'Stuck Kid', email: 'stuck.kid@example.test', password: 'Stuckkid@1234', birthYear: year - 15, inviteCode: 'DEMO-COHORT-07', guardianEmail: 'guardian.stuck@example.test', acceptTerms: true });
    [learner, other, kid, mentor, reviewer, otherAdmin] = await Promise.all(['stuck.learner@example.test', 'other.learner@example.test', 'stuck.kid@example.test', 'mentor@aihub.in', 'reviewer@aihub.in', 'admin@northstar.edu'].map(ctxFor));
    runId = (await startRun(learner, { agent: 'kilo_code', os: 'macos' })).id;
    kidRun = (await startRun(kid, { agent: 'kilo_code', os: 'windows' })).id;
  });
  beforeEach(() => _resetRateLimits());

  it('U4: own run and a real step only; secrets rejected; minors cannot share contact details; at most 3 open', async () => {
    const r = await createHelpRequest(learner, { runId, stepId: 'install', text: E404 });
    expect(r).toMatchObject({ stepId: 'install', stepTitle: 'Install Kilo Code', state: 'open', matchedIds: ['npm-e404'] });
    expect(await status(createHelpRequest(other, { runId, stepId: 'install', text: E404 }))).toBe(404);
    expect(await status(createHelpRequest(learner, { runId, stepId: 'nope', text: E404 }))).toBe(400);
    expect(await status(createHelpRequest(learner, { runId, stepId: 'install', text: 'my key is sk-ant-api03-abcdefghijklmnopqrstuv please help' }))).toBe(400);
    expect(await status(createHelpRequest(kid, { runId: kidRun, stepId: 'node', text: 'please call me on 98765 43210 about npm' }))).toBe(400);
    expect((await createHelpRequest(kid, { runId: kidRun, stepId: 'node', text: 'running scripts is disabled on this system' })).matchedIds).toEqual(['ps-scripts-disabled']);
    // Adults' personal data is redacted, not stored.
    const red = await createHelpRequest(learner, { runId, stepId: 'node', text: 'nvm: command not found, my email is stuck@example.test' });
    expect(red.errorText).not.toContain('stuck@example.test');
    await createHelpRequest(learner, { runId, stepId: 'check', text: 'zsh: command not found: kilo' });
    expect(await status(createHelpRequest(learner, { runId, stepId: 'start', text: 'one more problem here' }))).toBe(429);
    expect((await myHelpRequests(learner, runId)).length).toBe(MAX_OPEN);
    const n = await prisma.notification.count({ where: { userId: mentor.userId, template: 'help_requested' } });
    expect(n).toBeGreaterThan(0);
  });

  it('U5: staff in the same institution see the queue; other institutions get 404; learners cannot open it', async () => {
    const q = await helpQueue(mentor);
    expect(q.some(x => x.learner === 'Stuck Learner' && x.stepTitle === 'Install Kilo Code')).toBe(true);
    expect((await helpQueue(otherAdmin)).some(x => x.learner === 'Stuck Learner')).toBe(false);
    expect(await status(helpQueue(learner))).toBe(403);
    const id = q.find(x => x.learner === 'Stuck Learner')!.id;
    expect(await status(replyHelp(otherAdmin, id, { body: 'cross-tenant' }))).toBe(404);
    expect(await status(replyHelp(other, id, { body: 'not mine' }))).toBe(404);
  });

  it('U6: reply → answered (learner notified) → learner reply → open → resolve → closed', async () => {
    const id = (await myHelpRequests(learner, runId)).find(x => x.stepId === 'install')!.id;
    await replyHelp(reviewer, id, { body: 'Copy the command with the Copy button: npm install -g @kilocode/cli' });
    expect((await myHelpRequests(learner, runId)).find(x => x.id === id)!.state).toBe('answered');
    expect(await prisma.notification.count({ where: { userId: learner.userId, template: 'help_answered' } })).toBe(1);
    await replyHelp(learner, id, { body: 'That worked, thanks' });
    const t = (await myHelpRequests(learner, runId)).find(x => x.id === id)!;
    expect(t.state).toBe('open'); expect(t.messages.map(m => m.role)).toEqual(['staff', 'learner']);
    expect(await prisma.notification.count({ where: { userId: reviewer.userId, template: 'help_learner_replied' } })).toBe(1);
    await resolveHelp(learner, id);
    expect(await status(replyHelp(reviewer, id, { body: 'late reply' }))).toBe(409);
    expect(await prisma.auditLog.count({ where: { resourceId: id, action: { in: ['help.requested', 'help.replied', 'help.resolved'] } } })).toBe(4);
    // A slot is free again after resolving.
    expect((await createHelpRequest(learner, { runId, stepId: 'start', text: 'kilo opens but no free models listed' })).state).toBe('open');
  });

  it('U7: AI coach with lab context: not configured → no credit spent; another learner’s run → 404', async () => {
    const before = await prisma.entitlement.findMany({ where: { userId: learner.userId } });
    const saved = process.env.ANTHROPIC_API_KEY; delete process.env.ANTHROPIC_API_KEY;
    try {
      const e = await ask(learner, { assistantCode: 'code-mentor', message: E404, context: { lab: { runId, stepId: 'install' } } }).catch(x => x as AppError);
      expect((e as AppError).code).toBe('AI_NOT_CONFIGURED');
      expect(await status(ask(other, { assistantCode: 'code-mentor', message: E404, context: { lab: { runId, stepId: 'install' } } }))).toBe(404);
    } finally { if (saved !== undefined) process.env.ANTHROPIC_API_KEY = saved; }
    expect(await prisma.entitlement.findMany({ where: { userId: learner.userId } })).toEqual(before);
  });

  it('U8: the learner’s data export includes help requests and messages', async () => {
    const d = await exportMyData(learner) as unknown as { helpRequests: { messages: unknown[] }[] };
    expect(d.helpRequests.length).toBeGreaterThanOrEqual(4);
    expect(d.helpRequests.some(r => r.messages.length === 2)).toBe(true);
  });
});
