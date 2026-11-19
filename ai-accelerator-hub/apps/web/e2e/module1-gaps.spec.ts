/**
 * Module 1 with gaps: the boss is answered wrongly, so the automated review asks for changes.
 * The learner sees each gap highlighted with the points a fix earns, and keeps the XP already earned.
 */
import { test, expect, type Page } from 'playwright/test';
import path from 'path';
import { execSync } from 'child_process';

const OUT = path.join(__dirname, 'proof', 'module1-gaps');
test.setTimeout(10 * 60_000);

test.beforeAll(() => {
  const url = process.env.DEMO_DB_URL;
  if (!url) throw new Error('Set DEMO_DB_URL to the local demo database, e.g. file:/path/local.db');
  execSync('npx tsx prisma/reset-demo-module1.ts', { cwd: path.join(__dirname, '../../../packages/db'), env: { ...process.env, DATABASE_URL: url }, stdio: 'inherit' });
});

async function snap(page: Page, name: string) {
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true });
}

test('a wrong boss gets highlighted gaps with points, not a dead end', async ({ page, context }) => {
  await context.addInitScript(() => { try { localStorage.setItem('aih_theme', 'sln'); } catch { /* ignore */ } });
  await page.goto('/login');
  await page.getByLabel('Email').fill('datalearner@aihub.in');
  await page.getByLabel('Password', { exact: true }).fill('Learner@12345');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/dashboard');
  await page.goto('/levels/DA01_FUNDAMENTALS');

  await page.locator('input[type=radio]').nth(1).click({ force: true });
  await page.getByRole('button', { name: 'Mark briefing complete' }).click();
  await expect(page.getByText('Mission briefing complete')).toBeVisible({ timeout: 30_000 });
  const answers = [0, 1, 2, 2, 1];
  for (let q = 0; q < 5; q++) await page.locator('input[type=radio]').nth(q * 4 + answers[q]).click({ force: true });
  await page.getByRole('button', { name: 'Submit answers' }).click();
  await expect(page.getByText(/Quiz passed/)).toBeVisible({ timeout: 30_000 });
  await page.locator('input[type=checkbox]').first().click({ force: true });
  for (const [q, a] of [[0, 0], [1, 2], [2, 0]]) await page.locator('input[type=radio]').nth(q * 4 + a).click({ force: true });
  await page.getByRole('button', { name: 'Check answers' }).click();
  await expect(page.getByText(/Explore complete/)).toBeVisible({ timeout: 30_000 });

  const long = (s: string) => `${s} ` + 'This part is written in full so the minimum word count is met for the demo run of the build step. '.repeat(4);
  const boxes = page.locator('textarea');
  for (const s of ['Question', 'Sources', 'Lifecycle', 'Limits']) await boxes.nth(['Question', 'Sources', 'Lifecycle', 'Limits'].indexOf(s)).fill(long(s));
  await page.locator('select').first().selectOption({ label: 'Excel' });
  await page.getByRole('button', { name: 'Save my brief' }).click();
  await expect(page.getByText(/68 of 120/)).toBeVisible({ timeout: 30_000 });

  await page.locator('input[type=url]').first().fill('https://example.com/demo-module1-brief');
  await page.locator('textarea').first().fill(long('Reflection on the work.'));
  for (const box of await page.locator('input[type=checkbox]').all()) await box.click({ force: true });
  await page.getByRole('button', { name: 'Submit for review' }).click();
  await page.waitForResponse(r => r.url().includes('/proof') && r.request().method() === 'POST');

  // Boss answered wrongly on purpose: "Accept the first answer" for every situation.
  await page.goto('/levels/DA01_FUNDAMENTALS?a=6');
  await expect(page.getByRole('button', { name: 'Run the trial' })).toBeVisible({ timeout: 30_000 });
  for (let s = 0; s < 4; s++) await page.locator('input[type=radio]').nth(s * 3 + 2).click({ force: true });
  for (let s = 0; s < 4; s++) await page.getByLabel(`Reason for scenario ${s + 1}`).fill('I would just trust the first number I am given.', { timeout: 15_000 });
  const ran = page.waitForResponse(r => r.url().includes('/boss') && r.request().method() === 'POST');
  await page.getByRole('button', { name: 'Run the trial' }).click();
  expect((await ran).status()).toBe(200);

  // The automated review asks for changes at once, with highlighted gaps and points.
  await page.goto('/levels/DA01_FUNDAMENTALS?a=5');
  await expect(page.getByText(/Almost there/)).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText('+5 pts')).toBeVisible();
  await expect(page.getByText(/You keep all the XP/)).toBeVisible();
  await snap(page, '01-gaps-highlighted-with-points');
});
