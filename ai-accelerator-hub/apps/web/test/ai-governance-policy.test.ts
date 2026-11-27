// docs/AGENT_ORCHESTRATION_SPEC.md §3.12 · docs/AGENT_P0_BUILD_PLAN.md T1
import { describe, it, expect } from 'vitest';
import { decide, POLICY_VERSION, type PolicyInput, type Principal, type TenantPolicy } from '@aihub/ai-governance';

const adult: Principal = { kind: 'user', id: 'u1', tenantId: 't1', role: 'learner', ageBand: 'adult' };
const minor: Principal = { ...adult, id: 'u2', ageBand: 'minor' };
const svc: Principal = { kind: 'service', id: 'svc:agents', tenantId: 't1', role: 'service', ageBand: 'unknown' };
const on: TenantPolicy = { mode: 'managed', learnerLlm: true };
const off: TenantPolicy = { mode: 'managed', learnerLlm: false };
const ask = (o: Partial<PolicyInput> = {}) => decide({ principal: adult, purpose: 'learner_help', tier: 'fast', tenant: on, hasPersonalData: false, ...o });

describe('AI governance policy (T1)', () => {
  it('R0: unknown purpose, unknown tier or no principal → deny', () => {
    expect(ask({ purpose: 'free_for_all' })).toMatchObject({ allow: false, mode: 'deny', reasons: ['R0:unknown_purpose'] });
    expect(ask({ tier: 'mega' })).toMatchObject({ allow: false, reasons: ['R0:unknown_tier'] });
    expect(ask({ principal: { ...adult, id: '' } })).toMatchObject({ allow: false, reasons: ['R0:no_principal'] });
  });

  it('every decision carries the policy version and its reasons', () => {
    const d = ask();
    expect(d.policyVersion).toBe(POLICY_VERSION);
    expect(d.reasons.length).toBeGreaterThan(0);
  });

  it('R1: data class follows purpose and age', () => {
    expect(ask().dataClass).toBe('learner');
    expect(ask({ principal: minor }).dataClass).toBe('minor');
    expect(ask({ principal: svc, purpose: 'content' }).dataClass).toBe('course');
  });

  it('R2: content is service-only; eval is service or Super Admin; learner purposes need a user', () => {
    expect(ask({ purpose: 'content' })).toMatchObject({ allow: false, reasons: ['R2:content_is_service_only'] });
    expect(ask({ purpose: 'eval' })).toMatchObject({ allow: false, reasons: ['R2:eval_is_service_or_super_admin'] });
    expect(ask({ purpose: 'eval', principal: { ...adult, superAdmin: true } }).allow).toBe(true);
    expect(ask({ principal: svc, purpose: 'eval' }).allow).toBe(true);
    expect(ask({ principal: svc })).toMatchObject({ allow: false, reasons: ['R2:learner_purpose_needs_a_user'] });
  });

  it('R3: minors never get lab agent keys', () => {
    expect(ask({ principal: minor, purpose: 'lab_agent' })).toMatchObject({ allow: false, reasons: ['R3:no_lab_keys_for_minors'] });
    expect(ask({ purpose: 'lab_agent' })).toMatchObject({ allow: true, profile: 'auto:lab' });
  });

  it('R4: learner LLM off (paid keys off) → deterministic answers only, for adults and minors', () => {
    for (const principal of [adult, minor]) for (const purpose of ['learner_help', 'lab_agent'] as const) {
      if (principal === minor && purpose === 'lab_agent') continue;
      const d = ask({ principal, purpose, tenant: off });
      expect(d).toMatchObject({ allow: true, mode: 'deterministic_only', profile: null });
      expect(d.reasons).toContain('R4:learner_llm_off');
    }
    // content work does not depend on the learner switch
    expect(ask({ principal: svc, purpose: 'content', tenant: off })).toMatchObject({ mode: 'llm', profile: 'auto:content' });
  });

  it('R5: the free pool only for course data without personal data; never for learner text', () => {
    expect(ask().allowFreePool).toBe(false);
    expect(ask({ principal: minor }).allowFreePool).toBe(false);
    expect(ask({ principal: svc, purpose: 'content' }).allowFreePool).toBe(true);
    expect(ask({ principal: svc, purpose: 'content', hasPersonalData: true }).allowFreePool).toBe(false);
    expect(ask({ principal: svc, purpose: 'eval' }).allowFreePool).toBe(true);
  });

  it('R6: budget 80% alerts, 100% forces the fast tier, 120% pauses the model for learners', () => {
    const b = (spentUsd: number) => ({ ...on, budget: { spentUsd, budgetUsd: 100 } });
    expect(ask({ tenant: b(50) }).alert).toBeNull();
    expect(ask({ tenant: b(85) })).toMatchObject({ alert: 'budget_80', mode: 'llm' });
    expect(ask({ tenant: b(100), tier: 'reason' })).toMatchObject({ tier: 'fast', mode: 'llm' });
    expect(ask({ tenant: b(99), tier: 'reason' }).tier).toBe('reason');
    expect(ask({ tenant: b(120) })).toMatchObject({ allow: true, mode: 'deterministic_only' });
    expect(ask({ principal: svc, purpose: 'content', tenant: b(150) }).mode).toBe('llm'); // content uses the free pool
    expect(ask({ tenant: { ...on, budget: { spentUsd: 10, budgetUsd: 0 } } }).alert).toBeNull(); // no budget set
  });

  it('R7: managed → platform profiles', () => {
    expect(ask().profile).toBe('auto:learner');
    expect(ask({ purpose: 'lab_agent' }).profile).toBe('auto:lab');
    expect(ask({ principal: svc, purpose: 'content' }).profile).toBe('auto:content');
  });

  it('R7: restricted → own profile and only allowed providers; none allowed → no model', () => {
    const r: TenantPolicy = { mode: 'restricted', learnerLlm: true, code: 'SLNHRD', allowedProviders: ['gemini'] };
    expect(ask({ tenant: r })).toMatchObject({ mode: 'llm', profile: 'auto:t-SLNHRD', providers: ['gemini'], allowFreePool: false });
    expect(ask({ tenant: { ...r, allowedProviders: [] } })).toMatchObject({ mode: 'deterministic_only' });
    expect(ask({ tenant: { ...r, code: undefined } }).mode).toBe('deterministic_only');
    expect(ask({ principal: svc, purpose: 'content', tenant: r }).profile).toBe('auto:content'); // content stays platform work
  });

  it('R7: byok → own key, never the free pool, platform fallback only when allowed', () => {
    const k: TenantPolicy = { mode: 'byok', learnerLlm: true };
    expect(ask({ tenant: k })).toMatchObject({ profile: 'byok', allowFreePool: false, fallbackToPlatform: false });
    expect(ask({ tenant: { ...k, fallbackToPlatform: true } }).fallbackToPlatform).toBe(true);
  });

  it('R8: embeddings are self-hosted, for any data class (even with the learner LLM off)', () => {
    expect(ask({ tier: 'embed', tenant: off })).toMatchObject({ allow: true, mode: 'llm', profile: 'self' });
    expect(ask({ tier: 'embed', principal: minor, hasPersonalData: true }).profile).toBe('self');
  });

  it('minors: never the free pool, never lab keys, in every mode', () => {
    for (const tenant of [on, { mode: 'restricted', learnerLlm: true, code: 'X', allowedProviders: ['gemini'] } as TenantPolicy, { mode: 'byok', learnerLlm: true } as TenantPolicy]) {
      expect(ask({ principal: minor, tenant }).allowFreePool).toBe(false);
      expect(ask({ principal: minor, tenant, purpose: 'lab_agent' }).allow).toBe(false);
    }
  });

  it('is pure: the same input gives the same decision', () => {
    expect(ask({ tier: 'reason' })).toEqual(ask({ tier: 'reason' }));
  });
});
