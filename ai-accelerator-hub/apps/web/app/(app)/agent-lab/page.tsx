import { redirect } from 'next/navigation';
import { requireCtx, hasPerm } from '@/lib/server/context';
import { labOverview } from '@/lib/domain/agentLab';
import { AgentLab } from '@/components/learn/AgentLab';
import { guarded } from '@/lib/server/page';
import { Tr } from '@/components/i18n/Tr';

export const metadata = { title: 'Agent Lab' };
async function AgentLabPage() {
  const ctx = await requireCtx();
  if (!hasPerm(ctx, 'learn:self')) redirect('/review/agent-lab');
  const o = await labOverview(ctx);
  return (<>
    <section className="ph ph-navy"><div style={{ position: 'relative' }}><span className="eyebrow"><Tr>Agent Lab</Tr></span><h1 id="pageTitle"><Tr>Set up your own AI agent</Tr></h1><p className="desc"><Tr>An AI agent is a helper on your laptop: you tell it what to build, then check what it made. Install one, simplify your prompt, get a result and show your proof.</Tr></p></div></section>
    <div style={{ marginTop: 20 }}><AgentLab {...o} /></div>
  </>);
}

export default guarded(AgentLabPage);
