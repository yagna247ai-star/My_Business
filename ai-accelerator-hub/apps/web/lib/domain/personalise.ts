/**
 * Personalisation rules engine (docs/PERSONALISED_JOURNEY_BUSINESS_SPEC.md §4–§6).
 *
 * Pure and deterministic: the same answers + safety facts always give the same plan, so a plan can be
 * explained, audited and unit-tested. There is no model call here. Age and guardian consent come
 * from server-held UserSetting rows, never from the onboarding form.
 *
 * Personalisation changes the examples, demos, questions, pace, tools and support. It never lowers
 * the competence bar: every persona passes the same rubric dimensions and the same human review.
 */
import { z } from 'zod';

export const RULES_VERSION = 1;

export const PERSONAS = ['kid_hobbyist', 'student', 'software_pro', 'ai_builder', 'business_owner'] as const;
export type Persona = (typeof PERSONAS)[number];

export const PERSONA_LABEL: Record<Persona, string> = {
  kid_hobbyist: 'Young Coder',
  student: 'Student & Career Starter',
  software_pro: 'Engineering Professional',
  ai_builder: 'AI Builder',
  business_owner: 'Business Owner',
};

const PII = [/\b[6-9]\d{9}\b/, /\b[\w.+-]+@[\w-]+\.[\w.]+\b/, /\b\d{4}\s?\d{4}\s?\d{4}\b/];
const noPii = (s: string | undefined) => !s || !PII.some(re => re.test(s));

export const onboardingSchema = z.object({
  role: z.enum(['school_student', 'college_student', 'working_professional', 'builder', 'business_owner']),
  pythonHobby: z.boolean().optional(),
  profession: z.enum(['software_engineer', 'architect', 'other_engineer', 'non_engineering']).optional(),
  codingComfort: z.enum(['none', 'basic', 'daily']),
  goal: z.enum(['learn_fundamentals', 'get_job', 'upskill_at_work', 'build_product', 'automate_business', 'start_ai_business']),
  hoursPerWeek: z.union([z.literal(2), z.literal(5), z.literal(10), z.literal(15)]),
  os: z.enum(['macos', 'windows', 'linux', 'chromebook', 'unsure']),
  learningStyle: z.enum(['watch', 'read', 'do']),
  domain: z.string().trim().max(80).refine(noPii, 'Remove phone numbers, emails or ID numbers.').optional().or(z.literal('')),
  contextCard: z.string().trim().max(1200).refine(noPii, 'Remove phone numbers, emails or ID numbers.').optional().or(z.literal('')),
}).superRefine((a, ctx) => {
  if (a.role === 'working_professional' && !a.profession) ctx.addIssue({ code: 'custom', path: ['profession'], message: 'Tell us what kind of work you do.' });
});
export type Answers = z.infer<typeof onboardingSchema>;

export type Safety = { minor: boolean; guardianConsent: 'not_required' | 'pending' | 'granted' };

export type AgentCode = 'claude_code' | 'codex_cli' | 'opencode' | 'kilo_code';

export type Plan = {
  persona: Persona; label: string; headline: string;
  mode: 'no-code' | 'low-code' | 'pro-code';
  pace: { key: 'gentle' | 'standard' | 'fast'; weeksPerLevel: number; note: string };
  track: string; // Track.code from seed-v3 §7
  emphasis: { levelIdx: number; why: string }[];
  agents: { code: AgentCode; name: string; rank: number; why: string; allowed: boolean; blockedReason?: string }[];
  readiness: { id: string; label: string; hint?: string }[];
  support: string[];
  coachHint: string; // appended to the AI coach system prompt — tone and examples only
  rulesVersion: number;
};

export function derivePersona(a: Answers, s: Safety): Persona {
  if (a.role === 'school_student') return s.minor || a.pythonHobby ? 'kid_hobbyist' : 'student';
  if (a.role === 'college_student') return 'student';
  if (a.role === 'working_professional') return a.profession === 'non_engineering' ? 'ai_builder' : 'software_pro';
  if (a.role === 'builder') return 'ai_builder';
  return 'business_owner';
}

const TRACK_BY: Record<Persona, (a: Answers) => string> = {
  kid_hobbyist: () => 'AI_APP_DEV',
  student: a => (a.codingComfort === 'none' ? 'AI_PRODUCT_MGR' : 'AI_APP_DEV'),
  software_pro: a => (a.profession === 'architect' ? 'AI_SOLUTIONS_ARCH' : 'AI_AGENT_DEV'),
  ai_builder: a => (a.goal === 'automate_business' ? 'AI_AUTOMATION_ENG' : 'AI_APP_DEV'),
  business_owner: a => (a.goal === 'start_ai_business' ? 'AI_PRODUCT_MGR' : 'AI_AUTOMATION_ENG'),
};

const EMPHASIS: Record<Persona, { levelIdx: number; why: string }[]> = {
  kid_hobbyist: [{ levelIdx: 1, why: 'Learn what AI can and cannot do before building with it.' }, { levelIdx: 3, why: 'Clear prompts are the fastest way to good Python help.' }, { levelIdx: 8, why: 'Python fundamentals — your hobby becomes real projects.' }],
  student: [{ levelIdx: 2, why: 'Employers hire people who can find real problems.' }, { levelIdx: 7, why: 'Ship something you can show in an interview.' }, { levelIdx: 12, why: 'Open-source pull requests are public proof of skill.' }],
  software_pro: [{ levelIdx: 9, why: 'RAG is the most common enterprise GenAI pattern.' }, { levelIdx: 10, why: 'Agent design, tool calling and permissions.' }, { levelIdx: 13, why: 'Evaluation, cost and reliability in production.' }],
  ai_builder: [{ levelIdx: 3, why: 'Better prompts mean better agent output.' }, { levelIdx: 6, why: 'Automate the boring parts of what you build.' }, { levelIdx: 7, why: 'From idea to a deployed app.' }],
  business_owner: [{ levelIdx: 2, why: 'Pick one customer problem worth solving.' }, { levelIdx: 4, why: 'Use AI tools daily in your own business.' }, { levelIdx: 6, why: 'Automations that save staff hours.' }],
};

/** Agent order per persona. Rationale is about the learner, not vendor marketing. */
const AGENT_ORDER: Record<Persona, AgentCode[]> = {
  kid_hobbyist: ['kilo_code', 'opencode', 'claude_code', 'codex_cli'],
  student: ['kilo_code', 'opencode', 'claude_code', 'codex_cli'],
  software_pro: ['claude_code', 'codex_cli', 'opencode', 'kilo_code'],
  ai_builder: ['claude_code', 'kilo_code', 'codex_cli', 'opencode'],
  business_owner: ['claude_code', 'kilo_code', 'codex_cli', 'opencode'],
};
const AGENT_WHY: Record<AgentCode, string> = {
  kilo_code: 'Works inside VS Code and offers free models, so you can start without a paid plan.',
  opencode: 'Open-source (MIT) terminal agent that works with many model providers.',
  claude_code: 'Terminal, desktop and IDE agent; strong at reading and changing whole projects.',
  codex_cli: 'Terminal agent you sign in to with a ChatGPT plan.',
};
export const AGENT_NAME: Record<AgentCode, string> = { claude_code: 'Claude Code', codex_cli: 'Codex CLI', opencode: 'OpenCode', kilo_code: 'Kilo Code' };
/** Agents that cannot be used without a paid plan or a provider API key (verified 2026-11-04, see agentLab.ts sources). */
export const PAID_AGENTS: AgentCode[] = ['claude_code', 'codex_cli', 'opencode'];

export function buildPlan(a: Answers, s: Safety): Plan {
  const persona = derivePersona(a, s);
  const pace = a.hoursPerWeek <= 2 ? { key: 'gentle' as const, weeksPerLevel: 2, note: 'About 2 hours a week: one level every two weeks. Streak freezes protect busy weeks.' }
    : a.hoursPerWeek >= 10 ? { key: 'fast' as const, weeksPerLevel: 1, note: 'Fast pace: one level a week, plus stretch challenges on the Sunday hackathon.' }
    : { key: 'standard' as const, weeksPerLevel: 1, note: 'Standard pace: one level a week, matching the Saturday workshop and Sunday hackathon.' };
  const mode = a.codingComfort === 'daily' ? 'pro-code' : a.codingComfort === 'basic' ? 'low-code' : 'no-code';

  const agents = AGENT_ORDER[persona].map((code, i) => {
    let allowed = true, blockedReason: string | undefined;
    if (s.minor && PAID_AGENTS.includes(code) && s.guardianConsent !== 'granted') { allowed = false; blockedReason = 'Needs a paid plan or API key. A parent or guardian must approve and set this up.'; }
    return { code, name: AGENT_NAME[code], rank: i + 1, why: AGENT_WHY[code], allowed, ...(blockedReason ? { blockedReason } : {}) };
  });

  const readiness: Plan['readiness'] = [
    { id: 'laptop', label: 'Laptop charged and on a stable internet connection' },
    { id: 'notes', label: 'A notes app open to save prompts and results' },
    ...(a.os === 'windows' ? [{ id: 'wsl', label: 'Know whether you will use PowerShell or WSL', hint: 'Claude Code runs natively on Windows 10 1809+; OpenCode recommends WSL.' }] : []),
    ...(a.os === 'chromebook' ? [{ id: 'linux', label: 'Turn on the Linux development environment, or use a laptop with macOS, Windows or Linux', hint: 'Terminal agents need a full operating system.' }] : []),
    ...(a.os === 'unsure' ? [{ id: 'os', label: 'Find out which operating system your laptop runs', hint: 'Ask a mentor if you are not sure — setup commands differ.' }] : []),
    ...(s.minor
      ? [{ id: 'guardian', label: 'A parent or guardian is with you for setup', hint: 'No payment card is needed: start with free models. Never share your account with friends.' }]
      : [{ id: 'card', label: 'A payment card that works for international payments, if you choose a paid agent plan', hint: 'Optional. You can start with free models and upgrade later.' }]),
  ];

  const support = [
    ...(s.minor ? ['Private by default: your name is hidden from public standings until your guardian approves.', 'No purchases on a learner account under 18.'] : []),
    a.learningStyle === 'watch' ? 'Short demo videos come first in each activity.' : a.learningStyle === 'read' ? 'Written lessons come first; demos are optional.' : 'Hands-on build steps come first; read the lesson when you get stuck.',
    persona === 'software_pro' ? 'Pro-code demos: terminal, Git and real repositories from the start.' : persona === 'kid_hobbyist' ? 'Plain-language explanations with school and hobby examples.' : persona === 'business_owner' ? 'Every example uses a real small-business situation; ROI is part of each review.' : 'Examples drawn from your stated interest where possible.',
  ];

  const domain = a.domain ? ` Use examples from ${a.domain} when helpful.` : '';
  const coachHint = {
    kid_hobbyist: 'The learner is a young person learning Python as a hobby. Use simple words, short sentences and school or game examples. Keep them safe: remind them never to share personal data.',
    student: 'The learner is a student building a career. Connect concepts to portfolio projects and interview questions.',
    software_pro: 'The learner is an experienced engineer. Be concise and technical; discuss trade-offs, testing and production concerns.',
    ai_builder: 'The learner wants to build products with AI and may not be a programmer. Focus on practical steps and how to check what the AI built.',
    business_owner: 'The learner runs a business. Frame everything in customer value, time saved, cost and risk. Avoid jargon.',
  }[persona] + domain;

  const headline = {
    kid_hobbyist: 'Turn your Python hobby into real, safe AI projects.',
    student: 'Build proof of skill employers can check.',
    software_pro: 'Go from AI-assisted coding to production AI systems.',
    ai_builder: 'Go from idea to a working AI product, and know how to check it.',
    business_owner: 'Use AI to save time and serve customers in your own business.',
  }[persona];

  return { persona, label: PERSONA_LABEL[persona], headline, mode, pace, track: TRACK_BY[persona](a), emphasis: EMPHASIS[persona], agents, readiness, support, coachHint, rulesVersion: RULES_VERSION };
}

/**
 * Overlay a persona variant onto an activity config. Variants may replace whole keys
 * (problem, objective, check, scenarios, …) and may override individual build-field hints via `fieldHints`.
 * Field keys, counts and rules are never changed, so grading stays identical across personas.
 */
type AnyCfg = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
const PROTECTED = new Set(['kind', 'rubric', 'xpSplit', 'attempts', 'passPct', 'passMin', 'iterations', 'iterationRules', 'fields', 'minWords', 'minWhyWords', 'choices', 'quiz', 'checklist', 'tools']);
export function resolveConfig(cfg: AnyCfg, persona: Persona | null | undefined): AnyCfg {
  const { variants, ...base } = cfg;
  const v: AnyCfg | undefined = persona && variants ? variants[persona] : undefined;
  if (!v) return base;
  const { fieldHints, ...rest0 } = v;
  // Grading rules are protected: a variant can change what the learner reads, never how they are graded.
  const rest = Object.fromEntries(Object.entries(rest0).filter(([k]) => !PROTECTED.has(k)));
  if (rest.check && base.check && rest.check.options?.length !== base.check.options?.length) throw new Error('Variant must keep the option count');
  const out: AnyCfg = { ...base, ...rest, personalisedFor: persona };
  if (fieldHints && Array.isArray(base.fields)) out.fields = base.fields.map((f: AnyCfg) => (fieldHints[f.key] ? { ...f, hint: fieldHints[f.key] } : f));
  if (Array.isArray(rest.scenarios) && Array.isArray(base.scenarios) && rest.scenarios.length !== base.scenarios.length) throw new Error('Variant must keep the scenario count');
  return out;
}
