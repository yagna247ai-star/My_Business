export type Kind =
  | "lesson"
  | "workbook"
  | "project"
  | "glossary"
  | "resource"
  | "help";

export type Role =
  | "all"
  | "leadership-operations"
  | "marketing-sales"
  | "finance-accounting"
  | "data-analytics"
  | "product-strategy"
  | "design-creative"
  | "software-technology"
  | "education-consulting"
  | "personal-home";

export type CatalogItem = {
  id: string;
  kind: Kind;
  title: string;
  summary: string;
  level: 1 | 2 | 3 | 4 | 5;
  tool: string;
  roles: Role[];
  minutes: number;
  difficulty?: "beginner" | "intermediate" | "advanced";
};

export type Section = { title: string; body: string };
export type Sample = { name: string; content: string };
export type Step = { title: string; actions: string[]; expected?: string };
export type Source = { title: string; url: string; provider?: string };

export type Detail = CatalogItem & {
  outcome?: string;
  body?: string;
  sections?: Section[];
  samples?: Sample[];
  steps?: Step[];
  variants?: Record<string, string>;
  checks?: string[];
  sources?: Source[];
  prerequisites?: string[];
  notice?: string;
  url?: string;
};

export type Profile = {
  name: string;
  role: Exclude<Role, "all">;
  goal: "productivity" | "research" | "content" | "automation" | "products";
  task: string;
  input: "notes" | "documents" | "table" | "none";
  experience: "new" | "occasional" | "regular" | "builder";
  pace: "15" | "30" | "60";
  support: "beginner" | "intermediate" | "advanced";
};

export type ProgressEntry = {
  id: string;
  status: "completed" | "independent";
  updatedAt: string;
};

export type PathEntry = {
  id: string;
  why: string;
  phase: string;
};
