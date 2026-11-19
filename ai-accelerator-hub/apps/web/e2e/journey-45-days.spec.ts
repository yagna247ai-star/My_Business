/**
 * The full 45-day AI-Powered Data Analytics journey, opened day by day, with one screenshot per day.
 * Signs in as the demo learner (created by packages/db/prisma/demo-data-analytics-learner.ts).
 * Screenshots: e2e/proof/journey/day-01.png … day-45.png
 */
import { test, expect } from 'playwright/test';
import path from 'path';
import { DAY_TO_LEVEL } from '../lib/domain/lessonMarkdown';

const PROOF = path.join(__dirname, 'proof', 'journey');

test.setTimeout(15 * 60_000);

test('45 days, one screenshot each', async ({ page, context }) => {
  await context.addInitScript(() => { try { localStorage.setItem('aih_theme', 'sln'); } catch { /* ignore */ } });

  await page.goto('/login');
  await page.getByLabel('Email').fill('datalearner@aihub.in');
  await page.getByLabel('Password', { exact: true }).fill('Learner@12345');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/dashboard');

  for (let day = 1; day <= 45; day++) {
    const code = DAY_TO_LEVEL[day];
    await page.goto(`/levels/${code}/days/${day}`);
    await expect(page.getByText(`Day ${day} of 45`)).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('article')).toBeVisible();
    await page.waitForLoadState('networkidle').catch(() => {});
    const name = `day-${String(day).padStart(2, '0')}.png`;
    await page.screenshot({ path: path.join(PROOF, name), fullPage: true });
  }
});
