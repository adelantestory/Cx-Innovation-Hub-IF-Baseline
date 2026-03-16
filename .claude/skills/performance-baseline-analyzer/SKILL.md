# Performance Baseline Analyzer Skill

## Purpose

Analyzes Locust performance test results (JSON/CSV output) against defined baseline thresholds and produces a structured pass/fail summary. Used after running performance tests locally or in CI/CD to determine whether the application meets performance requirements.

## When to Use

- **After local Locust test run** — Analyze results and report pass/fail
- **In CI/CD pipeline** — Parse results artifact and gate the build
- **Performance regression investigation** — Compare current vs. baseline metrics
- **Demo preparation** — Generate a visual summary of performance characteristics

## Triggers

- Locust test run completes (locally or in CI)
- Performance test results artifact is uploaded
- Developer asks "did the performance tests pass?"
- PR review needs performance summary

---

## Procedure

### Step 1: Locate Results Files

Locust generates these output files when run with `--csv=results/taskify`:

| File | Contents |
|------|----------|
| `results/taskify_stats.csv` | Per-endpoint aggregate statistics |
| `results/taskify_stats_history.csv` | Time-series data |
| `results/taskify_failures.csv` | Failed request details |
| `results/taskify_exceptions.csv` | Python exceptions |

For JSON output (with `--json`), look for the stats JSON in stdout.

### Step 2: Parse Stats CSV

Read `taskify_stats.csv` and extract for each endpoint:

| Column | Meaning |
|--------|---------|
| `Name` | Endpoint name (e.g., `GET /api/projects`) |
| `# Requests` | Total request count |
| `# Failures` | Failed request count |
| `Median Response Time` | p50 in ms |
| `95%` | p95 response time in ms |
| `99%` | p99 response time in ms |
| `Average Response Time` | Mean in ms |
| `Min Response Time` | Minimum in ms |
| `Max Response Time` | Maximum in ms |
| `Requests/s` | Throughput |

### Step 3: Apply Baseline Thresholds

Compare each endpoint against these baselines:

| Metric | Threshold | Severity |
|--------|-----------|----------|
| p95 response time (GET endpoints) | < 500ms | FAIL |
| p95 response time (POST/PUT/PATCH) | < 1000ms | FAIL |
| p95 response time (DELETE) | < 500ms | FAIL |
| p95 response time (Health check) | < 200ms | FAIL |
| Error rate (per endpoint) | < 1% | FAIL |
| Error rate (aggregate) | < 1% | FAIL |
| p99 response time (any) | < 2000ms | WARN |
| Median response time (GET) | < 200ms | WARN |

### Step 4: Generate Summary Report

Produce a markdown summary table:

```markdown
## Performance Test Results — [PASS/FAIL]

**Test Run**: 2026-03-16 10:30:00 UTC
**Duration**: 2 minutes | **Users**: 50 | **Spawn Rate**: 10/s

### Endpoint Results

| Endpoint | Requests | Failures | p50 | p95 | p99 | RPS | Status |
|----------|----------|----------|-----|-----|-----|-----|--------|
| GET /api/health | 245 | 0 (0%) | 12ms | 45ms | 89ms | 2.0 | ✅ PASS |
| GET /api/projects | 680 | 0 (0%) | 35ms | 120ms | 250ms | 5.7 | ✅ PASS |
| GET /api/projects/:id/tasks | 890 | 2 (0.2%) | 48ms | 180ms | 350ms | 7.4 | ✅ PASS |
| PATCH /api/tasks/:id/status | 450 | 0 (0%) | 65ms | 280ms | 510ms | 3.8 | ✅ PASS |
| POST /api/tasks/:taskId/comments | 320 | 0 (0%) | 78ms | 320ms | 680ms | 2.7 | ✅ PASS |
| **Aggregate** | **2585** | **2 (0.1%)** | **45ms** | **180ms** | **450ms** | **21.5** | **✅ PASS** |

### Baseline Comparison

| Metric | Baseline | Actual | Status |
|--------|----------|--------|--------|
| p95 GET response time | < 500ms | 180ms | ✅ |
| p95 POST/PATCH response time | < 1000ms | 320ms | ✅ |
| Overall error rate | < 1% | 0.1% | ✅ |
| Concurrent users sustained | 50 | 50 | ✅ |

### Verdict: ✅ ALL BASELINES MET
```

### Step 5: Flag Regressions

If any threshold is breached:

```markdown
### ⚠️ REGRESSIONS DETECTED

| Endpoint | Metric | Baseline | Actual | Severity |
|----------|--------|----------|--------|----------|
| PATCH /api/tasks/:id/status | p95 | < 1000ms | 1250ms | 🔴 FAIL |
| GET /api/projects | Error rate | < 1% | 2.3% | 🔴 FAIL |

### Recommended Actions
1. Investigate `PATCH /api/tasks/:id/status` — p95 exceeds 1000ms threshold
   - Check database query performance (UPDATE with JOINs)
   - Review connection pool configuration
2. Investigate `GET /api/projects` — Error rate at 2.3%
   - Check for timeout errors in Locust failures CSV
   - Review PostgreSQL connection limits
```

---

## CI/CD Integration

### Parse Results in GitHub Actions

```bash
#!/bin/bash
# Parse Locust CSV results and check thresholds
STATS_FILE="results/taskify_stats.csv"
FAIL=0

# Check aggregate error rate
ERROR_RATE=$(tail -1 "$STATS_FILE" | awk -F',' '{print ($4/$3)*100}')
if (( $(echo "$ERROR_RATE > 1.0" | bc -l) )); then
  echo "::error::Aggregate error rate ${ERROR_RATE}% exceeds 1% threshold"
  FAIL=1
fi

# Check p95 for each endpoint
while IFS=',' read -r type name requests failures p50 p66 p75 p80 p90 p95 p98 p99 rest; do
  if [[ "$name" == "Aggregated" ]]; then continue; fi
  if [[ "$type" == "GET" ]] && (( $(echo "$p95 > 500" | bc -l) )); then
    echo "::error::${type} ${name} p95=${p95}ms exceeds 500ms threshold"
    FAIL=1
  fi
  if [[ "$type" =~ ^(POST|PUT|PATCH)$ ]] && (( $(echo "$p95 > 1000" | bc -l) )); then
    echo "::error::${type} ${name} p95=${p95}ms exceeds 1000ms threshold"
    FAIL=1
  fi
done < <(tail -n +2 "$STATS_FILE")

exit $FAIL
```

---

## Validation Checklist

- [ ] Stats CSV file is accessible and properly formatted
- [ ] All endpoints in the stats have been evaluated against thresholds
- [ ] Error rate calculated correctly (failures / total requests * 100)
- [ ] Summary includes both per-endpoint and aggregate metrics
- [ ] Regressions are flagged with specific endpoint and metric details
- [ ] Recommended actions are actionable (not generic)
- [ ] Verdict is clear: PASS or FAIL with reasons

## Integration with Other Skills

- **Performance Test Generator**: Generates the tests that produce these results
- **Deployment Preflight**: Check infrastructure readiness before cloud-scale tests
