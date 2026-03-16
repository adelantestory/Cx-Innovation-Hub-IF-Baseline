# PR Performance Gate Hook

## Description

This Copilot hook activates on pull requests that modify API code. It verifies that performance tests have been run and checks whether results meet baseline thresholds before the PR can be merged.

## Trigger

- **Event**: Pull request opened or updated
- **Condition**: PR includes changes to files in:
  - `concept/apps/api/src/routes/`
  - `concept/apps/api/src/services/`
  - `concept/apps/api/src/middleware/`
  - `concept/tests/performance/`

## Behavior

### Check 1: Performance Test Existence

Verify that `concept/tests/performance/locustfile.py` exists and contains test scenarios. If not, post a warning comment on the PR.

### Check 2: Local Test Execution Evidence

Look for evidence that performance tests were run:

- Check if the `performance-testing` GitHub Actions workflow was triggered for this PR
- Look for Locust results artifacts attached to recent workflow runs
- Check PR comments for performance test summary (posted by the Performance Baseline Analyzer skill or the Agentic Workflow)

### Check 3: Results Analysis

If performance test results are available:

1. Download the Locust stats CSV from the workflow artifacts
2. Apply the Performance Baseline Analyzer skill to evaluate results
3. Post a summary comment on the PR with pass/fail status

### PR Comment Format

```markdown
## 🏋️ Performance Test Results

**Workflow Run**: [#123](link-to-run) | **Branch**: `feature/new-endpoint`

| Metric | Baseline | Actual | Status |
|--------|----------|--------|--------|
| p95 GET response time | < 500ms | 180ms | ✅ |
| p95 POST/PATCH response time | < 1000ms | 320ms | ✅ |
| Overall error rate | < 1% | 0.1% | ✅ |

**Verdict**: ✅ All performance baselines met

<details>
<summary>Per-endpoint breakdown</summary>

| Endpoint | p50 | p95 | Errors | Status |
|----------|-----|-----|--------|--------|
| GET /api/projects | 35ms | 120ms | 0% | ✅ |
| PATCH /api/tasks/:id/status | 65ms | 280ms | 0% | ✅ |
| POST /api/tasks/:taskId/comments | 78ms | 320ms | 0% | ✅ |

</details>
```

### When No Results Are Available

```markdown
## 🏋️ Performance Test Results

⚠️ **No performance test results found for this PR.**

This PR modifies API code but no performance test run was detected.

**To run performance tests:**
1. Locally: `cd concept/tests/performance && locust -f locustfile.py --host=http://localhost:3000 --headless -u 50 -r 10 -t 2m --csv=results/taskify`
2. CI/CD: Trigger the "Performance Testing" workflow manually or push to `concept/tests/performance/`

See `concept/tests/performance/README.md` for full instructions.
```

## Implementation Notes

- This hook is advisory — it posts comments but does not block merging
- Uses the Performance Baseline Analyzer skill for results interpretation
- Integrates with the `performance-testing.yml` GitHub Actions workflow
- The Agentic Workflow (`perf-analysis.md`) may also post comments independently
- Only activates when API-related code is changed (not frontend-only PRs)
