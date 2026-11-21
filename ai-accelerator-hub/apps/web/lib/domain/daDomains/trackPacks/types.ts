/**
 * A domain's four difficulty tracks (Easy, Intermediate, Hard, Critical), as the sign-up form and journey page show
 * them. Light on purpose (no DomainSpec), so the browser can import it. The journeys themselves are built from each
 * pack's specs in tracks.ts.
 */
import type { IkigaiQuestion, ProblemTrack, TrackLevel } from '../dossiers/types';

export type TrackPackUi = {
  domain: string;
  /** "Each track is a different problem from the same <org>…" */
  org: string;
  /** What a Critical-track learner must confirm before starting. */
  criticalAck: string;
  tracks: ProblemTrack[];
  /** Quiz answers per track: what you would love to work on, and the outcome that matters most to you. */
  love: Record<TrackLevel, string>;
  need: Record<TrackLevel, string>;
};

/** The five-question Ikigai quiz for a domain: two questions in the domain's own words, three shared. */
export function quizFor(p: Pick<TrackPackUi, 'love' | 'need'>): IkigaiQuestion[] {
  return [
    { circle: 'love', question: 'Which of these would you happily work on late into the night?', options: [
      { label: p.love.easy, points: { easy: 2, intermediate: 1 } }, { label: p.love.intermediate, points: { intermediate: 2 } },
      { label: p.love.hard, points: { hard: 2, critical: 1 } }, { label: p.love.critical, points: { critical: 2, hard: 1 } }] },
    { circle: 'skills', question: 'What can you do today?', options: [
      { label: 'Excel, maybe a little SQL', points: { easy: 3 } }, { label: 'SQL and some Power BI', points: { intermediate: 3, easy: 1 } },
      { label: 'SQL and Python, some machine learning', points: { hard: 3, intermediate: 1 } }, { label: 'Python, ML, cloud, and some streaming or text analytics', points: { critical: 3, hard: 2 } }] },
    { circle: 'needs', question: 'Which outcome matters most to you?', options: [
      { label: p.need.easy, points: { easy: 2 } }, { label: p.need.intermediate, points: { intermediate: 2 } },
      { label: p.need.hard, points: { hard: 2 } }, { label: p.need.critical, points: { critical: 2 } }] },
    { circle: 'paid', question: 'Which role do you want in 12 months?', options: [
      { label: 'Data Analyst or BI Analyst', points: { easy: 2, intermediate: 1 } }, { label: 'Analytics Engineer', points: { intermediate: 2, hard: 1 } },
      { label: 'Data Scientist', points: { hard: 2 } }, { label: 'ML Engineer or Data Governance lead in a regulated industry', points: { critical: 2, hard: 1 } }] },
    { circle: 'time', question: 'How much time can you give each day?', options: [
      { label: 'About 1–1.5 hours', points: { easy: 3 } }, { label: 'About 2–3 hours', points: { intermediate: 3 } },
      { label: 'About 3–4 hours', points: { hard: 3 } }, { label: '4 hours or more', points: { critical: 3, hard: 1 } }] },
  ];
}

/** Recommend a track from quiz answers. Ties go to the easier track. */
export function recommendFrom(quiz: IkigaiQuestion[], answers: number[]): TrackLevel {
  const points: Record<TrackLevel, number> = { easy: 0, intermediate: 0, hard: 0, critical: 0 };
  quiz.forEach((q, i) => { const o = q.options[answers[i]]; if (o) for (const [k, v] of Object.entries(o.points)) points[k as TrackLevel] += v ?? 0; });
  const order: TrackLevel[] = ['easy', 'intermediate', 'hard', 'critical'];
  return order.reduce((best, l) => (points[l] > points[best] ? l : best), order[0]);
}

/** Nine modules, one deliverable each (same order as the curriculum). */
export const MODULES = ['Problem framing', 'Data collection', 'Databricks and Unity Catalog', 'Bronze ingestion', 'Silver cleansing', 'Gold modelling', 'Power BI', 'Machine learning and AI', 'Capstone'];
export const steps = (deliverables: string[]) => deliverables.map((deliverable, i) => ({ module: MODULES[i], deliverable }));
