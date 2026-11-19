import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Lock } from 'lucide-react';
import { requirePerm } from '@/lib/server/context';
import { levelState } from '@/lib/domain/journey';
import { rubricFor } from '@/lib/domain/review';
import { LevelWorkspace } from '@/components/learn/LevelWorkspace';
import { guarded } from '@/lib/server/page';

export const dynamic = 'force-dynamic';
async function LevelPage({ params, searchParams }: { params: Promise<{ code: string }>; searchParams: Promise<{ a?: string }> }) {
  const { code } = await params; const { a } = await searchParams;
  const ctx = await requirePerm('learn:self');
  const st = await levelState(ctx, code);
  if (st.locked) return <div className="card empty"><div className="ic-wrap"><Lock size={22} /></div><h1 className="h3">{st.level.title} is locked</h1><p className="text-2" style={{ marginTop: 6 }}>It unlocks when the previous level is approved by a reviewer.</p><Link className="btn btn-gold btn-sm" style={{ marginTop: 14 }} href="/levels">Back to journey</Link></div>;
  if (!st.level.isPublished) return <div className="card empty"><h1 className="h3">{st.level.title} is unlocked</h1><p className="text-2" style={{ marginTop: 6, maxWidth: '56ch', marginInline: 'auto' }}>Your program team publishes each level&apos;s six activities after review. You&apos;ll be notified the moment they&apos;re live — nothing here is placeholder content.</p>{st.level.description && <p className="muted small" style={{ marginTop: 8 }}>{st.level.description}</p>}<p className="small" style={{ marginTop: 10 }}><b>Topics:</b> {st.level.summary}</p><Link className="btn btn-outline btn-sm" style={{ marginTop: 14 }} href="/library">Explore the open-source library</Link></div>;
  const a6 = st.activities.find(x => x.idx === 6);
  const rubric = a6?.config?.rubric ? await rubricFor(a6.config.rubric) : null;
  const latest = st.latest ? { id: st.latest.id, state: st.latest.state, submittedAt: st.latest.submittedAt.toISOString(), url: st.latest.url, reviews: st.latest.reviews.map(r => ({ id: r.id, verdict: r.verdict, avg: r.weightedAvg, feedback: r.feedbackMd, by: r.reviewer.name || 'Reviewer', at: r.reviewedAt.toISOString(), scores: JSON.parse(r.rubricScores || '{}'), appeal: r.appealState })) } : null;
  return <LevelWorkspace code={code} idx={st.level.idx} isLast={!(await prisma.level.findFirst({ where: { journeyId: st.level.journeyId, idx: st.level.idx + 1 }, select: { id: true } }))} title={st.level.title} summary={st.level.summary || ''} xpTotal={st.level.xpReward} xpEarned={st.progress.xpEarned} levelState={st.progress.state} activities={JSON.parse(JSON.stringify(st.activities))} latest={latest} boss={st.boss} rubric={rubric} initial={Number(a) || undefined} />;
}

export default guarded(LevelPage);
