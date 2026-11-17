"use client";

import { useMemo, useState } from "react";
import { ResourceCard } from "./resource-card";
import type { CatalogItem } from "@/lib/types";

export function ExploreClient({ catalog }: { catalog: CatalogItem[] }) {
  const [level, setLevel] = useState(0);
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return catalog.filter(
      (item) =>
        (level === 0 || item.level === level) &&
        (!needle || `${item.title} ${item.summary}`.toLowerCase().includes(needle)),
    );
  }, [catalog, level, query]);

  return (
    <>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 22 }}>
        <input
          className="field"
          style={{ maxWidth: 320 }}
          placeholder="Search the library"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search the library"
        />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[0, 1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              className="choice"
              style={{ padding: "9px 13px" }}
              aria-pressed={level === value}
              onClick={() => setLevel(value)}
            >
              {value === 0 ? "All levels" : `Level ${value}`}
            </button>
          ))}
        </div>
      </div>

      <div className="grid">
        {results.map((item) => (
          <ResourceCard key={item.id} item={item} />
        ))}
      </div>

      {results.length === 0 && (
        <p className="quiet">No matching resources. Try a shorter phrase or choose all levels.</p>
      )}
    </>
  );
}
