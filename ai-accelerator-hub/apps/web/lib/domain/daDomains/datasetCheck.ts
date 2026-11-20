/**
 * Dataset validation for domain journeys (spec: docs/DOMAIN_ANALYTICS_JOURNEYS_SPEC.md §3.4).
 * A learner uploads a CSV or .xlsx; it is read in memory (never stored) and checked against the domain's schema.
 * Pure: no database, no '@/…' imports (the seed imports the schemas too).
 */
import { DatasetError } from './errors';
import { readXlsx } from './xlsx';

export { DatasetError };

export type ColumnType = 'string' | 'integer' | 'number' | 'date' | 'category' | 'boolean';
export type ColumnRule = { name: string; type: ColumnType; required?: boolean; key?: boolean; values?: string[]; min?: number; max?: number; description?: string };
export type DatasetSchema = { name: string; minRows: number; columns: ColumnRule[] };
export type Table = { header: string[]; rows: string[][] };
export type Check = { id: 'columns' | 'rows' | 'key' | 'required' | 'types' | 'categories' | 'ranges' | 'personal-data'; label: string; ok: boolean; detail: string };
export type DatasetReport = { passed: boolean; rows: number; columns: number; checks: Check[] };

export const MAX_DATASET_BYTES = 5 * 1024 * 1024;
const MAX_ROWS = 50_000;

/** RFC 4180 CSV: quoted fields, "" escapes, commas and newlines inside quotes, CRLF, UTF-8 BOM. */
export function parseCsv(text: string): string[][] {
  const s = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const rows: string[][] = [];
  let row: string[] = [], cell = '', quoted = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (quoted) {
      if (ch === '"') { if (s[i + 1] === '"') { cell += '"'; i++; } else quoted = false; }
      else cell += ch;
    } else if (ch === '"' && cell === '') quoted = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && s[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
      if (rows.length > MAX_ROWS + 1) throw new DatasetError(`Keep datasets under ${MAX_ROWS.toLocaleString('en-IN')} rows.`);
    } else cell += ch;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows.filter(r => r.some(c => c.trim() !== ''));
}

const isZip = (b: Buffer) => b.length >= 4 && b.readUInt32LE(0) === 0x04034b50;
const ext = (name: string) => (/\.([a-z0-9]+)$/i.exec(name)?.[1] ?? '').toLowerCase();

/** Read a CSV or .xlsx upload into a header and rows. Throws DatasetError with a message for the learner. */
export function readTable(buf: Buffer, filename: string): Table {
  if (!buf.length) throw new DatasetError('The file is empty.');
  if (buf.length > MAX_DATASET_BYTES) throw new DatasetError('Keep the file under 5 MB. Upload a sample, not the whole dataset.');
  const e = ext(filename);
  let rows: string[][];
  if (e === 'xlsx' || e === 'xlsm' || isZip(buf)) {
    if (e === 'xlsm') throw new DatasetError('Macro-enabled workbooks are not accepted. Save the file as a plain .xlsx (no macros).');
    if (!isZip(buf)) throw new DatasetError('This .xlsx file is not a valid Excel workbook.');
    rows = readXlsx(buf).filter(r => r.some(c => c.trim() !== ''));
  } else if (e === 'csv' || e === 'txt') {
    if (buf.includes(0)) throw new DatasetError('This does not look like a text CSV file.');
    rows = parseCsv(buf.toString('utf8'));
  } else {
    throw new DatasetError('Upload a CSV or Excel (.xlsx) file.');
  }
  if (!rows.length) throw new DatasetError('The file is empty.');
  return { header: rows[0].map(h => h.trim()), rows: rows.slice(1) };
}

const norm = (h: string) => h.toLowerCase().replace(/[\s_\-.]+/g, '');
const blank = (v: string | undefined) => v === undefined || v.trim() === '' || /^(null|na|n\/a|nan|none|-)$/i.test(v.trim());
/** Empty for this column? A null-like word ("None", "NA") is a real value when the column allows it as a category. */
const blankIn = (c: ColumnRule, v: string | undefined) => blank(v) && !(v !== undefined && v.trim() !== '' && c.values?.some(x => x.toLowerCase() === v.trim().toLowerCase()));

function isDate(v: string): boolean {
  const t = v.trim();
  let y: number, m: number, d: number;
  let r = /^(\d{4})-(\d{2})-(\d{2})(?:[ T]\d{2}:\d{2}(?::\d{2})?)?$/.exec(t);
  if (r) { y = +r[1]; m = +r[2]; d = +r[3]; }
  else if ((r = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(t))) { d = +r[1]; m = +r[2]; y = +r[3]; }
  else if (/^\d{5}(\.\d+)?$/.test(t)) { const n = Number(t); return n >= 20000 && n <= 80000; } // Excel serial date (1954–2119)
  else return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

const TYPE_OK: Record<ColumnType, (v: string) => boolean> = {
  string: () => true,
  category: () => true,
  integer: v => /^-?\d+$/.test(v.trim()),
  number: v => /^-?\d+(\.\d+)?$/.test(v.trim()),
  date: isDate,
  boolean: v => /^(true|false|yes|no|y|n|1|0)$/i.test(v.trim()),
};
const TYPE_NAME: Record<ColumnType, string> = { string: 'text', category: 'category', integer: 'a whole number', number: 'a number', date: 'a date (YYYY-MM-DD)', boolean: 'true/false' };

const PII: { label: string; re: RegExp }[] = [
  { label: 'phone number', re: /(?:^|\D)(?:\+?91[\s-]?)?[6-9]\d{9}(?:\D|$)/ },
  { label: 'email address', re: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i },
  { label: 'Aadhaar-like number', re: /(?:^|\D)[2-9]\d{3}[\s-]?\d{4}[\s-]?\d{4}(?:\D|$)/ },
];

const list = (items: string[], max = 5) => items.length <= max ? items.join('; ') : `${items.slice(0, max).join('; ')}; and ${items.length - max} more`;

export function validateDataset(table: Table, schema: DatasetSchema): DatasetReport {
  const idx = new Map(table.header.map((h, i) => [norm(h), i]));
  const col = (c: ColumnRule) => idx.get(norm(c.name));
  const present = schema.columns.filter(c => col(c) !== undefined);
  const data = table.rows.filter(r => r.some(v => !blank(v)));
  const rowNo = (i: number) => i + 2; // header is row 1
  const checks: Check[] = [];

  const missing = schema.columns.filter(c => c.required !== false && col(c) === undefined).map(c => c.name);
  checks.push({ id: 'columns', label: 'Required columns', ok: missing.length === 0, detail: missing.length ? `Missing: ${missing.join(', ')}` : `All ${schema.columns.filter(c => c.required !== false).length} required columns found` });

  checks.push({ id: 'rows', label: 'Enough rows', ok: data.length >= schema.minRows, detail: `${data.length} rows${data.length >= schema.minRows ? '' : `; needs at least ${schema.minRows}`}` });

  const dupes: string[] = [];
  for (const c of present.filter(c => c.key)) {
    const seen = new Map<string, number>();
    data.forEach((r, i) => { const v = (r[col(c)!] ?? '').trim(); if (!v) return; if (seen.has(v)) dupes.push(`${c.name} "${v}" (rows ${rowNo(seen.get(v)!)} and ${rowNo(i)})`); else seen.set(v, i); });
  }
  const hasKey = schema.columns.some(c => c.key);
  checks.push({ id: 'key', label: 'Unique key', ok: dupes.length === 0, detail: dupes.length ? `Duplicate keys: ${list(dupes)}` : hasKey ? 'Every key value is unique' : 'No key column in this dataset' });

  const nulls: string[] = [];
  for (const c of present.filter(c => c.required !== false)) data.forEach((r, i) => { if (blankIn(c, r[col(c)!])) nulls.push(`${c.name} (row ${rowNo(i)})`); });
  checks.push({ id: 'required', label: 'No empty required values', ok: nulls.length === 0, detail: nulls.length ? `Empty: ${list(nulls)}` : 'No empty values in required columns' });

  const badTypes: string[] = [];
  for (const c of present) data.forEach((r, i) => { const v = r[col(c)!]; if (!blankIn(c, v) && !TYPE_OK[c.type](v)) badTypes.push(`${c.name}: "${v}" is not ${TYPE_NAME[c.type]} (row ${rowNo(i)})`); });
  checks.push({ id: 'types', label: 'Data types', ok: badTypes.length === 0, detail: badTypes.length ? list(badTypes) : 'Every value has the expected type' });

  const badCats: string[] = [];
  for (const c of present.filter(c => c.type === 'category' && c.values?.length)) {
    const allowed = new Set(c.values!.map(v => v.toLowerCase()));
    const bad = new Set<string>();
    data.forEach(r => { const v = r[col(c)!]; if (!blankIn(c, v) && !allowed.has(v.trim().toLowerCase())) bad.add(v.trim()); });
    if (bad.size) badCats.push(`${c.name}: ${[...bad].slice(0, 5).join(', ')} (allowed: ${c.values!.join(', ')})`);
  }
  checks.push({ id: 'categories', label: 'Allowed categories', ok: badCats.length === 0, detail: badCats.length ? list(badCats) : 'Every category value is allowed' });

  const outOfRange: string[] = [];
  for (const c of present.filter(c => (c.type === 'integer' || c.type === 'number') && (c.min !== undefined || c.max !== undefined))) {
    data.forEach((r, i) => { const v = r[col(c)!]; if (blank(v) || !TYPE_OK[c.type](v)) return; const n = Number(v); if ((c.min !== undefined && n < c.min) || (c.max !== undefined && n > c.max)) outOfRange.push(`${c.name}: ${v} (row ${rowNo(i)}; allowed ${c.min ?? '…'} to ${c.max ?? '…'})`); });
  }
  checks.push({ id: 'ranges', label: 'Values in range', ok: outOfRange.length === 0, detail: outOfRange.length ? list(outOfRange) : 'Every number is in its allowed range' });

  const piiCols = new Map<string, Set<string>>();
  table.header.forEach((h, ci) => data.forEach(r => { const v = r[ci] ?? ''; for (const p of PII) if (p.re.test(v)) { if (!piiCols.has(h)) piiCols.set(h, new Set()); piiCols.get(h)!.add(p.label); } }));
  const pii = [...piiCols].map(([h, kinds]) => `${h} (${[...kinds].join(', ')})`);
  checks.push({ id: 'personal-data', label: 'No personal data', ok: pii.length === 0, detail: pii.length ? `Looks like real personal data in: ${list(pii)}. Use synthetic data only.` : 'No phone numbers, emails or ID numbers found' });

  return { passed: checks.every(c => c.ok), rows: data.length, columns: table.header.length, checks };
}
