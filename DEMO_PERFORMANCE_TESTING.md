# Performance Testing with GitHub Copilot — Demo Script

## Overview

- **Duration**: 20 minutes
- **Audience**: Developers familiar with GitHub and CI/CD
- **Goal**: Show how Copilot CLI + VS Code + GitHub Actions + Agentic Workflows create a complete performance testing pipeline from zero to cloud-scale

## Prerequisites (Pre-Demo Setup)

- Docker Desktop running
- Docker Compose services pre-built (`cd concept && docker compose build`)
- VS Code open with the project
- Terminal open in project root
- GitHub repository with Actions enabled
- Copilot CLI installed (`gh extension install github/gh-copilot`)
- gh-aw CLI installed (`gh extension install github/gh-aw`)
- Python 3.12+ with Locust installed
- Azure subscription with App Insights and Load Testing deployed (stage 5)
- **Pre-seed regression**: In `concept/apps/api/src/routes/tasks.js`, temporarily add `await new Promise(r => setTimeout(r, 600));` at the top of the `GET /projects/:projectId/tasks` handler to simulate a slow endpoint

---

## Demo Flow

### Act 1: The Story (0:00 — 2:00)

**Tools**: VS Code

"We have Taskify — a Kanban board built with Express.js and React, deployed to Azure Container Apps. The app works great... but how do we know it performs well? Today I'll show you how we went from zero performance testing to a full pipeline — local tests, CI/CD gates, cloud-scale load testing, and even an AI agent that automatically detects regressions."

- Open `concept/docs/ARCHITECTURE.md` — show the architecture diagram
- Open `concept/apps/api/src/routes/` — show the 4 route files (13 endpoints)
- "These are the endpoints we need to test under load"

### Act 2: Spec Kit Planning (2:00 — 5:00)

**Tools**: Copilot CLI (terminal)

"First, let's plan. This project uses Spec Kit — a specification-driven development pattern. Let's see what Copilot thinks we need."

- Show `concept/.specify/specify.md` — point out the Performance section
- Show `concept/.specify/tasks.md` — scroll to PERF tasks
- "Copilot helped us define 10 performance testing tasks following the same Spec Kit pattern as the rest of the project. Each task has an owner, priority, and dependencies."

Quick demo: Use Copilot CLI to ask about the spec:

```bash
gh copilot explain "What performance testing requirements are defined in concept/.specify/specify.md?"
```

### Act 3: Generating Tests with Copilot (5:00 — 9:00)

**Tools**: Copilot CLI + VS Code

"Now let's look at the Locust tests. These were generated with help from a Copilot skill."

- Open `.claude/skills/performance-test-generator/SKILL.md`
- "This skill teaches Copilot how to generate performance tests for our API. It knows our endpoint patterns, expected payloads, and response time thresholds."

- Open `concept/tests/performance/locustfile.py` in VS Code
- Walk through the 4 test scenarios:
  1. **browse_projects** (weight=3) — "Simulates users browsing the project list"
  2. **kanban_board_flow** (weight=4) — "The heaviest scenario — simulates drag-and-drop"
  3. **comment_activity** (weight=2) — "Posting and reading comments"
  4. **health_check** (weight=1) — "Basic heartbeat"

- Show the `on_start` method: "Each simulated user fetches real data to work with"
- Show the response time assertions: "Every request is validated against our baselines"

Use Copilot to explain a scenario:

```bash
gh copilot explain "How does the kanban_board_flow task in concept/tests/performance/locustfile.py simulate drag-and-drop?"
```

### Act 4: Running Local Tests (9:00 — 12:00)

**Tools**: Terminal + Browser

"Let's run the tests. First, spin up the app locally."

```bash
cd concept && docker compose up -d
```

(Should be pre-built, starts in seconds)

"Now run Locust with the web UI:"

```bash
cd tests/performance
locust -f locustfile.py --host=http://localhost:3000
```

- Open browser to `http://localhost:8089`
- Set: 50 users, spawn rate 10
- Click "Start swarming"
- Watch the live dashboard for ~30 seconds
- Point out:
  - Requests/sec chart climbing
  - Response time distribution
  - "Notice the tasks endpoint is slower than the rest — we'll see why soon"
- Stop the test
- Show the statistics table

"All endpoints under 500ms p95, error rate at 0%. Our baselines pass locally."

Stop Locust. Run headless to show CI-style output:

```bash
locust -f locustfile.py --host=http://localhost:3000 --headless -u 50 -r 10 -t 30s --csv=results/taskify
```

### Act 5: Guardrails — Hooks in Action (12:00 — 14:00)

**Tools**: VS Code + Terminal

"What happens when someone adds a new API endpoint but forgets to add performance tests? That's where Copilot hooks come in."

- Open `.github/hooks/pre-commit-perf-check.md`
- "This hook watches for changes to API routes and warns if there's no matching Locust test"

- Open `.github/hooks/pr-perf-gate.md`
- "And this hook checks PRs — it looks for performance test results and posts a summary comment"

- Show the concept: "Hooks are like guardrails. They don't block you, but they make sure you don't forget."

### Act 6: CI/CD Pipeline (14:00 — 17:00)

**Tools**: GitHub.com (browser) + VS Code

"Now let's see this in CI/CD."

- Open `.github/workflows/performance-testing.yml` in VS Code
- Walk through the two jobs:
  1. **local-verification**: "Same Locust test, but in a GitHub Actions runner with Docker Compose"
  2. **cloud-load-test**: "When enabled, pushes the test to Azure Load Testing for 100+ users"

- Switch to GitHub.com
- Go to Actions tab
- Show the Performance Testing workflow
- Either trigger it manually or show a pre-run result:
  - Click into the workflow run
  - Show the local-verification job logs
  - Show the step summary with the results table
  - Show the uploaded artifact (CSV + HTML report)

"The pipeline ran Locust against a fresh Docker Compose environment, verified all baselines, and uploaded the results. If any threshold was breached, the pipeline would fail."

### Act 7: The AI Agent — Agentic Workflows (17:00 — 19:00)

**Tools**: GitHub.com + VS Code

"Here's the really exciting part. After the performance pipeline runs, a GitHub Agentic Workflow kicks in."

- Open `.github/workflows/perf-analysis.md` in VS Code
- "This is written in natural language — not YAML. It tells an AI agent: download the test results, analyze them against our baselines, and if there's a regression, create a GitHub issue."

- Point out the frontmatter:
  - `on: workflow_run` — triggers after Performance Testing completes
  - `safe-outputs: create-issue` — the AI can create issues but nothing else
  - `tools: bash, github` — limited to read operations + safe outputs

- Switch to GitHub.com → Issues
- Show an issue created by the agentic workflow (pre-created or from a real run):
  - Title: `[perf-regression] Performance regression detected in GET /api/projects/:projectId/tasks`
  - Body: Results table, threshold comparison, recommended investigation steps

- "The agent found our pre-seeded regression — the tasks endpoint was responding at 750ms p95 instead of the 500ms threshold. It created an issue with all the details."

- "This is Continuous AI — not replacing CI/CD, but augmenting it with intelligent analysis."

### Act 8: App Insights & Wrap-up (19:00 — 20:00)

**Tools**: Azure Portal (or screenshot) + VS Code

"Finally, all of this is backed by real monitoring."

- Show `concept/infrastructure/bicep/stage5-performance.bicep`
- "Application Insights and Azure Load Testing are deployed as Bicep infrastructure — same pattern as everything else in the project."

- Show App Insights dashboard (Azure Portal or screenshot):
  - Live Metrics during a load test
  - Server response times
  - Failed requests
  - Dependencies (PostgreSQL calls)

"To recap what we built today:"

1. ✅ **Locust tests** — 4 realistic scenarios testing 13 API endpoints
2. ✅ **Copilot skills** — Generate tests and analyze results automatically
3. ✅ **Copilot hooks** — Guardrails that catch missing test coverage
4. ✅ **GitHub Actions** — Automated performance gate in CI/CD
5. ✅ **Agentic Workflow** — AI agent that creates regression issues
6. ✅ **Azure infrastructure** — App Insights + Load Testing via Bicep

"All of this was built with Copilot CLI and VS Code. The spec drove the implementation, the skills guided test generation, the hooks enforce quality, and the agentic workflow provides intelligent analysis. Questions?"

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Docker Compose slow to start | Pre-build: `docker compose build` before demo |
| Locust can't connect | Check `docker compose ps` — wait for API health check |
| No regression detected | Add `setTimeout(600)` to tasks.js GET handler |
| Agentic workflow not triggered | Ensure `gh aw compile perf-analysis` was run |
| Azure Load Testing fails | Check `Microsoft.LoadTestService` provider registration |

## Post-Demo Cleanup

```bash
# Remove the pre-seeded regression
# Edit concept/apps/api/src/routes/tasks.js
# Remove the setTimeout line

# Stop Docker Compose
cd concept && docker compose down -v

# Clean up Locust results
rm -rf concept/tests/performance/results/
```
