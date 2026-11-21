import { requirePerm } from '@/lib/server/context';
import { coachStatus } from '@/lib/ai/coach';
import { CoachChat } from '@/components/learn/CoachChat';
import { guarded } from '@/lib/server/page';
import { Tr } from '@/components/i18n/Tr';

export const metadata = { title: 'AI Coaches' };
async function Coach({ searchParams }: { searchParams: Promise<{ level?: string; a?: string }> }) {
  const ctx = await requirePerm('ai:use'); const sp = await searchParams;
  const s = await coachStatus(ctx);
  return (<>
    <section className="ph ph-plain"><h1 id="pageTitle"><Tr>AI Coaches</Tr></h1><p className="desc"><Tr>They explain, hint and ask questions — you do the work. Grades, XP and certificates are always decided by people.</Tr></p></section>
    <section className="card card-pad" style={{ marginTop: 18 }}><CoachChat assistants={s.assistants} configured={s.configured} creditsLeft={s.creditsLeft} context={sp.level ? { levelCode: sp.level.slice(0, 40), activityIdx: sp.a ? Number(sp.a) : undefined } : undefined} /></section>
  </>);
}

export default guarded(Coach);
