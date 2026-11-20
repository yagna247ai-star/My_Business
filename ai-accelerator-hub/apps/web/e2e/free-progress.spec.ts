/**
 * Evidence run: interactive days, skipping, free progression, and the Module 2 Excel + SQL lab.
 * Day 1: tick the steps + upload a screenshot → Mark done (+points) → skip activities → skip the other days →
 * "Level complete: X of Y points" and Level 2 opens with no review → Module 2 days: CSV → Excel → KPIs → install a
 * database → DDL → load, check and query.
 * Screenshots: e2e/proof/free-progress/NN-name.png and index.html.
 *
 * Local only (never production):
 *   DATABASE_URL=<local db> BASE_URL=http://localhost:3100 npx playwright test e2e/free-progress.spec.ts
 */
import { test, expect, type Page } from 'playwright/test';
import path from 'path';
import fs from 'fs';
import { JOURNEY_SPECS } from '../lib/domain/daDomains/tracks';
import { buildDomainJourney } from '../lib/domain/daDomains/curriculum';

const OUT = path.join(__dirname, 'proof', 'free-progress');
const RUN = Date.now().toString(36);
const EMAIL = `e2e.free.${RUN}@example.test`;
const PASSWORD = 'Free-Learner-2026';
const shots: { file: string; caption: string }[] = [];
const easy = buildDomainJourney(JOURNEY_SPECS.find(s => s.slug === 'education-easy')!);
const L1 = easy.levels[0].code, L2 = easy.levels[1].code;
const IMAGE = path.join(OUT, '_learner-work.png'); // stands in for the learner's own screenshot of their work

async function shot(page: Page, name: string, caption: string, full = true) {
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  fs.mkdirSync(OUT, { recursive: true });
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: full });
  shots.push({ file: `${name}.png`, caption });
}

test.describe.configure({ mode: 'serial' });
test.afterAll(async () => {
  fs.rmSync(IMAGE, { force: true });
  const html = `<!doctype html><meta charset="utf-8"><title>Free progression and Module 2 lab — evidence</title><style>body{font:15px/1.5 system-ui,sans-serif;margin:24px;background:#f4f6f9}.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px}figure{margin:0;background:#fff;border:1px solid #dde;border-radius:10px;overflow:hidden}img{width:100%;height:220px;object-fit:cover;object-position:top;display:block}figcaption{padding:8px 10px;font-size:13px}</style>
<h1>Free progression and the Module 2 Excel + SQL lab — Playwright evidence</h1><p>${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC · ${shots.length} screenshots · local app and local database.</p>
<div class="g">${shots.map(s => `<figure><a href="${s.file}"><img src="${s.file}" alt=""></a><figcaption>${s.caption}</figcaption></figure>`).join('')}</div>`;
  fs.mkdirSync(OUT, { recursive: true }); fs.writeFileSync(path.join(OUT, 'index.html'), html);
});

test('Days with proof, skip anything, next level opens without review, Module 2 Excel + SQL lab', async ({ page, baseURL }) => {
  test.setTimeout(900_000);
  fs.mkdirSync(OUT, { recursive: true });

  // Register on the Easy track (API, as the sign-up form is covered by the tracks evidence run), then sign in.
  const reg = await page.request.post(`${baseURL}/api/v1/register`, { data: { name: 'Free Learner', email: EMAIL, password: PASSWORD, birthYear: 2001, journeySlug: 'da-education-easy', acceptTerms: true } });
  expect(reg.ok(), await reg.text()).toBeTruthy();
  await page.goto('/login');
  await page.getByLabel('Email').fill(EMAIL);
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL(u => !u.pathname.startsWith('/login'), { timeout: 120_000, waitUntil: 'commit' });

  // 1. Day 1: the steps are a checklist, with a screenshot upload, "Mark done" and "Skip".
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/levels');
  await page.screenshot({ path: IMAGE }); // a real 1280×720 image to upload
  await page.goto(`/levels/${L1}/days/1`);
  await expect(page.getByRole('heading', { name: 'Your work today' })).toBeVisible();
  await shot(page, '01-day-1-steps-to-tick', 'Day 1: every step is a checkbox, with a screenshot upload, “Mark Day 1 done” and “Skip this day”');
  for (const box of await page.getByRole('checkbox', { name: /^Step \d+$/ }).all()) await box.check();
  await page.getByLabel('Day screenshot').setInputFiles(IMAGE);
  await page.getByRole('button', { name: 'Mark Day 1 done' }).click();
  await expect(page.getByText(/Day 1 done · \+10 points/)).toBeVisible({ timeout: 60_000 });
  await shot(page, '02-day-1-done-points', 'Steps ticked and screenshot uploaded: Day 1 done, +10 points, next day one click away');

  // 2. Skip an activity in the level: it opens the next one and earns no points.
  await page.goto(`/levels/${L1}`);
  await page.getByRole('button', { name: 'Skip for now' }).click();
  await expect(page.getByText(/Skipped for now: no points/)).toBeVisible({ timeout: 60_000 });
  await shot(page, '03-activity-skipped', 'Skip for now: the next activity opens; the skipped one shows “Skipped” and can be done later for its points');
  for (let idx = 2; idx <= 6; idx++) { const r = await page.request.post(`${baseURL}/api/v1/levels/${L1}/skip`, { data: { idx } }); expect(r.ok(), await r.text()).toBeTruthy(); }

  // 3. Skip a day from its page, then the rest by API.
  await page.goto(`/levels/${L1}/days/2`);
  await page.getByRole('button', { name: 'Skip this day' }).click();
  await expect(page.getByText(/Day 2 skipped/)).toBeVisible({ timeout: 60_000 });
  await shot(page, '04-day-2-skipped', 'Skip this day: no points now, the learner keeps going and can finish it later');
  for (const day of [3, 4]) { const r = await page.request.post(`${baseURL}/api/v1/levels/${L1}/days/${day}`, { data: { action: 'skip' } }); expect(r.ok(), await r.text()).toBeTruthy(); }
  const last = await page.request.post(`${baseURL}/api/v1/levels/${L1}/days/5`, { data: { action: 'skip' } });
  const lastJson = await last.json();
  expect(lastJson.advanced?.next).toBe(L2);

  // 4. Level complete: points out of total, and Level 2 is open with no review.
  await page.goto(`/levels/${L1}`);
  await expect(page.getByText('Level complete.')).toBeVisible();
  await expect(page.getByText(/You earned \d+ of \d+ points in this level/)).toBeVisible();
  await shot(page, '05-level-complete-points', 'Level complete: “You earned X of Y points… Level 2 is open. Skipped steps earned no points; you can go back and finish them”');
  await page.goto('/levels');
  await expect(page.getByText(/After Level 2 is complete/)).toBeVisible();
  await shot(page, '06-journey-level-2-open', 'Journey map: Level 2 open without waiting for review; later levels say “After Level N is complete”');

  // 5. Module 2 lab days.
  const lab: [number, RegExp, string, string][] = [
    [6, /Plan your data/, '07-day-6-json-and-text', 'Day 6: plan the data; two AI prompts for the JSON and text files'],
    [7, /Create the CSV file and open it in Excel/, '08-day-7-csv-to-excel', 'Day 7: create the CSV (Notepad / TextEdit, UTF-8), load it with Data → From Text/CSV, name the table'],
    [8, /Excel: calculate every KPI/, '09-day-8-excel-kpis-daily-why', 'Day 8: tested formulas for each KPI, the per-day sheet (COUNTIFS / AVERAGEIFS) and functions to find out why'],
    [9, /Install a SQL database/, '10-day-9-install-db-ddl', 'Day 9: choose MySQL, PostgreSQL, SQLite or PGlite; install, check the version, create the database, DDL'],
    [10, /Load the CSV into SQL/, '11-day-10-load-check-query', 'Day 10: load the CSV, check counts and problems, keep clean rows, KPI and per-day queries that match Excel'],
  ];
  for (const [day, title, name, caption] of lab) {
    await page.goto(`/levels/${L2}/days/${day}`);
    await expect(page.getByRole('heading', { name: title }).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Your work today' })).toBeVisible();
    await shot(page, name, caption);
  }
});
