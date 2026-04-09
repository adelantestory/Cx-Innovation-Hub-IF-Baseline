import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for Taskify E2E Tests
 * 
 * The application consists of:
 * - API server running on http://localhost:3000
 * - Web frontend running on http://localhost:5173
 * 
 * Browser projects:
 *   - chromium  (Desktop Chrome)
 *   - firefox   (Desktop Firefox)
 *   - webkit    (Desktop Safari)
 * 
 * In CI each browser is run as a separate matrix job so failures are
 * reported independently and don't block each other.
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
    video: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: [
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
