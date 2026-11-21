#!/usr/bin/env node
/** Codemod pass 3: displayed variables {x.label} → <Tv v={x.label} /> (translated when they are interface text). */
import ts from 'typescript';
import { readFileSync, writeFileSync } from 'fs';
const SKIP_TAGS = new Set(['code', 'pre', 'Tr', 'Tv', 'option', 'textarea', 'title', 'style', 'script', 'time', 'kbd']);
const SKIP_NAME = /^(children|t|tr|icon|Icon|I|n|i|j|k|idx|pos|count|total|xp|id|code|url|href|email|slug|at|date|when|value|v|key|size|width|height|score|avg|pct|percent|amount|level|attempt|attempts|max|min|rank|place|days|hours|minutes|streak|current|longest|freezes|rows|columns|file|name|first|user|learner|by|tenant|tenantName|cohort|length|xpEarned|xpTotal|earned|left|best)$/i;
const lastName = e => ts.isIdentifier(e) ? e.text : ts.isPropertyAccessExpression(e) ? e.name.text : '';
for (const file of process.argv.slice(2)) {
  const src = readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const edits = [];
  const visit = node => {
    if (ts.isJsxElement(node) && SKIP_TAGS.has(node.openingElement.tagName.getText())) return;
    if (ts.isJsxExpression(node) && node.expression && (ts.isJsxElement(node.parent) || ts.isJsxFragment(node.parent))) {
      const e = node.expression;
      if ((ts.isIdentifier(e) || ts.isPropertyAccessExpression(e)) && !SKIP_NAME.test(lastName(e)) && !/^[A-Z]/.test(lastName(e))) {
        edits.push({ start: node.getStart(), end: node.getEnd(), text: `<Tv v={${e.getText()}} />` });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  if (!edits.length) continue;
  edits.sort((a, b) => b.start - a.start);
  let out = src;
  for (const e of edits) out = out.slice(0, e.start) + e.text + out.slice(e.end);
  if (!/from '@\/components\/i18n\/Tv'/.test(out)) {
    const m = [...out.matchAll(/^import [^\n]+;\n/gm)].pop();
    const at = m ? m.index + m[0].length : 0;
    out = out.slice(0, at) + "import { Tv } from '@/components/i18n/Tv';\n" + out.slice(at);
  }
  writeFileSync(file, out);
  console.log(`~ ${file}: ${edits.length}`);
}
