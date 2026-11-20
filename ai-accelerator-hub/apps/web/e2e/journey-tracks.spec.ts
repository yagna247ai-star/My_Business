/**
 * Evidence run: Education tracks (Easy / Intermediate / Hard / Critical) with the Ikigai quiz.
 * Sign-up with the quiz → Easy track → change to Hard during Module 1 (keep work) → Hard day page with the real-world
 * situation → staff move the learner (Settings → Learning tracks, learner profile) → learner restarts Module 1 on
 * the new track → separate standings per track → track fixed after Module 1.
 * Screenshots: e2e/proof/tracks/NN-name.png and e2e/proof/tracks/index.html.
 *
 * Local only (never production):
 *   DATABASE_URL=<local db> BASE_URL=http://localhost:3100 npx playwright test e2e/journey-tracks.spec.ts
 * Uses the local demo Super Admin from packages/db/prisma/seed.ts.
 */
import { test, expect, type Page } from 'playwright/test';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { JOURNEY_SPECS } from '../lib/domain/daDomains/tracks';
import { buildDomainJourney } from '../lib/domain/daDomains/curriculum';

const OUT = path.join(__dirname, 'proof', 'tracks');
const RUN = Date.now().toString(36);
const EMAIL = `e2e.tracks.${RUN}@example.test`;
const PASSWORD = 'Track-Learner-2026';
const ADMIN = { email: 'admin@aihub.in', password: 'Admin@12345' }; // local demo seed only
const prisma = new PrismaClient();
const shots: { file: string; caption: string }[] = [];
const journey = (slug: string) => buildDomainJourney(JOURNEY_SPECS.find(s => `da-${s.slug}` === slug)!);

async function shot(page: Page, name: string, caption: string) {
  await page.waitForLoadState('networkidle').catch(() => {});
  // Scroll to the top first: a full-page capture taken mid-scroll draws the sticky top bar in the middle of the page.
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  fs.mkdirSync(OUT, { recursive: true });
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true });
  shots.push({ file: `${name}.png`, caption });
}
async function signIn(page: Page, email: string, password: string) {
  await page.context().clearCookies();
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL(u => !u.pathname.startsWith('/login'), { timeout: 180_000, waitUntil: 'commit' });
}

test.describe.configure({ mode: 'serial' });
test.afterAll(async () => {
  await prisma.$disconnect();
  const html = `<!doctype html><meta charset="utf-8"><title>Education tracks — evidence</title><style>body{font:15px/1.5 system-ui,sans-serif;margin:24px;background:#f4f6f9}.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px}figure{margin:0;background:#fff;border:1px solid #dde;border-radius:10px;overflow:hidden}img{width:100%;height:220px;object-fit:cover;object-position:top;display:block}figcaption{padding:8px 10px;font-size:13px}</style>
<h1>Education tracks — Playwright evidence</h1><p>${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC · ${shots.length} screenshots · local app and local database.</p>
<div class="g">${shots.map(s => `<figure><a href="${s.file}"><img src="${s.file}" alt=""></a><figcaption>${s.caption}</figcaption></figure>`).join('')}</div>`;
  fs.mkdirSync(OUT, { recursive: true }); fs.writeFileSync(path.join(OUT, 'index.html'), html);
});

test('Education tracks: quiz → choose → change in Module 1 → staff move → learner chooses → per-track standings → locked', async ({ page, baseURL }) => {
  test.setTimeout(1_800_000);
  const easy = journey('da-education-easy'), hard = journey('da-education'), inter = journey('da-education-intermediate');

  // 1. Sign-up: Education shows four tracks and the Ikigai quiz
  await page.goto('/register');
  await page.locator('#name').fill('Track Learner');
  await page.locator('#email').fill(EMAIL);
  await page.locator('#password').fill(PASSWORD);
  await page.locator('#birthYear').fill('2001');
  await page.getByLabel('Data Analytics by industry domain').check();
  await page.locator('#domainSelect').selectOption('education');
  await expect(page.getByRole('radio', { name: 'Critical track' })).toBeVisible();
  await page.getByText('Not sure? Find your track').click();
  for (let i = 0; i < 5; i++) await page.locator(`input[name="ikigai-${i}"]`).first().check();
  await expect(page.getByText('Recommended for you:')).toBeVisible();
  await shot(page, '01-signup-ikigai-quiz', 'Sign-up: Education has four tracks; the 5-question Ikigai quiz recommends one');
  await page.getByRole('radio', { name: 'Critical track' }).check();
  await expect(page.locator('#trackAck')).toBeVisible();
  await shot(page, '02-signup-critical-needs-ethics', 'Choosing Critical asks the learner to confirm the safeguarding and data-ethics rules');
  await page.getByRole('radio', { name: 'Easy track' }).check();
  await page.locator('#acceptTerms').check();
  await page.getByRole('button', { name: 'Create account' }).click();
  await page.waitForURL(/\/login/, { timeout: 180_000, waitUntil: 'commit' });

  // 2. Journey page: the learner's track, changeable during Module 1
  await signIn(page, EMAIL, PASSWORD);
  await page.goto('/levels');
  await expect(page.getByRole('heading', { name: /Easy: Catch-up radar/ })).toBeVisible({ timeout: 180_000 });
  await shot(page, '03-journey-easy-track', 'Journey page: Easy track, “you can change your track until you finish Module 1”');
  await page.goto(`/levels/${easy.levels[0].code}/days/1`);
  await expect(page.getByRole('heading', { name: /Your Easy track this module/ })).toBeVisible({ timeout: 180_000 });
  await shot(page, '04-easy-day-1', 'Easy track, Day 1: its own problem (Catch-up Radar) and this module’s deliverable');

  // 3. Do some Module 1 work, then change to Hard, keeping it
  const b = easy.levels[0].activities[0];
  const r = await page.request.post(`${baseURL}/api/v1/levels/${easy.levels[0].code}/activities/1`, { data: { choice: b.config.check.answer } });
  expect(r.ok(), await r.text()).toBeTruthy();
  await page.goto('/levels');
  await page.getByRole('button', { name: 'Change track' }).click();
  await page.getByRole('radio', { name: /Hard/ }).check();
  await page.getByRole('radio', { name: /Keep my Module 1 work/ }).check();
  await shot(page, '05-change-track-keep-work', 'During Module 1 the learner changes track and chooses: keep Module 1 work or restart');
  await page.getByRole('button', { name: 'Move to this track' }).click();
  await expect(page.getByRole('heading', { name: /Hard: Early-warning/ })).toBeVisible({ timeout: 180_000 });
  await shot(page, '06-journey-hard-track', 'Now on the Hard track; points are kept');

  // Hard track day page with the case-file situation (unlock the level locally to view a later day)
  const user = await prisma.user.findUniqueOrThrow({ where: { email: EMAIL } });
  const enr = await prisma.enrollment.findFirstOrThrow({ where: { userId: user.id, state: 'active' }, include: { journey: { include: { levels: true } } } });
  const l5 = enr.journey.levels.find(l => l.idx === 5)!;
  await prisma.progress.upsert({ where: { enrollmentId_levelId: { enrollmentId: enr.id, levelId: l5.id } }, update: { state: 'available' }, create: { tenantId: enr.tenantId, enrollmentId: enr.id, levelId: l5.id, userId: user.id, state: 'available', unlockedAt: new Date() } });
  await page.goto(`/levels/${hard.levels[4].code}/days/22`);
  await expect(page.getByRole('heading', { name: 'Today in the field' })).toBeVisible({ timeout: 180_000 });
  await shot(page, '07-hard-day-22-today-in-the-field', 'Hard track, Day 22: “Today in the field” — Arjun appears three times under three names');

  // 4. Staff: Settings → Learning tracks, then move the learner from their profile
  await signIn(page, ADMIN.email, ADMIN.password);
  await page.goto('/settings/tracks');
  await expect(page.getByRole('heading', { name: 'Who can change a learner’s track' })).toBeVisible({ timeout: 180_000 });
  await shot(page, '08-settings-learning-tracks', 'Settings → Learning tracks: which staff roles may move learners (Super Admin always)');
  await page.goto(`/settings/people/${user.id}`);
  await expect(page.getByRole('heading', { name: 'Learning track' })).toBeVisible({ timeout: 180_000 });
  await page.locator('#staffTrack').selectOption('intermediate');
  await page.locator('#staffTrackReason').fill('Your Module 1 canvas shows strong multi-source thinking; try the 360° profile problem.');
  await shot(page, '09-staff-move-learner', 'Learner profile (staff view): move to another track, with a reason');
  await page.getByRole('button', { name: 'Move learner' }).click();
  await expect(page.getByText(/has been asked to start the new track/)).toBeVisible({ timeout: 180_000 });
  await shot(page, '10-staff-move-sent', 'Sent: the learner decides how to continue; points are kept');

  // 5. Learner chooses to restart Module 1 on the new track
  await signIn(page, EMAIL, PASSWORD);
  await page.goto('/levels');
  await expect(page.getByText(/moved you to the Intermediate track/)).toBeVisible({ timeout: 180_000 });
  await page.getByRole('radio', { name: /Restart Module 1/ }).check();
  await shot(page, '11-learner-chooses-restart', 'The learner sees the staff change and chooses to restart Module 1');
  await page.getByRole('button', { name: /Start the Intermediate track/ }).click();
  await expect(page.getByRole('heading', { name: /Intermediate: Student 360/ })).toBeVisible({ timeout: 180_000 });
  await page.goto(`/levels/${inter.levels[0].code}/days/1`);
  await shot(page, '12-intermediate-day-1', 'Intermediate track, Day 1: a different problem, data and deliverables');

  // 6. Separate standings per track
  await page.goto('/leaderboard');
  await expect(page.getByRole('link', { name: 'Intermediate track' })).toBeVisible({ timeout: 180_000 });
  await shot(page, '13-standings-my-track', 'Standings: a separate board for learners on the same track');

  // 7. Track fixed after Module 1
  const e2 = await prisma.enrollment.findFirstOrThrow({ where: { userId: user.id, state: 'active' } });
  await prisma.progress.updateMany({ where: { enrollmentId: e2.id, level: { idx: 1 } }, data: { state: 'approved' } }); // simulate Module 1 approval
  await page.goto('/levels');
  await expect(page.getByText('You finished Module 1, so your track is fixed until Day 45.')).toBeVisible({ timeout: 180_000 });
  await expect(page.getByRole('button', { name: 'Change track' })).toHaveCount(0);
  await shot(page, '14-track-fixed-after-module-1', 'After Module 1 the track is fixed until Day 45, for the learner and for staff');
});
