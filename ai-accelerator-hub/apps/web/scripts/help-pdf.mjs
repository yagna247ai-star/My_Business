#!/usr/bin/env node
/**
 * Prints docs/help/SIMPLE_GUIDE.md (with its screenshots from public/help/img) to a PDF:
 *   public/help/AI_Accelerator_Hub_Simple_Guide.pdf   (served by the app: Help → Download the guide)
 *   docs/help/AI_Accelerator_Hub_Simple_Guide.pdf     (kept in the repository)
 * Run: node scripts/help-pdf.mjs   (needs Playwright's Chromium, already used for the e2e tests)
 */
import { readFileSync, copyFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const here = dirname(fileURLToPath(import.meta.url));
const web = join(here, '..');
const root = join(web, '../..');
const md = readFileSync(join(root, 'docs/help/SIMPLE_GUIDE.md'), 'utf8').replace(/\r\n/g, '\n');

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inline = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/`([^`]+)`/g, '<code>$1</code>');
const dataUri = src => {
  const file = join(web, 'public', src.replace(/^\//, ''));
  const type = src.endsWith('.png') ? 'image/png' : 'image/jpeg';
  return `data:${type};base64,${readFileSync(file).toString('base64')}`;
};

function toHtml(text) {
  const lines = text.split('\n'); const out = []; let i = 0; let para = [];
  const flush = () => { if (para.length) { out.push(`<p>${inline(para.join(' '))}</p>`); para = []; } };
  while (i < lines.length) {
    const t = lines[i].trim();
    if (!t) { flush(); i++; continue; }
    let m;
    if ((m = /^(#{1,3})\s+(.*)$/.exec(t))) { flush(); const n = m[1].length; out.push(`<h${n}${n === 2 ? ' class="section"' : ''}>${inline(m[2])}</h${n}>`); i++; continue; }
    if ((m = /^!\[([^\]]*)\]\((\/[^)]+)\)$/.exec(t))) { flush(); out.push(`<figure><img src="${dataUri(m[2])}" alt="${esc(m[1])}"><figcaption>${esc(m[1])}</figcaption></figure>`); i++; continue; }
    if (t.startsWith('|')) {
      flush(); const rows = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) { const l = lines[i].trim(); if (!/^\|?\s*:?-{2,}/.test(l)) rows.push(l.replace(/^\||\|$/g, '').split('|').map(c => c.trim())); i++; }
      const [h, ...b] = rows;
      out.push(`<table><thead><tr>${h.map(c => `<th>${inline(c)}</th>`).join('')}</tr></thead><tbody>${b.map(r => `<tr>${r.map(c => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`);
      continue;
    }
    if (/^[-*]\s+/.test(t) || /^\d+\.\s+/.test(t)) {
      flush(); const ordered = /^\d+\./.test(t); const items = [];
      while (i < lines.length && (ordered ? /^\d+\.\s+/ : /^[-*]\s+/).test(lines[i].trim())) { items.push(lines[i].trim().replace(/^([-*]|\d+\.)\s+/, '')); i++; }
      out.push(`<${ordered ? 'ol' : 'ul'}>${items.map(x => `<li>${inline(x)}</li>`).join('')}</${ordered ? 'ol' : 'ul'}>`);
      continue;
    }
    para.push(t); i++;
  }
  flush();
  return out.join('\n');
}

const css = `
  @page { size: A4; margin: 16mm 15mm 18mm; }
  body { font-family: -apple-system, 'Segoe UI', Roboto, 'Noto Sans', Arial, sans-serif; color: #1b2233; font-size: 11pt; line-height: 1.55; }
  h1 { font-size: 26pt; margin: 0 0 4pt; color: #0f1b3d; }
  h2.section { font-size: 16pt; color: #0f1b3d; margin: 22pt 0 6pt; padding-bottom: 4pt; border-bottom: 2px solid #e8b94f; page-break-after: avoid; }
  h2.section:not(:first-of-type) { page-break-before: always; }
  p { margin: 6pt 0; }
  ul, ol { margin: 6pt 0 6pt 18pt; padding: 0; } li { margin: 2pt 0; }
  table { border-collapse: collapse; width: 100%; margin: 8pt 0; font-size: 9.5pt; page-break-inside: avoid; }
  th { background: #0f1b3d; color: #fff; text-align: left; padding: 5pt 6pt; }
  td { border-bottom: 1px solid #dfe3ec; padding: 5pt 6pt; vertical-align: top; }
  tr:nth-child(even) td { background: #f6f7fb; }
  figure { margin: 10pt 0; page-break-inside: avoid; text-align: center; }
  img { max-width: 100%; max-height: 120mm; border: 1px solid #dfe3ec; border-radius: 6pt; }
  figcaption { font-size: 9pt; color: #5b6478; margin-top: 3pt; }
  code { background: #eef0f5; padding: 0 3pt; border-radius: 3pt; font-size: 9.5pt; }
  .cover { border-left: 6pt solid #e8b94f; padding-left: 12pt; margin-bottom: 18pt; }
`;
const [first, ...rest] = md.split(/\n(?=## )/);
const html = `<!doctype html><html><head><meta charset="utf-8"><title>AI Accelerator Hub — The Simple Guide</title><style>${css}</style></head>
<body><div class="cover">${toHtml(first)}</div>${toHtml(rest.join('\n'))}</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent(html, { waitUntil: 'load' });
const target = join(web, 'public/help/AI_Accelerator_Hub_Simple_Guide.pdf');
await page.pdf({ path: target, format: 'A4', printBackground: true, displayHeaderFooter: true,
  headerTemplate: '<span></span>',
  footerTemplate: '<div style="font-size:8pt;color:#8a93a6;width:100%;text-align:center;">AI Accelerator Hub — The Simple Guide · page <span class="pageNumber"></span> of <span class="totalPages"></span></div>',
  margin: { top: '16mm', bottom: '18mm', left: '15mm', right: '15mm' } });
await browser.close();
copyFileSync(target, join(root, 'docs/help/AI_Accelerator_Hub_Simple_Guide.pdf'));
console.log('help: PDF written');
