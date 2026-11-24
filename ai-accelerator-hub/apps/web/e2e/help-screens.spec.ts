/**
 * Screenshots for the Simple Guide (docs/help/SIMPLE_GUIDE.md), saved as JPEGs in public/help/img/ so the in-app
 * help, the /help page and the PDF show the real platform. Local only: run against a local dev server with the demo
 * accounts from prisma/seed.ts. Re-run after a UI change, then node scripts/help-build.mjs and node scripts/help-pdf.mjs.
 */
import { test, expect, type Browser, type Page } from 'playwright/test';
import path from 'path';
import fs from 'fs';

const OUT = path.join(__dirname, '..', 'public', 'help', 'img');
// Resumable: a picture that already exists is kept (delete public/help/img/<name>.jpg to retake it).
const have = (name: string) => fs.existsSync(path.join(OUT, `${name}.jpg`));
const shot = async (page: Page, name: string) => { if (have(name)) return; await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(600); await page.screenshot({ path: path.join(OUT, `${name}.jpg`), type: 'jpeg', quality: 72 }); };
const part = async (page: Page, selector: string, name: string) => { if (have(name)) return; const el = page.locator(selector).first(); await el.scrollIntoViewIfNeeded(); await page.waitForTimeout(500); await el.screenshot({ path: path.join(OUT, `${name}.jpg`), type: 'jpeg', quality: 72 }); };

async function signIn(browser: Browser, email: string, password: string) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.goto('/login');
  await page.locator('#email').fill(email); await page.locator('#password').fill(password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(u => !u.pathname.startsWith('/login'), { timeout: 180_000, waitUntil: 'commit' });
  return page;
}
const open = async (page: Page, url: string, ready: string | RegExp) => { await page.goto(url, { timeout: 240_000 }); await expect(page.getByText(ready).first()).toBeVisible({ timeout: 120_000 }); };

test('screenshots for the Simple Guide', async ({ browser, baseURL }) => {
  test.setTimeout(1_200_000);
  // Signed out: the register page.
  const anon = await (await browser.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  await open(anon, '/register', /Create|Register|account/i); await shot(anon, 'register');

  // A new learner on the AI-Powered Data Analytics journey.
  const email = `guide.${Date.now().toString(36)}@example.test`;
  const reg = await anon.request.post(`${baseURL}/api/v1/register`, { data: { name: 'Asha Learner', email, password: 'Guide-Learner-2026', birthYear: 2003, journeySlug: 'data-analytics-journey', acceptTerms: true } });
  expect(reg.ok(), await reg.text()).toBeTruthy();
  const me = await signIn(browser, email, 'Guide-Learner-2026');
  await open(me, '/dashboard', /Mission Control|next/i); await shot(me, 'dashboard');
  await open(me, '/levels/DA01_FUNDAMENTALS', 'Your activities'); await shot(me, 'level-page');
  await open(me, '/levels/DA01_FUNDAMENTALS/days/4', /guided steps/); await shot(me, 'day-banner');
  await part(me, '#steps', 'guided-step');
  await open(me, '/levels/DA01_FUNDAMENTALS/activities/1', 'Ask the AI coach'); await shot(me, 'activity-coach');
  await open(me, '/levels/DA01_FUNDAMENTALS/activities/5', 'What you do here'); await part(me, 'section[aria-label]:has(#ev), section.card:has(#ev)', 'proof-form');
  // The Help button: the panel for this page.
  await open(me, '/levels/DA01_FUNDAMENTALS/days/4', /guided steps/);
  await me.getByRole('button', { name: 'Help for this page' }).click();
  await expect(me.getByRole('dialog')).toBeVisible(); await me.waitForTimeout(500);
  await me.screenshot({ path: path.join(OUT, 'help-panel.jpg'), type: 'jpeg', quality: 72 });
  await me.keyboard.press('Escape');
  // Skip Level 1 to show a SQL day with the Windows/Mac switch and a copy box.
  for (let a = 1; a <= 6; a++) await me.request.post('/api/v1/levels/DA01_FUNDAMENTALS/skip', { data: { idx: a } });
  for (let d = 1; d <= 4; d++) await me.request.post(`/api/v1/levels/DA01_FUNDAMENTALS/days/${d}`, { data: { action: 'skip' } });
  await open(me, '/levels/DA02_SQL/days/6', /guided steps/); await part(me, '#steps', 'sql-step');
  await open(me, '/achievements', /Achievements|badge/i); await shot(me, 'achievements');
  await open(me, '/ranks', /Rank/i); await shot(me, 'ranks');
  await open(me, '/coach', /assistant|Coach/i); await shot(me, 'coaches');
  await open(me, '/agent-lab', /Agent Lab/i); await shot(me, 'agent-lab');
  await open(me, '/settings', /Settings|Language/i); await shot(me, 'settings');
  await open(me, '/feed', /Feed|post/i); await shot(me, 'feed');

  // The demo learner sees the showcase with sample projects.
  const student = await signIn(browser, 'student@aihub.in', 'Student@12345');
  await open(student, '/showcase', /Showcase/); await shot(student, 'showcase');

  const mentor = await signIn(browser, 'mentor@aihub.in', 'Mentor@12345');
  await open(mentor, '/review', /Review|queue/i); await shot(mentor, 'review-queue');

  const admin = await signIn(browser, 'admin@aihub.in', 'Admin@12345');
  await open(admin, '/admin/showcase', 'Manage showcase'); await shot(admin, 'admin-showcase');
  await open(admin, '/admin/content', /Content review/i); await shot(admin, 'content-review');
  await open(admin, '/settings/people', /People|member/i); await shot(admin, 'people');
  await open(admin, '/admin', /Analytics|Cohort/i); await shot(admin, 'analytics');
});
