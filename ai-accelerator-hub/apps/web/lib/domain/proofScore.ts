/**
 * Agent Lab proof scoring (docs/AGENT_LAB_PROOF_SCORING_SPEC.md §4). Pure and deterministic.
 * 60 automatic points (A1–A5) + 40 reviewer points (R1–R3). Pass = total ≥ 70 and every gate passes.
 */
import { findMethod, nodeMajor, type OS } from './setupGuide';
import type { AgentCode } from './personalise';
import { TECHNIQUE, checkPrompt, type TechniqueId } from './promptTechniques';

/** Minimum readable screenshot size (spec §3). Kept here so browser code never imports Node crypto. */
export const MIN_W = 640, MIN_H = 360;
export const PASS_MARK = 70;
export const LAB_XP_MAX = 40;
export type StepRef = 'install' | 'prompt' | 'result';
export type CheckItem = { id: string; label: string; points: number; max: number; gate: boolean; gateFailed: boolean; detail: string; why: string; fix: string; step: StepRef };

const words = (s: unknown) => String(s || '').trim().split(/\s+/).filter(Boolean).length;

export type AutoInput = {
  agent: AgentCode; os: OS; versionOutput: string | null;
  install?: { method?: string; nodeVersion?: string };
  /** Prompt Studio save; `promptParts` alone is the pre-studio single-shot shape. */
  prompt?: { technique: TechniqueId; caseId: string | null; fields: Record<string, string>; spotted: number | null } | null;
  promptParts?: Record<string, string>;
  resultSummary: string | null; verifiedNote?: string;
  screenshot: { exists: boolean; isImage: boolean; width: number | null; height: number | null; avStatus: string | null; reused: boolean };
};

/** A1–A5: automatic checks, 60 points. */
export function scoreAuto(i: AutoInput): { items: CheckItem[]; total: number; max: number; gatesOk: boolean } {
  const m = findMethod(i.agent, i.os, i.install?.method || '');
  const items: CheckItem[] = [];

  const a1 = !!m && !!i.versionOutput && new RegExp(m.check.pattern, 'i').test(i.versionOutput);
  items.push({ id: 'A1', label: 'Install proof matches the expected output', points: a1 ? 20 : 0, max: 20, gate: true, gateFailed: !a1,
    detail: a1 ? `Matches the ${m?.label} check.` : m ? `Doesn’t match what “${m.check.cmd || 'the check'}” prints.` : 'No install method saved.',
    why: 'It proves the agent is really installed on your computer — everything after depends on it.', fix: m ? m.check.how : 'Save the Install step.', step: 'install' });

  const needNode = !!m?.needs.includes('node');
  const major = needNode ? nodeMajor(i.install?.nodeVersion || '') : null;
  const a2 = !needNode || (major !== null && (!m?.minNode || major >= m.minNode));
  items.push({ id: 'A2', label: 'Node.js version meets the requirement', points: a2 ? 5 : 0, max: 5, gate: false, gateFailed: false,
    detail: needNode ? (a2 ? `node -v: ${i.install?.nodeVersion}` : `node -v: ${i.install?.nodeVersion || 'missing'}${m?.minNode ? ` (needs ${m.minNode}+)` : ''}`) : 'Not needed for this install method.',
    why: 'An old or missing Node.js is the most common reason npm installs fail later.', fix: 'Install the LTS version (nvm install --lts), open a new terminal, run node -v and save the Install step again.', step: 'install' });

  // A3 (Prompt Studio spec §5): 15 points shared equally across the chosen technique's rules.
  const pr = i.prompt || (i.promptParts ? { technique: 'single_shot' as const, caseId: null, fields: i.promptParts, spotted: null } : null);
  const chk = pr ? checkPrompt(pr.technique, pr.fields, { caseId: pr.caseId, spotted: pr.spotted }) : null;
  const bad = chk ? chk.rules.filter(r => !r.ok) : [];
  const tname = pr ? TECHNIQUE[pr.technique].name : 'prompt';
  items.push({ id: 'A3', label: `Prompt is complete (${tname})`, points: chk ? Math.round((15 * chk.passed) / chk.total) : 0, max: 15, gate: false, gateFailed: false,
    detail: !chk ? 'No prompt saved yet.' : bad.length ? bad.map(r => r.msg).join(' ') : `Every part of the ${tname} template is filled in.`,
    why: 'A clear, well-structured prompt is how you get reliable results from any AI agent — this is the skill the lab teaches.', fix: bad.length ? `Open “Build your prompt” and fix: ${bad.map(r => r.label).join(', ')}.` : 'Save the prompt step.', step: 'prompt' });

  const sw = words(i.resultSummary), vw = words(i.verifiedNote);
  const a4 = (sw >= 30 ? 6 : 0) + (vw >= 15 ? 4 : 0);
  items.push({ id: 'A4', label: 'Result write-up is complete', points: a4, max: 10, gate: false, gateFailed: false,
    detail: `What it produced: ${sw} words (30+). How you checked: ${vw} words (15+).`,
    why: 'Saying what the agent made and how you checked it shows you didn’t just trust the AI.', fix: 'Describe the files or answer it produced, and how you tested or opened it.', step: 'result' });

  const s = i.screenshot;
  const big = !!s.width && !!s.height && s.width >= MIN_W && s.height >= MIN_H;
  const avBad = s.avStatus === 'infected';
  const a5 = (s.exists && s.isImage ? 3 : 0) + (big ? 3 : 0) + (s.exists && !s.reused ? 4 : 0);
  const a5gate = !s.exists || !s.isImage || s.reused || avBad;
  items.push({ id: 'A5', label: 'Screenshot is genuine and readable', points: avBad ? 0 : a5, max: 10, gate: true, gateFailed: a5gate,
    detail: !s.exists ? 'No screenshot yet.' : !s.isImage ? 'Not an image.' : avBad ? 'Failed the virus scan.' : s.reused ? 'This exact image was already used for another Agent Lab proof.' : big ? `${s.width}×${s.height} — good.` : `${s.width}×${s.height} — smaller than ${MIN_W}×${MIN_H}, hard to read.`,
    why: 'Your reviewer needs to see your own agent producing your result. A reused or tiny image can’t prove that.',
    fix: s.reused ? 'Take a new screenshot of your own agent and result, then replace it.' : !big ? 'Capture the whole agent window (not a small crop) and replace the screenshot.' : 'Upload or paste a PNG, JPG or WebP screenshot.', step: 'result' });

  const total = items.reduce((n, x) => n + x.points, 0);
  return { items, total, max: 60, gatesOk: items.every(x => !x.gateFailed) };
}

export type Answer = 'yes' | 'partly' | 'no';
export type ReviewAnswers = { agentRunning: Answer; matchesResult: Answer; noSensitiveData: Answer };
export const REVIEW_QUESTIONS = [
  { key: 'agentRunning', id: 'R1', label: 'Does the screenshot show this agent running (its panel, TUI or terminal session)?', max: 15 },
  { key: 'matchesResult', id: 'R2', label: 'Does it show the result the learner described?', max: 15 },
  { key: 'noSensitiveData', id: 'R3', label: 'Is it free of secrets and personal data (keys, emails, phone numbers, other people’s data)?', max: 10 },
] as const;
const frac: Record<Answer, number> = { yes: 1, partly: 0.5, no: 0 };

/** R1–R3 plus the final outcome. */
export function scoreReview(autoTotal: number, autoGatesOk: boolean, a: ReviewAnswers) {
  const items = REVIEW_QUESTIONS.map(q => ({ id: q.id, label: q.label, max: q.max, answer: a[q.key], points: Math.round(q.max * frac[a[q.key]] * 2) / 2 }));
  const review = items.reduce((n, x) => n + x.points, 0);
  const total = Math.round(autoTotal + review);
  const gates = { agentRunning: a.agentRunning !== 'no', noSensitiveData: a.noSensitiveData === 'yes' };
  const pass = total >= PASS_MARK && autoGatesOk && gates.agentRunning && gates.noSensitiveData;
  const reasons: string[] = [];
  if (!autoGatesOk) reasons.push('An automatic check that must pass did not (install proof or screenshot).');
  if (!gates.agentRunning) reasons.push('The screenshot does not show the agent running.');
  if (!gates.noSensitiveData) reasons.push('The screenshot shows secrets or personal data — crop or retake it, and revoke any visible key.');
  if (total < PASS_MARK) reasons.push(`The score is ${total}/100; ${PASS_MARK} is needed.`);
  return { items, review, total, pass, xp: pass ? Math.round((LAB_XP_MAX * total) / 100) : 0, reasons };
}
