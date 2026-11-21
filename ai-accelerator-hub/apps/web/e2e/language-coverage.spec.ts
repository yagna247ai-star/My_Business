/**
 * Language coverage: every learner page, in every language, shows no untranslated interface text.
 *
 * Run with the AI chain pointed at a pseudo-translator that marks every machine translation with "ᐅ" (local only),
 * after `npm run i18n:fill`. A visible text that exactly equals an English string written in the learner code,
 * with no marker and no reviewed translation, is interface text that bypassed translation: the test lists it.
 * Lesson content, names and numbers come from the database, not the code, so they are not counted.
 *
 *   AI_PROVIDER_CHAIN=custom AI_API_KEY=x AI_BASE_URL=http://127.0.0.1:3999/v1 (dev server and i18n:fill)
 *   DATABASE_URL=<local db> BASE_URL=http://localhost:3100 npx playwright test e2e/language-coverage.spec.ts
 */
import { test, expect, type Page } from 'playwright/test';
import fs from 'fs';
import path from 'path';
import ts from 'typescript';
import { JOURNEY_SPECS } from '../lib/domain/daDomains/tracks';
import { buildDomainJourney } from '../lib/domain/daDomains/curriculum';

const WEB = path.join(__dirname, '..');
const OUT = path.join(__dirname, 'proof', 'language-coverage');
const LEARNER_SRC = ['app/(app)/dashboard', 'app/(app)/levels', 'app/(app)/onboarding', 'app/(app)/agent-lab', 'app/(app)/hackathons', 'app/(app)/achievements', 'app/(app)/ranks', 'app/(app)/leaderboard', 'app/(app)/feed', 'app/(app)/showcase', 'app/(app)/library', 'app/(app)/coach', 'app/(app)/career', 'app/(app)/billing', 'app/(app)/settings/page.tsx', 'app/(app)/settings/profile', 'app/(auth)', 'components/learn', 'components/account', 'components/feed', 'components/hackathon', 'components/talent/CareerPanels.tsx', 'components/auth', 'components/app', 'lib/domain/levelFlowRules.ts'];
const LANGS = ['te', 'hi', 'ta', 'kn', 'ml'] as const;
const RUN = Date.now().toString(36);
const EMAIL = `e2e.cover.${RUN}@example.test`;
const PASSWORD = 'Cover-Learner-2026';
const easy = buildDomainJourney(JOURNEY_SPECS.find(s => s.slug === 'education-easy')!);
const [L1, L2] = [easy.levels[0].code, easy.levels[1].code];
const PAGES = ['/dashboard', '/levels', `/levels/${L1}`, `/levels/${L1}/days/1`, `/levels/${L2}`, `/levels/${L2}/days/9`, '/onboarding', '/agent-lab', '/hackathons', '/achievements', '/ranks', '/leaderboard', '/leaderboard/areas', '/feed', '/showcase', '/library', '/coach', '/career', '/billing', '/settings', '/settings/profile'];
const KEEP = /^(XP|AI|CSV|SQL|KPI|JSON|IST|OK|Boss|Excel|Power BI|Databricks|GitHub|macOS|Windows|Linux|AI Accelerator|HUB|AI Accelerator Hub|SLN|Learn AI\. Build Solutions\. Become Future-Ready\.)$/;

/** Every English string written in the learner code (JSX text, string literals, template text). */
function englishLiterals(): Set<string> {
  const out = new Set<string>();
  const walk = (p: string): string[] => { const f = path.join(WEB, p); return fs.statSync(f).isDirectory() ? fs.readdirSync(f).flatMap(x => walk(path.join(p, x))) : /\.tsx?$/.test(p) ? [p] : []; };
  for (const file of LEARNER_SRC.flatMap(walk)) {
    const sf = ts.createSourceFile(file, fs.readFileSync(path.join(WEB, file), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const add = (s: string) => { const v = s.replace(/\s+/g, ' ').trim(); if (/[A-Za-z]{2,}/.test(v) && / /.test(v) && !/^[a-z0-9-]+( [a-z0-9-]+)*$/.test(v) && !KEEP.test(v)) out.add(v); };
    const visit = (n: ts.Node): void => {
      if (ts.isImportDeclaration(n)) return;
      if (ts.isJsxText(n) || ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) add(n.text);
      if (ts.isTemplateExpression(n)) { add(n.head.text); n.templateSpans.forEach(s => add(s.literal.text)); }
      ts.forEachChild(n, visit);
    };
    visit(sf);
  }
  return out;
}

async function visibleTexts(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const out: string[] = [];
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      const el = n.parentElement; if (!el || el.closest('code,pre,script,style,[aria-hidden="true"],.sr-only,nextjs-portal')) continue;
      const s = (n.textContent || '').replace(/\s+/g, ' ').trim(); if (!s) continue;
      const r = el.getBoundingClientRect(); if (r.width === 0 && r.height === 0) continue;
      out.push(s);
    }
    for (const el of Array.from(document.querySelectorAll('[aria-label],[placeholder],[title],img[alt]'))) for (const a of ['aria-label', 'placeholder', 'title', 'alt']) { const v = el.getAttribute(a); if (v) out.push(v.trim()); }
    return out;
  });
}

test.describe.configure({ mode: 'serial' });
test('every learner page, in every language, has no untranslated interface text', async ({ page, baseURL }) => {
  test.setTimeout(1_800_000);
  const english = englishLiterals();
  const leaks: Record<string, string[]> = {};
  const check = async (lang: string, url: string) => {
    await page.goto(url, { waitUntil: 'load' });
    await page.waitForTimeout(400); // client components settle (the dev server never goes network-idle)
    const bad = [...new Set((await visibleTexts(page)).filter(s => english.has(s)))];
    if (bad.length) leaks[`${lang} ${url}`] = bad;
    fs.mkdirSync(OUT, { recursive: true }); fs.writeFileSync(path.join(OUT, 'leaks.json'), JSON.stringify(leaks, null, 1));
  };

  // Signed out pages, in each language.
  for (const lang of LANGS) {
    await page.context().addCookies([{ name: 'aih_lang', value: lang, url: baseURL! }]);
    for (const url of ['/login', '/register']) await check(lang, url);
  }

  // A learner with Level 2 open (Level 1 skipped through), then every learner page in each language.
  const reg = await page.request.post(`${baseURL}/api/v1/register`, { data: { name: 'Cover Learner', email: EMAIL, password: PASSWORD, birthYear: 2001, journeySlug: 'da-education-easy', acceptTerms: true } });
  expect(reg.ok(), await reg.text()).toBeTruthy();
  await page.goto('/login');
  await page.locator('#email').fill(EMAIL); await page.locator('#password').fill(PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(u => !u.pathname.startsWith('/login'), { timeout: 120_000, waitUntil: 'commit' });
  for (let idx = 1; idx <= 6; idx++) await page.request.post(`${baseURL}/api/v1/levels/${L1}/skip`, { data: { idx } });
  for (let day = 1; day <= 5; day++) await page.request.post(`${baseURL}/api/v1/levels/${L1}/days/${day}`, { data: { action: 'skip' } });

  for (const lang of LANGS) {
    expect((await page.request.patch(`${baseURL}/api/v1/settings`, { data: { preferredLanguage: lang } })).ok()).toBeTruthy();
    // Machine-translate the activities and two lessons once, as a learner would with "Read in …".
    for (const code of [L1, L2]) expect((await page.request.post(`${baseURL}/api/v1/levels/${code}/translate`, { data: {} })).ok()).toBeTruthy();
    for (const [code, day] of [[L1, 1], [L2, 9]] as const) expect((await page.request.post(`${baseURL}/api/v1/levels/${code}/days/${day}/translate`, { data: {} })).ok()).toBeTruthy();
    for (const url of PAGES) await check(lang, url);
    if (lang === 'te') for (const [i, url] of [`/levels/${L1}`, `/levels/${L2}/days/9`, '/achievements'].entries()) {
      await page.goto(url); fs.mkdirSync(OUT, { recursive: true });
      await page.screenshot({ path: path.join(OUT, `0${i + 1}-${url.replace(/\W+/g, '-').replace(/^-|-$/g, '')}-te.png`), fullPage: true });
    }
  }
  await page.request.patch(`${baseURL}/api/v1/settings`, { data: { preferredLanguage: 'en' } });
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'leaks.json'), JSON.stringify(leaks, null, 1));
  const total = Object.values(leaks).reduce((n, x) => n + x.length, 0);
  expect(total, `Untranslated interface text (see e2e/proof/language-coverage/leaks.json):\n${Object.entries(leaks).slice(0, 12).map(([k, v]) => `${k}: ${v.slice(0, 8).join(' | ')}`).join('\n')}`).toBe(0);
});
