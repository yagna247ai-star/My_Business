#!/usr/bin/env node
/**
 * Codemod: make interface text in the given .tsx files translatable.
 *  - Plain JSX text  →  <Tr>text</Tr>
 *  - aria-label / placeholder / title / alt="literal"  →  {t('literal')}, adding `const t = useT()` (client) or
 *    `const t = await getT()` (async server component) to the enclosing component when needed.
 * Usage: node scripts/i18n-wrap.mjs <file.tsx> …   (prints what changed; review the diff afterwards)
 */
import ts from 'typescript';
import { readFileSync, writeFileSync } from 'fs';

const ATTRS = new Set(['aria-label', 'placeholder', 'title', 'alt']);
const SKIP_TAGS = new Set(['code', 'pre', 'Tr', 'style', 'script', 'kbd', 'samp']);
const wordy = s => /[A-Za-z]{2,}/.test(s) && !/^[\s\d.,:;·•/+\-–—×%()#@&|*!?'"`]*$/.test(s);
const codey = s => /^[A-Z0-9_]{2,}$/.test(s.trim()) || /^[\w.-]+\.(csv|json|txt|xlsx|sql|md)$/i.test(s.trim()) || /^(XP|AI|CSV|SQL|KPI|JSON|IST|OK)$/.test(s.trim());
const esc = s => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

function tagName(el) {
  const open = ts.isJsxElement(el) ? el.openingElement : el;
  return open.tagName.getText();
}

for (const file of process.argv.slice(2)) {
  const src = readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const isClient = /^\s*['"]use client['"]/.test(src);
  const edits = []; // { start, end, text }
  const needT = new Set(); // function nodes needing t
  let usedTr = false;

  const enclosingComponent = node => {
    for (let n = node.parent; n; n = n.parent) {
      if ((ts.isFunctionDeclaration(n) || ts.isArrowFunction(n) || ts.isFunctionExpression(n)) && n.body && ts.isBlock(n.body)) {
        const name = ts.isFunctionDeclaration(n) ? n.name?.text : ts.isVariableDeclaration(n.parent) ? n.parent.name.getText() : '';
        if (name && /^[A-Z]/.test(name)) return n;
      }
    }
    return null;
  };

  const visit = node => {
    if (ts.isJsxElement(node) && SKIP_TAGS.has(tagName(node))) return;
    if (ts.isJsxText(node)) {
      const raw = node.getFullText();
      const core = raw.trim();
      if (core && wordy(core) && !codey(core)) {
        const lead = raw.slice(0, raw.indexOf(core)); const trail = raw.slice(raw.indexOf(core) + core.length);
        edits.push({ start: node.getFullStart(), end: node.getEnd(), text: `${lead}<Tr>${core.replace(/\s+/g, ' ')}</Tr>${trail}` });
        usedTr = true;
      }
    }
    // {cond ? 'Saving…' : 'Save'} and {ok && 'Done'} shown as text: wrap the string results.
    if (ts.isJsxExpression(node) && node.expression && (ts.isJsxElement(node.parent) || ts.isJsxFragment(node.parent))) {
      const results = e => ts.isConditionalExpression(e) ? [...results(e.whenTrue), ...results(e.whenFalse)]
        : ts.isBinaryExpression(e) && (e.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken || e.operatorToken.kind === ts.SyntaxKind.BarBarToken || e.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken) ? results(e.right).concat(e.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken ? [] : results(e.left))
        : ts.isParenthesizedExpression(e) ? results(e.expression) : [e];
      for (const r of results(node.expression)) if ((ts.isStringLiteral(r) || ts.isNoSubstitutionTemplateLiteral(r)) && wordy(r.text) && !codey(r.text) && !/[<>{}]/.test(r.text)) {
        edits.push({ start: r.getStart(), end: r.getEnd(), text: `<Tr>${r.text.replace(/\s+/g, ' ').trim().replace(/&/g, '&amp;')}</Tr>` });
        usedTr = true;
      }
    }
    if (ts.isJsxAttribute(node) && ATTRS.has(node.name.getText()) && node.initializer && ts.isStringLiteral(node.initializer)) {
      const v = node.initializer.text;
      const fn = enclosingComponent(node);
      if (wordy(v) && fn && (isClient || fn.modifiers?.some(m => m.kind === ts.SyntaxKind.AsyncKeyword))) {
        edits.push({ start: node.initializer.getStart(), end: node.initializer.getEnd(), text: `{t('${esc(v)}')}` });
        needT.add(fn);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);

  for (const fn of needT) {
    const body = fn.body.getText();
    if (/\bconst t = (await getT\(\)|useT\(\))/.test(body) || /\bconst \[[^\]]*\bt\b[^\]]*\] = await Promise\.all/.test(body) || /[{,;]\s*const t = useT\(\)|\bt = useT\(\)/.test(body)) continue;
    edits.push({ start: fn.body.getStart() + 1, end: fn.body.getStart() + 1, text: isClient ? '\n  const t = useT();' : '\n  const t = await getT();' });
  }
  if (!edits.length) { console.log(`= ${file}`); continue; }
  edits.sort((a, b) => b.start - a.start);
  let out = src;
  for (const e of edits) out = out.slice(0, e.start) + e.text + out.slice(e.end);

  const imports = [];
  if (usedTr && !/from '@\/components\/i18n\/Tr'/.test(out)) imports.push("import { Tr } from '@/components/i18n/Tr';");
  if (needT.size && isClient && !/\buseT\b[^\n]*from '@\/components\/i18n\/I18nProvider'/.test(out)) imports.push("import { useT } from '@/components/i18n/I18nProvider';");
  if (needT.size && !isClient && !/\bgetT\b[^\n]*from '@\/lib\/i18n\/server'/.test(out)) imports.push("import { getT } from '@/lib/i18n/server';");
  if (imports.length) {
    const m = [...out.matchAll(/^import [^\n]+;\n/gm)].pop();
    const at = m ? m.index + m[0].length : (isClient ? out.indexOf('\n') + 1 : 0);
    out = out.slice(0, at) + imports.join('\n') + '\n' + out.slice(at);
  }
  writeFileSync(file, out);
  console.log(`~ ${file}: ${edits.length} edits`);
}
