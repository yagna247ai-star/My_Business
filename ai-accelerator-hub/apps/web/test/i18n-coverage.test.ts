/**
 * Pure: every learner-facing page and component sends its interface text through translation, and the list of
 * interface texts (lib/i18n/keys.generated.ts) is up to date. A new English label that bypasses <Tr> / t() fails here.
 */
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import ts from 'typescript';
import { describe, it, expect } from 'vitest';
import { allKeys } from '../scripts/i18n-extract.mjs';
import { UI_KEYS } from '../lib/i18n/keys.generated';

const WEB = join(__dirname, '..');
const LEARNER = [
  'app/(app)/dashboard', 'app/(app)/levels', 'app/(app)/onboarding', 'app/(app)/agent-lab', 'app/(app)/hackathons', 'app/(app)/achievements',
  'app/(app)/ranks', 'app/(app)/leaderboard', 'app/(app)/feed', 'app/(app)/showcase', 'app/(app)/library', 'app/(app)/coach', 'app/(app)/career',
  'app/(app)/billing', 'app/(app)/settings/page.tsx', 'app/(app)/settings/profile', 'app/(auth)',
  'components/learn', 'components/account', 'components/feed', 'components/hackathon', 'components/talent/CareerPanels.tsx', 'components/auth', 'components/app',
];
const files = (p: string): string[] => { const f = join(WEB, p); return statSync(f).isDirectory() ? readdirSync(f).flatMap(x => files(join(p, x))) : /\.tsx$/.test(p) ? [p] : []; };
const SKIP_TAGS = new Set(['code', 'pre', 'Tr', 'style', 'script', 'kbd', 'samp']);
const wordy = (s: string) => /[A-Za-z]{2,}/.test(s);
// Product names, units and codes that stay the same in every language.
const ALLOWED = /^(XP|AI|CSV|SQL|KPI|JSON|IST|OK|macOS|Windows|Linux|GitHub|AI Accelerator|HUB|AI Accelerator Hub|Learn AI\. Build Solutions\. Become Future-Ready\.|L\d+|[A-Z0-9_]{2,}|v\d.*|[\w.-]+\.(csv|json|txt|xlsx|sql|md))$/;

function untranslated(file: string): string[] {
  const src = readFileSync(join(WEB, file), 'utf8');
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const out: string[] = [];
  const tag = (el: ts.JsxElement) => el.openingElement.tagName.getText();
  const visit = (n: ts.Node): void => {
    if (ts.isJsxElement(n) && SKIP_TAGS.has(tag(n))) return;
    if (ts.isJsxText(n)) { const t = n.getText().trim(); if (t && wordy(t) && !ALLOWED.test(t)) out.push(`text "${t.slice(0, 60)}"`); }
    if (ts.isJsxAttribute(n) && ['aria-label', 'placeholder', 'title', 'alt'].includes(n.name.getText()) && n.initializer && ts.isStringLiteral(n.initializer) && wordy(n.initializer.text) && !ALLOWED.test(n.initializer.text)) out.push(`${n.name.getText()}="${n.initializer.text.slice(0, 60)}"`);
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return out;
}

describe('translation coverage', () => {
  it('learner pages and components have no interface text outside <Tr> / t()', () => {
    const problems = LEARNER.flatMap(files).flatMap(f => untranslated(f).map(x => `${f}: ${x}`));
    expect(problems, problems.slice(0, 30).join('\n')).toEqual([]);
  });
  it('the list of interface texts is up to date (run: node scripts/i18n-extract.mjs)', () => {
    expect(UI_KEYS).toEqual(allKeys());
  });
});
