/**
 * Provider-agnostic AI chain built on LangChain.
 *
 * Any provider is enabled by setting its API key (and optionally a model) in the environment.
 * Providers are tried in chain order; if the first fails, LangChain's `withFallbacks` moves to the next.
 *
 *   AI_PROVIDER_CHAIN   optional, comma-separated order, e.g. "anthropic,openrouter,gemini".
 *                       Default: every configured provider, in the registry order below.
 *   AI_MODEL_<ID>       optional model override per provider, e.g. AI_MODEL_OPENROUTER=qwen/qwen3-8b:free
 *
 * Supported out of the box (all through one interface):
 *   anthropic    ANTHROPIC_API_KEY                 (Claude models)
 *   gemini       GEMINI_API_KEY                    (Google Gemini)
 *   openai       OPENAI_API_KEY                    (OpenAI)
 *   xai          XAI_API_KEY                       (Grok)
 *   glm          ZHIPU_API_KEY                     (GLM / Zhipu BigModel)
 *   openrouter   OPENROUTER_API_KEY                (hundreds of models, including free ones)
 *   cerebras     CEREBRAS_API_KEY                  (Cerebras inference)
 *   custom       AI_BASE_URL + AI_API_KEY          (any OpenAI-compatible endpoint: Ollama, LiteLLM, Groq, Together, ...)
 */
import type { AiProvider, ChatTurn, ProviderReply } from '@/lib/ai/coach';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatOpenAI } from '@langchain/openai';
import { AIMessage, HumanMessage, SystemMessage, type BaseMessage } from '@langchain/core/messages';
import type { Runnable } from '@langchain/core/runnables';

type ChatModel = Runnable<BaseMessage[], AIMessage>;

type ProviderDef = {
  id: string;
  label: string;
  envKeys: string[];           // first non-empty wins
  defaultModel: string;
  build: (apiKey: string, model: string) => ChatModel;
};

const openAICompatible = (baseURL: string) => (apiKey: string, model: string) =>
  new ChatOpenAI({ apiKey, model, configuration: { baseURL }, temperature: 0.4, maxRetries: 1, timeout: 60_000 }) as unknown as ChatModel;

export const PROVIDER_DEFS: ProviderDef[] = [
  { id: 'anthropic', label: 'Anthropic Claude', envKeys: ['ANTHROPIC_API_KEY', 'ANTHROPIC_AUTH_TOKEN'], defaultModel: 'claude-haiku-5-5',
    build: (apiKey, model) => new ChatAnthropic({ apiKey, model, temperature: 0.4, maxRetries: 1, clientOptions: { timeout: 60_000 } }) as unknown as ChatModel },
  { id: 'gemini', label: 'Google Gemini', envKeys: ['GEMINI_API_KEY', 'GOOGLE_API_KEY'], defaultModel: 'gemini-2.5-flash',
    build: (apiKey, model) => new ChatGoogleGenerativeAI({ apiKey, model, temperature: 0.4, maxRetries: 1 }) as unknown as ChatModel },
  { id: 'openai', label: 'OpenAI', envKeys: ['OPENAI_API_KEY'], defaultModel: 'gpt-4o-mini',
    build: (apiKey, model) => openAICompatible('https://api.openai.com/v1')(apiKey, model) },
  { id: 'xai', label: 'xAI Grok', envKeys: ['XAI_API_KEY'], defaultModel: 'grok-3-mini',
    build: (apiKey, model) => openAICompatible('https://api.x.ai/v1')(apiKey, model) },
  { id: 'glm', label: 'GLM (Zhipu BigModel)', envKeys: ['ZHIPU_API_KEY', 'GLM_API_KEY'], defaultModel: 'glm-4-flash',
    build: (apiKey, model) => openAICompatible('https://open.bigmodel.cn/api/paas/v4')(apiKey, model) },
  { id: 'openrouter', label: 'OpenRouter (incl. free models)', envKeys: ['OPENROUTER_API_KEY'], defaultModel: 'meta-llama/llama-3.3-70b-instruct:free',
    build: (apiKey, model) => openAICompatible('https://openrouter.ai/api/v1')(apiKey, model) },
  { id: 'cerebras', label: 'Cerebras', envKeys: ['CEREBRAS_API_KEY'], defaultModel: 'llama-3.3-70b',
    build: (apiKey, model) => openAICompatible('https://api.cerebras.ai/v1')(apiKey, model) },
  { id: 'custom', label: 'Custom OpenAI-compatible endpoint', envKeys: ['AI_API_KEY'], defaultModel: process.env.AI_MODEL_CUSTOM || 'default',
    build: (apiKey, model) => openAICompatible(process.env.AI_BASE_URL || 'http://localhost:11434/v1')(apiKey, model) },
];

function keyFor(def: ProviderDef): string | null {
  for (const k of def.envKeys) { const v = process.env[k]?.trim(); if (v) return v; }
  return null;
}

/** Providers with a key configured, in chain order. */
export function configuredDefs(): { def: ProviderDef; apiKey: string }[] {
  const order = (process.env.AI_PROVIDER_CHAIN || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  const byId = new Map(PROVIDER_DEFS.map(d => [d.id, d]));
  const ids = order.length ? order : PROVIDER_DEFS.map(d => d.id);
  const out: { def: ProviderDef; apiKey: string }[] = [];
  for (const id of ids) {
    const def = byId.get(id); if (!def) continue;
    const apiKey = keyFor(def); if (apiKey) out.push({ def, apiKey });
  }
  return out;
}

/**
 * Gemini model names are retired over time (gemini-2.5-flash now returns 404), so the default is not hard-coded:
 * ask Google which models this key can use and take the newest stable Flash model. Cached for an hour.
 */
let geminiCache: { at: number; model: string } | null = null;
export function pickGeminiModel(models: { name: string; supportedGenerationMethods?: string[] }[]): string | null {
  const ok = models
    .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
    .map(m => m.name.replace(/^models\//, ''))
    .filter(n => /^gemini-\d+(\.\d+)?-flash$/.test(n));
  const ver = (n: string) => Number(/^gemini-(\d+(?:\.\d+)?)/.exec(n)![1]);
  return ok.sort((a, b) => ver(b) - ver(a))[0] ?? null;
}
async function geminiModel(apiKey: string, fallback: string): Promise<string> {
  if (geminiCache && Date.now() - geminiCache.at < 3600_000) return geminiCache.model;
  try {
    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200', { headers: { 'x-goog-api-key': apiKey }, signal: AbortSignal.timeout(10_000) });
    const j = (await r.json()) as { models?: { name: string; supportedGenerationMethods?: string[] }[] };
    const m = pickGeminiModel(j.models ?? []) ?? fallback;
    geminiCache = { at: Date.now(), model: m };
    return m;
  } catch { return fallback; }
}

function modelFor(def: ProviderDef, requested: string): string {
  const override = process.env[`AI_MODEL_${def.id.toUpperCase()}`]?.trim();
  if (override) return override;
  // Learner assistants carry Claude model names; only honour them for Anthropic.
  if (def.id === 'anthropic' && requested.startsWith('claude')) return requested;
  return def.defaultModel;
}

const toMessages = (system: string, turns: ChatTurn[]): BaseMessage[] => [
  new SystemMessage(system),
  ...turns.map(t => (t.role === 'assistant' ? new AIMessage(t.content) : new HumanMessage(t.content))),
];

const textOf = (m: AIMessage): string =>
  typeof m.content === 'string' ? m.content : m.content.map(part => (typeof part === 'object' && part && 'text' in part ? String(part.text) : '')).join('');

/** One AiProvider for the whole chain. `configured()` is true when at least one provider has a key. */
export const langchainProvider: AiProvider = {
  name: 'langchain-chain',
  configured: () => configuredDefs().length > 0,
  async chat(model: string, system: string, turns: ChatTurn[]): Promise<ProviderReply> {
    const active = configuredDefs();
    if (active.length === 0) throw new Error('No AI provider is configured');
    const models = await Promise.all(active.map(async ({ def, apiKey }) => {
      const override = process.env[`AI_MODEL_${def.id.toUpperCase()}`]?.trim();
      const name = def.id === 'gemini' && !override ? await geminiModel(apiKey, def.defaultModel) : modelFor(def, model);
      return { def, name, runnable: def.build(apiKey, name) };
    }));
    const [primary, ...rest] = models;
    const chain = rest.length ? primary.runnable.withFallbacks({ fallbacks: rest.map(r => r.runnable) }) : primary.runnable;
    const res = await chain.invoke(toMessages(system, turns));
    const usage = res.usage_metadata;
    return {
      text: textOf(res).trim(),
      tokensIn: usage?.input_tokens ?? 0,
      tokensOut: usage?.output_tokens ?? 0,
      // Report the model that actually answered (LangChain fallbacks hide which one ran); fall back to the primary label.
      model: String(res.response_metadata?.model_name ?? res.response_metadata?.model ?? `${primary.def.id}:${primary.name}`),
      refused: false,
    };
  },
};
