import { requireCtx } from '@/lib/server/context';
import { guarded } from '@/lib/server/page';
import { ProjectForm } from '@/components/showcase/ProjectForm';
import { Tr } from '@/components/i18n/Tr';

export const metadata = { title: 'Define a project' };
async function NewProject() {
  await requireCtx();
  return (<>
    <section className="ph ph-plain"><h1 id="pageTitle"><Tr>Define your project</Tr></h1><p className="desc"><Tr>Say what problem you solve and how. Next you give it a GitHub repository with a ready README and docs folder, then build and document it.</Tr></p></section>
    <div style={{ marginTop: 18, maxWidth: 760 }}><ProjectForm /></div>
  </>);
}
export default guarded(NewProject);
