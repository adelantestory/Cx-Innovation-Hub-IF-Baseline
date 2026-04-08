import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import os from "os";
import { createInterface } from "readline";
import { fileURLToPath } from "url";
import type { Response } from "express";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WEB_APP_DIR = path.resolve(__dirname, "../../web");
// Use relative path to avoid spaces in absolute Windows paths breaking shell args
const REPORTER_ABS = path.resolve(__dirname, "streaming-reporter.cjs");
const REPORTER_PATH = path.relative(WEB_APP_DIR, REPORTER_ABS);

// Signal file path for pause-on-failure (shared with /api/tests/continue endpoint)
let currentSignalFile: string | null = null;

export function writeContinueSignal(): boolean {
  if (!currentSignalFile) return false;
  try {
    fs.writeFileSync(currentSignalFile, "continue");
    return true;
  } catch {
    return false;
  }
}

interface TestMetaEntry {
  specFile: string;
  testName: string;
  summary: string;
  objective: string;
  flow: { description: string; action: string }[];
  tags: string[];
}

interface StreamEvent {
  event: string;
  total?: number;
  title?: string;
  suite?: string;
  status?: string;
  duration?: number;
  errors?: { message: string; snippet: string; stack: string }[];
  message?: string;
  retry?: number;
}

function loadMetadata(): Map<string, TestMetaEntry> {
  const map = new Map<string, TestMetaEntry>();
  const metaPath = path.resolve(__dirname, "../test-metadata.json");
  if (!fs.existsSync(metaPath)) return map;
  try {
    const raw = fs.readFileSync(metaPath, "utf-8");
    const entries: TestMetaEntry[] = JSON.parse(raw);
    for (const entry of entries) {
      map.set(entry.testName, entry);
    }
  } catch {
    console.warn("Failed to load test-metadata.json for enrichment.");
  }
  return map;
}

function sendSSE(res: Response, type: string, data: Record<string, unknown>) {
  res.write(`data: ${JSON.stringify({ type, data })}\n\n`);
}

function getSuggestion(errorMessage: string): { whatFailed: string; suggestion: string; severity: string } {
  const lower = errorMessage.toLowerCase();

  if (/timeout.*waiting/i.test(errorMessage) || /locator\.wait/i.test(errorMessage)) {
    return {
      whatFailed: "The test waited for an element to appear on the page, but it never showed up within the time limit.",
      suggestion: "Ensure the application is running and the page loads correctly. Check if the element selector is correct and the element is rendered by the app. If the app is slow, consider increasing the test timeout.",
      severity: "high",
    };
  }
  if (/page\.goto.*timeout/i.test(errorMessage) || /net::ERR_CONNECTION_REFUSED/i.test(errorMessage)) {
    return {
      whatFailed: "The test tried to navigate to the application URL, but the server didn't respond.",
      suggestion: "Make sure both the API server (port 3000) and the web app (port 5173) are running before executing tests. Start them with 'npm run dev' in the api/ and web/ directories.",
      severity: "critical",
    };
  }
  if (/expect\(received\)\.toBeVisible/i.test(errorMessage)) {
    return {
      whatFailed: "The test expected a specific element to be visible on the page, but it was either missing or hidden.",
      suggestion: "Verify that the UI component renders correctly. Check if the element has the right CSS selector or text content. The element might be conditionally rendered based on application state.",
      severity: "medium",
    };
  }
  if (/expect\(received\)\.toHaveText/i.test(errorMessage)) {
    return {
      whatFailed: "The text content of an element didn't match what the test expected.",
      suggestion: "Check if the data is loading correctly from the API. The displayed text might differ due to formatting, extra whitespace, or the data not being fetched yet. Verify the API returns the expected data.",
      severity: "medium",
    };
  }
  if (/expect\(received\)\.toHaveCount/i.test(errorMessage)) {
    return {
      whatFailed: "The test expected a specific number of elements on the page, but found a different count.",
      suggestion: "Verify that all expected items are rendered. This could indicate missing data from the API, a filtering issue, or elements not yet loaded. Check the seed data and API responses.",
      severity: "medium",
    };
  }
  if (/expect\(received\)\.toEqual/i.test(errorMessage) || /expect\(received\)\.toBe/i.test(errorMessage)) {
    return {
      whatFailed: "A value comparison failed — the actual value didn't match the expected value.",
      suggestion: "Review the expected vs. actual values in the error details. This often indicates a data mismatch, incorrect computation, or a changed API response format.",
      severity: "medium",
    };
  }
  if (/expect\(received\)\.toContainText/i.test(errorMessage)) {
    return {
      whatFailed: "The test expected an element to contain specific text, but the text was not found.",
      suggestion: "Check if the expected text is rendered by the component. The text might be loaded asynchronously or formatted differently than expected.",
      severity: "medium",
    };
  }
  if (/element is not attached/i.test(errorMessage) || /element was detached/i.test(errorMessage)) {
    return {
      whatFailed: "The test tried to interact with an element that was removed from the page during the operation.",
      suggestion: "This usually happens when the UI re-renders while the test is interacting with it. Add a wait for the element to be stable before interacting, or adjust the test to account for dynamic updates.",
      severity: "high",
    };
  }
  if (/element is not.*clickable/i.test(errorMessage) || /intercept/i.test(errorMessage)) {
    return {
      whatFailed: "The test tried to click an element, but another element was covering it or blocking the click.",
      suggestion: "Check for overlapping elements like modals, tooltips, or loading overlays. You may need to close a dialog, scroll the element into view, or wait for a loading state to complete.",
      severity: "medium",
    };
  }
  if (/drag/i.test(lower) && (/drop/i.test(lower) || /move/i.test(lower))) {
    return {
      whatFailed: "A drag-and-drop operation didn't complete successfully. The card may not have moved to the expected column.",
      suggestion: "Verify that the drag-and-drop library (@hello-pangea/dnd) is working correctly. Check that the keyboard-based drag sequence (Space → Arrow → Space) is being handled properly by the component.",
      severity: "high",
    };
  }
  if (/strict mode violation/i.test(errorMessage)) {
    return {
      whatFailed: "The selector matched multiple elements when only one was expected.",
      suggestion: "Make the selector more specific so it uniquely identifies a single element. Use text content, test IDs, or more specific CSS selectors to narrow down the match.",
      severity: "medium",
    };
  }
  if (/no element.*found/i.test(errorMessage) || /could not find/i.test(lower)) {
    return {
      whatFailed: "The test looked for an element on the page but couldn't find it at all.",
      suggestion: "Check if the element exists in the current view. It might require navigating to a different page, opening a modal, or the component might not render under current conditions.",
      severity: "high",
    };
  }
  if (/protocol error/i.test(errorMessage) || /browser.*closed/i.test(errorMessage)) {
    return {
      whatFailed: "The browser connection was lost during the test, possibly due to a crash or resource exhaustion.",
      suggestion: "This is often caused by insufficient system resources. Try closing other applications, or run tests with fewer parallel workers. If the issue persists, check for JavaScript errors that might crash the page.",
      severity: "critical",
    };
  }
  if (/navigation.*failed/i.test(errorMessage) || /ERR_NAME_NOT_RESOLVED/i.test(errorMessage)) {
    return {
      whatFailed: "The browser couldn't navigate to the requested URL.",
      suggestion: "Verify the BASE_URL is correct and the application server is running. Check for network issues or incorrect URL configuration.",
      severity: "critical",
    };
  }
  if (/expect\(received\)\.not/i.test(errorMessage)) {
    return {
      whatFailed: "An element or value that should NOT have been present was found on the page.",
      suggestion: "Check the application logic that determines when this element should be hidden or removed. The condition for hiding it may not be working correctly.",
      severity: "medium",
    };
  }

  return {
    whatFailed: "The test encountered an unexpected condition that didn't match the expected behavior.",
    suggestion: "Review the full error message and stack trace below. Check the application state and ensure the prerequisites for this test are met (correct user logged in, correct page loaded, data seeded properly).",
    severity: "medium",
  };
}

function buildAttemptedDescription(meta: TestMetaEntry | undefined): string {
  if (!meta || !meta.flow || meta.flow.length === 0) {
    return "Executed the test steps as defined in the spec file.";
  }
  return meta.flow.map((step, i) => `${i + 1}. ${step.description}`).join("\n");
}

function cleanErrorMessage(rawError: string): string {
  // Strip ANSI codes
  let cleaned = rawError.replace(/\x1b\[[0-9;]*m/g, "");
  // Remove file paths and line numbers for cleaner display
  cleaned = cleaned.replace(/\s+at\s+.+:\d+:\d+/g, "");
  // Remove call log lines (Playwright internals)
  cleaned = cleaned.replace(/Call log:[\s\S]*$/m, "").trim();
  // Truncate very long errors
  if (cleaned.length > 600) {
    cleaned = cleaned.substring(0, 600) + "…";
  }
  return cleaned;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findNewestVideo(dir: string): string | null {
  if (!fs.existsSync(dir)) return null;
  let newest: string | null = null;
  let newestTime = 0;

  function walk(d: string) {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.name.endsWith(".webm")) {
        const stat = fs.statSync(full);
        if (stat.mtimeMs > newestTime) {
          newestTime = stat.mtimeMs;
          newest = full;
        }
      }
    }
  }

  walk(dir);
  return newest;
}

export function runTest(specFiles: string[], testNames: string[] | null, res: Response, headed: boolean = false) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const metadata = loadMetadata();

  const args = ["playwright", "test", ...specFiles, `--reporter=${REPORTER_PATH}`, "--retries=0"];
  if (testNames && testNames.length > 0) {
    // Replace double quotes with '.' (regex any-char) to avoid breaking
    // cmd.exe shell quoting when the pattern is wrapped in double quotes
    const pattern = testNames.map((n) => escapeRegex(n).replace(/"/g, ".")).join("|");
    args.push("--grep", `"${pattern}"`);
  }
  if (headed) {
    args.push("--headed", "--workers=1");
  }

  const suiteLabel = specFiles.length === 1
    ? specFiles[0].replace(/\.spec\.ts$/, "")
    : `${specFiles.length} test suites`;

  // Send initialization progress
  sendSSE(res, "run:progress", {
    message: headed
      ? "🎬 Launching headed browser with slow-motion pacing…"
      : "Launching browser and loading application…",
    phase: "launching",
  });

  let testIndex = 0;
  let totalTests = 0;
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  let timedOut = 0;
  let totalDuration = 0;
  let currentSuiteName = suiteLabel;

  const env: Record<string, string | undefined> = { ...process.env, SKIP_WEBSERVER: "1" };
  if (headed) {
    env.SLOW_MO = "1000";
    env.RECORD_VIDEO = "1";
    env.PAUSE_ON_FAILURE = "1";
    env.TEST_TIMEOUT = "300000"; // 5 minutes to allow pause-on-failure inspection
    // Create a unique signal file path for pause-on-failure
    const signalFile = path.join(os.tmpdir(), `pw-continue-${Date.now()}.signal`);
    env.CONTINUE_SIGNAL_FILE = signalFile;
    currentSignalFile = signalFile;
  }

  const child = spawn("npx", args, {
    cwd: WEB_APP_DIR,
    shell: true,
    env,
  });

  // Parse stderr JSONL lines in real-time
  const rl = createInterface({ input: child.stderr });

  rl.on("line", (line: string) => {
    let event: StreamEvent;
    try {
      event = JSON.parse(line);
    } catch {
      return; // Ignore non-JSON stderr output
    }

    switch (event.event) {
      case "begin": {
        totalTests = event.total ?? 0;
        sendSSE(res, "run:start", {
          totalTests,
          specFile: specFiles.join(", "),
          suiteName: currentSuiteName,
        });
        sendSSE(res, "run:progress", {
          message: `Running ${totalTests} test${totalTests === 1 ? "" : "s"}…`,
          phase: "executing",
        });
        break;
      }

      case "testBegin": {
        // Skip retry attempts — only process first attempt
        if (event.retry && event.retry > 0) break;

        const title = event.title ?? "Unknown test";
        const meta = metadata.get(title);
        currentSuiteName = event.suite || currentSuiteName;

        const flowSteps = meta?.flow
          ? meta.flow.map((s) => s.description)
          : [title];

        sendSSE(res, "run:progress", {
          message: `Executing: ${title}`,
          phase: "executing",
        });

        sendSSE(res, "test:start", {
          testName: title,
          testIndex,
          totalTests,
          stepDescription: meta?.summary ?? title,
          objective: meta?.objective ?? "Validating application behavior",
          flowSteps,
        });
        break;
      }

      case "testEnd": {
        // Skip retry attempts — only process first attempt
        if (event.retry && event.retry > 0) break;

        const title = event.title ?? "Unknown test";
        const status = event.status ?? "failed";
        const duration = event.duration ?? 0;
        const meta = metadata.get(title);

        totalDuration += duration;

        const endData: Record<string, unknown> = {
          testName: title,
          testIndex,
          status,
          duration,
          objective: meta?.objective,
          attempted: buildAttemptedDescription(meta),
        };

        switch (status) {
          case "passed":
            passed++;
            break;
          case "failed": {
            failed++;
            const rawError = event.errors?.map((e) => e.message || e.snippet || "").join("\n") ?? "";
            const cleaned = cleanErrorMessage(rawError);
            const analysis = getSuggestion(rawError);
            endData.error = cleaned;
            endData.whatFailed = analysis.whatFailed;
            endData.suggestion = analysis.suggestion;
            endData.severity = analysis.severity;
            break;
          }
          case "skipped":
            skipped++;
            break;
          case "timedOut": {
            timedOut++;
            const analysis = getSuggestion("Timeout waiting for element");
            endData.error = "Test timed out — the operation exceeded the maximum allowed time.";
            endData.whatFailed = analysis.whatFailed;
            endData.suggestion = analysis.suggestion;
            endData.severity = "high";
            break;
          }
        }

        sendSSE(res, "test:end", endData);
        testIndex++;
        break;
      }

      case "end": {
        sendSSE(res, "run:end", {
          passed,
          failed,
          skipped,
          timedOut,
          totalDuration,
        });
        break;
      }

      case "paused": {
        sendSSE(res, "run:paused", {
          testName: event.title ?? "Unknown test",
        });
        break;
      }

      case "error": {
        sendSSE(res, "run:error", {
          message: event.message ?? "Unknown error occurred",
        });
        break;
      }
    }
  });

  // Handle stdout (not used with streaming reporter, but capture for debugging)
  child.stdout.on("data", () => {
    // Streaming reporter writes to stderr; stdout is unused
  });

  child.on("error", (err) => {
    sendSSE(res, "run:error", { message: `Failed to start test runner: ${err.message}` });
    res.end();
  });

  child.on("close", (code) => {
    // Clean up signal file
    if (headed && currentSignalFile) {
      try { fs.unlinkSync(currentSignalFile); } catch { /* ignore */ }
      currentSignalFile = null;
    }

    // If "end" event wasn't received from the reporter, send fallback
    if (testIndex === 0 && totalTests === 0) {
      sendSSE(res, "run:error", {
        message: `Playwright process exited with code ${code}. Ensure the application is running and Playwright is installed in the web app directory.`,
      });
    }

    // If headed mode, look for a recorded video
    if (headed) {
      try {
        const testResultsDir = path.resolve(WEB_APP_DIR, "test-results");
        const videoFile = findNewestVideo(testResultsDir);
        if (videoFile) {
          const relativePath = path.relative(testResultsDir, videoFile).replace(/\\/g, "/");
          sendSSE(res, "run:video", { videoUrl: `/api/videos/${relativePath}` });
        }
      } catch {
        // Video discovery is best-effort
      }
    }

    res.end();
  });

  // Handle client disconnect
  res.on("close", () => {
    rl.close();
    child.kill();
  });
}
