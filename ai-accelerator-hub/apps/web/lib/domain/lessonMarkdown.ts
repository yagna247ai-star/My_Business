/**
 * Small, safe markdown reader for course day content (docs/data-analytics-journey/days/*.md).
 * Supports: headings (#, ##, ###), paragraphs, bullet and numbered lists, tables, code fences,
 * block quotes, images on their own line (`![caption](/help/img/x.jpg)`, own-site paths only), and inline **bold** and `code`. It produces plain data; the page renders it as
 * React elements, so no raw HTML from content is ever inserted.
 */

export type Block =
  | { type: 'h'; level: 1 | 2 | 3; text: string }
  | { type: 'p'; text: string }
  | { type: 'quote'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'table'; header: string[]; rows: string[][] }
  | { type: 'code'; text: string }
  /** `![caption](/path.png)` alone on a line. Only images served by this site (a path starting with /). */
  | { type: 'img'; src: string; alt: string };

const cells = (line: string) => line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());

export function parseMarkdown(md: string): Block[] {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const out: Block[] = [];
  let i = 0;
  let para: string[] = [];
  const flush = () => { if (para.length) { out.push({ type: 'p', text: para.join(' ') }); para = []; } };

  while (i < lines.length) {
    const line = lines[i];
    const t = line.trim();

    if (t.startsWith('```')) {
      flush();
      const body: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) { body.push(lines[i]); i++; }
      out.push({ type: 'code', text: body.join('\n') });
      i++;
      continue;
    }
    if (t === '') { flush(); i++; continue; }

    const img = /^!\[([^\]]*)\]\((\/[A-Za-z0-9/_.-]+\.(?:png|jpe?g|webp|gif|svg))\)$/.exec(t);
    if (img) { flush(); out.push({ type: 'img', alt: img[1], src: img[2] }); i++; continue; }

    const h = /^(#{1,3})\s+(.*)$/.exec(t);
    if (h) { flush(); out.push({ type: 'h', level: h[1].length as 1 | 2 | 3, text: h[2] }); i++; continue; }

    if (t.startsWith('>')) {
      flush();
      const q: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) { q.push(lines[i].trim().replace(/^>\s?/, '')); i++; }
      out.push({ type: 'quote', text: q.join(' ') });
      continue;
    }

    if (t.startsWith('|')) {
      flush();
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        if (!/^\|?\s*:?-{2,}/.test(lines[i].trim())) rows.push(cells(lines[i]));
        i++;
      }
      const [header, ...body] = rows;
      out.push({ type: 'table', header: header || [], rows: body });
      continue;
    }

    if (/^[-*]\s+/.test(t)) {
      flush();
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) { items.push(lines[i].trim().replace(/^[-*]\s+/, '')); i++; }
      out.push({ type: 'ul', items });
      continue;
    }

    if (/^\d+\.\s+/.test(t)) {
      flush();
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) { items.push(lines[i].trim().replace(/^\d+\.\s+/, '')); i++; }
      out.push({ type: 'ol', items });
      continue;
    }

    para.push(t);
    i++;
  }
  flush();
  return out;
}

export type Inline = { kind: 'text' | 'bold' | 'code'; text: string };

/** Split one line of text into plain, **bold** and `code` pieces. */
export function parseInline(text: string): Inline[] {
  const out: Inline[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push({ kind: 'text', text: text.slice(last, m.index) });
    const tok = m[0];
    out.push(tok.startsWith('**') ? { kind: 'bold', text: tok.slice(2, -2) } : { kind: 'code', text: tok.slice(1, -1) });
    last = m.index + tok.length;
  }
  if (last < text.length) out.push({ kind: 'text', text: text.slice(last) });
  return out;
}

/** Module and day lookup for the journey: which level a day belongs to. */
export const DAY_TO_LEVEL: Record<number, string> = (() => {
  const ranges: [string, number, number][] = [
    ['DA01_FUNDAMENTALS', 1, 4], ['DA02_SQL', 5, 11], ['DA03_PYTHON_FUNDAMENTALS', 12, 16],
    ['DA04_PYTHON_ANALYTICS', 17, 22], ['DA05_POWER_BI', 23, 27], ['DA06_AI_FOR_ANALYTICS', 28, 31],
    ['DA07_MACHINE_LEARNING', 32, 36], ['DA08_ETL_DATA_QUALITY', 37, 41], ['DA09_CAPSTONE_READINESS', 42, 45],
  ];
  const map: Record<number, string> = {};
  for (const [code, from, to] of ranges) for (let d = from; d <= to; d++) map[d] = code;
  return map;
})();
