/**
 * Area crowns (top 3 per area), global ranking and the final-fight bracket, with 15 demo learners in five areas.
 * Setup runs packages/db/prisma/demo-area-learners.ts against the local demo database.
 */
import { test, expect, type Page } from 'playwright/test';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';

const OUT = path.join(__dirname, 'proof', 'area-standings');
test.describe.configure({ mode: 'serial' });
test.setTimeout(5 * 60_000);

test.beforeAll(() => {
  const url = process.env.DEMO_DB_URL;
  if (!url) throw new Error('Set DEMO_DB_URL to the local demo database.');
  fs.mkdirSync(OUT, { recursive: true });
  execSync('npx tsx prisma/demo-area-learners.ts', { cwd: path.join(__dirname, '../../../packages/db'), env: { ...process.env, DATABASE_URL: url }, stdio: 'inherit' });
});

async function signIn(page: Page) {
  await page.context().addInitScript(() => { try { localStorage.setItem('aih_theme', 'sln'); } catch { /* ignore */ } });
  await page.goto('/login');
  await page.getByLabel('Email').fill('datalearner@aihub.in');
  await page.getByLabel('Password', { exact: true }).fill('Learner@12345');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/dashboard');
}
const shot = async (page: Page, name: string) => { await page.waitForLoadState('networkidle').catch(() => {}); await page.screenshot({ path: path.join(OUT, name), fullPage: true }); };

test('whole journey: top 3 crowns in each area, global ranking and bracket', async ({ page }) => {
  await signIn(page);
  await page.goto('/leaderboard/areas');
  await expect(page.getByRole('heading', { name: 'Area standings' })).toBeVisible({ timeout: 60_000 });
  for (const area of ['Bhagyanagar', 'Warangal', 'Vijayawada', 'Visakhapatnam', 'Tirupati']) {
    const card = page.getByRole('region', { name: `${area} top 3` });
    await expect(card).toBeVisible();
    expect(await card.locator('li').count()).toBeLessThanOrEqual(3);
  }
  // Bhagyanagar has 5 ranked learners (4 demo + the main learner when they have XP); only 3 get crowns.
  await expect(page.getByRole('region', { name: 'Bhagyanagar top 3' }).locator('li')).toHaveCount(3);
  await expect(page.getByRole('region', { name: 'Bhagyanagar top 3' }).getByText('👑 1st')).toBeVisible();
  await expect(page.getByRole('table', { name: 'Global ranking by points' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Final fight bracket' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Round 1' })).toBeVisible();
  await expect(page.getByText(/Champion:/)).toBeVisible();
  await shot(page, '01-area-crowns-whole-journey.png');
});

test('one level: crowns are per level', async ({ page }) => {
  await signIn(page);
  await page.goto('/leaderboard/areas?level=DA02_SQL');
  await expect(page.getByText(/Level 2 — /).first()).toBeVisible({ timeout: 60_000 });
  // Lakshmi (Warangal) approved 2 levels, so she is ranked at level 2 but not at level 3.
  await expect(page.getByRole('region', { name: 'Warangal top 3' }).getByText('Lakshmi Bai')).toBeVisible();
  await shot(page, '02-area-crowns-level-2.png');
  await page.goto('/leaderboard/areas?level=DA03_PYTHON_FUNDAMENTALS');
  await expect(page.getByRole('region', { name: 'Warangal top 3' }).getByText('Lakshmi Bai')).toHaveCount(0);
  await shot(page, '03-area-crowns-level-3.png');
});

test('a learner sets their area in settings', async ({ page }) => {
  await signIn(page);
  await page.goto('/settings/profile');
  const box = page.getByLabel('My area');
  await expect(box).toHaveValue('Bhagyanagar', { timeout: 60_000 });
  await box.fill('Warangal');
  const saved = page.waitForResponse(r => r.url().includes('/api/v1/settings') && r.request().method() === 'PATCH');
  await page.getByRole('button', { name: 'Save area' }).click();
  expect((await saved).status()).toBe(200);
  await page.reload();
  await expect(page.getByLabel('My area')).toHaveValue('Warangal');
  await shot(page, '04-settings-area-saved.png');
  // put it back for the other demos
  await page.getByLabel('My area').fill('Bhagyanagar');
  const back = page.waitForResponse(r => r.url().includes('/api/v1/settings') && r.request().method() === 'PATCH');
  await page.getByRole('button', { name: 'Save area' }).click();
  expect((await back).status()).toBe(200);
});
