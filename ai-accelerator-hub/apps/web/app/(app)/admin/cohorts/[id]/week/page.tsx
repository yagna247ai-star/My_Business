// Cohort week board (docs/COHORT_WEEK_SPEC.md AC-3): learners × class dates, day done and attendance per block.
import Link from 'next/link';
import { requireCtx } from '@/lib/server/context';
import { cohortBoard } from '@/lib/domain/cohortWeek';
import { guarded } from '@/lib/server/page';
import { AttendanceBoard } from '@/components/staff/AttendanceBoard';

export const metadata = { title: 'Cohort week' };
const shift = (iso: string, days: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);

async function Week({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ w?: string }> }) {
  const ctx = await requireCtx();
  const [{ id }, { w }] = await Promise.all([params, searchParams]);
  const b = await cohortBoard(ctx, id, w);
  const first = b.dates[0];
  return (<>
    <section className="ph ph-plain"><h1 id="pageTitle">{b.cohort.name} · week of {first}</h1><p className="desc">Who finished each day and who attended each block. A mentor’s mark replaces a learner’s own check-in.</p></section>
    <div className="row between wrap gap-8" style={{ margin: '14px 0' }}>
      <Link className="link small" href="/admin/cohorts">← Cohorts &amp; sessions</Link>
      <span className="row gap-12 small"><Link className="link" href={`?w=${shift(first, -7)}`}>← Previous week</Link><Link className="link" href="?">This week</Link><Link className="link" href={`?w=${shift(first, 7)}`}>Next week →</Link></span>
    </div>
    {!b.calendar ? <div className="card card-pad"><p>This cohort has no class calendar yet. Plan it on <Link className="link" href="/admin/cohorts">Cohorts &amp; sessions</Link> (start date, class days, Session and Lab times).</p></div>
      : <AttendanceBoard board={JSON.parse(JSON.stringify(b))} />}
  </>);
}

export default guarded(Week);
