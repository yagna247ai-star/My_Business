/** Reads every route.ts under app/api (Node only: used by the generator script and the test, never at request time). */
import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { dirname, join, relative } from 'path';
import type { Resolve, RouteFile } from './openapi';

export function readRouteFiles(apiDir: string): RouteFile[] {
  const out: RouteFile[] = [];
  const walk = (d: string) => { for (const n of readdirSync(d)) { const p = join(d, n); if (statSync(p).isDirectory()) walk(p); else if (/^route\.(ts|tsx|js)$/.test(n)) out.push({ file: relative(apiDir, p).split('\\').join('/'), source: readFileSync(p, 'utf8') }); } };
  walk(apiDir);
  return out;
}

/** Resolves '@/lib/x' and './x' imports to source files below apps/web (root), for documenting imported schemas. */
export function moduleResolver(root: string): Resolve {
  return (spec, from) => {
    const base = spec.startsWith('@/') ? join(root, spec.slice(2)) : spec.startsWith('.') ? join(root, dirname(from), spec) : null;
    if (!base) return null;
    for (const ext of ['.ts', '.tsx', '/index.ts']) { const f = base + ext; if (existsSync(f)) return { file: relative(root, f).split('\\').join('/'), source: readFileSync(f, 'utf8') }; }
    return null;
  };
}
