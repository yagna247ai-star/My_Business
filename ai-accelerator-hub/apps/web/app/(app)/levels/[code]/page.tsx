import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Lock } from 'lucide-react';
import { requirePerm } from '@/lib/server/context';
import { levelState } from '@/lib/domain/journey';
import { rubricFor } from '@/lib/domain/review';
import { LevelWorkspace } from '@/components/learn/LevelWorkspace';
import { guarded } from '@/lib/server/page';
import { getLocale, getT } from '@/lib/i18n/server';
import { cachedActivities } from '@/lib/i18n/activityTranslate';
import { TranslateLesson } from '@/components/learn/TranslateLesson';
import { Tr } from '@/components/i18n/Tr';
import { Tv } from '@/components/i18n/Tv';

export const dynamic = 'force-dynamic';
async function LevelPage({ params, searchParams }: { params: Promise<{ code: string }>; searchParams: Promise<{ a?: string }> }) {
  const { code } = await params; const { a } = await searchParams;
  const ctx = await requirePerm('learn:self');
  const [st, t] = await Promise.all([levelState(ctx, code), getT()]);
  if (st.locked) return <div className="card empty"><div className="ic-wrap"><Lock size={22} /></div><h1 className="h3">{t('{title} is locked', { title: st.level.title })}</h1><p className="text-2" style={{ marginTop: 6 }}>{t('It opens when every activity and day of the previous level is done or skipped.')}</p><Link className="btn btn-gold btn-sm" style={{ marginTop: 14 }} href="/levels">{t('Back to journey')}</Link></div>;
  if (!st.level.isPublished) return <div className="card empty"><h1 className="h3"><Tv v={st.level.title} /> <Tr>is unlocked</Tr></h1><p className="text-2" style={{ marginTop: 6, maxWidth: '56ch', marginInline: 'auto' }}><Tr>Your program team publishes each level&apos;s six activities after review. You&apos;ll be notified the moment they&apos;re live — nothing here is placeholder content.</Tr></p>{st.level.description && <p className="muted small" style={{ marginTop: 8 }}><Tv v={st.level.description} /></p>}<p className="small" style={{ marginTop: 10 }}><b><Tr>Topics:</Tr></b> <Tv v={st.level.summary} /></p><Link className="btn btn-outline btn-sm" style={{ marginTop: 14 }} href="/library"><Tr>Explore the open-source library</Tr></Link></div>;
  // The learner's language: cached activity translations replace the English text (answers stay by position).
  const locale = await getLocale();
  const tr = await cachedActivities(st.activities.map(x => ({ ...x, config: x.config as never })), locale);
  const activities = tr.acts;
  const a6 = st.activities.find(x => x.idx === 6);
  const rubric = a6?.config?.rubric ? await rubricFor(a6.config.rubric) : null;
  const latest = st.latest ? { id: st.latest.id, state: st.latest.state, submittedAt: st.latest.submittedAt.toISOString(), url: st.latest.url, reviews: st.latest.reviews.map(r => ({ id: r.id, verdict: r.verdict, avg: r.weightedAvg, feedback: r.feedbackMd, by: r.reviewer.name || 'Reviewer', at: r.reviewedAt.toISOString(), scores: JSON.parse(r.rubricScores || '{}'), appeal: r.appealState })) } : null;
  return <>{locale !== 'en' && !tr.translated && <TranslateLesson endpoint={`/api/v1/levels/${code}/translate`} />}<LevelWorkspace code={code} idx={st.level.idx} isLast={!(await prisma.level.findFirst({ where: { journeyId: st.level.journeyId, idx: st.level.idx + 1 }, select: { id: true } }))} title={st.level.title} summary={st.level.summary || ''} xpTotal={st.completion.total} xpEarned={st.progress.xpEarned} levelState={st.progress.state} activities={JSON.parse(JSON.stringify(activities))} latest={latest} boss={st.boss} rubric={rubric} initial={Number(a) || undefined} days={st.days} completion={st.completion} /></>;
}

export default guarded(LevelPage);
