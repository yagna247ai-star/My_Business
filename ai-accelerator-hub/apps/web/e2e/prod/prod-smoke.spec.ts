/**
 * Production smoke test on the custom domain. Read-only: signs in with the seeded demo accounts and opens
 * pages; it never submits work or changes settings. Run:
 *   BASE_URL=https://aiachub.nachikethaenterprises.business npx playwright test e2e/prod
 */
import { test, expect, type Page } from 'playwright/test';
import path from 'path';
import fs from 'fs';

const OUT = path.join(__dirname, '..', 'proof', 'production');
test.describe.configure({ mode: 'serial' });
test.setTimeout(4 * 60_000);
test.beforeAll(() => fs.mkdirSync(OUT, { recursive: true }));

const shot = async (page: Page, name: string) => { await page.waitForLoadState('networkidle').catch(() => {}); await page.screenshot({ path: path.join(OUT, name), fullPage: true }); };
async function signIn(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL(u => !u.pathname.startsWith('/login'), { timeout: 60_000 });
}
/** Open a page and check it rendered without an error screen. */
async function opens(page: Page, url: string, heading: RegExp, name: string) {
  const res = await page.goto(url);
  expect(res?.status(), `${url} status`).toBeLessThan(400);
  await expect(page.getByRole('heading', { name: heading }).first()).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(/Something went wrong|Application error|Internal Server Error/i)).toHaveCount(0);
  await shot(page, name);
}

test('custom domain: HTTPS, landing page and health check', async ({ page, request }) => {
  const base = test.info().project.use.baseURL!;
  expect(base.startsWith('https://aiachub.nachikethaenterprises.business')).toBeTruthy();
  const health = await request.get('/api/health');
  expect(health.status()).toBe(200);
  const res = await page.goto('/');
  expect(res?.status()).toBe(200);
  await shot(page, '01-landing.png');
});

test('public pages: login and register render; signed-in pages and APIs require sign-in', async ({ page, request }) => {
  await opens(page, '/login', /Sign in/i, '01b-login.png');
  await opens(page, '/register', /account|Register|Join|Sign up/i, '01c-register.png');
  for (const p of ['/dashboard', '/ranks', '/levels', '/leaderboard/areas', '/settings', '/admin/journeys']) {
    const r = await request.get(p, { maxRedirects: 0 });
    expect([302, 307], `${p} should redirect to sign-in`).toContain(r.status());
    expect(r.headers()['location'] || '').toContain('/login');
  }
  const api = await request.post('/api/v1/levels/DA01_FUNDAMENTALS/stuck', { data: { question: 'hello there', tried: '', hints: [] }, headers: { origin: test.info().project.use.baseURL! } });
  expect([401, 403]).toContain(api.status());
  const providers = await (await request.get('/api/auth/providers')).json();
  expect(providers.credentials.callbackUrl).toContain('aiachub.nachikethaenterprises.business');
});

// Signed-in checks need a production account: SMOKE_EMAIL / SMOKE_PASSWORD (learner) and ADMIN_EMAIL / ADMIN_PASSWORD.
test('learner: dashboard, journey, ranks, area crowns, data analytics module, stuck helper, settings', async ({ page }) => {
  test.skip(!process.env.SMOKE_EMAIL, 'Set SMOKE_EMAIL and SMOKE_PASSWORD to a production learner account.');
  await signIn(page, process.env.SMOKE_EMAIL!, process.env.SMOKE_PASSWORD!);
  await shot(page, '02-learner-dashboard.png');
  await opens(page, '/levels', /stages\.|Journey/i, '03-learner-journey.png');
  await opens(page, '/ranks', /^Ranks$/, '04-ranks.png');
  await opens(page, '/leaderboard/areas', /Area standings/, '05-area-crowns.png');
  await opens(page, '/leaderboard', /Standings/, '06-standings.png');
  await opens(page, '/settings', /Settings/, '07-settings.png');
  await expect(page.getByLabel('My area')).toBeVisible(); // the new area column exists in production
  // The learner's own first level (one active journey per learner: other journeys' levels are not open to them)
  await page.goto('/levels');
  const first = page.locator('a.lv-tile').first();
  await expect(first).toBeVisible({ timeout: 30_000 });
  await first.click();
  await expect(page.getByRole('heading', { name: /Level 1 —/ })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole('button', { name: 'Stuck? Get a hint' })).toBeVisible();
  await shot(page, '08-level-1-workspace.png');
  // Stuck helper API: first step asks what you tried (no AI call is needed for this step)
  const r = await page.request.post('/api/v1/levels/DA01_FUNDAMENTALS/stuck', { data: { question: 'How do I pick a measurable question?', tried: '', hints: [] }, headers: { origin: test.info().project.use.baseURL! } });
  expect(r.status(), await r.text()).toBe(200);
  expect((await r.json()).step).toBe('ask_tried');
});

test('admin: journey and hackathon builders', async ({ page }) => {
  test.skip(!process.env.ADMIN_EMAIL, 'Set ADMIN_EMAIL and ADMIN_PASSWORD to a production admin account.');
  await signIn(page, process.env.ADMIN_EMAIL!, process.env.ADMIN_PASSWORD!);
  await opens(page, '/admin/journeys', /Journey/i, '09-admin-journeys.png');
  await opens(page, '/admin/hackathons', /Hackathon/i, '10-admin-hackathons.png');
});
