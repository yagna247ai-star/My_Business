/**
 * The whole data analytics journey: all nine modules completed by the demo learner, step by step,
 * reviewed automatically, with a screenshot after every step. Answers come from the same builder the
 * seed uses (packages/db/prisma/data-analytics-activities.ts), so the test follows the real content.
 * Module 1's content is in seed-data-analytics.ts; its answers are listed below.
 */
import { test, expect, type Page } from 'playwright/test';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { MODULES, buildModule } from '../../../packages/db/prisma/data-analytics-activities';

const ROOT = path.join(__dirname, 'proof', 'journey-modules');
test.describe.configure({ mode: 'serial' });
test.setTimeout(25 * 60_000);

type Answers = { idx: number; code: string; title: string; xp: number; briefing: number; quiz: number[]; explore: number[]; fields: number; tool: string; boss: number[] };

const M1: Answers = { idx: 1, code: 'DA01_FUNDAMENTALS', title: 'Data Analytics Fundamentals', xp: 120, briefing: 1, quiz: [0, 1, 2, 2, 1], explore: [0, 0, 0], fields: 4, tool: 'Excel', boss: [0, 0, 0, 0] };

function answersFor(code: string, idx: number, xp: number): Answers {
  const spec = MODULES.find(m => m.code === code)!;
  const rows = buildModule(spec);
  const c = (i: number) => rows[i - 1].config as any;
  return {
    idx, code, title: spec.code, xp,
    briefing: c(1).check.answer,
    quiz: c(2).quiz.map((q: any) => q.answer),
    explore: c(3).questions.map((q: any) => q.answer),
    fields: c(4).fields.length,
    tool: c(4).tools[0],
    boss: c(6).scenarios.map((s: any) => s.correct[0]),
  };
}

const ALL: Answers[] = [M1, ...MODULES.map((m, i) => answersFor(m.code, i + 2, m.xp))];
// Module 1's explore answers depend on its own seed config: question 1 → 0, 2 → 0, 3 → 0 (see seed-data-analytics.ts).

test.beforeAll(() => {
  const url = process.env.DEMO_DB_URL;
  if (!url) throw new Error('Set DEMO_DB_URL to the local demo database, e.g. file:/path/local.db');
  // Publish the drafted modules locally (the seed keeps them unpublished until reviewer sign-off), then reset.
  execSync('npx tsx prisma/demo-data-analytics-learner.ts', { cwd: path.join(__dirname, '../../../packages/db'), env: { ...process.env, DATABASE_URL: url }, stdio: 'inherit' });
  execSync('npx tsx prisma/reset-demo-journey.ts', { cwd: path.join(__dirname, '../../../packages/db'), env: { ...process.env, DATABASE_URL: url }, stdio: 'inherit' });
});

// Dev mode compiles each route on first use (up to 30 s). Compile them all once, before any timed step.
test.beforeAll(async ({ request }) => {
  test.setTimeout(10 * 60_000);
  const paths = ['/login', '/dashboard', '/levels', '/levels/DA01_FUNDAMENTALS',
    ...['activities/1', 'proof', 'boss'].map(s => `/api/v1/levels/DA01_FUNDAMENTALS/${s}`)];
  for (const p of paths) await request.get(p, { timeout: 180_000, maxRedirects: 0 }).catch(() => {});
});

async function signIn(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill('datalearner@aihub.in');
  await page.getByLabel('Password', { exact: true }).fill('Learner@12345');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/dashboard');
}

const WORDS = 'This part is written in full for the demo run, so the minimum word count for the field is met and the reviewer can read it. ';

for (const a of ALL) {
  test(`Module ${a.idx}: ${a.code} completed and approved automatically`, async ({ page, context }) => {
    const out = path.join(ROOT, `${String(a.idx).padStart(2, '0')}-${a.code}`);
    fs.mkdirSync(out, { recursive: true });
    const snap = async (name: string) => { await page.waitForLoadState('networkidle').catch(() => {}); await page.screenshot({ path: path.join(out, `${name}.png`), fullPage: true }); };
    await context.addInitScript(() => { try { localStorage.setItem('aih_theme', 'sln'); } catch { /* ignore */ } });
    await signIn(page);

    await page.goto(`/levels/${a.code}`);
    await expect(page.getByRole('heading', { name: new RegExp(`Level ${a.idx} —`) })).toBeVisible({ timeout: 30_000 });
    await snap('01-start');

    // 1 Briefing
    await page.locator('input[type=radio]').nth(a.briefing).click({ force: true });
    await page.getByRole('button', { name: 'Mark briefing complete' }).click();
    await expect(page.getByText('Mission briefing complete')).toBeVisible({ timeout: 30_000 });
    await snap('02-briefing');

    // 2 Learn
    for (let q = 0; q < a.quiz.length; q++) await page.locator('input[type=radio]').nth(q * 4 + a.quiz[q]).click({ force: true });
    await page.getByRole('button', { name: 'Submit answers' }).click();
    await expect(page.getByText(/Quiz passed with 100%/)).toBeVisible({ timeout: 30_000 });
    await snap('03-learn');

    // 3 Explore
    await page.locator('input[type=checkbox]').first().click({ force: true });
    for (let q = 0; q < a.explore.length; q++) await page.locator('input[type=radio]').nth(q * 4 + a.explore[q]).click({ force: true });
    await page.getByRole('button', { name: 'Check answers' }).click();
    await expect(page.getByText(/Explore complete/)).toBeVisible({ timeout: 30_000 });
    await snap('04-explore');

    // 4 Build
    const boxes = page.locator('textarea');
    for (let i = 0; i < a.fields; i++) await boxes.nth(i).fill(`Field ${i + 1}. ` + WORDS.repeat(3));
    await page.locator('select').first().selectOption({ label: a.tool });
    const built = page.waitForResponse(r => r.url().includes('/activities/4') && r.request().method() === 'POST');
    await page.getByRole('button', { name: 'Save my brief' }).click();
    expect((await built).status()).toBe(200);
    await snap('05-build');

    // 5 Proof
    await page.locator('input[type=url]').first().fill(`https://example.com/demo-${a.code.toLowerCase()}`);
    await page.locator('textarea').first().fill('Reflection. ' + WORDS.repeat(5));
    for (const box of await page.locator('input[type=checkbox]').all()) await box.click({ force: true });
    const proof = page.waitForResponse(r => r.url().includes('/proof') && r.request().method() === 'POST');
    await page.getByRole('button', { name: 'Submit for review' }).click();
    expect((await proof).status()).toBe(200);
    await snap('06-proof');

    // 6 Boss, then automated review
    await page.goto(`/levels/${a.code}?a=6`);
    await expect(page.getByRole('button', { name: 'Run the trial' })).toBeVisible({ timeout: 30_000 });
    for (let s = 0; s < a.boss.length; s++) await page.locator('input[type=radio]').nth(s * 3 + a.boss[s]).click({ force: true });
    for (let s = 0; s < a.boss.length; s++) await page.getByLabel(`Reason for scenario ${s + 1}`).fill('Check the data first, then decide with a clear, measurable reason.', { timeout: 15_000 });
    await page.getByRole('button', { name: 'Run the trial' }).click();
    // The trial and the automated review finish on the server; reload until the level shows approved.
    await expect(async () => {
      await page.goto(`/levels/${a.code}`);
      await expect(page.getByText(/approved!/)).toBeVisible({ timeout: 5_000 });
    }).toPass({ timeout: 180_000, intervals: [3_000, 5_000, 10_000] });

    await page.locator('.flower-burst span').first().waitFor({ timeout: 30_000 });
    await page.addStyleTag({ content: '.flower-burst span{animation-delay:-1s !important;animation-play-state:paused !important}' });
    await page.screenshot({ path: path.join(out, '07-approved-flowers.png') });
    await expect(page.getByText(/approved!/)).toBeVisible();
    await expect(page.getByText(`${a.xp} / ${a.xp} XP`)).toBeVisible();
  });
}

test('Journey page: all nine modules approved', async ({ page, context }) => {
  await context.addInitScript(() => { try { localStorage.setItem('aih_theme', 'sln'); } catch { /* ignore */ } });
  await signIn(page);
  await page.goto('/levels');
  await expect(page.getByText('Approved').first()).toBeVisible({ timeout: 30_000 });
  expect(await page.getByText('Approved').count()).toBeGreaterThanOrEqual(9);
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.screenshot({ path: path.join(ROOT, '10-journey-all-approved.png'), fullPage: true });
});
