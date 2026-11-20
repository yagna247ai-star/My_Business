/**
 * Minimal, safe .xlsx reader: first worksheet → rows of strings. No third-party library (the common one, `xlsx`
 * on npm, has unpatched advisories). Only what dataset validation needs: shared strings, inline strings,
 * numbers and booleans. Formulas are read as their cached value.
 *
 * Safety: the zip is read from its central directory; declared sizes are checked BEFORE inflating (zip-bomb guard)
 * and inflation is capped; macro-enabled workbooks (vbaProject.bin) are refused; entry and row counts are limited.
 * Nothing is executed and nothing is written to disk.
 */
import { inflateRawSync } from 'zlib';
import { DatasetError } from './errors';

const MAX_ENTRIES = 2000;
const MAX_TOTAL_UNCOMPRESSED = 40 * 1024 * 1024;
const MAX_ROWS = 100_000;
const MAX_COLS = 200;

type Entry = { name: string; method: number; compSize: number; size: number; offset: number };

function readCentralDirectory(buf: Buffer): Entry[] {
  // End of central directory: 22 bytes + optional comment (≤ 64 KB), searched from the end.
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 22 - 0xffff); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new DatasetError('This .xlsx file is not a valid Excel workbook.');
  const count = buf.readUInt16LE(eocd + 10);
  const cdOffset = buf.readUInt32LE(eocd + 16);
  if (count > MAX_ENTRIES) throw new DatasetError('This workbook has too many parts to read.');
  const entries: Entry[] = [];
  let p = cdOffset;
  let total = 0;
  for (let n = 0; n < count; n++) {
    if (p + 46 > buf.length || buf.readUInt32LE(p) !== 0x02014b50) throw new DatasetError('This .xlsx file is damaged.');
    const method = buf.readUInt16LE(p + 10);
    const compSize = buf.readUInt32LE(p + 20);
    const size = buf.readUInt32LE(p + 24);
    const nameLen = buf.readUInt16LE(p + 28), extraLen = buf.readUInt16LE(p + 30), commentLen = buf.readUInt16LE(p + 32);
    const offset = buf.readUInt32LE(p + 42);
    const name = buf.toString('utf8', p + 46, p + 46 + nameLen);
    total += size;
    if (total > MAX_TOTAL_UNCOMPRESSED) throw new DatasetError('This workbook is too large when unpacked. Keep datasets under 40 MB.');
    entries.push({ name, method, compSize, size, offset });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

function readEntry(buf: Buffer, e: Entry): string {
  if (e.offset + 30 > buf.length || buf.readUInt32LE(e.offset) !== 0x04034b50) throw new DatasetError('This .xlsx file is damaged.');
  const start = e.offset + 30 + buf.readUInt16LE(e.offset + 26) + buf.readUInt16LE(e.offset + 28);
  const data = buf.subarray(start, start + e.compSize);
  if (e.method === 0) return data.toString('utf8');
  if (e.method !== 8) throw new DatasetError('This workbook uses an unsupported compression method. Save it again as a normal .xlsx.');
  try {
    return inflateRawSync(data, { maxOutputLength: e.size + 1 }).toString('utf8');
  } catch {
    throw new DatasetError('This workbook is too large when unpacked or is damaged.');
  }
}

const unescapeXml = (s: string) => s
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'")
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
  .replace(/&amp;/g, '&');

/** Text of every <t> run inside a fragment (rich text is split into several runs). */
const textRuns = (xml: string) => Array.from(xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g), m => unescapeXml(m[1])).join('');

const colIndex = (ref: string) => {
  const letters = /^([A-Z]+)/.exec(ref)?.[1] ?? '';
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
};

function firstSheetPath(files: Map<string, Entry>, buf: Buffer): string {
  const wb = files.get('xl/workbook.xml');
  const rels = files.get('xl/_rels/workbook.xml.rels');
  if (wb && rels) {
    const rid = /<sheet\b[^>]*\br:id="([^"]+)"/.exec(readEntry(buf, wb))?.[1];
    if (rid) {
      const relXml = readEntry(buf, rels);
      const rel = new RegExp(`<Relationship\\b[^>]*\\bId="${rid}"[^>]*>`).exec(relXml)?.[0];
      const target = rel && /\bTarget="([^"]+)"/.exec(rel)?.[1];
      if (target) {
        const path = target.startsWith('/') ? target.slice(1) : `xl/${target}`;
        if (files.has(path)) return path;
      }
    }
  }
  const fallback = [...files.keys()].filter(n => /^xl\/worksheets\/sheet\d+\.xml$/.test(n)).sort()[0];
  if (!fallback) throw new DatasetError('This workbook has no worksheet.');
  return fallback;
}

export function readXlsx(buf: Buffer): string[][] {
  const entries = readCentralDirectory(buf);
  if (entries.some(e => /vbaProject\.bin$/i.test(e.name))) throw new DatasetError('Macro-enabled workbooks are not accepted. Save the file as a plain .xlsx (no macros).');
  const files = new Map(entries.map(e => [e.name, e]));
  const sst = files.get('xl/sharedStrings.xml');
  const shared = sst ? Array.from(readEntry(buf, sst).matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g), m => textRuns(m[1])) : [];
  const sheetXml = readEntry(buf, files.get(firstSheetPath(files, buf))!);

  const rows: string[][] = [];
  let nextRow = 0;
  for (const rm of sheetXml.matchAll(/<row\b([^>]*)>([\s\S]*?)<\/row>|<row\b([^>]*)\/>/g)) {
    const attrs = rm[1] ?? rm[3] ?? '';
    const r = Number(/\br="(\d+)"/.exec(attrs)?.[1] ?? nextRow + 1) - 1;
    nextRow = r + 1;
    if (r >= MAX_ROWS) throw new DatasetError(`Keep datasets under ${MAX_ROWS.toLocaleString('en-IN')} rows.`);
    const cells: string[] = [];
    let nextCol = 0;
    for (const cm of (rm[2] ?? '').matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const cAttrs = cm[1];
      const ref = /\br="([A-Z]+\d+)"/.exec(cAttrs)?.[1];
      const c = ref ? colIndex(ref) : nextCol;
      nextCol = c + 1;
      if (c >= MAX_COLS) continue;
      const t = /\bt="([^"]+)"/.exec(cAttrs)?.[1];
      const inner = cm[2] ?? '';
      const v = /<v>([\s\S]*?)<\/v>/.exec(inner)?.[1];
      let val = '';
      if (t === 's') val = shared[Number(v)] ?? '';
      else if (t === 'inlineStr') val = textRuns(inner);
      else if (t === 'b') val = v === '1' ? 'true' : 'false';
      else if (v !== undefined) val = unescapeXml(v);
      while (cells.length < c) cells.push('');
      cells[c] = val;
    }
    while (rows.length < r) rows.push([]);
    rows[r] = cells;
  }
  // Pad every row to the header width so sparse cells line up.
  const width = Math.max(0, ...rows.map(r => r.length));
  return rows.map(r => { const out = r.slice(); while (out.length < width) out.push(''); return out; });
}
