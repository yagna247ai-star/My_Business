/**
 * Everything the level page and the activity pages need, loaded once: the level's state, activities in the
 * learner's language, proof and review, the journey's levels (for the level tabs) and the cohort's next class.
 */
import 'server-only';
import { prisma } from '@/lib/prisma';
import type { Ctx } from '@/lib/server/context';
import { getEnrollment, levelState } from '@/lib/domain/journey';
import { rubricFor } from '@/lib/domain/review';
import { getLocale } from '@/lib/i18n/server';
import { cachedActivities } from '@/lib/i18n/activityTranslate';

export async function loadLevelPage(ctx: Ctx, code: string) {
  const st = await levelState(ctx, code);
  const e = await getEnrollment(ctx);
  const levels = await prisma.level.findMany({ where: { journeyId: st.level.journeyId }, orderBy: { idx: 'asc' }, select: { id: true, idx: true, code: true, title: true } });
  const progress = await prisma.progress.findMany({ where: { enrollmentId: e.id }, select: { levelId: true, state: true, completedAt: true } });
  const byLevel = new Map(progress.map(p => [p.levelId, p]));
  const tabs = levels.map(l => { const p = byLevel.get(l.id); return { idx: l.idx, code: l.code, title: l.title, state: !p || p.state === 'locked' ? 'locked' : p.state === 'approved' || p.completedAt ? 'done' : 'open', current: l.code === code }; });
  const sched = e.cohort?.schedule ? (() => { try { return JSON.parse(e.cohort!.schedule!); } catch { return null; } })() : null;
  const sessions: { title: string; startsAt: string; durationMin: number; liveLink: string | null; agenda?: { title: string; minutes: number }[] }[] = (sched?.sessions ?? []).filter((s: { startsAt: string }) => Date.parse(s.startsAt) > Date.now() - 6 * 3600e3).slice(0, 1);
  if (st.locked) return { st, locked: true as const, tabs, sessions };
  const locale = await getLocale();
  const tr = await cachedActivities(st.activities.map(x => ({ ...x, config: x.config as never })), locale);
  const a6 = st.activities.find(x => x.idx === 6);
  const rubric = a6?.config?.rubric ? await rubricFor(a6.config.rubric) : null;
  const latest = st.latest ? { id: st.latest.id, state: st.latest.state, submittedAt: st.latest.submittedAt.toISOString(), url: st.latest.url, reviews: st.latest.reviews.map(r => ({ id: r.id, verdict: r.verdict, avg: r.weightedAvg, feedback: r.feedbackMd, by: r.reviewer.name || 'Reviewer', at: r.reviewedAt.toISOString(), scores: JSON.parse(r.rubricScores || '{}'), appeal: r.appealState })) } : null;
  return { st, locked: false as const, tabs, sessions, locale, translated: tr.translated, activities: JSON.parse(JSON.stringify(tr.acts)), rubric, latest };
}
