import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import { discoverTests } from "./testDiscovery.js";
import { runTest, writeContinueSignal } from "./testRunner.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

const TESTS_DIR = path.resolve(__dirname, "../../web/tests");
const TEST_RESULTS_DIR = path.resolve(__dirname, "../../web/test-results");

const CI_OWNER = "AdelanteStory";
const CI_REPO = "Cx-Innovation-Hub-IF-Baseline";
const CI_WORKFLOW = "playwright-tests.yml";

app.use(cors({ origin: "http://localhost:5174" }));
app.use(express.json());

// Serve recorded test videos
app.use("/api/videos", express.static(TEST_RESULTS_DIR));

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Discover tests and merge with metadata into TestCatalog shape
app.get("/api/tests", (_req, res) => {
  try {
    const discoveredSuites = discoverTests(TESTS_DIR);

    // Load optional test metadata
    const metadataPath = path.resolve(__dirname, "../test-metadata.json");
    interface MetadataEntry {
      specFile: string;
      testSuite: string;
      testName: string;
      summary: string;
      objective: string;
      flow: { description: string; action: string }[];
      tags: string[];
    }
    let metadataList: MetadataEntry[] = [];
    if (fs.existsSync(metadataPath)) {
      try {
        const raw = fs.readFileSync(metadataPath, "utf-8");
        metadataList = JSON.parse(raw);
      } catch {
        console.warn("Failed to parse test-metadata.json, ignoring.");
      }
    }

    // Build lookup: "specFile:::testName" → metadata
    const metaMap = new Map<string, MetadataEntry>();
    for (const entry of metadataList) {
      metaMap.set(`${entry.specFile}:::${entry.testName}`, entry);
    }

    // Merge discovered tests with metadata
    let totalTests = 0;
    const suites = discoveredSuites.map((suite) => {
      const tests = suite.tests.map((t) => {
        totalTests++;
        const meta = metaMap.get(`${suite.specFile}:::${t.name}`);
        return {
          specFile: suite.specFile,
          testSuite: suite.name,
          testName: t.name,
          summary: meta?.summary ?? t.name,
          objective: meta?.objective ?? "No description available",
          flow: meta?.flow ?? [],
          tags: meta?.tags ?? [],
        };
      });
      return { name: suite.name, specFile: suite.specFile, tests };
    });

    res.json({ suites, totalTests });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: message });
  }
});

// Run tests via SSE — supports multiple specs, test names, and headed mode
app.get("/api/tests/run", (req, res) => {
  const specsParam = req.query.specs as string | undefined;
  const testsParam = req.query.tests as string | undefined;
  const headedParam = req.query.headed as string | undefined;

  if (!specsParam) {
    res.status(400).json({ error: "Missing 'specs' query parameter" });
    return;
  }

  const specFiles = specsParam.split(",").filter(Boolean);
  const testNames = testsParam ? testsParam.split(",").filter(Boolean) : null;
  const headed = headedParam === "true";

  runTest(specFiles, testNames, res, headed);
});

// Continue a paused headed test
app.post("/api/tests/continue", (_req, res) => {
  const ok = writeContinueSignal();
  res.json({ ok });
});

// ── CI Test Execution routes ────────────────────────────────────

function ghApi(endpoint: string): string {
  return execSync(
    `gh api ${endpoint}`,
    { encoding: "utf-8", timeout: 30000 }
  );
}

// Workflow summary — static step descriptions from the YAML
app.get("/api/ci/workflow", (_req, res) => {
  res.json({
    name: "Playwright Tests",
    steps: [
      "Checkout repository",
      "Initialize PostgreSQL database from SQL seeds",
      "Setup Node.js 20 with npm cache",
      "Install API and Web dependencies",
      "Install Playwright Chromium browser",
      "Run Playwright E2E tests",
      "Upload test report artifact (14-day retention)",
    ],
  });
});

// Last N workflow runs
app.get("/api/ci/runs", (_req, res) => {
  try {
    const raw = ghApi(
      `/repos/${CI_OWNER}/${CI_REPO}/actions/workflows/${CI_WORKFLOW}/runs?per_page=3`
    );
    const data = JSON.parse(raw);

    interface GHRun {
      id: number;
      name: string;
      status: string;
      conclusion: string | null;
      head_branch: string;
      head_sha: string;
      display_title: string;
      created_at: string;
      updated_at: string;
      html_url: string;
    }

    const runs = (data.workflow_runs as GHRun[]).map((r) => {
      const created = new Date(r.created_at).getTime();
      const updated = new Date(r.updated_at).getTime();
      const durationMs = updated - created;
      const mins = Math.floor(durationMs / 60000);
      const secs = Math.floor((durationMs % 60000) / 1000);
      return {
        id: r.id,
        name: r.name,
        status: r.status,
        conclusion: r.conclusion,
        branch: r.head_branch,
        commitSha: r.head_sha.slice(0, 7),
        commitMessage: r.display_title,
        duration: `${mins}m ${secs}s`,
        createdAt: r.created_at,
        url: r.html_url,
      };
    });

    res.json(runs);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: `Failed to fetch CI runs: ${message}` });
  }
});

// Trigger a workflow dispatch (optionally filtered to specific tests)
app.post("/api/ci/dispatch", (req, res) => {
  try {
    const testFilter: string = req.body?.testFilter ?? "";
    let cmd = `gh api -X POST /repos/${CI_OWNER}/${CI_REPO}/actions/workflows/${CI_WORKFLOW}/dispatches -f ref=demo/playwright-testing`;
    if (testFilter.trim()) {
      cmd += ` -f "inputs[test_filter]=${testFilter.trim()}"`;
    }
    execSync(cmd, { encoding: "utf-8", timeout: 15000 });
    res.json({ ok: true, message: "Workflow dispatch triggered" });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: `Failed to dispatch workflow: ${message}` });
  }
});

// Failure analysis for a specific run
app.get("/api/ci/failures/:runId", (req, res) => {
  try {
    const runId = req.params.runId;

    // Get jobs for this run
    const jobsRaw = ghApi(
      `/repos/${CI_OWNER}/${CI_REPO}/actions/runs/${runId}/jobs`
    );
    const jobsData = JSON.parse(jobsRaw);

    interface GHStep {
      name: string;
      status: string;
      conclusion: string | null;
    }
    interface GHJob {
      id: number;
      name: string;
      status: string;
      conclusion: string | null;
      steps: GHStep[];
    }

    const failedJobs = (jobsData.jobs as GHJob[]).filter(
      (j) => j.conclusion === "failure"
    );

    if (failedJobs.length === 0) {
      res.json({ failures: [], summary: "No failures found in this run." });
      return;
    }

    const failures: {
      job: string;
      step: string;
      error: string;
      suggestion: string;
    }[] = [];

    for (const job of failedJobs) {
      // Get job logs
      let logText = "";
      try {
        logText = execSync(
          `gh api /repos/${CI_OWNER}/${CI_REPO}/actions/jobs/${job.id}/logs`,
          { encoding: "utf-8", timeout: 30000 }
        );
      } catch {
        logText = "(Unable to retrieve logs)";
      }

      // Find failed steps
      const failedSteps = job.steps.filter(
        (s) => s.conclusion === "failure"
      );

      for (const step of failedSteps) {
        // Extract relevant error lines from the log
        const lines = logText.split("\n");
        const errorLines: string[] = [];
        for (const line of lines) {
          const lower = line.toLowerCase();
          if (
            lower.includes("error") ||
            lower.includes("failed") ||
            lower.includes("timeout") ||
            lower.includes("expect(") ||
            lower.includes("assert")
          ) {
            errorLines.push(line.trim());
          }
        }
        const errorSummary =
          errorLines.slice(0, 10).join("\n") ||
          `Step "${step.name}" failed (no detailed error in logs)`;

        failures.push({
          job: job.name,
          step: step.name,
          error: errorSummary,
          suggestion: generateSuggestion(step.name, errorSummary),
        });
      }
    }

    res.json({ failures });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res
      .status(500)
      .json({ error: `Failed to analyze run: ${message}` });
  }
});

function generateSuggestion(stepName: string, error: string): string {
  const lower = (stepName + " " + error).toLowerCase();
  if (lower.includes("timeout"))
    return "Consider increasing the test timeout or investigating slow page loads / network delays.";
  if (lower.includes("database") || lower.includes("pg_isready"))
    return "PostgreSQL service may not have started in time. Check the health-check config and ensure SQL seed scripts are valid.";
  if (lower.includes("install") || lower.includes("npm"))
    return "Dependency installation failed. Check for version conflicts or network issues in the runner environment.";
  if (lower.includes("playwright") || lower.includes("browser"))
    return "Browser installation or launch may have failed. Ensure 'npx playwright install chromium --with-deps' runs successfully.";
  if (lower.includes("expect(") || lower.includes("assert"))
    return "A test assertion failed. Review the expected vs. actual values and check if the application behavior has changed.";
  if (lower.includes("locator") || lower.includes("selector"))
    return "An element was not found on the page. Verify that CSS selectors or test IDs match the current DOM structure.";
  return "Review the error details above. Check if recent code changes may have affected this step.";
}

app.listen(PORT, () => {
  console.log(`E2E Testing Portal server running on http://localhost:${PORT}`);
  console.log(`Tests directory: ${TESTS_DIR}`);
});
