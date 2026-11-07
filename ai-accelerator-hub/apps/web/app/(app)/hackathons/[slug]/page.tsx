import { notFound } from 'next/navigation';
import { requireCtx } from '@/lib/server/context';
import { hackathonDetail } from '@/lib/domain/hackathon';
import { HackathonPanels } from '@/components/hackathon/HackathonPanels';
import { guarded } from '@/lib/server/page';

export const metadata = { title: 'Hackathon brief' };
async function HackathonPage({ params }: { params: Promise<{ slug: string }> }) {
  const ctx = await requireCtx();
  const { slug } = await params;
  let d;
  try { d = await hackathonDetail(ctx, slug); } catch { notFound(); }
  const b = d.board;
  return (<>
    <section className="ph ph-plain"><h1 id="pageTitle">{b.title}</h1><p className="desc">Status: {b.status}{b.windows.submitDueAt ? ` · submit by ${new Date(b.windows.submitDueAt).toLocaleString('en-IN')}` : ''}</p></section>
    <article className="card card-pad" style={{ marginTop: 18 }}><h2 className="h3">Brief</h2><p style={{ whiteSpace: 'pre-wrap' }}>{b.briefMd || 'The full brief will be posted when the hackathon opens.'}</p></article>
    <HackathonPanels id={b.id} slug={b.slug} status={b.status} myTeam={d.myTeam} peerTasks={d.peerTasks} result={b.result} canJudge={d.canJudge} />
    <section className="card card-pad" style={{ marginTop: 18 }} aria-labelledby="board"><h2 className="h3" id="board">Board</h2>
      {b.entries.length === 0 && <p className="desc">No teams entered yet.</p>}
      <ul style={{ listStyle: 'none', padding: 0, margin: '10px 0 0', display: 'grid', gap: 8 }}>
        {b.entries.map((e, i) => <li key={i} className="set-row"><div><b>{e.team}</b><p>{e.title || 'Untitled entry'} · {e.memberCount} members · {e.state} · {e.peerCount} peer {e.peerCount === 1 ? 'review' : 'reviews'}</p></div>{e.repoUrl && <a className="btn btn-outline btn-sm" href={e.repoUrl} target="_blank" rel="noopener noreferrer nofollow">Repo ↗</a>}</li>)}
      </ul>
    </section>
  </>);
}

export default guarded(HackathonPage);
