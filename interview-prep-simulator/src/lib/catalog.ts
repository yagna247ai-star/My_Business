import { RoleDef, TrackDef } from "./types";

export const ROLES: RoleDef[] = [
  { id: "software-architect", name: "Software / Solution Architect", focus: ["System design", "Architecture patterns", "NFRs", "Trade-offs"] },
  { id: "enterprise-cloud-architect", name: "Enterprise / Cloud Architect", focus: ["Cloud platforms", "Governance", "Security/cost", "Integration"] },
  { id: "data-architect", name: "Data Engineer / Architect", focus: ["Pipelines", "Modeling", "Reliability", "Scale & governance"] },
  { id: "genai-developer", name: "GenAI / ML Developer", focus: ["LLM apps", "RAG & evals", "Prompting", "Productionization"] },
];

export const TRACKS: TrackDef[] = [
  { id: "mid", name: "Mid-level", years: "5–8 years", expectation: "Strong execution, sound designs, clear reasoning on scoped systems." },
  { id: "senior", name: "Senior", years: "9–14 years", expectation: "End-to-end ownership, cross-team trade-offs, reliability and scale depth." },
  { id: "staff", name: "Staff / Principal", years: "15–25 years", expectation: "Org-wide strategy, ambiguity handling, governance, and long-term architectural bets." },
];

export function roleById(id: string) { return ROLES.find(r => r.id === id); }
export function trackById(id: string) { return TRACKS.find(t => t.id === id); }
