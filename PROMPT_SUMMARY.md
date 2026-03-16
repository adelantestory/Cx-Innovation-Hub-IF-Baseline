# Prompt Summary — Performance Testing Implementation

> **Purpose**: This document captures the prompt used to generate the entire performance testing implementation. You can provide this prompt (or a variation) to GitHub Copilot on github.com, Copilot CLI, or VS Code to recreate similar results for any project.

---

## The Prompt

```
I want to add end-to-end performance testing to this project. Here's what I need:

1. **Local Performance Tests (Locust + Python)**
   - Create Locust load tests in `concept/tests/performance/` that exercise all API endpoints
   - Include 4 weighted test scenarios: browsing projects (30%), kanban board drag-drop flow (40%), comment activity (20%), health checks (10%)
   - Set baselines: p95 < 500ms for GET, p95 < 1000ms for POST/PATCH, error rate < 1%, 50 concurrent users for 2 minutes
   - Tests should run against the local Docker Compose environment

2. **Copilot Skills (2 skills)**
   - Performance Test Generator: A skill that teaches Copilot how to generate Locust tests for new API endpoints following the project's patterns
   - Performance Baseline Analyzer: A skill that analyzes Locust CSV/JSON output against thresholds and produces a pass/fail summary

3. **Copilot Hooks (2 hooks)**
   - Pre-commit guardrail: Warns when API routes are modified without corresponding Locust test coverage
   - PR performance gate: Checks PRs that touch API code for performance test results and posts a summary comment

4. **Infrastructure (Bicep)**
   - Add Application Insights module linked to existing Log Analytics Workspace
   - Add Azure Load Testing module
   - Create a new stage5-performance.bicep that deploys both resources
   - Update deploy.sh to support stage 5
   - Wire App Insights connection string into the API container app

5. **GitHub Actions Pipeline**
   - Create `performance-testing.yml` workflow with two jobs:
     - Job 1: Local verification — spin up Docker Compose, run Locust headless, check thresholds, upload artifacts
     - Job 2: Cloud load test (conditional) — deploy to Azure Load Testing, query App Insights for errors
   - Trigger on manual dispatch and push to performance test files

6. **GitHub Agentic Workflow (gh-aw)**
   - Create `perf-analysis.md` agentic workflow that triggers after the performance pipeline completes
   - The AI agent downloads test artifacts, analyzes results against baselines, and creates GitHub issues for any regressions
   - Uses safe-outputs: create-issue with [perf-regression] prefix and auto-close older issues

7. **Spec Kit Updates**
   - Update .specify/specify.md with performance testing requirements
   - Update .specify/plan.md with a new performance testing stage
   - Update .specify/tasks.md with PERF task category (10 tasks)

8. **Branch Guardrail**
   - Create a hook that enforces all work stays on the current branch — no new branches allowed

9. **Demo Script (20 minutes)**
   - Create a structured demo script showing the full workflow: spec planning → test generation → local tests → hooks → CI/CD → agentic workflow → App Insights
   - Include pre-demo setup, troubleshooting, and cleanup instructions
   - Pre-seed a performance regression (setTimeout in one endpoint) so the agentic workflow has something to detect

Follow the existing project patterns:
- Bicep modules in concept/infrastructure/bicep/modules/ with standard header/params/outputs
- Skills as SKILL.md in .claude/skills/{name}/
- Hooks as .md files in .github/hooks/
- Workflows in .github/workflows/
- Spec Kit in concept/.specify/
- All code on the current branch only — never create new branches
```

---

## How to Use This Prompt

### On GitHub.com (Copilot in PR / Issue)
Paste the prompt above into a GitHub Issue or Copilot Chat. Copilot will generate implementation suggestions based on your repository context.

### With Copilot CLI
```bash
gh copilot suggest "Add Locust performance tests to my Express.js API with GitHub Actions pipeline and Azure Load Testing infrastructure"
```

### With VS Code Copilot Chat
Open Copilot Chat (Ctrl+Shift+I) and paste the prompt. Copilot will use the open workspace context to generate files.

### With Claude Code / Copilot CLI Agent
```bash
# From the project root
copilot "Add end-to-end performance testing: Locust tests, Copilot skills and hooks, Bicep infra for App Insights and Azure Load Testing, GitHub Actions pipeline, and a gh-aw agentic workflow for dynamic analysis. Follow existing project patterns."
```

---

## What Was Generated

| Component | Files | Description |
|-----------|-------|-------------|
| **Locust Tests** | `concept/tests/performance/locustfile.py`, `requirements.txt`, `README.md` | 4 weighted test scenarios against 13 API endpoints |
| **Skill: Test Generator** | `.claude/skills/performance-test-generator/SKILL.md` | Guides generating Locust tests for new endpoints |
| **Skill: Baseline Analyzer** | `.claude/skills/performance-baseline-analyzer/SKILL.md` | Analyzes results against thresholds |
| **Hook: Pre-commit** | `.github/hooks/pre-commit-perf-check.md` | Warns on missing perf test coverage |
| **Hook: PR Gate** | `.github/hooks/pr-perf-gate.md` | Posts perf summary on PRs |
| **Hook: Branch Guard** | `.github/hooks/branch-protection-guardrail.md` | Prevents branch creation |
| **Bicep: App Insights** | `concept/infrastructure/bicep/modules/app-insights.bicep` | Application Insights module |
| **Bicep: Load Testing** | `concept/infrastructure/bicep/modules/load-testing.bicep` | Azure Load Testing module |
| **Bicep: Stage 5** | `concept/infrastructure/bicep/stage5-performance.bicep` | Composes both modules |
| **Deploy Script** | `concept/infrastructure/deploy.sh` | Updated with stage 5 support |
| **GH Actions** | `.github/workflows/performance-testing.yml` | 2-job pipeline (local + cloud) |
| **Agentic Workflow** | `.github/workflows/perf-analysis.md` | AI agent for regression detection |
| **Spec Kit** | `concept/.specify/specify.md`, `plan.md`, `tasks.md` | Updated with perf testing |
| **Demo Script** | `DEMO_PERFORMANCE_TESTING.md` | 20-minute demo walkthrough |
| **Prompt Summary** | `PROMPT_SUMMARY.md` | This file |

---

## Key Design Decisions

1. **Locust (Python)** over k6/JMeter — lightweight, scriptable, works with Azure Load Testing
2. **Bicep** for infrastructure — matches existing project pattern (not Terraform)
3. **Agentic Workflows** for dynamic analysis — demonstrates Continuous AI alongside CI/CD
4. **Advisory hooks** (warn, don't block) — appropriate for demo/POC context
5. **Single branch** (`demo/performance-testing`) — enforced by guardrail hook
6. **Stage 5 isolation** — performance infra is a separate deployment stage, not mixed into foundation
