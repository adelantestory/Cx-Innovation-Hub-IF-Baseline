import { defineConfig, devices } from '@playwright/test';

const skipWebServer = process.env.PLAYWRIGHT_SKIP_WEBSERVER === '1';

/**
 * Playwright Configuration for Taskify E2E Tests
 *
 * The application consists of:
 * - API server running on http://localhost:3000
 * - Web frontend running on http://localhost:5173
 *
 * In CI we usually start the stack once via Docker Compose and reuse those
 * services instead of launching the Vite/Express dev servers from Playwright.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

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

  webServer: skipWebServer
    ? undefined
    : [
        {
          command: 'cd ../../apps/api && npm run dev',
          url: 'http://localhost:3000',
          reuseExistingServer: !process.env.CI,
          stdout: 'ignore',
          stderr: 'pipe',
        },
        {
          command: 'cd ../../apps/web && npm run dev',
          url: 'http://localhost:5173',
          reuseExistingServer: !process.env.CI,
          stdout: 'ignore',
          stderr: 'pipe',
        },
      ],
});
