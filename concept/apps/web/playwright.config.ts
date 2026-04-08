import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for Taskify E2E Tests
 *
 * The application consists of:
 * - API server running on http://localhost:3000
 * - Web frontend running on http://localhost:5173
 *
 * In CI (CI=true), both servers are started fresh via the webServer config.
 * Locally, set reuseExistingServer to true by leaving CI unset so that
 * already-running dev servers (e.g. from `docker compose up`) are reused.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { outputFolder: 'playwright-report', open: 'never' }]],

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: [
    {
      command: 'cd ../api && npm start',
      url: 'http://localhost:3000/api/health',
      reuseExistingServer: !process.env.CI,
      stdout: 'pipe',
      stderr: 'pipe',
      timeout: 60_000,
    },
    {
      command: 'npm run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      stdout: 'pipe',
      stderr: 'pipe',
      timeout: 60_000,
    },
  ],
});
