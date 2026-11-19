/**
 * Module 1, fully functional, end to end, with a screenshot after every step (TDD: each expectation is
 * written first; the run shows which step is not yet working).
 * Run the reset first: npx tsx ../../packages/db/prisma/reset-demo-module1.ts (local demo only).
 * Points: briefing +5, learn +18, explore +10, build +35, proof +5, review approval +20 and boss bonus +27 = 120 XP.
 * Review is automated by rubric template (lib/domain/autoReview.ts): no waiting for a person.
 */
import { test, expect, type Page } from 'playwright/test';
import path from 'path';
import { execSync } from 'child_process';

const OUT = path.join(__dirname, 'proof', 'module1-full');
test.setTimeout(10 * 60_000);

// Clean Module 1 for the demo learner before the run (local SQLite only; needs DEMO_DB_URL).
test.beforeAll(() => {
  const url = process.env.DEMO_DB_URL;
  if (!url) throw new Error('Set DEMO_DB_URL to the local demo database, e.g. file:/path/local.db');
  execSync('npx tsx prisma/reset-demo-module1.ts', { cwd: path.join(__dirname, '../../../packages/db'), env: { ...process.env, DATABASE_URL: url }, stdio: 'inherit' });
});

async function snap(page: Page, name: string) {
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true });
}

async function signIn(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/dashboard');
}

test('Module 1 is completed by the learner, step by step', async ({ page, context }) => {
  await context.addInitScript(() => { try { localStorage.setItem('aih_theme', 'sln'); } catch { /* ignore */ } });
  await signIn(page, 'datalearner@aihub.in', 'Learner@12345');
  await page.goto('/levels/DA01_FUNDAMENTALS');
  await snap(page, '01-start');
  await expect(page.getByText('0 / 120 XP').first()).toBeVisible();

  // 1. Mission briefing (+5)
  await page.locator('input[type=radio]').nth(1).click({ force: true });
  await page.getByRole('button', { name: 'Mark briefing complete' }).click();
  await expect(page.getByText('Mission briefing complete')).toBeVisible({ timeout: 30_000 });
  await snap(page, '02-briefing-done');

  // 2. Learn quiz (+18), answers from the lesson key
  const answers = [0, 1, 2, 2, 1];
  for (let q = 0; q < 5; q++) await page.locator('input[type=radio]').nth(q * 4 + answers[q]).click({ force: true });
  await page.getByRole('button', { name: 'Submit answers' }).click();
  await expect(page.getByText(/Quiz passed with 100%/)).toBeVisible({ timeout: 30_000 });
  await snap(page, '03-learn-quiz-passed');

  // 3. Explore the dataset (+10): tick the checkbox, answer three questions
  await page.locator('input[type=checkbox]').first().click({ force: true });
  const explore = [0, 2, 0];
  for (let q = 0; q < 3; q++) await page.locator('input[type=radio]').nth(q * 4 + explore[q]).click({ force: true });
  await page.getByRole('button', { name: 'Check answers' }).click();
  await expect(page.getByText(/Explore complete/)).toBeVisible({ timeout: 30_000 });
  await snap(page, '04-explore-complete');

  // 4. Build: the data inventory (+35), four written fields and the tool used
  const texts = [
    'The measurable question: How did weekly revenue change between September and October, by branch and by product category, for Sunita Stores? The measure is revenue, the period is September to October, and the breakdown is by branch and product category, so the owner can see where sales rose or fell.',
    'Sources: the paper billing book (structured lines, one row per bill), the WhatsApp group of daily totals (unstructured messages that need typing up), and the bank statement (structured rows with dates and amounts). Each source answers part of the question, and I checked that they cover the same weeks.',
    'Lifecycle: collect the bills, messages and bank rows. Clean duplicate bills, missing amounts and wrong dates before anything else. Process the data into weekly totals for each branch. Analyse the change from one week to the next. Visualise it as a line chart. Report one clear action for the owner, such as checking the South branch display in the second week of October, and say what would change the answer.',
    'Limits: only two branches, no customer history, WhatsApp totals are typed by hand and may be missing days.',
  ];
  const boxes = page.locator('textarea');
  for (let i = 0; i < texts.length; i++) await boxes.nth(i).fill(texts[i]);
  await page.locator('select').first().selectOption({ label: 'Excel' });
  await page.getByRole('button', { name: 'Save my brief' }).click();
  await expect(page.getByText(/68 of 120/)).toBeVisible({ timeout: 30_000 });
  await snap(page, '05-build-saved');
  // 5. Submit proof (+5): link to the brief, the reflection (50+ words), the checklist
  const urls = page.locator('input[type=url]');
  await urls.nth(0).fill('https://example.com/demo-module1-brief');
  await page.locator('textarea').first().fill(
    'I chose the sales question because the owner needs one clear number to act on. I used the billing book, the WhatsApp totals and the bank statement, and I said which of them were typed by hand. The hardest part was spotting that a bill was counted twice. Next time I would ask the owner which week the holiday fell in before I read the change.'
  );
  for (const box of await page.locator('input[type=checkbox]').all()) await box.click({ force: true });
  const saved = page.waitForResponse(r => r.url().includes('/proof') && r.request().method() === 'POST');
  await page.getByRole('button', { name: 'Submit for review' }).click();
  expect((await saved).status()).toBe(200);
  await page.reload();
  await expect(page.getByText(/review/i).first()).toBeVisible({ timeout: 30_000 });
  await snap(page, '06-proof-submitted');
  // 6. Evaluation + Boss (+47): four situations, one choice and a reason each; best result goes to the reviewer
  await page.goto('/levels/DA01_FUNDAMENTALS?a=6');
  await expect(page.getByRole('button', { name: 'Run the trial' })).toBeVisible({ timeout: 30_000 });
  for (let s = 0; s < 4; s++) await page.locator('input[type=radio]').nth(s * 3).click({ force: true });
  for (let s = 0; s < 4; s++) await page.getByLabel(`Reason for scenario ${s + 1}`).fill('Define a measurable question first, then check the data before any chart or claim.', { timeout: 15_000 });
  const ran = page.waitForResponse(r => r.url().includes('/boss') && r.request().method() === 'POST');
  await page.getByRole('button', { name: 'Run the trial' }).click();
  expect((await ran).status()).toBe(200);
  // 7. Automated review by rubric template: no human wait. Approved → flowers, full XP, next level open.
  await page.goto('/levels/DA01_FUNDAMENTALS');
  await page.locator('.flower-burst span').first().waitFor({ timeout: 30_000 });
  // Freeze one frame of the burst (1 s in) so the screenshot is repeatable, not a timing race.
  await page.addStyleTag({ content: '.flower-burst span{animation-delay:-1s !important;animation-play-state:paused !important}' });
  await page.screenshot({ path: path.join(OUT, '07-auto-approved-flowers.png') });
  const box = (await page.locator('.celebrate').boundingBox())!;
  await page.screenshot({ path: path.join(OUT, '07b-flowers-close-up.png'), clip: { x: box.x - 10, y: box.y - 20, width: box.width + 20, height: box.height + 200 } });
  await expect(page.getByText(/approved!/)).toBeVisible();
  await expect(page.getByText('120 / 120 XP')).toBeVisible();
  await page.goto('/levels');
  await snap(page, '08-next-level-unlocked');
});
