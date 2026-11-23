import { requireCtx } from '@/lib/server/context';
import { adminShowcase } from '@/lib/domain/showcase';
import { ShowcaseAdmin } from '@/components/showcase/ShowcaseAdmin';
import { guarded } from '@/lib/server/page';
import { Tr } from '@/components/i18n/Tr';

export const metadata = { title: 'Manage showcase' };
export const dynamic = 'force-dynamic';

async function ManageShowcase() {
  const items = await adminShowcase(await requireCtx()); // refuses anyone without moderation rights
  const reported = items.filter(i => i.openReports.length).length;
  return (<>
    <section className="ph ph-plain"><h1 id="pageTitle"><Tr>Manage showcase</Tr></h1>
      <p className="desc"><Tr>Learners publish their reviewer-approved work and it shows at once. Here you feature good projects, hide or remove ones that break the rules (the author sees your reason), and answer members’ reports. Every action is recorded in the audit log.</Tr></p>
      <p className="small" style={{ marginTop: 6 }}>{items.length} <Tr>projects</Tr> · {reported} <Tr>with open reports</Tr></p></section>
    <ShowcaseAdmin initial={items} />
  </>);
}
export default guarded(ManageShowcase);
