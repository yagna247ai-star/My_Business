import { redirect } from 'next/navigation';
import { requireCtx, hasPerm } from '@/lib/server/context';
import { labOverview } from '@/lib/domain/agentLab';
import { AgentLab } from '@/components/learn/AgentLab';
import { guarded } from '@/lib/server/page';

export const metadata = { title: 'Agent Lab' };
async function AgentLabPage() {
  const ctx = await requireCtx();
  if (!hasPerm(ctx, 'learn:self')) redirect('/review/agent-lab');
  const o = await labOverview(ctx);
  return (<>
    <section className="ph ph-navy"><div style={{ position: 'relative' }}><span className="eyebrow">Agent Lab</span><h1 id="pageTitle">Set up your own AI agent</h1><p className="desc">An AI agent is a helper on your laptop: you tell it what to build, then check what it made. Install one, simplify your prompt, get a result and show your proof.</p></div></section>
    <div style={{ marginTop: 20 }}><AgentLab {...o} /></div>
  </>);
}

export default guarded(AgentLabPage);
