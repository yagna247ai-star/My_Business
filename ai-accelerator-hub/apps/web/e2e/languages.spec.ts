/**
 * Evidence run: the whole site follows the chosen language.
 * Sign-in page switcher → Telugu sign-in → learner saves Telugu in Settings → menu, dashboard, journey, level and
 * day pages in Telugu → "Read in తెలుగు" translates the lesson (code stays English) → every other language too.
 * Screenshots: e2e/proof/languages/NN-name.png and index.html.
 *
 * Local only. For the lesson translation step, point the AI chain at any OpenAI-compatible endpoint, e.g.
 *   AI_PROVIDER_CHAIN=custom AI_API_KEY=… AI_BASE_URL=…/v1
 */
import { test, expect, type Page } from 'playwright/test';
import path from 'path';
import fs from 'fs';
import { JOURNEY_SPECS } from '../lib/domain/daDomains/tracks';
import { buildDomainJourney } from '../lib/domain/daDomains/curriculum';

const OUT = path.join(__dirname, 'proof', 'languages');
const RUN = Date.now().toString(36);
const EMAIL = `e2e.lang.${RUN}@example.test`;
const PASSWORD = 'Lang-Learner-2026';
const shots: { file: string; caption: string }[] = [];
const L1 = buildDomainJourney(JOURNEY_SPECS.find(s => s.slug === 'education-easy')!).levels[0].code;

async function shot(page: Page, name: string, caption: string) {
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  fs.mkdirSync(OUT, { recursive: true });
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true });
  shots.push({ file: `${name}.png`, caption });
}
const setLanguage = async (page: Page, baseURL: string | undefined, lang: string) => {
  const r = await page.request.patch(`${baseURL}/api/v1/settings`, { data: { preferredLanguage: lang } });
  expect(r.ok(), await r.text()).toBeTruthy();
};

test.describe.configure({ mode: 'serial' });
test.afterAll(async () => {
  const html = `<!doctype html><meta charset="utf-8"><title>Languages — evidence</title><style>body{font:15px/1.5 system-ui,sans-serif;margin:24px;background:#f4f6f9}.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px}figure{margin:0;background:#fff;border:1px solid #dde;border-radius:10px;overflow:hidden}img{width:100%;height:220px;object-fit:cover;object-position:top;display:block}figcaption{padding:8px 10px;font-size:13px}</style>
<h1>Site languages — Playwright evidence</h1><p>${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC · ${shots.length} screenshots · local app and local database.</p>
<div class="g">${shots.map(s => `<figure><a href="${s.file}"><img src="${s.file}" alt=""></a><figcaption>${s.caption}</figcaption></figure>`).join('')}</div>`;
  fs.mkdirSync(OUT, { recursive: true }); fs.writeFileSync(path.join(OUT, 'index.html'), html);
});

test('The whole learner site follows the chosen language', async ({ page, baseURL }) => {
  test.setTimeout(900_000);
  await page.setViewportSize({ width: 1280, height: 800 });

  // 1. Signed out: the sign-in page has a language picker.
  await page.goto('/login');
  await page.getByRole('combobox', { name: 'Language' }).selectOption('te');
  await expect(page.getByRole('heading', { name: 'సైన్ ఇన్' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'te');
  await shot(page, '01-signin-telugu', 'Sign-in page: language picker; the page switches to Telugu (<html lang="te">)');

  // 2. A learner signs in and saves Telugu in Settings → Profile.
  const reg = await page.request.post(`${baseURL}/api/v1/register`, { data: { name: 'Lang Learner', email: EMAIL, password: PASSWORD, birthYear: 2001, journeySlug: 'da-education-easy', acceptTerms: true } });
  expect(reg.ok(), await reg.text()).toBeTruthy();
  await page.locator('#email').fill(EMAIL);
  await page.locator('#password').fill(PASSWORD);
  await page.getByRole('button', { name: 'సైన్ ఇన్' }).click();
  await page.waitForURL(u => !u.pathname.startsWith('/login'), { timeout: 120_000, waitUntil: 'commit' });
  await setLanguage(page, baseURL, 'te');

  // 3. Every learner page in Telugu.
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: /తిరిగి స్వాగతం/ })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'ప్రయాణం' })).toBeVisible();
  await shot(page, '02-dashboard-telugu', 'Dashboard and side menu in Telugu after saving తెలుగు in Settings');
  await page.goto('/levels');
  await expect(page.getByText('మీ ప్రయాణం')).toBeVisible();
  await shot(page, '03-journey-telugu', 'Journey map in Telugu (level titles are lesson content: see “Read in తెలుగు” on day pages)');
  await page.goto(`/levels/${L1}`);
  await expect(page.getByText('స్థాయి వివరాలు')).toBeVisible();
  await shot(page, '04-level-telugu', 'Level page: activity tabs, Skip, Level facts in Telugu');
  await page.goto(`/levels/${L1}/days/1`);
  await expect(page.getByRole('heading', { name: 'ఈరోజు మీ పని' })).toBeVisible();
  await shot(page, '05-day-telugu-before-translate', 'Day page in Telugu; the lesson itself is English until “Read in తెలుగు”');

  // 4. Lesson translation (through the AI chain; code stays English), cached for the next reader.
  await page.getByRole('button', { name: 'తెలుగులో చదవండి' }).click();
  await expect(page.getByText('యంత్ర అనువాదం.')).toBeVisible({ timeout: 120_000 });
  await expect(page.getByRole('heading', { name: 'లక్ష్యం' })).toBeVisible();
  await shot(page, '06-day-lesson-translated', 'Lesson translated through the AI chain and cached; link back to the English original');
  await page.getByRole('link', { name: 'ఆంగ్ల మూలం చూపించు' }).click();
  await expect(page.getByRole('heading', { name: 'Goal' })).toBeVisible();

  // 5. The other languages switch the same way.
  const checks: [string, string, string][] = [['hi', 'यात्रा', 'आपकी यात्रा'], ['ta', 'பயணம்', 'உங்கள் பயணம்'], ['kn', 'ಪಯಣ', 'ನಿಮ್ಮ ಪಯಣ'], ['ml', 'യാത്ര', 'നിങ്ങളുടെ യാത്ര'], ['en', 'Journey', 'Your journey']];
  for (const [lang, nav, eyebrow] of checks) {
    await setLanguage(page, baseURL, lang);
    await page.goto('/levels');
    await expect(page.locator('html')).toHaveAttribute('lang', lang);
    await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: nav, exact: true })).toBeVisible();
    await expect(page.getByText(eyebrow)).toBeVisible();
    if (lang !== 'en') await shot(page, `07-journey-${lang}`, `Journey page in ${lang}`);
  }
});
