import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html", { outputFolder: "./tests/test results" }]],
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:5173",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
        },
      },
    },
  ],
  webServer: process.env.SKIP_WEBSERVER ? undefined : [
    {
      command: "npm run dev",
      cwd: "../api",
      port: 3000,
      reuseExistingServer: !process.env.CI,
      timeout: 30000,
    },
    {
      command: "npm run dev",
      port: 5173,
      reuseExistingServer: !process.env.CI,
      timeout: 30000,
    },
  ],
});
