/**
 * Evidence run: the AI-Powered Data Analytics journey with detailed guided steps (Agent Lab style), and an activity
 * page with the AI coach side panel. Earlier levels are skipped through the learner's own skip actions.
 * Screenshots: e2e/proof/generic-guided/. Local only.
 */
import { test, expect, type Page } from 'playwright/test';
import path from 'path';
import fs from 'fs';

const OUT = path.join(__dirname, 'proof', 'generic-guided');
const EMAIL = `e2e.generic.${Date.now().toString(36)}@example.test`;
const LEVELS = [['DA01_FUNDAMENTALS', 1, 4], ['DA02_SQL', 5, 11], ['DA03_PYTHON_FUNDAMENTALS', 12, 16], ['DA04_PYTHON_ANALYTICS', 17, 22]] as const;
const shot = async (page: Page, name: string) => { await page.waitForTimeout(400); fs.mkdirSync(OUT, { recursive: true }); await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true }); };

async function skipLevel(page: Page, code: string, from: number, to: number) {
  for (let a = 1; a <= 6; a++) await page.request.post(`/api/v1/levels/${code}/skip`, { data: { idx: a } });
  for (let d = from; d <= to; d++) { const r = await page.request.post(`/api/v1/levels/${code}/days/${d}`, { data: { action: 'skip' } }); expect(r.ok(), await r.text()).toBeTruthy(); }
}

test('generic journey: detailed guided steps', async ({ page, baseURL }) => {
  test.setTimeout(900_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  const reg = await page.request.post(`${baseURL}/api/v1/register`, { data: { name: 'Generic Learner', email: EMAIL, password: 'Generic-Learner-2026', birthYear: 2001, journeySlug: 'data-analytics-journey', acceptTerms: true } });
  expect(reg.ok(), await reg.text()).toBeTruthy();
  await page.goto('/login');
  await page.locator('#email').fill(EMAIL); await page.locator('#password').fill('Generic-Learner-2026');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(u => !u.pathname.startsWith('/login'), { timeout: 180_000, waitUntil: 'commit' });

  // The top of a guided day: the banner that points at the steps.
  await page.goto('/levels/DA01_FUNDAMENTALS/days/4', { timeout: 240_000 });
  await expect(page.getByText(/Today: \d+ guided steps/)).toBeVisible({ timeout: 120_000 });
  await page.screenshot({ path: path.join(OUT, '01-day4-banner.png') });

  await skipLevel(page, 'DA01_FUNDAMENTALS', 1, 4);
  await page.goto('/levels/DA02_SQL/days/6', { timeout: 240_000 });
  await expect(page.getByRole('heading', { name: 'Your steps today' })).toBeVisible({ timeout: 120_000 });
  await page.locator('#steps').scrollIntoViewIfNeeded();
  await page.locator('#steps').screenshot({ path: path.join(OUT, '02-day6-sql-setup-step.png') });

  for (const [code, a, b] of LEVELS.slice(1, 3)) await skipLevel(page, code, a, b);
  await page.goto('/levels/DA04_PYTHON_ANALYTICS/days/17', { timeout: 240_000 });
  await expect(page.getByRole('heading', { name: 'Your steps today' })).toBeVisible({ timeout: 120_000 });
  await page.locator('#steps').screenshot({ path: path.join(OUT, '03-day17-pip-install-step.png') });
  await page.getByRole('radio', { name: 'Mac' }).click();
  await page.locator('#steps').screenshot({ path: path.join(OUT, '04-day17-mac.png') });

  await page.goto('/levels/DA02_SQL', { timeout: 240_000 });
  await expect(page.getByRole('heading', { name: 'Your days' })).toBeVisible({ timeout: 120_000 });
  await shot(page, '05-level2-days');
});
