import { defineConfig, devices } from "@playwright/test";

const slowMo = parseInt(process.env.SLOW_MO || "0", 10);
const recordVideo = process.env.RECORD_VIDEO === "1";
const testTimeout = parseInt(process.env.TEST_TIMEOUT || "30000", 10);

export default defineConfig({
  testDir: "./tests",
  timeout: testTimeout,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["html", { outputFolder: "./tests/test results", open: "never" }],
  ],
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:5173",
    trace: "on-first-retry",
    ...(recordVideo && {
      video: { mode: "on" as const, size: { width: 1280, height: 720 } },
    }),
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
          slowMo,
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
