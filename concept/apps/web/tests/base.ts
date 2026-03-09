import { test as base, expect } from "@playwright/test";
import fs from "fs";

export { expect };

const MAX_PAUSE_MS = 10 * 60 * 1000; // 10-minute safety limit for pause polling

/**
 * Returns true for errors worth pausing on (timeout, element not found).
 * Assertion failures (expect().toBe, etc.) fail fast without pausing.
 */
function shouldPause(error: Error | undefined): boolean {
  if (!error) return false;
  const msg = error.message?.toLowerCase() || "";
  return (
    msg.includes("timeout") ||
    msg.includes("timed out") ||
    msg.includes("waiting for") ||
    msg.includes("not found") ||
    msg.includes("no element")
  );
}

/**
 * Extended test fixture that pauses on failure in headed mode.
 * The page is still alive during fixture teardown (after `await use(page)`),
 * so we can keep the browser window open for the user to inspect the failure.
 * Only pauses for timeout / element-not-found errors — assertion failures
 * complete immediately.
 */
export const test = base.extend({
  page: async ({ page }, use, testInfo) => {
    await use(page);

    if (
      process.env.PAUSE_ON_FAILURE === "1" &&
      shouldPause(testInfo.error) &&
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
