import { NextRequest } from 'next/server';
import { route } from '@/lib/server/http';
import { requirePerm } from '@/lib/server/context';
import { submissionForReview } from '@/lib/domain/review';
export const GET = route(async (_r: NextRequest, p) => { const d = await submissionForReview(await requirePerm('review:read'), p.id); const s = d.submission; return { id: s.id, state: s.state, learner: s.user.name, url: s.url, deployedUrl: s.deployedUrl, reflection: s.reflectionMd, submittedAt: s.submittedAt, meta: JSON.parse(s.metadata || '{}'), level: { code: s.progress.level.code, title: s.progress.level.title }, rubric: d.rubric, checks: d.checks, boss: d.boss ? { best: d.boss.best, total: d.boss.total } : null, reviews: s.reviews.map(r => ({ id: r.id, verdict: r.verdict, avg: r.weightedAvg, scores: JSON.parse(r.rubricScores || '{}'), feedback: r.feedbackMd, by: r.reviewer.name, at: r.reviewedAt, appeal: r.appealState, appealNote: r.appealNote })), canDecide: d.canDecide }; });
