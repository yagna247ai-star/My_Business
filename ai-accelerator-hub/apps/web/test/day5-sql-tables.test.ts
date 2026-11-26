// docs/DAY5_SQL_TABLES_SPEC.md
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { GENERIC_GUIDED } from '@/lib/domain/genericGuided';

const stepSql = JSON.stringify(GENERIC_GUIDED[5]).replace(/\\n/g, '\n').replace(/\\"/g, '"');
const lesson = readFileSync(join(__dirname, '../../../docs/data-analytics-journey/days/D05-databases-rdbms-keys.md'), 'utf8');

/** table -> column names, from every CREATE TABLE in a script. */
function tables(sql: string): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const m of sql.matchAll(/CREATE TABLE\s+(\w+)\s*\(([\s\S]*?)\);/g)) {
    const body = m[2].replace(/--[^\n]*/g, '').replace(/REFERENCES\s+\w+\(\w+\)/g, '');
    out[m[1]] = body.split(',').map(c => c.trim().split(/\s+/)[0]).filter(Boolean).sort();
  }
  return out;
}

describe('Day 5 SQL tables', () => {
  it('AC-1: customers has city, and the INSERT puts city names in it', () => {
    expect(tables(stepSql).customers).toEqual(['city', 'customer_id', 'name']);
    const ins = stepSql.match(/INSERT INTO customers VALUES ([^;]+);/)![1];
    const rows = [...ins.matchAll(/\((\d+),'([^']+)','([^']+)'\)/g)];
    expect(rows.length).toBe(3);
    for (const r of rows) expect(r[3]).toMatch(/^[A-Za-z][A-Za-z ]+$/);
  });
  it('AC-2: the lesson and the steps create the same tables and columns', () => {
    expect(tables(lesson)).toEqual(tables(stepSql));
  });
});

/** The replace() pairs in migration 0019, applied the way Postgres would (standard strings, '' is a quote). */
function applyMigration(payload: string, matchesWhere: (p: string) => boolean): string {
  const sql = readFileSync(join(__dirname, '../../../packages/db/prisma/migrations/0019_day5_customers_city/migration.sql'), 'utf8').replace(/--[^\n]*/g, '');
  const lit = [...sql.matchAll(/'((?:[^']|'')*)'/g)].map(m => m[1].replace(/''/g, "'"));
  const marker = lit[lit.length - 1];
  if (!(lit.includes('md') && matchesWhere(payload) && payload.includes(marker))) return payload;
  const pairs = lit.filter(x => x !== 'md' && x !== marker);
  let out = payload;
  for (let i = 0; i < pairs.length; i += 2) out = out.split(pairs[i]).join(pairs[i + 1]);
  return out;
}

describe('migration 0019', () => {
  const seedPayload = (body: string, steps: unknown) => JSON.stringify({ body, day: 5, module: 'M2', steps });
  const before = readFileSync(join(__dirname, 'fixtures/D05-before-0019.md'), 'utf8');
  const oldSteps = JSON.parse(JSON.stringify(GENERIC_GUIDED[5]).replace('name TEXT NOT NULL, city TEXT);', 'name TEXT NOT NULL, phone TEXT);')
    .replace("(1,'Mrs. Rao','Hyderabad'),(2,'Imran','Vijayawada'),(3,'Lakshmi','Warangal')", "(1,'Mrs. Rao','9800000001'),(2,'Imran','9800000002'),(3,'Lakshmi','9800000003')"));
  const oldPayload = seedPayload(before, oldSteps);
  const newPayload = seedPayload(lesson, GENERIC_GUIDED[5]);

  it('AC-3: an old copy of Day 5 becomes exactly what the seed now writes, and a second run changes nothing', () => {
    expect(oldPayload).not.toBe(newPayload);
    const once = applyMigration(oldPayload, () => true);
    expect(once).toBe(newPayload);
    expect(applyMigration(once, () => true)).toBe(once);
  });
  it('AC-3: other days are not changed', () => {
    const other = JSON.stringify({ body: 'SELECT * FROM sales_orders;\n  unit_price  NUMERIC NOT NULL', day: 10 });
    expect(applyMigration(other, () => true)).toBe(other);
  });
});
