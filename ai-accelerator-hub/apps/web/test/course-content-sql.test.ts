// docs/COURSE_CONTENT_CHECK_SPEC.md — run the course's SQL, don't just read it.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { createRequire } from 'module';
// Loaded at run time: Vite does not know node:sqlite yet (Node 22.13+ / 24 has it built in).
const { DatabaseSync } = createRequire(import.meta.url)('node:sqlite') as typeof import('node:sqlite');
type DatabaseSync = InstanceType<typeof DatabaseSync>;
import { GENERIC_GUIDED } from '@/lib/domain/genericGuided';
import { JOURNEY_SPECS } from '@/lib/domain/daDomains/tracks';
import { labCols, ddl, checkData, copyClean, kpiQueries } from '@/lib/domain/daDomains/dataLab';
import { rawSchema, sampleCsv } from '@/lib/domain/daDomains/curriculum';
import { parseCsv } from '@/lib/domain/daDomains/datasetCheck';

const ROOT = join(__dirname, '../../..');
const DAYS_DIR = join(ROOT, 'docs/data-analytics-journey/days');

/** Split a script into statements, respecting quotes and -- comments. Drops comment-only leftovers. */
function statements(sql: string): string[] {
  const out: string[] = []; let buf = ''; let q = false; let comment = false;
  for (const ch of sql) {
    buf += ch;
    if (comment) { if (ch === '\n') comment = false; continue; }
    if (!q && ch === '-' && buf.endsWith('--')) { comment = true; continue; }
    if (ch === "'") q = !q;
    if (ch === ';' && !q) { out.push(buf); buf = ''; }
  }
  if (buf.replace(/--[^\n]*/g, '').trim()) out.push(buf);
  return out.filter(s => s.replace(/--[^\n]*/g, '').trim());
}
const isQuery = (s: string) => /^(SELECT|WITH)\b/i.test(s.replace(/--[^\n]*/g, '').trim());
/** Run a script; return the rows of its last query. */
function run(db: DatabaseSync, sql: string): Record<string, unknown>[] | null {
  let last: Record<string, unknown>[] | null = null;
  for (const s of statements(sql)) { if (isQuery(s)) last = db.prepare(s).all() as Record<string, unknown>[]; else db.exec(s); }
  return last;
}
const sqlSteps = (day: number) => (GENERIC_GUIDED[day] || []).filter(s => s.code?.lang === 'sql');
const days = Object.keys(GENERIC_GUIDED).map(Number).sort((a, b) => a - b);

/** The day's practice tables, built from its guided steps. */
function dayDb(day: number) {
  const db = new DatabaseSync(':memory:');
  for (const s of sqlSteps(day)) run(db, s.code!.text);
  return db;
}
const tablesOf = (db: DatabaseSync) => (db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all() as { name: string }[]).map(r => r.name);

describe('guided SQL steps run as the page says (AC-1)', () => {
  for (const day of days.filter(d => sqlSteps(d).length)) {
    it(`AC-1: day ${day}`, () => {
      const db = new DatabaseSync(':memory:'); db.exec('PRAGMA foreign_keys = ON');
      for (const s of GENERIC_GUIDED[day]) {
        if (s.code?.lang !== 'sql') continue;
        const rows = run(db, s.code.text);
        const check = s.check as { kind: string; pattern?: string; sample?: string };
        for (const d of s.do) {
          const text = typeof d === 'string' ? d : d.text;
          const count = text.match(/paste this line and run it: (SELECT COUNT\(\*\) FROM \w+;)/);
          if (count) expect(String(Object.values(db.prepare(count[1]).get() as object)[0]), `${s.title}: setup count`).toMatch(new RegExp(check.pattern!));
          const then = text.match(/Then run: (SELECT .*;)/);
          if (then) expect(String(Object.values(db.prepare(then[1]).get() as object)[0]), `${s.title}: ${then[1]}`).toBe(check.sample);
        }
        for (const see of s.see || []) {
          const n = see.text.match(/Result: (\d+) rows? returned/);
          if (n && rows) expect(rows.length, `${s.title}: rows returned`).toBe(Number(n[1]));
        }
      }
    });
  }
});

describe('inserted values fit their columns (AC-2)', () => {
  const rules: [RegExp, (v: unknown) => boolean, string][] = [
    [/(^|_)(city|name|region|branch|state|district|segment|category|department|member|customer|product|status)$/i, v => typeof v !== 'string' || !/^[\d\s+\-.]+$/.test(v), 'a name or place, not digits'],
    [/(date|_on|_at|month|first_visit)$/i, v => v === null || /^\d{4}-\d{2}/.test(String(v)), 'a date'],
    [/(amount|price|qty|quantity|salary|revenue|cost|fee|total|units)$/i, v => v === null || typeof v === 'number', 'a number'],
    [/(phone|mobile)$/i, v => v === null || /^[\d\s+\-]+$/.test(String(v)), 'a phone number'],
  ];
  for (const day of days.filter(d => sqlSteps(d).length)) {
    it(`AC-2: day ${day}`, () => {
      const db = dayDb(day);
      for (const t of tablesOf(db)) {
        for (const row of db.prepare(`SELECT * FROM "${t}"`).all() as Record<string, unknown>[]) {
          for (const [col, v] of Object.entries(row)) {
            for (const [re, ok, what] of rules) if (re.test(col)) expect(ok(v), `day ${day} ${t}.${col} = ${JSON.stringify(v)} should be ${what}`).toBe(true);
          }
        }
      }
    });
  }
});

describe('lesson SQL uses that day’s practice tables (AC-3)', () => {
  const ILLUSTRATION_ONLY = new Set([40, 41, 43]); // no practice tables that day: warehouse, reconciliation and capstone sketches
  const files = readdirSync(DAYS_DIR).filter(f => /^D\d+.*\.md$/.test(f));
  for (const f of files) {
    const day = Number(f.match(/^D(\d+)/)![1]);
    const blocks = [...readFileSync(join(DAYS_DIR, f), 'utf8').matchAll(/```sql\n([\s\S]*?)```/g)].map(m => m[1]);
    if (!blocks.length || ILLUSTRATION_ONLY.has(day)) continue;
    it(`AC-3: ${f}`, () => {
      const db = dayDb(day);
      expect(tablesOf(db).length, `${f} has lesson SQL but its day builds no practice tables`).toBeGreaterThan(0);
      for (const b of blocks) for (const s of statements(b)) {
        const body = s.replace(/--[^\n]*/g, '').trim();
        if (/^CREATE TABLE/i.test(body) || /^WHERE\b/i.test(body)) continue; // tables are compared in day5-sql-tables.test.ts; a lone WHERE is a "wrong way" fragment
        expect(() => db.prepare(isQuery(s) ? `EXPLAIN ${s}` : s), `${f}: ${body.split('\n')[0]}`).not.toThrow();
      }
    });
  }
  it('AC-5: Day 10 lesson gives the same answers as its steps', () => {
    const db = dayDb(10);
    const [bands, above] = [...readFileSync(join(DAYS_DIR, 'D10-subqueries-ctes-case.md'), 'utf8').matchAll(/```sql\n([\s\S]*?)```/g)].map(m => run(db, m[1])!);
    expect(bands.map(r => r.orders)).toEqual([4, 4, 4]);
    expect(above.map(r => r.customer)).toEqual(['Kavya Boutique', 'Lakshmi Stores']);
  });
});

describe('domain journeys: generated SQLite scripts keep every good row (AC-4)', () => {
  for (const d of JOURNEY_SPECS) {
    it(`AC-4: ${d.slug}`, () => {
      const c = labCols(d); const db = new DatabaseSync(':memory:');
      const noDot = (s: string) => s.split('\n').filter(l => !l.trim().startsWith('.')).join('\n');
      run(db, noDot(ddl('sqlite', c)));
      const [head, ...rows] = parseCsv(sampleCsv({ ...rawSchema(d), columns: d.dataset.columns }, 120));
      const ins = db.prepare(`INSERT INTO ${c.table}_raw (${head.join(', ')}) VALUES (${head.map(() => '?').join(', ')})`);
      for (const r of rows) ins.run(...r);
      run(db, noDot(checkData('sqlite', c)));
      run(db, noDot(copyClean('sqlite', c)));
      expect((db.prepare(`SELECT COUNT(*) AS n FROM ${c.table}`).get() as { n: number }).n).toBe(120);
      expect(run(db, kpiQueries(c))?.length).toBeGreaterThan(0);
    });
  }
});

describe('migration 0020 fixes old copies of the Day 8, 10 and 11 lessons', () => {
  const sql = readFileSync(join(ROOT, 'packages/db/prisma/migrations/0020_lesson_sql_days_8_10_11/migration.sql'), 'utf8').replace(/^--[^\n]*\n/gm, '');
  const updates = [...sql.matchAll(/replace\(payload, '((?:[^']|'')*)', '((?:[^']|'')*)'\)\nWHERE kind = 'md' AND strpos\(payload, '((?:[^']|'')*)'\) > 0;/g)].map(m => [m[1], m[2], m[3]].map(x => x.replace(/''/g, "'")));
  const apply = (p: string) => updates.reduce((acc, [a, b, where]) => acc.includes(where) ? acc.split(a).join(b) : acc, p);
  const seed = (body: string, day: number) => JSON.stringify({ body, day, module: 'M2', steps: GENERIC_GUIDED[day] });
  for (const [file, day] of [['D08-aggregates-group-by', 8], ['D10-subqueries-ctes-case', 10], ['D11-window-functions', 11]] as const) {
    it(`AC-5: ${file}: an old copy becomes what the seed now writes; a second run changes nothing`, () => {
      const before = seed(readFileSync(join(__dirname, `fixtures/${file}-before-0020.md`), 'utf8'), day);
      const after = seed(readFileSync(join(DAYS_DIR, `${file}.md`), 'utf8'), day);
      expect(before).not.toBe(after);
      expect(apply(before)).toBe(after);
      expect(apply(apply(before))).toBe(after);
    });
  }
  it('AC-5: every UPDATE matches only rows that still hold its old block', () => {
    expect(updates.length).toBe(4);
    for (const [a, , where] of updates) expect(where).toBe(a);
  });
});

describe('data migrations name real tables', () => {
  it('every UPDATE / INSERT / DELETE in a migration targets a table some migration creates (Prisma @@map names, not model names)', () => {
    const dir = join(ROOT, 'packages/db/prisma/migrations');
    const all = readdirSync(dir).filter(d => /^\d{4}_/.test(d)).map(d => readFileSync(join(dir, d, 'migration.sql'), 'utf8')).join('\n');
    const created = new Set([...all.matchAll(/CREATE TABLE (?:IF NOT EXISTS )?"(\w+)"/g)].map(m => m[1]));
    const used = [...all.matchAll(/(?:UPDATE|INSERT INTO|DELETE FROM) "(\w+)"/g)].map(m => m[1]);
    expect(used.length).toBeGreaterThan(0);
    for (const t of used) expect(created.has(t), `migration writes to "${t}", which no migration creates`).toBe(true);
  });
});
