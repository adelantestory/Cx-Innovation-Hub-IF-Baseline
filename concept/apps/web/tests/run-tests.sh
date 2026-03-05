#!/usr/bin/env bash
# =============================================================================
# run-tests.sh — Run Playwright E2E tests in headed mode with HTML report
# =============================================================================
# Usage:
#   ./tests/run-tests.sh              # run all 5 test files
#   ./tests/run-tests.sh comments     # run a single test file by keyword
#
# Prerequisites:
#   docker compose up -d   (PostgreSQL, API, and Web must be running)
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPORT_DIR="$PROJECT_DIR/playwright-report"
RESULTS_LOG="$REPORT_DIR/test-results.log"

cd "$PROJECT_DIR"

# Determine which test files to run
if [[ $# -gt 0 ]]; then
  # Match keyword to a test file (e.g. "comments" → tests/comments.spec.ts)
  TEST_FILES=()
  for keyword in "$@"; do
    match=$(find tests -name "*${keyword}*.spec.ts" 2>/dev/null | head -1)
    if [[ -n "$match" ]]; then
      TEST_FILES+=("$match")
    else
      echo "⚠  No test file matching '$keyword' — skipping"
    fi
  done
  if [[ ${#TEST_FILES[@]} -eq 0 ]]; then
    echo "❌ No matching test files found. Available:"
    ls tests/*.spec.ts
    exit 1
  fi
else
  TEST_FILES=(tests/*.spec.ts)
fi

echo "═══════════════════════════════════════════════════════════════"
echo "  Taskify — Playwright E2E Tests  (headed mode)"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "  Files:  ${TEST_FILES[*]}"
echo "  Report: $REPORT_DIR/index.html"
echo ""

# Run Playwright in headed mode with the HTML reporter
npx playwright test "${TEST_FILES[@]}" \
  --headed \
  --reporter=html \
  2>&1 | tee "$RESULTS_LOG" || true

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  Test run complete"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "  Results log : $RESULTS_LOG"
echo "  HTML report : file://$(cd "$REPORT_DIR" && pwd)/index.html"
echo ""
echo "  To open the report in your browser:"
echo "    npx playwright show-report"
echo ""
