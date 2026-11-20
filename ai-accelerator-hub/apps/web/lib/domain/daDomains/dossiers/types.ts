/**
 * An enterprise problem dossier: the problem told the way the people inside the industry live it.
 * It puts the learner in a role with a mandate, follows one customer's story signal by signal, quantifies the
 * money with visible working, grounds the problem in real public evidence (with sources), shows the raw data as it
 * really arrives, and lists the decisions the solution must enable. Each of the 45 days then opens with a real
 * situation from the same organisation that makes that day's technical topic necessary.
 */
export type DayProblem = { scene: string; pain: string; task: string; doneWhen: string };

export type ProblemDossier = {
  /** One sentence a learner can repeat to anyone. */
  oneLine: string;
  /** The learner's role and the brief they receive on Day 1. */
  role: { title: string; from: string; brief: string[] };
  organisation: { name: string; profile: string[] };
  /** One customer's story as a timeline of signals: when, what, where it was recorded, who saw it, what happened. */
  timeline: { title: string; rows: { when: string; signal: string; source: string; sawIt: string; action: string }[]; gap: string };
  /** Other scenes from the same organisation. */
  story: string[];
  /** First-person voices of the stakeholders. */
  voices: { who: string; quote: string }[];
  /** Real public evidence that the problem exists beyond this organisation. */
  evidence: { fact: string; source: string; url: string }[];
  pains: { who: string; pain: string; consequence: string }[];
  customerImpact: string[];
  /** The value of one customer, so the learner feels the cost of losing one. */
  unitEconomics: string[];
  revenue: { lines: { item: string; working: string; annual: string }[]; total: string };
  costOfDelay: string;
  whyNow: string[];
  triedAndFailed: { what: string; why: string }[];
  decisions: { decision: string; owner: string; when: string; needs: string }[];
  rootCauses: string[];
  constraints: string[];
  /** Raw data exactly as it arrives, with the problems in it. */
  dataSamples: { source: string; format: string; sample: string; issues: string[] }[];
  /** The formal problem statement. */
  statement: { situation: string; complication: string; question: string; inScope: string[]; outOfScope: string[] };
  success: { metric: string; baseline: string; target: string; how: string }[];
  /** Day number (1–45) → the real-world situation that makes that day’s topic necessary. */
  days: Record<number, DayProblem>;
};

/** Ikigai rating of a candidate problem, each circle 1–5. */
export type IkigaiScore = {
  /** What the world needs: severity × number of people affected. */
  needs: number;
  /** What you can be paid for: budget, ROI and hiring demand behind the problem. */
  paid: number;
  /** What you become good at: career value of the skills the problem teaches. */
  skills: number;
  /** What learners love: how much the problem pulls people in (personalised by the learner quiz). */
  love: number;
  /** Not an Ikigai circle: can it be built with data an organisation really has? Used to break ties. */
  feasibility: number;
};

export type CandidateProblem = { id: string; title: string; hook: string; score: IkigaiScore; why: Record<'needs' | 'paid' | 'skills' | 'love', string>; track?: TrackLevel };

export type TrackLevel = 'easy' | 'intermediate' | 'hard' | 'critical';

/** One way to take on the domain problem. Each track changes the statement, data, steps and solution. */
export type ProblemTrack = {
  level: TrackLevel;
  problemId: string;
  title: string;
  question: string;
  situation: string;
  scope: { label: string; value: string }[];
  forYou: string[];
  effort: string;
  xpMultiplier: number;
  data: { table: string; rows: string; source: string }[];
  /** One deliverable per module (9). */
  steps: { module: string; deliverable: string }[];
  solution: string;
  success: string[];
  whatMakesItHard: string;
  gate?: string;
};

/** One question in the learner's Ikigai quiz; each option adds points to tracks. */
export type IkigaiQuestion = { circle: 'love' | 'skills' | 'needs' | 'paid' | 'time'; question: string; options: { label: string; points: Partial<Record<TrackLevel, number>> }[] };
