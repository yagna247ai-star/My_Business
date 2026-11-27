/**
 * Hub AI Gateway policy (docs/AGENT_ORCHESTRATION_SPEC.md §3.12, P0 task T1). Pure: no I/O, no clock, no env.
 * Deny by default. Every decision says which rules fired and the policy version, so it can be logged in ai_requests.
 *
 * The rules, in order:
 *  R0  unknown purpose or tier → deny
 *  R1  data class: content/eval → course; learner_help/lab_agent → learner; a minor's request → minor
 *  R2  content and eval are service work: a user principal may not request them (eval also allows a Super Admin)
 *  R3  minors never get lab agent keys
 *  R4  learner purposes with the institution's learner LLM switched off → deterministic answers only (no model)
 *  R5  the free pool only for course/public data with no personal data in the request
 *  R6  budget: ≥ 80% alert, ≥ 100% fast tier only, ≥ 120% learner purposes deterministic only
 *  R7  institution mode: managed → platform profile; restricted → its own profile and allowed providers (none → no model);
 *      byok → its own key, never the free pool, platform fallback only when the institution allows it
 *  R8  embeddings are self-hosted (no provider), so any data class may be embedded
 */
export const POLICY_VERSION = 'p0.1';

export const PURPOSES = ['learner_help', 'lab_agent', 'content', 'eval'] as const;
export type Purpose = (typeof PURPOSES)[number];
export const TIERS = ['fast', 'reason', 'vision', 'embed'] as const;
export type Tier = (typeof TIERS)[number];
export type AgeBand = 'adult' | 'minor' | 'unknown';
export type TenantMode = 'managed' | 'restricted' | 'byok';
export type DataClass = 'public' | 'course' | 'learner' | 'minor';
export type Mode = 'llm' | 'deterministic_only' | 'deny';

export type Principal = { kind: 'user' | 'service'; id: string; tenantId: string; role: string; ageBand: AgeBand; superAdmin?: boolean };
export type TenantPolicy = {
  mode: TenantMode;
  /** docs §3.13: paid keys are off until the owner switches learner LLM on, per tenant. */
  learnerLlm: boolean;
  allowedProviders?: string[];
  code?: string;
  fallbackToPlatform?: boolean;
  budget?: { spentUsd: number; budgetUsd: number };
};
export type PolicyInput = { principal: Principal; purpose: string; tier: string; tenant: TenantPolicy; hasPersonalData: boolean };
export type Decision = {
  allow: boolean;
  mode: Mode;
  /** The gateway profile to route to: auto:learner, auto:content, auto:lab, auto:t-<code>, byok, or self (embeddings). */
  profile: string | null;
  tier: Tier | null;
  dataClass: DataClass | null;
  allowFreePool: boolean;
  /** Restricted mode: only these providers. null = the profile decides. */
  providers: string[] | null;
  fallbackToPlatform: boolean;
  alert: 'budget_80' | null;
  reasons: string[];
  policyVersion: string;
};

const base = (reasons: string[]): Decision => ({ allow: false, mode: 'deny', profile: null, tier: null, dataClass: null, allowFreePool: false, providers: null, fallbackToPlatform: false, alert: null, reasons, policyVersion: POLICY_VERSION });
const deny = (reason: string, partial: Partial<Decision> = {}): Decision => ({ ...base([reason]), ...partial, allow: false, mode: 'deny' });
const LEARNER: Purpose[] = ['learner_help', 'lab_agent'];

export function decide(input: PolicyInput): Decision {
  const { principal: p, tenant: t } = input;
  // R0
  if (!(PURPOSES as readonly string[]).includes(input.purpose)) return deny('R0:unknown_purpose');
  if (!(TIERS as readonly string[]).includes(input.tier)) return deny('R0:unknown_tier');
  if (!p.id || !p.tenantId) return deny('R0:no_principal');
  const purpose = input.purpose as Purpose; let tier = input.tier as Tier;
  const reasons: string[] = [];

  // R1
  const minor = p.ageBand === 'minor';
  const dataClass = (LEARNER.includes(purpose) ? (minor ? 'minor' : 'learner') : 'course') as DataClass;
  reasons.push(`R1:data_${dataClass}`);

  // R2
  if (purpose === 'content' && p.kind !== 'service') return deny('R2:content_is_service_only', { dataClass });
  if (purpose === 'eval' && p.kind !== 'service' && !p.superAdmin) return deny('R2:eval_is_service_or_super_admin', { dataClass });
  if (LEARNER.includes(purpose) && p.kind !== 'user') return deny('R2:learner_purpose_needs_a_user', { dataClass });

  // R3
  if (purpose === 'lab_agent' && minor) return deny('R3:no_lab_keys_for_minors', { dataClass });

  // R8: embeddings never leave our servers
  if (tier === 'embed') {
    return { ...base([...reasons, 'R8:embed_self_hosted']), allow: true, mode: 'llm', profile: 'self', tier, dataClass };
  }

  // R6 budget
  let alert: Decision['alert'] = null;
  const used = t.budget && t.budget.budgetUsd > 0 ? t.budget.spentUsd / t.budget.budgetUsd : 0;
  if (used >= 0.8) { alert = 'budget_80'; reasons.push('R6:budget_80'); }
  if (used >= 1.2 && LEARNER.includes(purpose)) {
    return { ...base([...reasons, 'R6:budget_120_paused']), allow: true, mode: 'deterministic_only', dataClass, alert };
  }
  if (used >= 1 && tier === 'reason') { tier = 'fast'; reasons.push('R6:budget_100_fast_only'); }

  // R4 learner LLM switch
  if (LEARNER.includes(purpose) && !t.learnerLlm) {
    return { ...base([...reasons, 'R4:learner_llm_off']), allow: true, mode: 'deterministic_only', dataClass, tier, alert };
  }

  // R5 free pool
  const allowFreePool = (dataClass === 'course' || dataClass === 'public') && !input.hasPersonalData;
  reasons.push(allowFreePool ? 'R5:free_pool_allowed' : 'R5:paid_only');

  // R7 institution mode
  let profile: string; let providers: string[] | null = null; let fallbackToPlatform = false;
  const platformProfile = purpose === 'lab_agent' ? 'auto:lab' : LEARNER.includes(purpose) ? 'auto:learner' : 'auto:content';
  if (t.mode === 'restricted' && LEARNER.includes(purpose)) {
    const allowed = (t.allowedProviders ?? []).filter(Boolean);
    if (!allowed.length || !t.code) return { ...base([...reasons, 'R7:restricted_without_providers']), allow: true, mode: 'deterministic_only', dataClass, tier, alert };
    profile = `auto:t-${t.code}`; providers = allowed; reasons.push('R7:restricted');
  } else if (t.mode === 'byok' && LEARNER.includes(purpose)) {
    profile = 'byok'; fallbackToPlatform = !!t.fallbackToPlatform; reasons.push(fallbackToPlatform ? 'R7:byok_with_platform_fallback' : 'R7:byok_no_fallback');
  } else {
    profile = platformProfile; reasons.push('R7:managed');
  }

  return { allow: true, mode: 'llm', profile, tier, dataClass, allowFreePool: allowFreePool && profile === 'auto:content', providers, fallbackToPlatform, alert, reasons, policyVersion: POLICY_VERSION };
}
