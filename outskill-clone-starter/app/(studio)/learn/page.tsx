import { ResourceCard } from "@/components/resource-card";
import { getCatalog, levelLabel } from "@/lib/content";

export const metadata = { title: "Learn · Outskill" };

export default function LearnPage() {
  const catalog = getCatalog();
  const levels = [1, 2, 3, 4, 5] as const;

  return (
    <>
      <div className="page-heading">
        <p className="eyebrow">LEARN, ONE USEFUL SKILL AT A TIME</p>
        <h1>Start small. Understand more.</h1>
        <p>
          Five levels, each with a short path. Every item states what you can do afterwards and how
          long it takes.
        </p>
      </div>

      {levels.map((level) => {
        const items = catalog.filter((item) => item.level === level);
        if (!items.length) return null;
        return (
          <section key={level} style={{ marginBottom: 40 }}>
            <h2 style={{ marginBottom: 14 }}>
              Level {level} · {levelLabel(level)}
            </h2>
            <div className="grid">
              {items.map((item) => (
                <ResourceCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}
