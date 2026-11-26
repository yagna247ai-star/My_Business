// docs/API_DOCS_SPEC.md
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { buildOpenApi, routePath } from '@/lib/apiDocs/openapi';
import { readRouteFiles, moduleResolver } from '@/lib/apiDocs/routeFiles';
import committed from '@/lib/apiDocs/openapi.generated.json';

const root = join(__dirname, '..');
const files = readRouteFiles(join(root, 'app/api'));
const doc = buildOpenApi(files, moduleResolver(root));
type Op = { security: unknown[]; 'x-permission'?: string; 'x-rate-limit'?: { max: number }; requestBody?: { content: Record<string, { schema: Record<string, unknown> }> }; parameters: { name: string; in: string }[] };
const op = (path: string, m: string) => (doc.paths as Record<string, Record<string, Op>>)[path]?.[m];

describe('API docs', () => {
  it('AC-1: every route file and every exported method appears, with {params}', () => {
    expect(files.length).toBeGreaterThan(130);
    const listed = Object.values(doc.paths).flatMap(p => Object.values(p as Record<string, { description: string }>)).map(o => o.description.match(/app\/api\/(.*)`/)![1]);
    for (const f of files) expect(listed, f.file).toContain(f.file);
    expect(routePath('v1/levels/[code]/proof/route.ts')).toEqual({ path: '/api/v1/levels/{code}/proof', params: ['code'] });
    expect(routePath('auth/[...nextauth]/route.ts').path).toBe('/api/auth/{nextauth}');
    expect(op('/api/v1/levels/{code}/proof', 'post')!.parameters).toEqual([{ name: 'code', in: 'path', required: true, schema: { type: 'string' } }]);
    expect(Object.keys(doc.paths['/api/auth/{nextauth}'])).toEqual(['get', 'post']);
  });
  it('AC-2: who may call it, and rate limits', () => {
    expect(op('/api/v1/levels/{code}/proof', 'post')).toMatchObject({ 'x-permission': 'learn:self', security: [{ session: [] }], 'x-rate-limit': { name: 'proof', max: 10, windowMs: 60000 } });
    expect(op('/api/v1/help', 'post')!.security).toEqual([{ session: [] }]);
    expect(op('/api/v1/register/journeys', 'get')!.security).toEqual([]);
    const cron = Object.keys(doc.paths).filter(p => p.startsWith('/api/cron/'));
    expect(cron.length).toBeGreaterThan(0);
    for (const p of cron) for (const o of Object.values(doc.paths[p] as Record<string, Op>)) expect(o.security, p).toEqual([{ cron: [] }]);
  });
  it('AC-3: request bodies come from the route’s zod schema (local, imported, with constants); others are still documented', () => {
    const proof = op('/api/v1/levels/{code}/proof', 'post')!.requestBody!.content['application/json'].schema;
    expect(proof).toMatchObject({ type: 'object', properties: { evidenceUrl: { type: 'string', maxLength: 2048 }, reflection: { type: 'string' } } });
    expect(proof.required).toEqual(expect.arrayContaining(['evidenceUrl', 'reflection', 'checklist']));
    const reg = op('/api/v1/register', 'post')!.requestBody!.content['application/json'].schema as { properties: Record<string, unknown> };
    expect(Object.keys(reg.properties)).toEqual(expect.arrayContaining(['name', 'email', 'password']));
    expect(op('/api/v1/hackathons/{id}/status', 'post')!.requestBody!.content['application/json'].schema).toMatchObject({ properties: { status: { enum: ['draft', 'open', 'building', 'submit', 'review', 'closed'] } } });
    expect(op('/api/v1/files', 'post')!.requestBody!.content['multipart/form-data'].schema).toMatchObject({ properties: { file: { format: 'binary' } } });
    let described = 0, generic = 0;
    for (const p of Object.values(doc.paths)) for (const o of Object.values(p as Record<string, Op>)) if (o.requestBody) { const s = Object.values(o.requestBody.content)[0].schema; if (String(s.description ?? '').startsWith('JSON body')) generic++; else described++; }
    expect(described).toBeGreaterThan(75);
    expect(generic).toBeLessThan(8);
  });
  it('AC-4: the committed document is up to date (run: npm run openapi)', () => {
    expect(JSON.parse(JSON.stringify(doc))).toEqual(committed);
  });
  it('AC-5: the document and the page are for Super Admins and Institution Admins', () => {
    expect(readFileSync(join(root, 'app/api/v1/openapi.json/route.ts'), 'utf8')).toMatch(/requirePerm\('institute:manage'\)/);
    expect(readFileSync(join(root, 'app/api-docs/page.tsx'), 'utf8')).toMatch(/requirePerm\('institute:manage'\)/);
    expect(op('/api/v1/openapi.json', 'get')!['x-permission']).toBe('institute:manage');
  });
  it('AC-6: only /api-docs may load jsDelivr, and only pinned files with integrity', () => {
    const cfg = readFileSync(join(root, 'next.config.js'), 'utf8');
    expect(cfg).toMatch(/source: '\/api-docs', headers: \[\{ key: 'Content-Security-Policy', value: apiDocsCsp \}\]/);
    expect(cfg.match(/const csp = \[[\s\S]*?\]\.join/)![0]).not.toMatch(/jsdelivr/);
    const ui = readFileSync(join(root, 'app/api-docs/SwaggerUi.tsx'), 'utf8');
    expect(ui).toMatch(/swagger-ui-dist@5\.17\.14\/swagger-ui-bundle\.js/);
    expect(ui).toMatch(/jsSri: 'sha384-[A-Za-z0-9+/=]{64}'/);
    expect(ui).toMatch(/cssSri: 'sha384-[A-Za-z0-9+/=]{64}'/);
  });
});
