import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireCtx } from '@/lib/server/context';
import { guarded } from '@/lib/server/page';
import { GUIDE_STEPS } from '@/lib/github/githubCore';
import { GuideChecklist } from '@/components/showcase/GuideChecklist';
import { Tr } from '@/components/i18n/Tr';

export const metadata = { title: 'GitHub guide' };

/** docs/SHOWCASE_GITHUB_SPEC.md §3.10: from no GitHub account to a checked-out, documented project. */
async function GithubGuide({ searchParams }: { searchParams: Promise<{ connect?: string }> }) {
  await requireCtx();
  const { connect } = await searchParams;
  return (<>
    <Link href="/showcase" className="link small"><ArrowLeft size={14} /><Tr>Back to the showcase</Tr></Link>
    <section className="ph ph-plain"><h1 id="pageTitle"><Tr>GitHub, step by step</Tr></h1><p className="desc"><Tr>From no account to your project checked out in VS Code with its documents filled in. Tick each step as you finish it; your ticks stay on this device.</Tr></p></section>
    {connect === 'unavailable' && <p className="callout info small" style={{ marginTop: 12 }}><Tr>Connecting GitHub is not switched on yet. Add your GitHub username on your project page and map a repository instead, or ask your admin.</Tr></p>}
    <div style={{ marginTop: 18 }}><GuideChecklist steps={GUIDE_STEPS} /></div>
  </>);
}
export default guarded(GithubGuide);
