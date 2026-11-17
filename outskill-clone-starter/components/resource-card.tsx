"use client";

import Link from "next/link";
import { isComplete, useProgress } from "@/lib/progress";
import type { CatalogItem } from "@/lib/types";

const kindLabel: Record<CatalogItem["kind"], string> = {
  lesson: "Lesson",
  workbook: "Workbook",
  project: "Project",
  glossary: "Glossary",
  resource: "Resource",
  help: "Help",
};

export function ResourceCard({ item }: { item: CatalogItem }) {
  const progress = useProgress();
  const done = isComplete(progress, item.id);

  return (
    <Link className="resource-card" href={`/learn/${item.id}`}>
      <div className="card-meta">
        <span className="kind-tag">{kindLabel[item.kind]}</span>
        <span>Level {item.level}</span>
      </div>
      <h3>{item.title}</h3>
      <p>{item.summary}</p>
      <div className="card-footer">
        <span>{item.tool}</span>
        <span>·</span>
        <span>{item.minutes} min</span>
        {done && (
          <span className="done-dot" style={{ marginLeft: "auto" }}>
            Done
          </span>
        )}
      </div>
    </Link>
  );
}
