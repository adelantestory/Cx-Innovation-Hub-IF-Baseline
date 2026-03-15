import { test as base, expect } from "@playwright/test";
import fs from "fs";

export { expect };

const MAX_PAUSE_MS = 10 * 60 * 1000; // 10-minute safety limit for pause polling

/**
 * Extended test fixture that pauses on failure in headed mode.
 * The page is still alive during fixture teardown (after `await use(page)`),
 * so we can keep the browser window open for the user to inspect the failure.
 */
export const test = base.extend({
  page: async ({ page }, use, testInfo) => {
    await use(page);

    // After test body completes — page is still alive here.
    // Use testInfo.error (reliably set during teardown) instead of status comparison.
    if (
      process.env.PAUSE_ON_FAILURE === "1" &&
      testInfo.error &&
      process.env.CONTINUE_SIGNAL_FILE
    ) {
      // Notify the server via stderr (same JSONL format the readline handler expects)
      try {
        process.stderr.write(
          JSON.stringify({ event: "paused", title: testInfo.title }) + "\n"
        );
      } catch {
        // Ignore write errors
      }

      const signalFile = process.env.CONTINUE_SIGNAL_FILE;
      const startTime = Date.now();

      // Async-poll for the signal file — keeps the page alive and browser open
      while (
        !fs.existsSync(signalFile) &&
        Date.now() - startTime < MAX_PAUSE_MS
      ) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      try {
        fs.unlinkSync(signalFile);
      } catch {
        // Ignore cleanup errors
      }
    }
  },
});
