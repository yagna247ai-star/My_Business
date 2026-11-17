import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:4200';

test.describe('Smallest AI x MyApps CRM - E2E Automation Suite', () => {

  test('1. System Header & Live Telemetry Verification', async ({ page }) => {
    await page.goto(BASE_URL);

    // Verify Title & Brand Header
    await expect(page).toHaveTitle(/Smallest AI|Frontend/);
    const header = page.locator('header');
    await expect(header).toContainText('Smallest AI');
    await expect(header).toContainText('MyApps CRM');

    // Verify System Port Badges
    await expect(header).toContainText(':8000');
    await expect(header).toContainText('Redis:');
  });

  test('2. Ingested Lead Queue & Dispatcher Tab', async ({ page }) => {
    await page.goto(BASE_URL);

    // Click Lead CSV & Call Dispatcher tab
    const dispatcherTab = page.locator("button:has-text('Lead CSV & Call Dispatcher')");
    await dispatcherTab.click();

    // Verify Table Headers
    const tableHeader = page.locator('table thead');
    await expect(tableHeader).toContainText('Name');
    await expect(tableHeader).toContainText('Phone');
    await expect(tableHeader).toContainText('Status');

    // Verify Campaign Buttons
    await expect(page.locator("button:has-text('Launch Voice Agent Campaign')")).toBeVisible();
    await expect(page.locator("button:has-text('Sync & Call MyAppz CRM Leads')")).toBeVisible();
  });

  test('3. MyApps CRM Kanban Board Stages', async ({ page }) => {
    await page.goto(BASE_URL);

    // Click CRM Kanban Board tab
    const crmTab = page.locator("button:has-text('MyApps CRM Kanban Board')");
    await crmTab.click();

    // Check pipeline stage headings
    const headings = page.locator('h3');
    await expect(headings.filter({ hasText: 'Called' })).toBeVisible();
    await expect(headings.filter({ hasText: 'Demo Scheduled' })).toBeVisible();
    await expect(headings.filter({ hasText: 'Quote Sent' })).toBeVisible();
    await expect(headings.filter({ hasText: 'Opted Out' })).toBeVisible();
  });

  test('4. Redis Cache Inspector & Telemetry', async ({ page }) => {
    await page.goto(BASE_URL);

    // Switch to Redis tab
    const redisTab = page.locator("button:has-text('Redis Cache Inspector')");
    await redisTab.click();

    // Verify telemetry section
    await expect(page.locator('h3:has-text("Redis Telemetry")')).toBeVisible();
    await expect(page.locator('h3:has-text("Redis Keys & Locks Explorer")')).toBeVisible();
  });

  test('5. Devil\'s Advocate Crash-Testing Audit Suite', async ({ page }) => {
    await page.goto(BASE_URL);

    // Switch to Audit tab
    const auditTab = page.locator("button:has-text('Devil')");
    await auditTab.click();

    // Verify audit scenario options
    await expect(page.locator('h4:has-text("1. API Rate Limit")')).toBeVisible();
    await expect(page.locator('h4:has-text("2. Webhook Replay")')).toBeVisible();
    await expect(page.locator('h4:has-text("3. CRM Server Downtime")')).toBeVisible();
    await expect(page.locator('h4:has-text("4. DNC Consent Violation")')).toBeVisible();

    // Run Full Audit
    const auditBtn = page.locator("button:has-text('Run Full ARB & NFR Audit')");
    await auditBtn.click();
    await page.waitForTimeout(1000);

    // Verify output in console pre tag
    const preOutput = page.locator('.font-mono pre');
    await expect(preOutput).toBeVisible();
  });

  test('6. API Key & Configuration Settings Modal', async ({ page }) => {
    await page.goto(BASE_URL);

    // Open Config Modal
    const configBtn = page.locator("button:has-text('Config & API Key')");
    await configBtn.click();

    // Check modal visibility & input fields
    const modalTitle = page.locator("h3:has-text('System Configuration')");
    await expect(modalTitle).toBeVisible();

    // Cancel modal
    const cancelBtn = page.locator("button:has-text('Cancel')");
    await cancelBtn.click();
    await expect(modalTitle).not.toBeVisible();
  });

});
