/**
 * Guided steps: a day's task split into steps the learner follows one by one, like the Agent Lab setup guide.
 * Each step explains its concept where it is needed, says exactly what to do, and checks that it was done:
 *   tick        reading or thinking steps (self-confirmed)
 *   answer      a short written answer, checked for quality (answerQuality, never by word count)
 *   paste       paste real output (a query result, a version line, a CSV header) matched against a pattern
 *   screenshot  an image of the learner's own work (Excel, Power BI, Databricks)
 * Points by effort. Pure module: used by the server (checks) and the browser (the guided day).
 */
import { checkAnswer } from './answerQuality';

export type StepCheck =
  | { kind: 'tick'; prompt: string }
  | { kind: 'answer'; prompt: string; hint?: string }
  | { kind: 'paste'; prompt: string; pattern: string; sample?: string; fail: string }
  | { kind: 'screenshot'; prompt: string };

export type GuidedStep = {
  title: string;
  /** What this is and why it matters, at the moment the learner needs it (2–3 sentences). */
  concept: string;
  /** Exactly what to do. */
  do: string[];
  code?: { lang: string; text: string };
  check: StepCheck;
};

export const STEP_POINTS: Record<StepCheck['kind'], number> = { tick: 2, answer: 3, paste: 5, screenshot: 5 };
export const stepPoints = (s: GuidedStep) => STEP_POINTS[s.check.kind];

export type StepInput = { answer?: string; paste?: string; fileOk?: boolean };
export type StepResult = { ok: true } | { ok: false; reason: string };

/** Is this step done? fileOk: the server has verified the uploaded screenshot belongs to the learner. */
export function validateStep(step: GuidedStep, input: StepInput): StepResult {
  const c = step.check;
  if (c.kind === 'tick') return { ok: true };
  if (c.kind === 'answer') {
    const q = checkAnswer(input.answer, { topic: c.prompt, hint: c.hint });
    return q.ok ? { ok: true } : { ok: false, reason: q.reason! };
  }
  if (c.kind === 'paste') {
    const text = String(input.paste ?? '').trim();
    if (!text) return { ok: false, reason: 'Paste the output you got.' };
    if (text.length > 20000) return { ok: false, reason: 'Paste only the relevant lines of the output.' };
    let re: RegExp; try { re = new RegExp(c.pattern, 'im'); } catch { return { ok: true }; }
    return re.test(text) ? { ok: true } : { ok: false, reason: c.fail };
  }
  return input.fileOk ? { ok: true } : { ok: false, reason: 'Upload a screenshot of your work for this step.' };
}

/** Per-step progress stored with the day: index → result. */
export type StepState = { s: 'done' | 'skipped'; xp: number; at: string; answer?: string; paste?: string; fileId?: string };
export const stepsFinished = (steps: GuidedStep[], states: (StepState | null | undefined)[]) => steps.every((_, i) => !!states[i]);
/** The first step not yet done or skipped (the one that is open), or -1 when the day is finished. */
export const currentStep = (steps: GuidedStep[], states: (StepState | null | undefined)[]) => steps.findIndex((_, i) => !states[i]);
