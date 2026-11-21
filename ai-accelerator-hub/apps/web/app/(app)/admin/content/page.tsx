import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { requireCtx } from '@/lib/server/context';
import { reviewJourneys } from '@/lib/domain/contentReview';
import { guarded } from '@/lib/server/page';

export const metadata = { title: 'Content review' };
export const dynamic = 'force-dynamic';

async function ContentReview() {
  const ctx = await requireCtx();
  const journeys = await reviewJourneys(ctx);
  const drafts = journeys.reduce((n, j) => n + (j.levels - j.publishedLevels), 0);
  const open = journeys.reduce((n, j) => n + j.openSuggestions, 0);
  return (<>
    <section className="ph ph-plain"><h1 id="pageTitle">Content review</h1>
      <p className="desc">Read every journey exactly as learners get it, including the answers they never see. Leave suggestions on a level, a day lesson or an activity, and track them until the content is improved. {ctx.superAdmin ? 'As Super Admin you can publish or unpublish levels.' : 'A Super Admin publishes levels.'}</p></section>
    <div className="row gap-12 wrap" style={{ marginTop: 14 }}>
      <span className="badge badge-neutral">{journeys.length} journeys</span>
      <span className={`badge ${drafts ? 'badge-gold' : 'badge-success'}`}>{drafts ? `${drafts} draft levels` : 'Every level published'}</span>
      <span className={`badge ${open ? 'badge-gold' : 'badge-neutral'}`}>{open} open suggestions</span>
    </div>
    <section className="card card-pad" style={{ marginTop: 16 }} aria-labelledby="jt">
      <h2 className="h3" id="jt">Journeys</h2>
      <div className="table-wrap" style={{ marginTop: 10 }}><table className="tbl"><caption className="sr-only">Journeys to review</caption>
        <thead><tr><th>Journey</th><th>Levels published</th><th>Open suggestions</th><th>Journey status</th><th /></tr></thead>
        <tbody>{journeys.map(j => <tr key={j.id}>
          <td><b>{j.title}</b><div className="muted xs">/{j.slug}</div></td>
          <td className="small">{j.publishedLevels} of {j.levels}{j.publishedLevels < j.levels && <span className="badge badge-gold" style={{ marginLeft: 6 }}>{j.levels - j.publishedLevels} drafts</span>}</td>
          <td className="small">{j.openSuggestions || '—'}</td>
          <td className="small">{j.published ? 'Open to learners' : 'Not open'}</td>
          <td><Link className="btn btn-outline btn-sm" href={`/admin/content/${j.id}`}>Review <ArrowRight size={14} /></Link></td>
        </tr>)}</tbody>
      </table></div>
      <p className="muted xs" style={{ marginTop: 10 }}>Opening a journey to new learners and choosing the default journey are in <Link className="link" href="/admin/journeys">Journey builder</Link>.</p>
    </section>
  </>);
}
export default guarded(ContentReview);
