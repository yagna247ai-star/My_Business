import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requirePerm } from '@/lib/server/context';
import { guarded } from '@/lib/server/page';
import { loadLevelPage } from '@/lib/server/levelPage';
import { activityBrief } from '@/lib/domain/levelView';
import { ActivityView } from '@/components/learn/ActivityView';
import { TranslateLesson } from '@/components/learn/TranslateLesson';

export const dynamic = 'force-dynamic';

async function ActivityPage({ params }: { params: Promise<{ code: string; idx: string }> }) {
  const { code, idx } = await params;
  const ctx = await requirePerm('learn:self');
  const d = await loadLevelPage(ctx, code);
  if (d.locked || !d.st.level.isPublished) redirect(`/levels/${code}`);
  const acts = d.activities as { id: string; idx: number; title: string; state: string; config: Record<string, unknown> }[];
  const i = acts.findIndex(a => a.idx === Number(idx));
  if (i < 0) redirect(`/levels/${code}`);
  const act = acts[i];
  const vote = await prisma.contentFeedback.findUnique({ where: { levelId_target_userId: { levelId: d.st.level.id, target: `activity:${act.idx}`, userId: ctx.userId } }, select: { useful: true } });
  const ref = (a?: { idx: number; title: string }) => (a ? { idx: a.idx, title: a.title } : null);
  return <>
    {d.locale !== 'en' && !d.translated && <TranslateLesson endpoint={`/api/v1/levels/${code}/translate`} />}
    <ActivityView code={code} level={{ idx: d.st.level.idx, title: d.st.level.title }} act={act as never} count={acts.length} brief={activityBrief(act)}
      latest={d.latest} boss={d.st.boss} rubric={d.rubric} prev={ref(acts[i - 1])} next={ref(acts[i + 1])} vote={vote?.useful ?? null} />
  </>;
}
export default guarded(ActivityPage);
