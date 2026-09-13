import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for Taskify E2E Tests
 * 
 * The application consists of:
 * - API server running on http://localhost:3000
 * - Web frontend running on http://localhost:5173
 */

// DEBUG: Log env vars at config load time
if (process.env.SLOW_MO) {
  console.log(`[PW Config] SLOW_MO=${process.env.SLOW_MO}`);
  console.log(`[PW Config] headless will be: ${!process.env.SLOW_MO}`);
  console.log(`[PW Config] slowMo will be: ${parseInt(process.env.SLOW_MO, 10)}`);
}

// When SLOW_MO is set (headed / demo mode) tests take longer per action,
// so scale the overall test timeout and per-assertion/action budgets accordingly.
const SLOW_MO_MS = process.env.SLOW_MO ? parseInt(process.env.SLOW_MO, 10) : 0;
const IS_SLOW = SLOW_MO_MS > 0;

// The e2e-portal sets SKIP_WEBSERVER=1 because it expects the API + web to be
// running already (either via `docker-compose up` or `npm run dev` in each app).
// When this flag is set, do NOT let Playwright try to start its own servers —
// otherwise it will time out at 60s waiting on ports that are unresponsive.
const SKIP_WEBSERVER = !!process.env.SKIP_WEBSERVER;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: IS_SLOW ? 0 : 1,
  workers: process.env.CI ? 1 : (IS_SLOW ? 1 : undefined),
  reporter: 'html',
  timeout: IS_SLOW ? 180_000 : 30_000,
  expect: {
    timeout: IS_SLOW ? 15_000 : 5_000,
  },

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: IS_SLOW ? 30_000 : 0,
    navigationTimeout: IS_SLOW ? 60_000 : 30_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        headless: !IS_SLOW,
        slowMo: IS_SLOW ? SLOW_MO_MS : undefined,
        video: process.env.RECORD_VIDEO ? 'on' : 'off',
      },
    },
  ],

  webServer: SKIP_WEBSERVER ? undefined : [
    {
      command: 'cd ../api && npm run dev',
      url: 'http://localhost:3000/api/health',
      reuseExistingServer: !process.env.CI,
      stdout: 'ignore',
      stderr: 'pipe',
    },
    {
      command: 'npm run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      stdout: 'ignore',
      stderr: 'pipe',
    },
  ],
});
