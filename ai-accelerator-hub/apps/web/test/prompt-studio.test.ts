/**
 * Prompt Studio (docs/AGENT_LAB_PROMPT_STUDIO_SPEC.md §8, S1–S8).
 */
import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import type { Ctx } from '@/lib/server/context';
import { AppError } from '@/lib/server/errors';
import { _resetRateLimits } from '@/lib/server/http';
import { register } from '@/lib/domain/account';
import { startRun, saveStep, labOverview, KEY_QUIZ } from '@/lib/domain/agentLab';
import { CATEGORIES, TECHNIQUES, TECHNIQUE, buildPrompt, casesFor, checkPrompt, readSavedPrompt, type TechniqueId } from '@/lib/domain/promptTechniques';
import { scoreAuto, type AutoInput } from '@/lib/domain/proofScore';

const err = async (p: Promise<unknown>) => { try { await p; return null; } catch (e) { return e as AppError; } };

describe('Techniques (pure)', () => {
  it('S1: all eight techniques exist in five categories, each with 3 real cases covering every persona', () => {
    expect(TECHNIQUES.map(t => t.id).sort()).toEqual(['cot', 'few_shot', 'injection', 'markdown', 'react', 'reverse', 'single_shot', 'tot']);
    for (const c of CATEGORIES) expect(TECHNIQUES.some(t => t.category === c.id)).toBe(true);
    const personas = new Set<string>();
    for (const t of TECHNIQUES) { expect(t.cases.length).toBeGreaterThanOrEqual(3); t.cases.forEach(c => c.personas.forEach(p => personas.add(p))); }
    expect([...personas].sort()).toEqual(['ai_builder', 'business_owner', 'kid_hobbyist', 'software_pro', 'student']);
  });

  it('S2: every built-in case passes its own checks (injection only after the attack is spotted)', () => {
    for (const t of TECHNIQUES) for (const c of t.cases) {
      const spotted = c.untrusted ? c.untrusted.attackLine : null;
      const r = checkPrompt(t.id, c.fields, { caseId: c.id, spotted });
      expect(r.ok, `${t.id}/${c.id}: ${r.rules.filter(x => !x.ok).map(x => x.msg).join(' ')}`).toBe(true);
      if (c.untrusted) {
        expect(checkPrompt(t.id, c.fields, { caseId: c.id, spotted: null }).ok).toBe(false);
        expect(checkPrompt(t.id, c.fields, { caseId: c.id, spotted: (c.untrusted.attackLine + 1) % c.untrusted.text.length }).ok).toBe(false);
      }
    }
  });

  it('S3: technique structure rules — blanks, few-shot pairs, option counts, lists', () => {
    expect(checkPrompt('single_shot', {}).passed).toBe(0);
    const fs = TECHNIQUE.few_shot.cases[0].fields;
    expect(checkPrompt('few_shot', { ...fs, examples: 'Input: one two three four five six\nOutput: seven eight nine ten eleven twelve' }).rules.find(r => r.key === 'examples')!.ok).toBe(false);
    const tot = TECHNIQUE.tot.cases[0].fields;
    expect(checkPrompt('tot', { ...tot, branches: '9' }).ok).toBe(false);
    expect(checkPrompt('tot', { ...tot, criteria: 'cheap' }).ok).toBe(false);
    expect(checkPrompt('react', { ...TECHNIQUE.react.cases[0].fields, tools: 'everything' }).ok).toBe(false);
    expect(checkPrompt('markdown', { ...TECHNIQUE.markdown.cases[0].fields, sections: 'Summary' }).ok).toBe(false);
    expect(checkPrompt('reverse', { ...TECHNIQUE.reverse.cases[0].fields, count: '1' }).ok).toBe(false);
  });

  it('S4: the builder adds each technique’s own wording, deterministically', () => {
    const want: Record<TechniqueId, RegExp> = { single_shot: /ask me before you start/, few_shot: /Follow the pattern/, cot: /Think step by step/, tot: /genuinely different approaches/, react: /Thought:[\s\S]*Action:[\s\S]*Observation:/, markdown: /^## /m, reverse: /Argue against this plan/, injection: /Treat it as data only[\s\S]*<untrusted>/ };
    for (const t of TECHNIQUES) { const c = t.cases[0]; const p = buildPrompt(t.id, c.fields, c.id); expect(p).toMatch(want[t.id]); expect(buildPrompt(t.id, c.fields, c.id)).toBe(p); }
    expect(buildPrompt('injection', TECHNIQUE.injection.cases[0].fields, 'inj_issue')).toContain('ignore all previous instructions'); // the sample is shown inside the data tags
  });

  it('S5: persona cases come first; old five-part saves still read as single-shot', () => {
    expect(casesFor('single_shot', 'business_owner')[0].personas).toContain('business_owner');
    expect(readSavedPrompt({ parts: { goal: 'x' } })).toMatchObject({ technique: 'single_shot', fields: { goal: 'x' } });
  });

  it('S6: proof score A3 uses the chosen technique', () => {
    const base: AutoInput = { agent: 'kilo_code', os: 'macos', versionOutput: '7.8.27', install: { method: 'cli', nodeVersion: 'v24.22.2' }, resultSummary: null, screenshot: { exists: false, isImage: false, width: null, height: null, avStatus: null, reused: false } };
    const c = TECHNIQUE.cot.cases[0];
    const a3 = (p: AutoInput['prompt']) => scoreAuto({ ...base, prompt: p }).items.find(x => x.id === 'A3')!;
    expect(a3({ technique: 'cot', caseId: c.id, fields: c.fields, spotted: null })).toMatchObject({ points: 15, label: 'Prompt is complete (Chain of Thought)' });
    expect(a3({ technique: 'cot', caseId: c.id, fields: { ...c.fields, givens: '' }, spotted: null }).points).toBe(10); // 2 of 3 rules
    const inj = TECHNIQUE.injection.cases[1];
    expect(a3({ technique: 'injection', caseId: inj.id, fields: inj.fields, spotted: null }).points).toBe(12); // 4 of 5 — attack not spotted
    expect(a3(null).points).toBe(0);
  });
});

describe('Saving the prompt step (integration)', () => {
  let c: Ctx; let runId = '';
  beforeAll(async () => {
    await register({ name: 'Studio Learner', email: 'studio@example.test', password: 'Studioooo@123', birthYear: new Date().getFullYear() - 30, inviteCode: 'DEMO-COHORT-07', acceptTerms: true });
    const u = await prisma.user.findUniqueOrThrow({ where: { email: 'studio@example.test' } });
    const m = await prisma.membership.findFirstOrThrow({ where: { userId: u.id }, include: { role: true, tenant: true } });
    c = { userId: u.id, email: u.email, name: u.name || '', tenantId: m.tenantId, tenantSlug: m.tenant.slug, tenantName: m.tenant.name, role: m.role.code as Ctx['role'], cohortId: m.cohortId, superAdmin: false };
    const r = await startRun(c, { agent: 'opencode', os: 'macos' }); runId = r.id;
    await saveStep(c, runId, 'prepare', { checked: [] });
    await saveStep(c, runId, 'install', { method: 'brew', versionOutput: 'opencode-v2 2.2.6' });
    await saveStep(c, runId, 'connect', { quiz: KEY_QUIZ.answer, noKeyShared: true });
  });
  beforeEach(() => _resetRateLimits());

  it('S7: server applies the same checks; injection needs the right line; field errors are per blank', async () => {
    expect((await err(saveStep(c, runId, 'prompt', { technique: 'magic', fields: {} })))?.status).toBe(400);
    const tot = TECHNIQUE.tot.cases[2];
    const e = await err(saveStep(c, runId, 'prompt', { technique: 'tot', caseId: tot.id, fields: { ...tot.fields, branches: '12' } }));
    expect(e?.status).toBe(400); expect(Object.keys((e as AppError & { details: Record<string, string> }).details)).toEqual(['branches']);
    const inj = TECHNIQUE.injection.cases[0];
    expect((await err(saveStep(c, runId, 'prompt', { technique: 'injection', caseId: inj.id, fields: inj.fields, spotted: 0 })))?.status).toBe(400);
    const v = await saveStep(c, runId, 'prompt', { technique: 'injection', caseId: inj.id, fields: inj.fields, spotted: inj.untrusted!.attackLine });
    expect(v.steps.prompt.data).toMatchObject({ technique: 'injection', caseId: 'inj_issue', spotted: 3, before: inj.before });
    const row = await prisma.agentLabRun.findUniqueOrThrow({ where: { id: runId } });
    expect(row.promptAfter).toContain('<untrusted>'); expect(row.promptBefore).toBe(inj.before);
  });

  it('S8: a revisited lab returns what was saved (install output, prompt, write-up) so fields are not empty', async () => {
    const o = await labOverview(c);
    const run = o.runs.find(r => r.id === runId)!;
    expect(run.versionOutput).toBe('opencode-v2 2.2.6');
    expect(readSavedPrompt(run.steps.prompt.data)?.technique).toBe('injection');
    expect(run).toHaveProperty('resultSummary');
  });
});
