import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for Taskify E2E Tests
 *
 * The application consists of:
 * - API server running on http://localhost:3000
 * - Web frontend running on http://localhost:5173
 *
 * In CI: both servers are started directly (Node.js + Vite dev server) so
 * that they can connect to the PostgreSQL service already running in the
 * GitHub Actions environment.
 *
 * Locally: docker compose up launches the full stack including the database.
 */

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: 1,
  workers: isCI ? 1 : undefined,
  reporter: [['html', { outputFolder: 'tests/test results', open: 'never' }]],

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

  webServer: isCI
    ? [
        // In CI: start the API server directly — PostgreSQL is already
        // provided as a GitHub Actions service container on localhost:5432.
        {
          command: 'node src/index.js',
          cwd: '../api',
          url: 'http://localhost:3000',
          reuseExistingServer: false,
          stdout: 'pipe',
          stderr: 'pipe',
        },
        // In CI: start the Vite dev server directly.
        {
          command: 'npm run dev',
          url: 'http://localhost:5173',
          reuseExistingServer: false,
          stdout: 'pipe',
          stderr: 'pipe',
        },
      ]
    : {
        // Locally: docker compose starts the full stack (db + api + web).
        command: 'docker compose up',
        cwd: '../..',
        url: 'http://localhost:5173',
        reuseExistingServer: true,
        stdout: 'ignore',
        stderr: 'pipe',
      },
});
