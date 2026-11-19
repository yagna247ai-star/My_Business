/** Stuck helper on a level page: asks what you tried first; with no Gemini key it says so instead of guessing. */
import { test, expect } from 'playwright/test';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';

const OUT = path.join(__dirname, 'proof', 'stuck-helper');
test.setTimeout(5 * 60_000);

test.beforeAll(() => {
  const url = process.env.DEMO_DB_URL;
  if (!url) throw new Error('Set DEMO_DB_URL to the local demo database.');
  fs.mkdirSync(OUT, { recursive: true });
  const env = { ...process.env, DATABASE_URL: url };
  const cwd = path.join(__dirname, '../../../packages/db');
  execSync('npx tsx prisma/demo-data-analytics-learner.ts', { cwd, env, stdio: 'inherit' });
  execSync('npx tsx prisma/reset-demo-journey.ts', { cwd, env, stdio: 'inherit' });
});

// Compile the helper route once before the timed steps (dev mode compiles on first use).
test.beforeAll(async ({ request }) => {
  test.setTimeout(5 * 60_000);
  await request.get('/api/v1/levels/DA02_SQL/stuck', { timeout: 180_000 }).catch(() => {});
});

test('ask what was tried, then an honest fallback without a model key', async ({ page, context }) => {
  await context.addInitScript(() => { try { localStorage.setItem('aih_theme', 'sln'); } catch { /* ignore */ } });
  await page.goto('/login');
  await page.getByLabel('Email').fill('datalearner@aihub.in');
  await page.getByLabel('Password', { exact: true }).fill('Learner@12345');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/dashboard');
  await page.goto('/levels/DA02_SQL');
  await page.getByRole('button', { name: 'Stuck? Get a hint' }).click({ timeout: 60_000 });
  const panel = page.getByRole('region', { name: 'Stuck helper' });
  await panel.getByLabel('What are you stuck on?').fill('How do I keep only branches whose total is above 1 lakh?');
  await panel.getByRole('button', { name: 'Get a hint' }).click();
  await expect(panel.getByRole('status')).toContainText('what have you tried', { ignoreCase: true, timeout: 60_000 });
  await page.screenshot({ path: path.join(OUT, '01-asks-what-you-tried.png'), fullPage: true });

  await panel.getByLabel('What have you tried?').fill('I wrote WHERE SUM(amount) > 100000 and got an error.');
  await panel.getByRole('button', { name: 'Get a hint' }).click();
  await expect(panel.getByRole('status')).toContainText(process.env.GEMINI_API_KEY ? '' : 'will not guess', { timeout: 60_000 });
  await page.screenshot({ path: path.join(OUT, '02-fallback-no-key.png'), fullPage: true });
});
