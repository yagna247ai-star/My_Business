/**
 * Evidence run: the AI-Powered Data Analytics journey with guided steps (Day 1), and an activity page with the
 * AI coach side panel. Screenshots: e2e/proof/generic-guided/. Local only.
 */
import { test, expect, type Page } from 'playwright/test';
import path from 'path';
import fs from 'fs';

const OUT = path.join(__dirname, 'proof', 'generic-guided');
const EMAIL = `e2e.generic.${Date.now().toString(36)}@example.test`;
const shot = async (page: Page, name: string) => { await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(400); fs.mkdirSync(OUT, { recursive: true }); await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true }); };

test('generic journey: guided day and activity with the AI coach panel', async ({ page, baseURL }) => {
  test.setTimeout(600_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  const reg = await page.request.post(`${baseURL}/api/v1/register`, { data: { name: 'Generic Learner', email: EMAIL, password: 'Generic-Learner-2026', birthYear: 2001, journeySlug: 'data-analytics-journey', acceptTerms: true } });
  expect(reg.ok(), await reg.text()).toBeTruthy();
  await page.goto('/login');
  await page.locator('#email').fill(EMAIL); await page.locator('#password').fill('Generic-Learner-2026');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(u => !u.pathname.startsWith('/login'), { timeout: 180_000, waitUntil: 'commit' });

  await page.goto('/levels/DA01_FUNDAMENTALS/days/1', { timeout: 240_000 });
  await expect(page.getByRole('heading', { name: 'Your steps today' })).toBeVisible({ timeout: 120_000 });
  await expect(page.getByText('What a shop records').first()).toBeVisible();
  await shot(page, '01-generic-day1-steps');

  await page.goto('/levels/DA01_FUNDAMENTALS/activities/1', { timeout: 240_000 });
  await expect(page.getByRole('heading', { name: 'Ask the AI coach' })).toBeVisible({ timeout: 120_000 });
  await shot(page, '02-activity-with-coach');
});
