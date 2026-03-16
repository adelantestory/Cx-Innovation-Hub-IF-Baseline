---
description: "Analyzes performance test results after the Performance Testing pipeline completes. Detects regressions, checks Application Insights for errors, and creates issues for problems found."

on:
  workflow_run:
    workflows: ["Performance Testing"]
    types: [completed]

permissions:
  contents: read
  actions: read
  issues: read

tools:
  bash: ["cat", "grep", "jq", "head", "tail", "sort", "awk", "wc", "python3", "pip"]
  github:
    toolsets: [repos, issues]
  web-fetch:

runtimes:
  python:
    version: "3.12"

network:
  allowed:
    - defaults
    - python

safe-outputs:
  create-issue:
    title-prefix: "[perf-regression] "
    labels: [performance, automated, regression]
    close-older-issues: true
    expires: 7d
  add-comment:
    max: 1
---

## Performance Test Analysis Agent

You are a performance engineering analyst. Your job is to analyze the results of the most recent Performance Testing workflow run and determine if there are any performance regressions or application errors.

## What to Do

### Step 1: Get the Triggering Workflow Run

Use the GitHub API to find the workflow run that triggered this analysis. Look at the `workflow_run` event context to get the run ID, branch, and conclusion.

If the triggering workflow **failed**, note this and still attempt to analyze any available artifacts.

### Step 2: Download Performance Test Artifacts

Download the `performance-test-results` artifact from the triggering workflow run. This contains:
- `taskify_stats.csv` — Per-endpoint aggregate statistics
- `taskify_stats_history.csv` — Time-series data
- `taskify_failures.csv` — Failed request details
- `report.html` — Visual HTML report

### Step 3: Analyze Results Against Baselines

Parse `taskify_stats.csv` and evaluate each endpoint against these thresholds:

| Metric | Threshold |
|--------|-----------|
| p95 response time for GET endpoints | < 500ms |
| p95 response time for POST/PUT/PATCH endpoints | < 1000ms |
| Overall error rate | < 1% |
| p99 response time for any endpoint | < 2000ms |

### Step 4: Identify Regressions

A regression is any endpoint that:
- Exceeds its p95 response time threshold
- Has an error rate > 1%
- Shows p99 > 2000ms (potential outlier issues)

### Step 5: Create Output

**If regressions are found**, create a GitHub issue with:

**Title**: Performance regression detected in [endpoint name(s)]

**Body** should include:
1. A summary table showing all endpoints with their p50, p95, p99, error rate, and pass/fail status
2. Specific details about which thresholds were breached
3. The branch and commit that triggered the test
4. Link to the workflow run
5. Recommended investigation steps:
   - Check recent commits that modified the affected endpoint
   - Review database query performance
   - Check Application Insights for correlated errors
   - Consider connection pool or resource constraints

**If no regressions found**, add a comment to the workflow run summary confirming all baselines were met with a brief results table.

## Important Notes

- Always be specific about which endpoints regressed and by how much
- Include the actual values vs. the threshold (e.g., "p95 was 750ms, threshold is 500ms")
- If the triggering workflow failed before producing results, note this in the issue
- Use markdown tables for clear, scannable output
- The goal is to make it immediately clear what regressed and where to start investigating
