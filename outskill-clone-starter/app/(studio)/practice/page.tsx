import { ResourceCard } from "@/components/resource-card";
import { byKind } from "@/lib/content";

export const metadata = { title: "Practice · Outskill" };

export default function PracticePage() {
  const workbooks = byKind("workbook");
  const projects = byKind("project");

  return (
    <>
      <div className="page-heading">
        <p className="eyebrow">FROM “I UNDERSTAND” TO “I BUILT IT”</p>
        <h1>Make something you can use.</h1>
        <p>
          Workbooks give you the material and the steps. Projects give you the brief and the tests.
          Both end in something you can show.
        </p>
      </div>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ marginBottom: 14 }}>Guided workbooks</h2>
        <div className="grid">
          {workbooks.map((item) => (
            <ResourceCard key={item.id} item={item} />
          ))}
        </div>
        {workbooks.length === 0 && <p className="quiet">No workbooks yet.</p>}
      </section>

      <section>
        <h2 style={{ marginBottom: 14 }}>Projects</h2>
        <div className="grid">
          {projects.map((item) => (
            <ResourceCard key={item.id} item={item} />
          ))}
        </div>
        {projects.length === 0 && <p className="quiet">No projects yet.</p>}
      </section>
    </>
  );
}
