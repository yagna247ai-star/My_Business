/**
 * OpenAPI 3.1 for every route handler under app/api, built from the route files themselves (docs/API_DOCS_SPEC.md).
 * Pure: give it the files' paths and source text. Request bodies come from each route's own zod schema.
 */
import { z } from 'zod';

export type RouteFile = { file: string; source: string }; // file: path below app/api, e.g. "v1/levels/[code]/proof/route.ts"
/** Source text of an imported module ('@/lib/domain/account'), or null. Lets imported zod schemas be documented. */
export type Resolve = (spec: string, from: string) => { file: string; source: string } | null; // from: the importing file, below apps/web
type Src = { file: string; source: string }; // a source file, path below apps/web
const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;

/** "v1/levels/[code]/proof/route.ts" → "/api/v1/levels/{code}/proof" and its parameters. */
export function routePath(file: string) {
  const segs = file.replace(/\/?route\.(ts|tsx|js)$/, '').split('/').filter(s => s && !/^\(.*\)$/.test(s));
  const params: string[] = [];
  const path = '/api/' + segs.map(s => { const m = s.match(/^\[(?:\.\.\.)?(\w+)\]$/); if (m) { params.push(m[1]); return `{${m[1]}}`; } return s; }).join('/');
  return { path: path.replace(/\/$/, ''), params };
}

/** The text of `const NAME = <expr>;` (up to the first ; outside brackets and strings). */
function constExpr(source: string, name: string): string | null {
  const m = new RegExp(`(?:const|let)\\s+${name}\\s*(?::[^=]+)?=\\s*`).exec(source);
  if (!m) return null;
  // TypeScript-only suffixes (as const, satisfies T, as T) do not run as JavaScript.
  return exprFrom(source, m.index + m[0].length)?.replace(/\s+(as\s+const|satisfies\s+[\w<>[\],\s]+|as\s+[A-Z][\w<>[\]]*)\s*$/, '') ?? null;
}
function exprFrom(source: string, start: number, stopAtComma = false): string | null {
  let depth = 0; let q: string | null = null;
  for (let i = start; i < source.length; i++) {
    const c = source[i];
    if (q) { if (c === '\\') { i++; continue; } if (c === q) q = null; continue; }
    if (c === '"' || c === "'" || c === '`') { q = c; continue; }
    if ('([{'.includes(c)) depth++;
    else if (')]}'.includes(c)) { if (depth === 0) return source.slice(start, i).trim(); depth--; }
    else if (depth === 0 && (c === ';' || (stopAtComma && c === ',') || (c === '\n' && /^\s*(export|const|let|function|async)\b/.test(source.slice(i + 1))))) return source.slice(start, i).trim();
  }
  return null;
}

/** Where a name used in a schema is defined: a const in this file, or one imported from another module. */
function lookup(name: string, at: Src, resolve?: Resolve): { expr: string; at: Src } | null {
  const local = constExpr(at.source, name);
  if (local) return { expr: local, at };
  const imp = [...at.source.matchAll(/import\s*\{([^}]*)\}\s*from\s*'([^']+)'/g)]
    .map(x => ({ names: x[1].split(',').map(n => n.trim()).filter(Boolean), spec: x[2] }))
    .find(x => x.names.some(n => n.split(/\s+as\s+/).pop() === name));
  if (!imp || !resolve) return null;
  const mod = resolve(imp.spec, at.file);
  const original = imp.names.find(n => n.split(/\s+as\s+/).pop() === name)!.split(/\s+as\s+/)[0];
  const e = mod ? constExpr(mod.source, original) : null;
  return e && mod ? { expr: e, at: mod } : null;
}

/** The expression with every name it uses defined in front of it (through imports, a few levels deep). */
export function inline(expr: string, at: Src, resolve: Resolve | undefined, depth = 0): string {
  if (depth > 4) return expr;
  const code0 = expr.replace(/'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`/g, "''").replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
  const names = [...new Set([...code0.matchAll(/(?<![.\w$])([A-Za-z_$][\w$]*)\b(?!\s*:)/g)].map(m => m[1]))]
    .filter(n => n !== 'z' && !/^(true|false|null|undefined|new|typeof|return|Number|String|Boolean|Array|Object|Math|Date|RegExp|Infinity|NaN|v|s|x|n|a|b|e|i)$/.test(n));
  let code = expr;
  for (const n of names) { const d = lookup(n, at, resolve); if (d) code = `((${n}) => (${code}))(${inline(d.expr, d.at, resolve, depth + 1)})`; }
  return code;
}

/** A zod expression (source text) as JSON Schema, or null when it cannot be evaluated on its own. */
export function zodToSchema(expr: string, at: Src, resolve?: Resolve): Record<string, unknown> | null {
  try {
    const schema = new Function('z', `"use strict"; return (${inline(expr, at, resolve)});`)(z) as z.ZodType;
    if (!schema || typeof (schema as { safeParse?: unknown }).safeParse !== 'function') return null;
    const js = z.toJSONSchema(schema, { unrepresentable: 'any', io: 'input' }) as Record<string, unknown>;
    delete js.$schema;
    return js;
  } catch { return null; }
}

const MULTIPART = { type: 'object', properties: { file: { type: 'string', format: 'binary' } }, required: ['file'] };

function bodySchema(at: Src, resolve?: Resolve): { schema: Record<string, unknown> | null; multipart?: boolean } | undefined {
  const source = at.source;
  if (/\breq\.formData\(\)/.test(source)) return { schema: MULTIPART, multipart: true };
  const m = /\bbody\(\s*req\s*,\s*/.exec(source);
  if (!m) return /\breq\.json\(\)/.test(source) ? { schema: null } : undefined; // null: a body we cannot describe
  const arg = exprFrom(source, m.index + m[0].length, true);
  if (!arg) return { schema: null };
  if (!/^[A-Za-z_]\w*$/.test(arg)) return { schema: zodToSchema(arg, at, resolve) };
  const d = lookup(arg, at, resolve);
  return { schema: d ? zodToSchema(d.expr, d.at, resolve) : null };
}

function access(file: string, source: string) {
  const perm = source.match(/requirePerm\(\s*'([\w:]+)'\s*\)/)?.[1];
  if (perm) return { security: [{ session: [] }], 'x-permission': perm, who: `Signed in, with the \`${perm}\` permission.` };
  if (/requireCtx\(/.test(source)) return { security: [{ session: [] }], who: 'Signed in (any role). The service may check more (own record, same institution).' };
  if (file.startsWith('cron/')) return { security: [{ cron: [] }], who: 'Vercel Cron only (Authorization: Bearer CRON_SECRET).' };
  return { security: [], who: 'Public.' };
}

export function buildOpenApi(files: RouteFile[], resolve?: Resolve) {
  const paths: Record<string, Record<string, unknown>> = {};
  const tags = new Set<string>();
  for (const { file, source } of [...files].sort((a, b) => a.file.localeCompare(b.file))) {
    const { path, params } = routePath(file);
    const segs = path.split('/').filter(Boolean);
    const tag = segs[1] === 'v1' ? (segs[2] ?? 'v1') : (segs[1] ?? 'api');
    const destructured = source.match(/export\s+const\s*\{([^}]+)\}\s*=/)?.[1].split(',').map(x => x.trim()) ?? [];
    const methods = METHODS.filter(mth => destructured.includes(mth) || new RegExp(`export\\s+(?:const\\s+${mth}\\b|(?:async\\s+)?function\\s+${mth}\\b)`).test(source));
    if (!methods.length) continue;
    const who = access(file, source);
    const limit = source.match(/limit:\s*\{\s*name:\s*'([\w-]+)',\s*max:\s*(\d+),\s*windowMs:\s*([\d_]+)/);
    const body = bodySchema({ file: `app/api/${file}`, source }, resolve);
    const authJs = /handlers/.test(source) && file.startsWith('auth/');
    tags.add(tag);
    paths[path] = {};
    for (const mth of methods) {
      const op: Record<string, unknown> = {
        tags: [tag], operationId: `${mth.toLowerCase()}_${segs.slice(1).join('_').replace(/[{}]/g, '').replace(/[^\w]/g, '_')}`,
        summary: `${mth} ${path.replace(/^\/api\/(v1\/)?/, '')}`,
        description: `${authJs ? 'Auth.js sign-in, sign-out, session and CSRF endpoints (handled by the library). ' : ''}**Who may call it:** ${who.who}\n\nSource: \`apps/web/app/api/${file}\``,
        security: who.security,
        ...(who['x-permission'] ? { 'x-permission': who['x-permission'] } : {}),
        ...(limit ? { 'x-rate-limit': { name: limit[1], max: Number(limit[2]), windowMs: Number(limit[3].replace(/_/g, '')) } } : {}),
        parameters: params.map(p => ({ name: p, in: 'path', required: true, schema: { type: 'string' } })),
        responses: {
          '200': { description: 'Success (JSON).' },
          '400': { description: 'Invalid input: `{ error, fields }` with a message per field.' },
          ...(who.security.length ? { '401': { description: 'Not signed in.' }, '403': { description: 'Signed in without permission.' } } : {}),
          ...(limit ? { '429': { description: 'Too many requests.' } } : {}),
        },
      };
      if (mth !== 'GET' && mth !== 'DELETE' && body !== undefined) op.requestBody = { required: true, content: { [body.multipart ? 'multipart/form-data' : 'application/json']: { schema: body.schema ?? { type: 'object', description: 'JSON body (see the route source).' } } } };
      paths[path][mth.toLowerCase()] = op;
    }
  }
  return {
    openapi: '3.1.0',
    info: { title: 'AI Accelerator Hub API', version: '1.0', description: 'Every route handler of the platform, generated from the route files (docs/API_DOCS_SPEC.md). Calls from this page use your own signed-in session, so they act as you. Changes (POST, PUT, PATCH, DELETE) are real.' },
    servers: [{ url: '/' }],
    tags: [...tags].sort().map(name => ({ name })),
    components: { securitySchemes: {
      session: { type: 'apiKey', in: 'cookie', name: '__Secure-authjs.session-token', description: 'Your signed-in session cookie (Auth.js). Sign in on the site first; the browser sends it.' },
      cron: { type: 'http', scheme: 'bearer', description: 'CRON_SECRET, for Vercel Cron only.' },
    } },
    paths,
  };
}
