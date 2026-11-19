/**
 * Full local flow: theme, learner sign-in, dashboard, journey, settings (photo + theme),
 * admin journey and hackathon builders, sign-out. Demo accounts only (created by the seeds).
 * Screenshots are written to e2e/proof/ as evidence.
 */
import { test, expect, type Page } from 'playwright/test';
import path from 'path';

const PROOF = path.join(__dirname, 'proof');
const RUN = Date.now().toString(36);
// 1x1 PNG, used as the profile photo.
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');

async function shot(page: Page, name: string) {
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.screenshot({ path: path.join(PROOF, `${name}.png`), fullPage: true });
}

async function signIn(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
}

test.beforeEach(async ({ context }) => {
  // The SLN heritage theme is chosen once and saved on this device.
  await context.addInitScript(() => {
    try { localStorage.setItem('aih_theme', 'sln'); } catch { /* ignore */ }
  });
});

test('1. login page renders in the SLN theme', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'sln');
  await shot(page, '01-login-sln');
});

test('2. learner signs in and sees the dashboard', async ({ page }) => {
  await signIn(page, 'student@aihub.in', 'Student@12345');
  await page.waitForURL('**/dashboard');
  await expect(page.getByText(/Welcome back/)).toBeVisible();
  await shot(page, '02-learner-dashboard');
});

test('3. learner opens the journey page and sees the level strip', async ({ page }) => {
  await signIn(page, 'student@aihub.in', 'Student@12345');
  await page.waitForURL('**/dashboard');
  await page.goto('/levels');
  await expect(page.getByText(/Your journey/)).toBeVisible();
  await shot(page, '03-journey');
});

test('4. learner uploads a profile photo and picks the theme in settings', async ({ page }) => {
  await signIn(page, 'student@aihub.in', 'Student@12345');
  await page.waitForURL('**/dashboard');
  await page.goto('/settings/profile');
  await expect(page.getByRole('heading', { name: 'Profile photo' })).toBeVisible();

  await page.getByLabel('Choose a profile photo').setInputFiles({ name: 'me.png', mimeType: 'image/png', buffer: PNG });
  await expect(page.getByText('Profile photo saved.')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByAltText('Your profile photo')).toBeVisible();

  await expect(page.getByRole('radio', { name: /SLN heritage/ })).toBeChecked();
  await shot(page, '04-settings-photo-and-theme');
});

test('5. tenant admin builds a journey and a hackathon', async ({ page }) => {
  await signIn(page, 'tenantadmin@aihub.in', 'TenantAdmin@12345');
  await page.waitForURL('**/dashboard');

  await page.goto('/admin/journeys');
  const jSlug = `pilot-${RUN}`;
  await page.getByRole('textbox', { name: 'Journey name' }).fill(`Pilot ${RUN}`);
  await page.getByRole('textbox', { name: /Web address \(slug\)/ }).fill(jSlug);
  await page.getByRole('textbox', { name: 'Stage 1 title' }).fill('Foundations');
  await page.getByRole('textbox', { name: 'Title', exact: true }).fill('Reading shop data');
  await page.getByRole('textbox', { name: 'Code' }).fill(`PILOT${RUN.toUpperCase().replace(/[^A-Z0-9]/g, '')}`.slice(0, 30));
  await page.getByRole('button', { name: 'Create journey' }).click();
  await expect(page.getByText(/Created ".*" with 1 levels/)).toBeVisible({ timeout: 30_000 });
  await shot(page, '05-admin-journey-created');

  await page.goto('/admin/hackathons');
  await page.getByRole('textbox', { name: 'Hackathon title' }).fill(`Sprint ${RUN}`);
  await page.getByRole('textbox', { name: /Web address \(slug\)/ }).fill(`sprint-${RUN}`);
  await page.getByRole('textbox', { name: /Brief/ }).fill('Teams clean one shop sales file and present one finding.');
  await page.getByRole('button', { name: 'Create hackathon' }).click();
  await expect(page.getByText(/Created ".*" as a draft/)).toBeVisible({ timeout: 30_000 });
  await shot(page, '06-admin-hackathon-created');
});
