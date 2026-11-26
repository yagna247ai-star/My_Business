import { requireCtx } from '@/lib/server/context';
import { forbidden } from '@/lib/server/errors';
import { guarded } from '@/lib/server/page';
import { canManageMaterials, materialsPicker } from '@/lib/domain/dayMaterials';
import { MaterialsManager } from '@/components/admin/MaterialsManager';

export const metadata = { title: 'Day materials' };
export const dynamic = 'force-dynamic';

/** Staff (Institution Admin, Program Manager, Instructor, Course Mentor): add study links to any day (docs/DAY_MATERIALS_SPEC.md v1.2). */
async function DayMaterialsPage({ searchParams }: { searchParams: Promise<{ day?: string }> }) {
  const ctx = await requireCtx();
  if (!canManageMaterials(ctx)) throw forbidden('You need Day materials access.');
  const courses = await materialsPicker(ctx);
  const { day } = await searchParams;
  return (<>
    <section className="ph ph-plain"><h1 id="pageTitle">Day materials</h1><p className="desc">Pick a course, a level and a day, then add the slides, documents, sheets, Colab notebooks or videos learners should study that day. Learners in {ctx.tenantName} see them on the day page and under Study materials in their journey, and get a notification.{ctx.superAdmin ? ' As Super Admin, what you add also appears in every other institution that runs the same course.' : ''}</p></section>
    <div style={{ marginTop: 18 }}><MaterialsManager courses={courses} initialDay={day ?? null} /></div>
  </>);
}
export default guarded(DayMaterialsPage);
