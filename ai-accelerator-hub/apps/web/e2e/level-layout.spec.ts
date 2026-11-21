/**
 * Evidence run: the level page (level tabs, words you will see, your days and activities, get ready, class info),
 * an activity page (what you do here, you leave with, the activity, was this useful, next activity) and a guided day.
 * Screenshots: e2e/proof/level-layout/. Local only.
 */
import { test, expect, type Page } from 'playwright/test';
import path from 'path';
import fs from 'fs';
import { JOURNEY_SPECS } from '../lib/domain/daDomains/tracks';
import { buildDomainJourney } from '../lib/domain/daDomains/curriculum';

const OUT = path.join(__dirname, 'proof', 'level-layout');
const EMAIL = `e2e.layout.${Date.now().toString(36)}@example.test`;
const L1 = buildDomainJourney(JOURNEY_SPECS.find(s => s.slug === 'bfsi-easy')!).levels[0].code;
const shot = async (page: Page, name: string) => { await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(400); fs.mkdirSync(OUT, { recursive: true }); await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true }); };

test('level page, activity page and guided day', async ({ page, baseURL }) => {
  test.setTimeout(600_000);
  await page.setViewportSize({ width: 1280, height: 800 });
  const reg = await page.request.post(`${baseURL}/api/v1/register`, { data: { name: 'Layout Learner', email: EMAIL, password: 'Layout-Learner-2026', birthYear: 2001, journeySlug: 'da-bfsi-easy', acceptTerms: true } });
  expect(reg.ok(), await reg.text()).toBeTruthy();
  await page.goto('/login');
  await page.locator('#email').fill(EMAIL); await page.locator('#password').fill('Layout-Learner-2026');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(u => !u.pathname.startsWith('/login'), { timeout: 180_000, waitUntil: 'commit' });

  await page.goto(`/levels/${L1}`, { timeout: 240_000 });
  await expect(page.getByRole('heading', { name: 'Your activities' })).toBeVisible({ timeout: 120_000 });
  await expect(page.getByText('Words you will see')).toBeVisible();
  await shot(page, '01-level-page');

  await page.goto(`/levels/${L1}/activities/1`, { timeout: 240_000 });
  await expect(page.getByText('What you do here')).toBeVisible({ timeout: 120_000 });
  await shot(page, '02-activity-page');

  await page.goto(`/levels/${L1}/days/1`, { timeout: 240_000 });
  await expect(page.getByRole('heading', { name: 'Your steps today' })).toBeVisible({ timeout: 120_000 });
  await shot(page, '03-guided-day');
});
