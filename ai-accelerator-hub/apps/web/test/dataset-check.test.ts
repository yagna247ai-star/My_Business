import { describe, it, expect } from 'vitest';
import { deflateRawSync, crc32 } from 'zlib';
import { parseCsv, readTable, validateDataset, DatasetError, type DatasetSchema } from '@/lib/domain/daDomains/datasetCheck';
import { readXlsx } from '@/lib/domain/daDomains/xlsx';

/* ---------- a real .xlsx (zip) writer, only for tests ---------- */
function zip(files: Record<string, string | Buffer>): Buffer {
  const locals: Buffer[] = []; const centrals: Buffer[] = []; let offset = 0;
  for (const [name, content] of Object.entries(files)) {
    const data = Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf8');
    const comp = deflateRawSync(data); const nameBuf = Buffer.from(name, 'utf8'); const crc = crc32(data);
    const lh = Buffer.alloc(30); lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(0, 6); lh.writeUInt16LE(8, 8);
    lh.writeUInt32LE(crc, 14); lh.writeUInt32LE(comp.length, 18); lh.writeUInt32LE(data.length, 22); lh.writeUInt16LE(nameBuf.length, 26); lh.writeUInt16LE(0, 28);
    const ch = Buffer.alloc(46); ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6); ch.writeUInt16LE(0, 8); ch.writeUInt16LE(8, 10);
    ch.writeUInt32LE(crc, 16); ch.writeUInt32LE(comp.length, 20); ch.writeUInt32LE(data.length, 24); ch.writeUInt16LE(nameBuf.length, 28); ch.writeUInt32LE(offset, 42);
    locals.push(lh, nameBuf, comp); centrals.push(ch, nameBuf); offset += lh.length + nameBuf.length + comp.length;
  }
  const cd = Buffer.concat(centrals); const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(centrals.length / 2, 8); end.writeUInt16LE(centrals.length / 2, 10); end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, cd, end]);
}
const colName = (i: number) => { let s = ''; i += 1; while (i > 0) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; };
function xlsx(rows: (string | number | boolean | null)[][], extra: Record<string, string | Buffer> = {}): Buffer {
  const strings: string[] = []; const si = (s: string) => { let i = strings.indexOf(s); if (i < 0) { strings.push(s); i = strings.length - 1; } return i; };
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const sheet = rows.map((r, ri) => `<row r="${ri + 1}">${r.map((v, ci) => {
    const ref = `${colName(ci)}${ri + 1}`;
    if (v === null) return '';
    if (typeof v === 'number') return `<c r="${ref}"><v>${v}</v></c>`;
    if (typeof v === 'boolean') return `<c r="${ref}" t="b"><v>${v ? 1 : 0}</v></c>`;
    return `<c r="${ref}" t="s"><v>${si(v)}</v></c>`;
  }).join('')}</row>`).join('');
  return zip({
    '[Content_Types].xml': '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"/>',
    'xl/workbook.xml': '<?xml version="1.0"?><workbook xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Data" sheetId="1" r:id="rId1"/></sheets></workbook>',
    'xl/_rels/workbook.xml.rels': '<?xml version="1.0"?><Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>',
    'xl/worksheets/sheet1.xml': `<?xml version="1.0"?><worksheet><sheetData>${sheet}</sheetData></worksheet>`,
    'xl/sharedStrings.xml': `<?xml version="1.0"?><sst>${strings.map(s => `<si><t>${esc(s)}</t></si>`).join('')}</sst>`,
    ...extra,
  });
}

const schema: DatasetSchema = {
  name: 'students', minRows: 3,
  columns: [
    { name: 'student_id', type: 'string', required: true, key: true },
    { name: 'grade', type: 'integer', required: true, min: 1, max: 12 },
    { name: 'attendance_pct', type: 'number', required: true, min: 0, max: 100 },
    { name: 'exam_date', type: 'date', required: false },
    { name: 'stream', type: 'category', required: true, values: ['Science', 'Commerce', 'Arts'] },
  ],
};
const good = 'student_id,grade,attendance_pct,exam_date,stream\nS001,10,92.5,2026-03-12,Science\nS002,11,78,2026-03-12,Commerce\nS003,12,88.25,,Arts\n';
const check = (r: ReturnType<typeof validateDataset>, id: string) => r.checks.find(c => c.id === id)!;

describe('parseCsv', () => {
  it('handles quotes, escaped quotes, commas, CRLF and a BOM', () => {
    expect(parseCsv('﻿a,b\r\n"x, y","say ""hi"""\r\n')).toEqual([['a', 'b'], ['x, y', 'say "hi"']]);
  });
  it('drops fully empty trailing lines', () => {
    expect(parseCsv('a\n1\n\n\n')).toEqual([['a'], ['1']]);
  });
  it('keeps newlines inside quoted cells', () => {
    expect(parseCsv('note\n"line 1\nline 2"\n')).toEqual([['note'], ['line 1\nline 2']]);
  });
});

describe('validateDataset', () => {
  it('passes a clean dataset and reports every check', () => {
    const r = validateDataset(readTable(Buffer.from(good), 'students.csv'), schema);
    expect(r.passed).toBe(true);
    expect(r.rows).toBe(3);
    expect(r.checks.every(c => c.ok)).toBe(true);
    expect(r.checks.map(c => c.id)).toEqual(['columns', 'rows', 'key', 'required', 'types', 'categories', 'ranges', 'personal-data']);
  });
  it('matches headers ignoring case, spaces and underscores', () => {
    const csv = 'Student ID,GRADE,Attendance Pct,Exam Date,Stream\nS1,9,50,,Arts\nS2,9,60,,Arts\nS3,9,70,,Arts\n';
    expect(validateDataset(readTable(Buffer.from(csv), 'x.csv'), schema).passed).toBe(true);
  });
  it('names missing required columns', () => {
    const r = validateDataset(readTable(Buffer.from('student_id,grade\nS1,9\nS2,9\nS3,9\n'), 'x.csv'), schema);
    expect(r.passed).toBe(false);
    expect(check(r, 'columns').detail).toMatch(/attendance_pct/);
    expect(check(r, 'columns').detail).toMatch(/stream/);
    expect(check(r, 'columns').detail).not.toMatch(/exam_date/); // optional column
  });
  it('requires the minimum number of rows', () => {
    const r = validateDataset(readTable(Buffer.from(good.split('\n').slice(0, 3).join('\n')), 'x.csv'), schema);
    expect(check(r, 'rows').ok).toBe(false);
    expect(check(r, 'rows').detail).toMatch(/2 rows.*at least 3/);
  });
  it('finds duplicate keys', () => {
    const r = validateDataset(readTable(Buffer.from(good + 'S001,9,40,,Arts\n'), 'x.csv'), schema);
    expect(check(r, 'key').ok).toBe(false);
    expect(check(r, 'key').detail).toMatch(/S001/);
  });
  it('finds nulls in required columns but allows them in optional ones', () => {
    const r = validateDataset(readTable(Buffer.from(good + 'S004,10,,,Arts\n'), 'x.csv'), schema);
    expect(check(r, 'required').ok).toBe(false);
    expect(check(r, 'required').detail).toMatch(/attendance_pct.*row 5/);
  });
  it('finds wrong types with the row number', () => {
    const r = validateDataset(readTable(Buffer.from(good + 'S004,ten,50,13/45/2026,Arts\n'), 'x.csv'), schema);
    expect(check(r, 'types').ok).toBe(false);
    expect(check(r, 'types').detail).toMatch(/grade.*row 5/);
    expect(check(r, 'types').detail).toMatch(/exam_date.*row 5/);
  });
  it('finds values outside the allowed categories', () => {
    const r = validateDataset(readTable(Buffer.from(good + 'S004,10,50,,Sports\n'), 'x.csv'), schema);
    expect(check(r, 'categories').ok).toBe(false);
    expect(check(r, 'categories').detail).toMatch(/Sports/);
  });
  it('finds values outside numeric ranges', () => {
    const r = validateDataset(readTable(Buffer.from(good + 'S004,10,104,,Arts\n'), 'x.csv'), schema);
    expect(check(r, 'ranges').ok).toBe(false);
    expect(check(r, 'ranges').detail).toMatch(/attendance_pct.*104/);
  });
  it('flags personal data: phone, email and Aadhaar-like numbers', () => {
    const csv = 'student_id,grade,attendance_pct,exam_date,stream,contact\nS1,9,50,,Arts,9876543210\nS2,9,50,,Arts,a@b.com\nS3,9,50,,Arts,2345 6789 0123\n';
    const r = validateDataset(readTable(Buffer.from(csv), 'x.csv'), schema);
    expect(check(r, 'personal-data').ok).toBe(false);
    expect(check(r, 'personal-data').detail).toMatch(/contact/);
    expect(r.passed).toBe(false);
  });
});

describe('readTable / readXlsx', () => {
  it('reads the first sheet of a real .xlsx, with shared strings, numbers and booleans', () => {
    const buf = xlsx([['student_id', 'grade', 'attendance_pct', 'exam_date', 'stream'], ['S001', 10, 92.5, null, 'Science'], ['S002', 11, 78, null, 'Commerce'], ['S003', 12, 88, null, 'Arts']]);
    const t = readTable(buf, 'students.xlsx');
    expect(t.header).toEqual(['student_id', 'grade', 'attendance_pct', 'exam_date', 'stream']);
    expect(t.rows[0]).toEqual(['S001', '10', '92.5', '', 'Science']);
    expect(validateDataset(t, schema).passed).toBe(true);
  });
  it('accepts Excel date serial numbers as dates', () => {
    const buf = xlsx([['student_id', 'grade', 'attendance_pct', 'exam_date', 'stream'], ['S1', 9, 50, 46093, 'Arts'], ['S2', 9, 50, 46093, 'Arts'], ['S3', 9, 50, 46093, 'Arts']]);
    expect(check(validateDataset(readTable(buf, 'x.xlsx'), schema), 'types').ok).toBe(true);
  });
  it('places sparse cells in the right columns', () => {
    const rows = readXlsx(xlsx([['a', 'b', 'c'], ['1', null, '3']]));
    expect(rows[1]).toEqual(['1', '', '3']);
  });
  it('refuses macro-enabled workbooks', () => {
    expect(() => readTable(xlsx([['a']], { 'xl/vbaProject.bin': Buffer.from('macro') }), 'x.xlsx')).toThrow(DatasetError);
  });
  it('refuses a zip bomb (declared uncompressed size too large)', () => {
    const big = Buffer.alloc(45 * 1024 * 1024, 65); // 45 MB of "A": compresses tiny
    expect(() => readTable(zip({ 'xl/worksheets/sheet1.xml': big }), 'x.xlsx')).toThrow(/too large/);
  });
  it('refuses unsupported files with a clear message', () => {
    expect(() => readTable(Buffer.from('%PDF-1.4 nope'), 'report.pdf')).toThrow(/CSV or Excel/);
    expect(() => readTable(Buffer.from('not a zip'), 'fake.xlsx')).toThrow(DatasetError);
  });
  it('refuses an empty file and a header-only file', () => {
    expect(() => readTable(Buffer.from(''), 'x.csv')).toThrow(/empty/);
    const r = validateDataset(readTable(Buffer.from('student_id,grade\n'), 'x.csv'), schema);
    expect(r.passed).toBe(false);
  });
});

describe('null-like words that are real category values', () => {
  it('treats "None" as a value when the column allows it, and as empty when it does not', () => {
    const s: DatasetSchema = { name: 't', minRows: 1, columns: [{ name: 'id', type: 'string', required: true, key: true }, { name: 'sport', type: 'category', required: true, values: ['Cricket', 'None'] }, { name: 'coach', type: 'string', required: true }] };
    const ok = validateDataset(readTable(Buffer.from('id,sport,coach\nA,None,Ravi\n'), 'x.csv'), s);
    expect(ok.passed).toBe(true);
    const bad = validateDataset(readTable(Buffer.from('id,sport,coach\nA,Cricket,None\n'), 'x.csv'), s);
    expect(check(bad, 'required').detail).toMatch(/coach/);
  });
});
