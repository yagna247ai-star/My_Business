import fs from "node:fs";
import path from "node:path";
import type { CatalogItem, Detail } from "./types";

const contentDir = path.join(process.cwd(), "content");

let catalogCache: CatalogItem[] | null = null;
const detailCache = new Map<string, Detail>();

export function getCatalog(): CatalogItem[] {
  if (!catalogCache) {
    const raw = fs.readFileSync(path.join(contentDir, "catalog.json"), "utf8");
    catalogCache = JSON.parse(raw) as CatalogItem[];
  }
  return catalogCache;
}

export function getDetail(id: string): Detail | null {
  if (detailCache.has(id)) return detailCache.get(id)!;

  // Guard against path traversal before touching the filesystem.
  if (!/^[a-z0-9-]+$/.test(id)) return null;

  const file = path.join(contentDir, "items", `${id}.json`);
  if (!fs.existsSync(file)) return null;

  const detail = JSON.parse(fs.readFileSync(file, "utf8")) as Detail;
  detailCache.set(id, detail);
  return detail;
}

export function byKind(...kinds: CatalogItem["kind"][]) {
  return getCatalog().filter((item) => kinds.includes(item.kind));
}

export function findItem(id: string) {
  return getCatalog().find((item) => item.id === id);
}

export function levelLabel(level: number) {
  return ["", "Foundations", "Context", "Creation", "Automation", "Building"][level] ?? "";
}
