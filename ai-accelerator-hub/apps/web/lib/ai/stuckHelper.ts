/**
 * Stuck helper (GAMIFICATION-SPEC §7): a LangGraph workflow that helps a learner who is stuck.
 *   1. If the learner has not said what they tried, ask first.
 *   2. Otherwise give ONE hint (never the full answer), building on earlier hints.
 *   3. After three hints, hand over to a mentor.
 * The model is Gemini, through the app's provider registry. With no Gemini key, or if the call fails,
 * the helper says so plainly (FALLBACK) and never invents an answer.
 */
import { Annotation, StateGraph, START, END } from '@langchain/langgraph';
import { HumanMessage } from '@langchain/core/messages';
import { PROVIDER_DEFS } from '@/lib/ai/providers/langchain';

export const MAX_HINTS = 3;
export const FALLBACK = 'The AI helper is not available right now, so it will not guess. Re-read the lesson for this step, check your data, or ask your mentor from the review page.';
export const ASK_TRIED = 'Before a hint: what have you tried so far, and what happened? One or two sentences is enough.';
export const ESCALATE = 'You have had three hints. A mentor can now look at your work with you. Use "Ask a mentor" on this level, and include what you tried.';

export type Step = 'ask_tried' | 'hint' | 'escalate' | 'fallback';
export type HelperInput = { question: string; tried: string; hints: string[]; levelTitle: string };
export type HelperResult = { step: Step; reply: string; hints: string[] };
/** Turns a prompt into one hint. null means no model is configured. */
export type HintModel = ((prompt: string) => Promise<string>) | null;

export function nextStep(s: { tried: string; hints: string[] }): Exclude<Step, 'fallback'> {
  if (!s.tried.trim()) return 'ask_tried';
  if (s.hints.length >= MAX_HINTS) return 'escalate';
  return 'hint';
}

export function hintPrompt(s: HelperInput): string {
  return [
    `You are a patient tutor for the "${s.levelTitle}" level of a data analytics course. Explain like you would to a 12-year-old.`,
    'Rules: give exactly one hint, in at most three sentences. Never give the full answer, the final query, or the final code.',
    'Point to the idea or the step to check next. Do not ask for or repeat personal data.',
    `The learner is stuck on: ${s.question}`,
    `What they tried: ${s.tried}`,
    s.hints.length ? `Hints already given (do not repeat them, go one step further):\n${s.hints.map(h => `- ${h}`).join('\n')}` : 'No hints given yet.',
  ].join('\n');
}

const State = Annotation.Root({
  question: Annotation<string>(),
  tried: Annotation<string>(),
  levelTitle: Annotation<string>(),
  hints: Annotation<string[]>(),
  step: Annotation<Step>(),
  reply: Annotation<string>(),
});
type S = typeof State.State;

function buildGraph(model: HintModel) {
  return new StateGraph(State)
    .addNode('ask_tried', () => ({ step: 'ask_tried' as Step, reply: ASK_TRIED }))
    .addNode('escalate', () => ({ step: 'escalate' as Step, reply: ESCALATE }))
    .addNode('hint', async (s: S) => {
      if (!model) return { step: 'fallback' as Step, reply: FALLBACK };
      try {
        const text = (await model(hintPrompt(s))).trim();
        if (!text) return { step: 'fallback' as Step, reply: FALLBACK };
        return { step: 'hint' as Step, reply: text, hints: [...s.hints, text] };
      } catch {
        return { step: 'fallback' as Step, reply: FALLBACK };
      }
    })
    .addConditionalEdges(START, (s: S) => nextStep(s), { ask_tried: 'ask_tried', hint: 'hint', escalate: 'escalate' })
    .addEdge('ask_tried', END)
    .addEdge('hint', END)
    .addEdge('escalate', END)
    .compile();
}

export async function runStuckHelper(input: HelperInput, model: HintModel = geminiModel()): Promise<HelperResult> {
  const out = await buildGraph(model).invoke({ ...input, hints: input.hints.slice(0, MAX_HINTS), step: 'ask_tried', reply: '' });
  return { step: out.step, reply: out.reply, hints: out.hints };
}

/** Gemini through the provider registry, or null when no Gemini key is set. */
export function geminiModel(): HintModel {
  const def = PROVIDER_DEFS.find(d => d.id === 'gemini')!;
  const key = def.envKeys.map(k => process.env[k]?.trim()).find(Boolean);
  if (!key) return null;
  const chat = def.build(key, process.env.AI_MODEL_GEMINI?.trim() || def.defaultModel);
  return async (prompt: string) => {
    const msg = await chat.invoke([new HumanMessage(prompt)]);
    return typeof msg.content === 'string' ? msg.content : msg.content.map(c => ('text' in c ? c.text : '')).join('');
  };
}
