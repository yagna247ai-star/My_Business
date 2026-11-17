import { Answer, Question, ScoreBreakdown } from "./types";

function clamp(n: number, min = 0, max = 100) { return Math.max(min, Math.min(max, n)); }

function textScore(text: string, keyPoints: string[]) {
  const t = text.toLowerCase();
  let hits = 0;
  for (const p of keyPoints) {
    const tokens = p.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 3);
    const matched = tokens.some(tok => t.includes(tok));
    if (matched) hits++;
  }
  const coverage = keyPoints.length ? hits / keyPoints.length : 0;
  const lengthBonus = Math.min(text.trim().length / 220, 1) * 0.15;
  return clamp((coverage * 0.85 + lengthBonus) * 100);
}

export function scoreQuestion(q: Question, a: Answer): { score: number; notes: string[] } {
  const notes: string[] = [];
  if (q.type === "mcq") {
    const correct = a.selectedIndex === q.correctIndex;
    notes.push(correct ? "Selected correct answer." : `Expected: ${q.options?.[q.correctIndex ?? 0] ?? "n/a"}.`);
    if (!correct) notes.push(`Key points: ${q.keyPoints.slice(0,2).join("; ")}.`);
    return { score: correct ? 100 : 30, notes };
  }
  const base = textScore(a.response || "", q.keyPoints);
  const timeFactor = a.timeSpentSec > 0 && a.timeSpentSec <= q.timeLimitSec ? 1 : 0.9;
  const score = clamp(base * timeFactor);
  const missing = q.keyPoints.filter(p => !a.response.toLowerCase().includes(p.toLowerCase().split(" ")[0]));
  if (missing.length) notes.push(`Consider covering: ${missing.slice(0,2).join("; ")}.`);
  else notes.push("Covered core rubric points well.");
  if (a.response.trim().length < 60) notes.push("Add more depth, trade-offs, and concrete examples.");
  return { score, notes };
}

export function aggregateScore(questions: Question[], answers: Answer[]): { score: ScoreBreakdown; feedback: string[]; strengths: string[]; improvements: string[] } {
  const byId = new Map(questions.map(q => [q.id, q]));
  const per: { q: Question; s: number; notes: string[] }[] = [];
  for (const a of answers) {
    const q = byId.get(a.questionId);
    if (!q) continue;
    const r = scoreQuestion(q, a);
    per.push({ q, s: r.score, notes: r.notes });
  }
  const avg = (arr: number[]) => arr.length ? arr.reduce((x,y)=>x+y,0)/arr.length : 0;
  const byComp: Record<string, number[]> = {};
  per.forEach(p => { (byComp[p.q.competency] ||= []).push(p.s); });
  const byCompetency: Record<string, number> = {};
  Object.entries(byComp).forEach(([k,v]) => byCompetency[k] = Math.round(avg(v)));

  const total = Math.round(avg(per.map(p => p.s)));
  const correctness = Math.round(avg(per.filter(p=>p.q.type==="mcq").map(p=>p.s).concat(per.filter(p=>p.q.type!=="mcq").map(p=>p.s*0.6))));
  const depth = Math.round(avg(per.filter(p=>p.q.type!=="mcq").map(p=>p.s)));
  const tradeoffsQs = per.filter(p=>/trade|nfr|cost|security|scale|reliab|govern|privacy|consistency|latency/i.test(p.q.prompt + " " + p.q.competency)).map(p=>p.s);
  const tradeoffs = Math.round(avg(tradeoffsQs.length ? tradeoffsQs : per.map(p=>p.s)));
  const communication = Math.round(avg(per.map(p => (answers.find(a=>a.questionId===p.q.id)?.response.length || 0) > 40 ? Math.min(100,p.s+10) : Math.max(20,p.s-10))));

  const feedback = per.flatMap(p => p.notes.map(n => `[${p.q.competency}] ${n}`)).slice(0, 12);
  const strengths = Object.entries(byCompetency).filter(([,v])=>v>=75).map(([k])=>k).slice(0,4);
  const improvements = Object.entries(byCompetency).filter(([,v])=>v<65).map(([k])=>k).slice(0,4);
  if (!strengths.length) strengths.push("Attempted all questions with consistent effort");
  if (!improvements.length) improvements.push("Push for deeper trade-off analysis and metrics");

  return { score: { total, correctness, depth, tradeoffs, communication, byCompetency }, feedback, strengths, improvements };
}

export function saveResult(result: any) {
  if (typeof window === "undefined") return;
  const key = "interview_results_v1";
  const prev = JSON.parse(localStorage.getItem(key) || "[]");
  prev.unshift(result);
  localStorage.setItem(key, JSON.stringify(prev.slice(0, 20)));
}
export function loadResults() {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem("interview_results_v1") || "[]"); } catch { return []; }
}
