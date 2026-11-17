"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CatalogItem } from "@/lib/types";

export function Search({ items }: { items: CatalogItem[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const pool = needle
      ? items.filter((item) =>
          `${item.title} ${item.summary} ${item.tool}`.toLowerCase().includes(needle),
        )
      : items;
    return pool.slice(0, 8);
  }, [items, query]);

  return (
    <>
      <button className="search-trigger" onClick={() => setOpen(true)} aria-haspopup="dialog">
        <span aria-hidden="true">⌕</span> Search
      </button>

      {open && (
        <div className="dialog-backdrop" onClick={() => setOpen(false)}>
          <div
            className="dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Search the library"
            onClick={(event) => event.stopPropagation()}
          >
            <h2>Search lessons, workbooks and projects</h2>
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Try “verification” or “table”"
              aria-label="Search query"
            />
            <div className="dialog-results">
              {results.map((item) => (
                <Link
                  key={item.id}
                  href={`/learn/${item.id}`}
                  onClick={() => setOpen(false)}
                >
                  {item.title}
                  <span>
                    {item.kind} · {item.tool} · {item.minutes} min
                  </span>
                </Link>
              ))}
              {results.length === 0 && <p className="quiet">No matching items.</p>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
