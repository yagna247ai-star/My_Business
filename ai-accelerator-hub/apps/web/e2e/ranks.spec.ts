/**
 * Ranks page (redesign-v3 design): City / State / Everyone tabs, your standing, next place up,
 * top-3 podium with the crown, ranked list with movement and badges. Real XP from the local demo database.
 */
import { test, expect, type Page } from 'playwright/test';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';

const OUT = path.join(__dirname, 'proof', 'ranks');
test.describe.configure({ mode: 'serial' });
test.setTimeout(6 * 60_000);

test.beforeAll(async ({ request }) => {
  test.setTimeout(8 * 60_000);
  const url = process.env.DEMO_DB_URL;
  if (!url) throw new Error('Set DEMO_DB_URL to the local demo database.');
  fs.mkdirSync(OUT, { recursive: true });
  execSync('npx tsx prisma/demo-area-learners.ts', { cwd: path.join(__dirname, '../../../packages/db'), env: { ...process.env, DATABASE_URL: url }, stdio: 'inherit' });
  for (const p of ['/login', '/dashboard', '/ranks']) await request.get(p, { timeout: 180_000, maxRedirects: 0 }).catch(() => {});
});

async function signIn(page: Page, email: string) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill('Learner@12345');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/dashboard', { timeout: 120_000 });
}
const shot = async (page: Page, name: string) => { await page.waitForLoadState('networkidle').catch(() => {}); await page.screenshot({ path: path.join(OUT, name), fullPage: true }); };

test('City tab: Hyderabad board with standing, next place, podium and list', async ({ page }) => {
  await signIn(page, 'datalearner@aihub.in');
  await page.getByRole('link', { name: 'Ranks', exact: true }).first().click();
  await expect(page.getByRole('heading', { name: 'Ranks', level: 1 })).toBeVisible({ timeout: 60_000 });
  await expect(page.getByRole('heading', { name: 'Top of Hyderabad' })).toBeVisible();
  await expect(page.getByRole('link', { name: /City\s*Hyderabad/ })).toHaveAttribute('aria-current', 'page');

  const standing = page.getByRole('region', { name: 'Your standing' });
  await expect(standing).toContainText('Your standing · Hyderabad');
  await expect(standing).toContainText(/Top \d+%/);
  await expect(standing).toContainText(/You are #\d+ of \d+ in Hyderabad\./);

  const podium = page.getByLabel('Top three');
  await expect(podium.locator('.rk-pod')).toHaveCount(3);
  await expect(podium.getByRole('img', { name: 'First place' })).toBeVisible();

  const list = page.getByRole('list', { name: 'Ranks 4 and below' });
  expect(await list.locator('li').count()).toBeGreaterThanOrEqual(7);
  await expect(list.locator('.rk-move.up').first()).toBeVisible();      // learners with recent XP moved up
  await expect(page.getByText(/First \d+ of \d+ members\./)).toBeVisible();
  // only Hyderabad learners on the city board
  for (const area of await list.locator('.rk-who .xs').allTextContents()) expect(area).toMatch(/^Hyderabad ·/);
  await shot(page, '01-city-hyderabad.png');
});

test('State tab: Telangana, and the hackathon tab: everyone', async ({ page }) => {
  await signIn(page, 'datalearner@aihub.in');
  await page.goto('/ranks');
  await page.getByRole('link', { name: /State\s*Telangana/ }).click();
  await expect(page.getByRole('heading', { name: 'Top of Telangana' })).toBeVisible({ timeout: 60_000 });
  await shot(page, '02-state-telangana.png');

  await page.getByRole('link', { name: /The hackathon\s*Everyone/ }).click();
  await expect(page.getByRole('heading', { name: 'Top of everyone' })).toBeVisible({ timeout: 60_000 });
  await expect(page.getByRole('region', { name: 'Your standing' })).toContainText('overall');
  const areas = (await page.getByRole('list', { name: 'Ranks 4 and below' }).locator('.rk-who .xs').allTextContents()).map(a => a.split(' · ')[0]);
  expect(new Set(areas).size).toBeGreaterThan(1); // everyone, from many cities
  await shot(page, '03-hackathon-everyone.png');
});

test('A small city is ranked at state level (Pune → Maharashtra)', async ({ page }) => {
  await signIn(page, 'omkar.joshi@demo.aihub.in');
  await page.goto('/ranks');
  await expect(page.getByRole('heading', { name: 'Top of Maharashtra' })).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText('Pune has fewer than 10 ranked learners, so you are ranked across Maharashtra.')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Next place up' })).toContainText('points to go');
  await shot(page, '04-small-city-state-level.png');
});

test('Phone width: the page stacks and does not scroll sideways', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page, 'datalearner@aihub.in');
  await page.goto('/ranks');
  await expect(page.getByRole('heading', { name: 'Top of Hyderabad' })).toBeVisible({ timeout: 60_000 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  await shot(page, '05-phone.png');
});
