export type RoleId = "software-architect" | "enterprise-cloud-architect" | "data-architect" | "genai-developer";
export type TrackId = "mid" | "senior" | "staff";
export type QuestionType = "mcq" | "scenario" | "coding";

export interface RubricCriterion {
  name: string;
  weight: number; // 0-1
  description: string;
}

export interface Question {
  id: string;
  role: RoleId;
  track: TrackId;
  type: QuestionType;
  competency: string;
  prompt: string;
  options?: string[];
  correctIndex?: number;
  keyPoints: string[];
  rubric: RubricCriterion[];
  timeLimitSec: number;
}

export interface RoleDef {
  id: RoleId;
  name: string;
  focus: string[];
}

export interface TrackDef {
  id: TrackId;
  name: string;
  years: string;
  expectation: string;
}

export interface Answer {
  questionId: string;
  response: string;
  selectedIndex?: number;
  timeSpentSec: number;
}

export interface ScoreBreakdown {
  total: number;
  correctness: number;
  depth: number;
  tradeoffs: number;
  communication: number;
  byCompetency: Record<string, number>;
}

export interface AssessmentResult {
  id: string;
  role: RoleId;
  track: TrackId;
  mode: "assessment" | "mock";
  answers: Answer[];
  score: ScoreBreakdown;
  feedback: string[];
  strengths: string[];
  improvements: string[];
  completedAt: string;
}
