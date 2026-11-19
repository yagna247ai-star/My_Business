/** Visual alignment check after the fixes: journey page, final level, area crowns (SVG crowns), at desktop and phone width. */
import { test, expect } from 'playwright/test';
import path from 'path';
import fs from 'fs';

const OUT = path.join(__dirname, 'proof', 'visual-check');
test.setTimeout(6 * 60_000);
test.beforeAll(() => fs.mkdirSync(OUT, { recursive: true }));

for (const vp of [{ name: 'desktop', width: 1280, height: 720 }, { name: 'phone', width: 390, height: 844 }]) {
  test(`screens line up at ${vp.name} width`, async ({ page, context }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await context.addInitScript(() => { try { localStorage.setItem('aih_theme', 'sln'); } catch { /* ignore */ } });
    await page.goto('/login');
    await page.getByLabel('Email').fill('datalearner@aihub.in');
    await page.getByLabel('Password', { exact: true }).fill('Learner@12345');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL('**/dashboard', { timeout: 120_000 });

    for (const [url, name] of [['/levels', 'journey'], ['/levels/DA09_CAPSTONE_READINESS', 'final-level'], ['/leaderboard/areas', 'area-crowns']] as const) {
      await page.goto(url);
      await page.waitForLoadState('networkidle').catch(() => {});
      await page.addStyleTag({ content: '.flower-burst span{animation-delay:-1s !important;animation-play-state:paused !important}' });
      // No horizontal page scroll at any width.
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `${name} scrolls sideways by ${overflow}px`).toBeLessThanOrEqual(1);
      await page.screenshot({ path: path.join(OUT, `${vp.name}-${name}.png`), fullPage: true });
    }
    await page.goto('/levels');
    await expect(page.getByRole('heading', { name: /Five stages\. Nine levels\./ })).toBeVisible();
    await page.goto('/levels/DA09_CAPSTONE_READINESS');
    await expect(page.getByText('You have finished the whole journey.')).toBeVisible();
    await page.goto('/leaderboard/areas');
    expect(await page.locator('.crown-tag .crown-svg').count()).toBeGreaterThanOrEqual(13);
  });
}
