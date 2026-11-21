/**
 * Is a learner's written answer a real answer? Replaces word-count minimums ("at least 55 words"): length is not
 * quality, and counting words pushes people to pad. We check what matters and never show a number.
 *
 * checkAnswer() is pure and always runs: not empty, not a single word, not keyboard mash or one word repeated,
 * not a copy of the example, and on topic for content fields with an example (English answers only, so answers written in Telugu,
 * Hindi or another Indian language are never rejected for "not mentioning" an English word).
 * judgeAnswers() asks the AI chain whether each answer really addresses its question. It adds a check when an
 * AI provider is available and silently does nothing when it is not (no key, rate limit, timeout): learners are
 * never blocked because the AI is down.
 */
import { langchainProvider } from '@/lib/ai/providers/langchain';

export type Quality = { ok: boolean; reason?: string; score: 1 | 2 | 3 | 4 | 5 };
export type Depth = 'short' | 'detail';

const latin = (s: string) => (s.match(/[A-Za-z]/g) ?? []).length;
const tokens = (s: string) => s.toLowerCase().split(/[^a-z0-9ऀ-෿]+/).filter(w => w.length > 2);
const STOP = new Set(['the', 'and', 'for', 'with', 'that', 'this', 'what', 'your', 'you', 'how', 'why', 'which', 'from', 'are', 'was', 'were', 'will', 'into', 'about', 'they', 'them', 'their', 'our', 'can', 'not', 'but', 'its', 'has', 'have', 'had', 'one', 'all', 'any', 'each', 'who', 'did', 'does', 'use', 'used', 'example', 'e.g']);
const MASH = /(asdf|qwer|zxcv|hjkl|jkl;|uiop|lorem|ipsum|blah|test test|xxx|aaaa|hhhh)/i;

function jaccard(a: string, b: string) {
  const A = new Set(tokens(a)), B = new Set(tokens(b));
  if (!A.size || !B.size) return 0;
  let n = 0; A.forEach(t => { if (B.has(t)) n++; });
  return n / (A.size + B.size - n);
}

/**
 * topic: the question or label the answer is for. hint: the example shown to the learner.
 * depth 'detail' (reflections, briefs) expects what you did and what you learned; 'short' (a reason, a prompt) does not.
 */
export function checkAnswer(text: unknown, ctx: { topic: string; hint?: string; depth?: Depth }): Quality {
  const t = String(text ?? '').trim();
  const words = t.split(/\s+/).filter(Boolean);
  const depth = ctx.depth ?? 'short';
  const topic = ctx.topic.replace(/[.?:]+$/, '').toLowerCase();
  if (!t) return { ok: false, reason: `Please answer: ${topic}.`, score: 1 };
  if (words.length < 3) return { ok: false, reason: `Write a full sentence that answers: ${topic}.`, score: 1 };

  const distinct = new Set(words.map(w => w.toLowerCase()));
  const longest = Math.max(...words.map(w => w.length));
  if (MASH.test(t) || distinct.size / words.length < 0.35 || /(.)\1{4,}/.test(t) || longest > 40) {
    return { ok: false, reason: 'This does not read like a real answer yet. Explain it in your own words.', score: 1 };
  }
  if (ctx.hint && jaccard(t, ctx.hint) > 0.8) return { ok: false, reason: 'Use your own words instead of repeating the example.', score: 1 };

  // On-topic check only for content fields that come with an example (hint), and only for English answers:
  // generic questions ("what did you change?") are answered well without repeating their words.
  const english = latin(t) / Math.max(1, t.replace(/\s/g, '').length) > 0.6;
  if (english && ctx.hint) {
    const want = new Set([...tokens(ctx.topic), ...tokens(ctx.hint ?? '')].filter(w => !STOP.has(w)));
    const have = tokens(t).filter(w => !STOP.has(w));
    const related = have.some(w => want.has(w) || [...want].some(k => k.length > 4 && (w.startsWith(k.slice(0, 5)) || k.startsWith(w.slice(0, 5)))));
    if (want.size > 0 && !related && words.length < 15) return { ok: false, reason: `Your answer does not talk about ${topic} yet. Say how it applies to your work.`, score: 2 };
  }
  if (depth === 'detail' && words.length < 8) return { ok: false, reason: 'Add a little more: what you did, what happened, and what you learned.', score: 2 };

  const sentences = t.split(/[.!?।]+/).filter(s => s.trim().split(/\s+/).length >= 3).length;
  const score: Quality['score'] = depth === 'detail' ? (sentences >= 4 && distinct.size >= 45 ? 5 : sentences >= 2 ? 4 : 3) : (sentences >= 2 ? 5 : 4);
  return { ok: true, score };
}

/** Check several answers at once; the first problem per field, keyed by field. */
export function checkAll(items: { key: string; text: unknown; topic: string; hint?: string; depth?: Depth }[]): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const i of items) { const q = checkAnswer(i.text, i); if (!q.ok) errors[i.key] = q.reason!; }
  return errors;
}

/**
 * The AI judge: does each answer actually address its question? Returns feedback only for answers it is sure are off
 * topic or wrong. Returns {} whenever the AI is unavailable (no key, quota, timeout), so it can never block a learner.
 */
export async function judgeAnswers(items: { key: string; topic: string; text: string }[], context: string): Promise<Record<string, string>> {
  if (process.env.AI_ANSWER_CHECK === 'off' || !langchainProvider.configured() || !items.length) return {};
  const system = [
    'You review short answers written by data-analytics learners in India. For each item, decide if the answer genuinely addresses its question in the context given.',
    'Be generous: accept simple, imperfect or non-English answers that make a real attempt. Reject only answers that are off topic, nonsense, or clearly wrong.',
    'Return ONLY JSON: [{"key": "...", "ok": true|false, "feedback": "one short, kind sentence telling them what to add or fix (no word counts)"}].',
  ].join('\n');
  try {
    const r = await Promise.race([
      langchainProvider.chat('answer-check', system, [{ role: 'user', content: JSON.stringify({ context, items }) }]),
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), 12_000)),
    ]);
    const arr = JSON.parse(r.text.replace(/^```(?:json)?\s*|\s*```$/g, '')) as { key: string; ok: boolean; feedback?: string }[];
    const keys = new Set(items.map(i => i.key));
    return Object.fromEntries(arr.filter(x => keys.has(x.key) && x.ok === false && x.feedback).map(x => [x.key, String(x.feedback).slice(0, 240)]));
  } catch { return {}; }
}
