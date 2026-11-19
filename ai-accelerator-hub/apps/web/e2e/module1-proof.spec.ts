/**
 * Module 1 proof: the module page, each of its six activities, and Days 1–4, with screenshots.
 * Signs in as the demo learner (packages/db/prisma/demo-data-analytics-learner.ts).
 */
import { test, expect } from 'playwright/test';
import path from 'path';

const OUT = path.join(__dirname, 'proof', 'module1');
test.setTimeout(10 * 60_000);

test('Module 1: module page, six activities, days 1–4', async ({ page, context }) => {
  await context.addInitScript(() => { try { localStorage.setItem('aih_theme', 'sln'); } catch { /* ignore */ } });
  await page.goto('/login');
  await page.getByLabel('Email').fill('datalearner@aihub.in');
  await page.getByLabel('Password', { exact: true }).fill('Learner@12345');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/dashboard');

  await page.goto('/levels/DA01_FUNDAMENTALS');
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.screenshot({ path: path.join(OUT, '00-module1-page.png'), fullPage: true });

  for (let a = 1; a <= 6; a++) {
    await page.goto(`/levels/DA01_FUNDAMENTALS?a=${a}`);
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.screenshot({ path: path.join(OUT, `activity-${a}.png`), fullPage: true });
  }

  for (let day = 1; day <= 4; day++) {
    await page.goto(`/levels/DA01_FUNDAMENTALS/days/${day}`);
    await expect(page.getByText(`Day ${day} of 45`)).toBeVisible({ timeout: 60_000 });
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.screenshot({ path: path.join(OUT, `day-${String(day).padStart(2, '0')}.png`), fullPage: true });
  }
});
