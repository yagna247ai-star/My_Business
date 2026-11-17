"use client";

import { usePathname } from "next/navigation";
import { Search } from "./search";
import type { CatalogItem } from "@/lib/types";

const labels: Record<string, string> = {
  path: "My Path",
  learn: "Learn",
  practice: "Practice",
  explore: "Explore",
  work: "My Work",
};

export function Topbar({ catalog }: { catalog: CatalogItem[] }) {
  const pathname = usePathname();
  const segment = pathname.split("/")[1] || "path";

  return (
    <header className="topbar">
      <p className="breadcrumb">
        Your workspace
        <span aria-hidden="true">/</span>
        {labels[segment] ?? "Learn"}
      </p>
      <Search items={catalog} />
    </header>
  );
}
