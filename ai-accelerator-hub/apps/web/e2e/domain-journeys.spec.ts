/**
 * Evidence run for the 17 domain journeys (spec: docs/DOMAIN_ANALYTICS_JOURNEYS_SPEC.md).
 * For every domain: register choosing the domain → journey map → day pages for every stage → Module 1 screenshot
 * evidence (validated, XP) → Module 2 dataset check (fail, then pass, XP) → points in the standings.
 * Screenshots: e2e/proof/domains/<slug>/NN-name.png, plus an index page e2e/proof/domains/index.html.
 *
 * Run against a local app with a seeded local database (never production):
 *   DATABASE_URL=<local db> BASE_URL=http://localhost:3100 npx playwright test e2e/domain-journeys.spec.ts
 * Modules unlock after a reviewer approves the previous one; this run unlocks them directly in the local database
 * (simulating approval) so every stage's day pages can be captured.
 */
import { test, expect, type Page } from 'playwright/test';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { DOMAINS } from '../lib/domain/daDomains/catalog';
import { buildDomainJourney, sampleCsv } from '../lib/domain/daDomains/curriculum';
import { makePng } from '../test/helpers/png';

const OUT = path.join(__dirname, 'proof', 'domains');
const RUN = Date.now().toString(36);
const PASSWORD = 'Domain-Learner-2026';
const prisma = new PrismaClient();
const captured: Record<string, { file: string; caption: string }[]> = {};

/** Day pages captured per domain: one per stage, showing the steps, code and AI prompts. */
const KEY_DAYS: [number, string][] = [[1, 'problem'], [3, 'kpi-business-case-sla'], [7, 'ai-prompt-structured-data'], [12, 'unity-catalog-dev-prod'], [15, 'masks-row-filters'], [19, 'auto-loader'], [24, 'lakeflow-expectations'], [27, 'scd-type-2'], [32, 'power-bi-rls'], [38, 'mlflow'], [43, 'jobs-asset-bundles'], [45, 'go-live-review']];

async function shot(page: Page, slug: string, name: string, caption: string) {
  await page.waitForLoadState('networkidle').catch(() => {});
  const dir = path.join(OUT, slug); fs.mkdirSync(dir, { recursive: true });
  await page.screenshot({ path: path.join(dir, `${name}.png`), fullPage: true });
  (captured[slug] ??= []).push({ file: `${slug}/${name}.png`, caption });
}

async function api(page: Page, url: string, body: unknown) {
  const r = await page.request.post(url, { data: body });
  expect(r.ok(), `${url}: ${await r.text()}`).toBeTruthy();
  return r.json();
}

test.describe.configure({ mode: 'serial' });
test.afterAll(async () => {
  await prisma.$disconnect();
  const doms = DOMAINS.filter(d => captured[d.slug]);
  const html = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Domain journeys — evidence</title>
<style>body{font:15px/1.5 system-ui,sans-serif;margin:24px;color:#1a1a1a;background:#faf8f4}h1{margin:0 0 4px}h2{margin:32px 0 8px;border-top:1px solid #ddd;padding-top:16px}.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px}figure{margin:0;background:#fff;border:1px solid #e3ded4;border-radius:10px;overflow:hidden}figure img{width:100%;height:180px;object-fit:cover;object-position:top;display:block;border-bottom:1px solid #eee}figcaption{padding:8px 10px;font-size:13px}nav a{margin-right:10px}</style>
<h1>Domain-based Data Analytics journeys — Playwright evidence</h1><p>Run ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC · ${doms.length} of ${DOMAINS.length} domains · ${Object.values(captured).flat().length} screenshots. Local app and local test database; modules after Module 1 were unlocked directly to capture every stage.</p>
<nav>${doms.map(d => `<a href="#${d.slug}">${d.name}</a>`).join('')}</nav>
${doms.map(d => `<h2 id="${d.slug}">${d.name} — ${d.problem.title}</h2><div class="g">${captured[d.slug].map(c => `<figure><a href="${c.file}"><img src="${c.file}" alt="${c.caption}"></a><figcaption>${c.caption}</figcaption></figure>`).join('')}</div>`).join('\n')}`;
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'index.html'), html);
});

for (const d of DOMAINS) {
  test(`${d.name}: register → 45-day journey → evidence → dataset check → points`, async ({ page, baseURL }) => {
    test.setTimeout(300_000);
    const j = buildDomainJourney(d);
    const m1 = j.levels[0], m2 = j.levels[1];
    const email = `e2e.${d.slug}.${RUN}@example.test`;

    // 1. Registration with the domain chosen
    await page.goto('/register');
    await page.locator('#name').fill(`${d.name.split(' ')[0]} Learner`);
    await page.locator('#email').fill(email);
    await page.locator('#password').fill(PASSWORD);
    await page.locator('#birthYear').fill('2000');
    await page.getByLabel('Data Analytics by industry domain').check();
    await page.locator('#domainSelect').selectOption(j.slug);
    await page.locator('#acceptTerms').check();
    await shot(page, d.slug, '01-register-domain', `Registration: “${d.name}” chosen from 17 domains`);
    await page.getByRole('button', { name: 'Create account' }).click();
    await page.waitForURL(/\/login/, { timeout: 60_000 });

    // 2. Sign in
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL(u => !u.pathname.startsWith('/login'), { timeout: 60_000 });

    // 3. Journey map (9 modules)
    await page.goto('/levels');
    await expect(page.getByText(m1.title).first()).toBeVisible({ timeout: 60_000 });
    await shot(page, d.slug, '02-journey-map', 'Journey map: 9 modules, 45 days');

    // Simulate reviewer approvals so every module can be opened in this evidence run.
    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    const enr = await prisma.enrollment.findFirstOrThrow({ where: { userId: user.id, state: 'active' }, include: { journey: { include: { levels: true } } } });
    for (const lv of enr.journey.levels) {
      await prisma.progress.upsert({ where: { enrollmentId_levelId: { enrollmentId: enr.id, levelId: lv.id } }, update: { state: lv.idx === 1 ? undefined : 'available' }, create: { tenantId: enr.tenantId, enrollmentId: enr.id, levelId: lv.id, userId: user.id, state: 'available', unlockedAt: new Date() } });
    }

    // 4. Day pages: one per stage (steps, code, AI prompts)
    for (const [day, label] of KEY_DAYS) {
      const lv = j.levels[Math.floor((day - 1) / 5)];
      await page.goto(`/levels/${lv.code}/days/${day}`);
      await expect(page.getByRole('heading', { name: new RegExp(`Day ${day}\\b`) }).first()).toBeVisible({ timeout: 60_000 });
      await shot(page, d.slug, `03-day-${String(day).padStart(2, '0')}-${label}`, `Day ${day}: ${lv.days[(day - 1) % 5].title}`);
    }

    // 5. Module 1: briefing + learn (answers from the same generator the server used), then screenshot evidence in the UI
    const a1 = m1.activities;
    await api(page, `${baseURL}/api/v1/levels/${m1.code}/activities/1`, { choice: a1[0].config.check.answer });
    await api(page, `${baseURL}/api/v1/levels/${m1.code}/activities/2`, { answers: a1[1].config.quiz.map((q: { answer: number }) => q.answer) });
    await page.goto(`/levels/${m1.code}?a=3`);
    await page.getByRole('button', { name: /Activity 3:/ }).click();
    await page.getByLabel('Screenshot file').setInputFiles({ name: 'problem-canvas.png', mimeType: 'image/png', buffer: makePng(1280, 720, d.slug.length) });
    for (const box of await page.locator('fieldset input[type=checkbox]').all()) await box.check();
    await shot(page, d.slug, '04-m1-screenshot-ready', 'Module 1 evidence: screenshot chosen, checklist ticked');
    await page.getByRole('button', { name: 'Submit screenshot' }).click();
    await expect(page.getByText(/Screenshot evidence accepted/)).toBeVisible({ timeout: 60_000 });
    await shot(page, d.slug, '05-m1-screenshot-accepted', `Screenshot validated · +${a1[2].xp} XP`);

    // 6. Module 2: dataset check — a failing file, then a passing one
    const a2 = m2.activities;
    await api(page, `${baseURL}/api/v1/levels/${m2.code}/activities/1`, { choice: a2[0].config.check.answer });
    await api(page, `${baseURL}/api/v1/levels/${m2.code}/activities/2`, { answers: a2[1].config.quiz.map((q: { answer: number }) => q.answer) });
    await page.goto(`/levels/${m2.code}?a=3`);
    await page.getByRole('button', { name: /Activity 3:/ }).click();
    await expect(page.getByRole('heading', { name: /Expected columns/ })).toBeVisible();
    const good = sampleCsv(j.schemas.dataset, 120);
    // A broken file: one required column removed from every row (sample values never contain commas).
    const dropped = j.schemas.dataset.columns.find(c => !c.key && c.required !== false)!.name;
    const at = good.split('\n')[0].split(',').indexOf(dropped);
    const badCsv = good.split('\n').map(line => line ? line.split(',').filter((_, i) => i !== at).join(',') : line).join('\n');
    await page.getByLabel('Dataset file').setInputFiles({ name: `${j.schemas.dataset.name}.csv`, mimeType: 'text/csv', buffer: Buffer.from(badCsv) });
    await page.getByRole('button', { name: /Check my dataset/ }).click();
    await expect(page.getByText('Some checks failed')).toBeVisible({ timeout: 60_000 });
    await shot(page, d.slug, '06-m2-dataset-check-failed', `Dataset check failed: column “${dropped}” missing (no XP)`);
    await page.getByLabel('Dataset file').setInputFiles({ name: `${j.schemas.dataset.name}.csv`, mimeType: 'text/csv', buffer: Buffer.from(good) });
    await page.getByRole('button', { name: /Check my dataset|Check again/ }).click();
    await expect(page.getByText('All checks passed')).toBeVisible({ timeout: 60_000 });
    await shot(page, d.slug, '07-m2-dataset-check-passed', `Dataset check passed: 120 rows · +${a2[2].xp} XP`);

    // 7. Points and standings
    await page.goto('/leaderboard');
    await expect(page.locator('main')).toContainText(/XP|points/i, { timeout: 60_000 });
    await shot(page, d.slug, '08-standings', 'Points flow into the standings');
  });
}
