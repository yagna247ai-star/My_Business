// End-to-end flow against a running app (default http://localhost:3100).
// Start the app first (see docs/data-analytics-journey/practice/SETUP-WINDOWS.md for setup), then: npm run test:e2e
import { defineConfig, devices } from 'playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 120_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3100',
    trace: 'retain-on-failure',
    screenshot: 'off',
    viewport: { width: 1280, height: 900 },
  },
  // Uses the Google Chrome installed on this machine (Playwright's bundled Chromium is unsupported on macOS 12).
  projects: [{ name: 'chrome', use: { ...devices['Desktop Chrome'], channel: 'chrome' } }],
});
