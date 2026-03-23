# Taskify Copilot Demo Playbook

**Delante Solutions LLC | GitHub Copilot Customer Demo**
**Repo:** `adelantestory/Cx-Innovation-Hub-IF-Baseline`

> 7 branches · 1 setup script · 45-min demo flow

---

## Table of Contents

1. [Overview](#1-overview)
2. [One-Time Setup](#2-one-time-setup)
3. [Suggested 45-Minute Demo Flow](#3-suggested-45-minute-demo-flow)
4. [Branch Details and Prompts](#4-branch-details-and-prompts)
   - [Branch 1: demo/spec-driven-agent](#branch-1-demospec-driven-agent)
   - [Branch 2: demo/playwright-testing](#branch-2-demoplaywright-testing)
   - [Branch 3: demo/figma-mcp](#branch-3-demofigma-mcp)
   - [Branch 4: demo/ai-operations](#branch-4-demoai-operations)
   - [Branch 5: demo/app-modernization](#branch-5-demoapp-modernization)
   - [Branch 6: demo/iac-generation](#branch-6-demoiac-generation)
   - [Branch 7: demo/security-quality](#branch-7-demosecurity-quality)
5. [Parallel Worktrees](#5-parallel-worktrees)
6. [Quick Reference](#6-quick-reference)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. Overview

The Taskify Copilot Demo uses a single GitHub repository with 7 purpose-built demo branches. Each branch is the full working application minus one deliberately-seeded gap. The demo narrative is always the same: **customer sees the gap, Copilot fills it, customer sees the result.**

This approach — **Option C: Worktree-Based Broken-to-Fixed** — was chosen because:

- The broken-to-fixed narrative makes Copilot demos land. Customers see the problem before the solution.
- Worktrees let you run all 7 scenarios simultaneously in separate VS Code windows — no branch switching mid-demo.
- Reset is a single command per scenario, not a full teardown.
- Each branch is self-contained. The `DEMO_README.md` at the root of each branch has the exact Copilot prompts to paste.

### The Gold App

The base application (Taskify) is a full-stack Kanban productivity tool already built on `main`:

- **Backend:** Node.js / Express, plain JavaScript, PostgreSQL 16, 12 REST endpoints
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, `@hello-pangea/dnd` for drag-and-drop
- **Database:** 4 tables (users, projects, tasks, comments), seed data with 5 users + 3 projects
- **Local dev:** Docker Compose runs all three services (db, api, web) with a single command

### Branch Architecture Summary

| Branch | The Gap | Copilot Fills |
|--------|---------|---------------|
| `demo/spec-driven-agent` | `apps/api/src` + `apps/web/src` wiped; SQL scripts gone | Reads spec → scaffolds full stack from zero |
| `demo/playwright-testing` | `tests/` empty; `playwright.config.ts` is a stub | Generates E2E tests mapped to spec requirements |
| `demo/figma-mcp` | `Board.tsx` replaced with stub + design token hints | Figma MCP → pixel-accurate Board component |
| `demo/ai-operations` | N+1 query bug in GET tasks; `monitoring.bicep` missing | Fixes query to single JOIN + generates alert rules IaC |
| `demo/app-modernization` | Entire app in legacy JS: SQL injection, class components | 4-PR sequence: security → modularize → TS → Bicep |
| `demo/iac-generation` | `deploy.sh` present; no `main.bicep`, no `terraform/` | Bash → Bicep; Bicep → Terraform |
| `demo/security-quality` | 3 OWASP vulns seeded (A01, A03, A04) in `tasks.js` | Security review + CodeQL Autofix on all three |

---

## 2. One-Time Setup

Run this once after cloning. The script creates all 7 branches, tags the baseline, and pushes to origin.

```bash
git clone https://github.com/adelantestory/Cx-Innovation-Hub-IF-Baseline.git taskify-demo
cd taskify-demo
bash setup-demo-branches.sh
```

### Branches + GitHub Issues in one shot

```bash
bash setup-demo-branches.sh --with-issues
```

> Requires the `gh` CLI installed and authenticated (`gh auth login`). If `gh` is not found, the script skips issue seeding gracefully.

### Worktree Setup (run once after branch creation)

Worktrees let all 7 branches live in separate directories simultaneously — no branch switching, no VS Code reload.

```bash
git worktree add ../demo-spec-agent   demo/spec-driven-agent
git worktree add ../demo-playwright   demo/playwright-testing
git worktree add ../demo-figma        demo/figma-mcp
git worktree add ../demo-aiops        demo/ai-operations
git worktree add ../demo-legacy       demo/app-modernization
git worktree add ../demo-iac          demo/iac-generation
git worktree add ../demo-security     demo/security-quality
```

Open each in VS Code:

```bash
code ../demo-spec-agent
code ../demo-aiops
code ../demo-legacy
code ../demo-security
```

Or open all in one VS Code multi-root workspace — see [Section 5: Parallel Worktrees](#5-parallel-worktrees).

### Reset a Branch After a Demo Run

```bash
git checkout demo/<branch-name>
git reset --hard baseline
bash setup-demo-branches.sh --only <branch-name>
git push origin demo/<branch-name> --force

# Example:
git checkout demo/security-quality
git reset --hard baseline
bash setup-demo-branches.sh --only security-quality
```

---

## 3. Suggested 45-Minute Demo Flow

| Time | Branch | What You Show |
|------|--------|---------------|
| 0–10 min | `demo/spec-driven-agent` | Zero to working app from a spec document |
| 10–18 min | `demo/playwright-testing` | Spec-mapped E2E tests with requirement traceability |
| 18–25 min | `demo/figma-mcp` | Figma design → production React code via MCP |
| 25–33 min | `demo/ai-operations` | SRE Agent diagnoses N+1 bug, Copilot fixes + adds monitoring IaC |
| 33–40 min | `demo/app-modernization` | Assessment + PR 1 (SQL injection) + PR 2 (modularize) |
| 40–45 min | `demo/security-quality` | CodeQL alert + Copilot Autofix (SQL injection, access control) |

> The `demo/iac-generation` branch is best used as a standalone segment for customers asking specifically about infrastructure automation. It can replace the app-modernization or security segments depending on audience.

---

## 4. Branch Details and Prompts

---

### Branch 1: `demo/spec-driven-agent`

| | |
|---|---|
| **The Gap** | `concept/apps/api/src/` and `concept/apps/web/src/` wiped. SQL files deleted. |
| **What Remains** | `CLAUDE.md`, `concept/.specify/specify.md`, Dockerfiles, all config files |
| **Act** | ACT I — opening scene |
| **Duration** | ~10 minutes |

#### The Story

> "We start with nothing but a product spec and our AI development framework. Watch Copilot read the requirements and scaffold the entire full-stack application — API, frontend, database schema, and seed data."

#### How to Run

1. Open the `demo/spec-driven-agent` worktree in VS Code
2. Open Copilot Chat in **Agent mode**
3. Paste the main prompt below
4. After generation: `cd concept && docker compose up`
5. Use the cascade prompt to show the agentic loop continuing

#### Copilot Prompt — Main

```
Read CLAUDE.md and concept/.specify/specify.md.
Scaffold the complete Taskify application:
- concept/apps/api/src/ — Node.js/Express API (match existing package.json and Dockerfiles)
- concept/apps/web/src/ — React/Vite/TypeScript frontend (match existing tsconfig/vite/tailwind)
- concept/sql/ — 001_create_tables.sql and 005_seed_data.sql
Follow every convention in CLAUDE.md exactly. This is a functional prototype.
```

#### Copilot Prompt — Cascade (spec change)

```
The spec has been updated: tasks now have a priority field (High, Medium, Low, default Medium).
Update the SQL migration, API endpoints, and the task Card component.
Maintain all existing patterns.
```

#### What Lands

Customers see zero-to-working-app from a spec document. The cascade prompt shows the agentic loop continuing without human intervention — change the spec, the entire stack updates.

---

### Branch 2: `demo/playwright-testing`

| | |
|---|---|
| **The Gap** | `concept/apps/web/tests/` is empty. `playwright.config.ts` is a stub. |
| **What Remains** | Full working app. Playwright 1.41.0 in `package.json` devDependencies. |
| **Act** | ACT I — Scene 2 |
| **Duration** | ~8 minutes |

#### The Story

> "The app works. Now we need tests. Watch Copilot read the product requirements document and generate E2E tests — each one citing the exact spec requirement it validates."

#### How to Run

1. Open `demo/playwright-testing` in VS Code
2. Paste the prompt below
3. After generation: `cd concept/apps/web && npm install && npx playwright install chromium`
4. Start the app (`docker compose up`), then run: `npx playwright test --ui`

#### Copilot Prompt

```
Using artifacts/Taskify Product Description.txt as the source of truth,
write Playwright E2E tests in concept/apps/web/tests/.

Each test must quote the requirement it covers. Create these files:
- tests/userSelect.spec.ts      — user selection on launch
- tests/kanbanBoard.spec.ts     — board renders 4 columns, cards in correct columns
- tests/dragAndDrop.spec.ts     — move a card between columns
- tests/comments.spec.ts        — add a comment, edit own, cannot edit/delete others
- tests/cardHighlight.spec.ts   — current user's cards have distinct styling

Also complete playwright.config.ts with:
- baseURL: http://localhost:5173
- webServer config for both API (port 3000) and web (port 5173)
- chromium only, retries: 1
```

#### What Lands

Requirement traceability — every test has a comment quoting the spec line that justifies it. Tests become living documentation of the product requirements.

---

### Branch 3: `demo/figma-mcp`

| | |
|---|---|
| **The Gap** | `Board.tsx` is a non-functional stub with design token hints in comments. |
| **What Remains** | `Column.tsx`, `Card.tsx`, `TaskDetail.tsx` all intact. App launches but board shows placeholder. |
| **Act** | ACT I — Scene 3 |
| **Duration** | ~7 minutes |

#### The Story

> "Our designer finished the Figma layout. Watch Copilot connect to Figma via MCP, read the design tokens directly from the design file, and generate production React code that matches pixel-for-pixel."

#### Prerequisites

- Figma MCP server connected in VS Code: **Settings → Copilot → MCP → Add server**
- Verify MCP appears in the Copilot Chat tools list before the demo
- Have the Taskify Figma file open in the browser (split-screen: Figma left, VS Code right)

#### How to Run

1. Open `demo/figma-mcp` in VS Code
2. Activate Figma MCP in the Copilot Chat tool selector
3. Paste the prompt — watch the MCP tool calls reading Figma node properties
4. After generation: `docker compose up` — show the visual match side-by-side with Figma

#### Copilot Prompt (with Figma MCP active)

```
Using the connected Figma design for Taskify, implement the complete Board.tsx component.
Figma frame: "Taskify / Kanban Board"

Requirements:
- DragDropContext from @hello-pangea/dnd wrapping 4 Column components
- Map STATUS_COLUMNS to display labels: To Do, In Progress, In Review, Done
- Highlight cards assigned to currentUser using the design token colors from the stub
- Column drop zones highlight on drag-over (use --drop-zone-bg token)
- Optimistic UI for drag: update state immediately, call updateTaskStatus(), rollback on error
- Include New Task button/form
- Open TaskDetail modal on card click
- Match Figma layout and spacing exactly
Keep the BoardProps interface unchanged.
```

#### What Lands

The MCP tool calls are visible in Copilot Chat — the audience literally watches Copilot reading the Figma file. Split-screen before/after is the visual payoff.

---

### Branch 4: `demo/ai-operations`

| | |
|---|---|
| **The Gap** | N+1 query bug in `GET /api/projects/:id/tasks`. No `monitoring.bicep`. |
| **What Remains** | Full working app — bug is invisible to users, visible to App Insights. |
| **Act** | ACT II — Azure SRE Agent |
| **Duration** | ~8 minutes |

#### The Bug (Seeded)

The GET tasks endpoint fetches all tasks first, then fires a separate `SELECT` per task to get the assigned user — one database round-trip per task. With 20 tasks on a board that's 21 queries per page load. Azure Application Insights / SRE Agent detects this as a latency spike.

#### The Story

> "Azure SRE Agent detected a latency spike in production at 2 AM. Watch the agent diagnose the root cause across App Insights and container logs — then watch Copilot fix the query and generate the monitoring-as-code that should have caught this earlier."

#### How to Run

1. Azure Portal → Application Insights → show the latency alert or Smart Detection finding
2. Launch Azure SRE Agent — show it querying App Insights, reading container logs, identifying the N+1
3. Switch to VS Code → paste the Copilot fix prompt below
4. Copilot fixes the query (single LEFT JOIN) and generates `monitoring.bicep`

#### Copilot Prompt — Fix N+1 + Add Monitoring

```
The Azure SRE Agent identified performance issues in
concept/apps/api/src/routes/tasks.js:

1. N+1 query in GET /api/projects/:projectId/tasks — fix with a single LEFT JOIN:
   SELECT t.*, u.name AS assigned_user_name, u.avatar_color AS assigned_user_avatar_color
   FROM tasks t LEFT JOIN users u ON t.assigned_user_id = u.id
   WHERE t.project_id = $1 ORDER BY t.position, t.created_at

2. No pagination — add optional ?limit=20&offset=0 query params
   (maintain backward compat: return all if not specified)

3. Create concept/infrastructure/bicep/monitoring.bicep with alert rules:
   - API p95 response time > 2000ms (Severity 2)
   - Container error rate > 1% (Severity 1)
   - Container CPU > 80% (Severity 2)
   - PostgreSQL connection count > 80% max (Severity 2)
   Follow patterns in existing stage*.bicep files. Use parameterized thresholds.
```

#### What Lands

The SRE Agent catches the problem before the customer does. Copilot closes the gap immediately. The monitoring IaC ensures it can't happen again without being caught.

---

### Branch 5: `demo/app-modernization`

| | |
|---|---|
| **The Gap** | Entire app rewritten in legacy patterns: SQL injection, class components, hardcoded creds. |
| **What Remains** | Docker, SQL schema/seed data. The app actually runs — bugs are silent. |
| **Act** | ACT III — Modernization |
| **Duration** | ~15 min (full) or 10 min (PR 1 + PR 2 only) |

#### The Legacy Issues

- **Critical** — SQL injection in multiple routes (string concatenation in queries)
- **Critical** — No ownership check on `DELETE /api/comments/:id` — any user can delete anyone's comments
- **High** — All routes in a single flat `index.js`, no modular structure
- **High** — Class-based React with direct state mutation (anti-pattern)
- **High** — Hardcoded password in `concept/infrastructure/deploy.sh`
- **Medium** — No TypeScript, no error handling middleware

#### The Story

> "This is the codebase we inherit 90% of the time. Watch Copilot produce a modernization assessment, then execute a 4-PR upgrade sequence — from SQL injection fix to full IaC replacement."

#### Prompt Sequence (run in order)

**PR 1 — Assessment (show this first)**
```
Assess this codebase for modernization. Review concept/apps/api/src/ and
concept/apps/web/src/. Produce a prioritized list:
Critical (security), High (architecture), Medium (quality), Low (style).
```

**PR 2 — Fix SQL Injection (5 min)**
```
Fix all SQL injection vulnerabilities in concept/apps/api/src/index.js.
Replace every string-concatenated SQL query with parameterized queries ($1, $2...).
Also add the ownership check missing from DELETE /api/comments/:id —
verify req.headers['x-user-id'] matches the comment's user_id before deleting.
Do not change any business logic.
```

**PR 3 — Modularize + Error Handling (5 min)**
```
Refactor concept/apps/api/src/index.js:
- Extract routes into concept/apps/api/src/routes/{users,projects,tasks,comments}.js
- Add centralized error handler in concept/apps/api/src/middleware/errorHandler.js
- Add GET /api/health endpoint
- Add request logging middleware
Follow the structure documented in CLAUDE.md.
```

**PR 4 — Modernize React (5 min)**
```
Migrate concept/apps/web/src/components from class components to functional
components with React hooks. Start with KanbanBoard.jsx:
- useState instead of this.state
- useEffect instead of componentDidMount
- Fix the direct state mutation bug
- Add missing Content-Type: application/json header to all fetch calls
Also restore TypeScript: rename .jsx to .tsx, add type definitions.
```

**PR 5 — Replace deploy.sh with Bicep (5 min)**
```
Replace concept/infrastructure/deploy.sh with proper IaC.
Generate concept/infrastructure/bicep/main.bicep that:
- Deploys all Taskify resources (Container Apps, PostgreSQL, Key Vault)
- Uses Managed Identity — NO hardcoded passwords
- Stores DB connection string in Key Vault, references it from Container App
- Follows patterns in the existing stage*.bicep files
```

#### What Lands

Run PR 1 (Assessment) + PR 2 (SQL injection fix) for maximum impact in minimum time. The before/after on SQL injection is dramatic and the security stakes are immediately legible to non-technical stakeholders.

---

### Branch 6: `demo/iac-generation`

| | |
|---|---|
| **The Gap** | No `main.bicep`. No `terraform/` directory. |
| **What Remains** | Full modern TypeScript app. Detailed `deploy.sh` with 8-step manual process. |
| **Act** | Standalone or ACT III supplement |
| **Duration** | ~10 minutes |

#### The Story

> "90% of SMB customers have a bash script like this. Two prompts — bash to Bicep, then Bicep to Terraform. Same infrastructure, two IaC languages, both production-quality, in under 10 minutes."

#### How to Run

1. Open `concept/infrastructure/deploy.sh` — walk through it: 8 steps, manual, no repeatability
2. Paste Prompt 1 — Copilot reads `deploy.sh`, generates complete `main.bicep`
3. Walk the Bicep: Managed Identity pattern, Key Vault references, no hardcoded passwords
4. Paste Prompt 2 — converts Bicep to Terraform in one more prompt

#### Copilot Prompt — Part 1: Bash to Bicep

```
Read concept/infrastructure/deploy.sh. Generate concept/infrastructure/bicep/main.bicep
that replaces it with Bicep (resources in dependency order):
Log Analytics → App Insights → Key Vault (RBAC) → Managed Identity → PostgreSQL
→ Container Apps Environment → API Container App → Static Web App

Requirements:
- Managed Identity everywhere — zero hardcoded passwords
- @description decorators on all params
- All resources tagged: Environment, Project, ManagedBy=Bicep
- Follow patterns in existing stage*.bicep files
- Output: apiUrl, webUrl, keyVaultName, dbServerName
```

#### Copilot Prompt — Part 2: Bicep to Terraform

```
Convert concept/infrastructure/bicep/main.bicep to Terraform HCL.
Create concept/infrastructure/terraform/ with:
  main.tf, variables.tf, outputs.tf, providers.tf

Requirements:
- azurerm provider with ~> 3.0 constraint
- random_password resource for DB password
- All variables must have type and description
- Match the same resource configuration from the Bicep
```

#### What Lands

Show the `deploy.sh` first — let customers recognize it. Two prompts produce production-grade IaC in both Microsoft and HashiCorp ecosystems. No lock-in.

---

### Branch 7: `demo/security-quality`

| | |
|---|---|
| **The Gap** | 3 OWASP vulnerabilities seeded in `concept/apps/api/src/routes/tasks.js` |
| **What Remains** | Full working app — vulnerabilities are silent but findable by CodeQL |
| **Act** | ACT III or standalone security segment |
| **Duration** | ~7 minutes |

#### The Seeded Vulnerabilities

| OWASP | Location & Description |
|-------|------------------------|
| **A03 — SQL Injection** | `GET /api/tasks/search`: `?q=` parameter interpolated directly into SQL |
| **A01 — Broken Access Control** | `PATCH /api/tasks/:id/assign`: no auth check, any user can reassign any task |
| **A04 — Insecure Design** | `POST /api/projects/:id/tasks`: `assigned_user_id` not validated, no title length limit |

> **Note:** The SQL injection is in the `/search` endpoint — the main board `GET /api/projects/:id/tasks` is clean, so the app works normally during the demo.

#### The Story

> "GitHub Advanced Security flagged vulnerabilities in our PR. Watch Copilot explain each attack vector, then watch CodeQL Autofix generate the remediation PR automatically."

#### How to Run

1. Push this branch: `git push origin demo/security-quality`
2. GitHub repo → **Security tab → Code Scanning** → show the CodeQL alert for SQL injection
3. Click **Copilot Autofix** on the alert — show it generating a suggested fix
4. In VS Code: paste the security review prompt below

#### Copilot Security Review Prompt (VS Code)

```
Review concept/apps/api/src/routes/tasks.js for security vulnerabilities.

For each vulnerability found:
- Name the OWASP category and severity
- Show the vulnerable code
- Explain the specific attack vector
- Provide the exact fix

Then apply all fixes.
```

#### Expected Fixes

- **A03:** Replace interpolated `` %${q}% `` with `ILIKE $1` parameterized pattern
- **A01:** Add `X-User-Id` check in assign route — verify requester is current assignee or PM role
- **A04:** Add `SELECT EXISTS` check that `assigned_user_id` refers to a real user; add title length limit

#### What Lands

Show both surfaces: GitHub UI (CodeQL alert + Autofix) and VS Code (Copilot Chat). The OWASP categorization makes risk legible to non-developer stakeholders.

---

## 5. Parallel Worktrees

Showing multiple worktrees running simultaneously is one of the most visually impressive parts of the demo.

### VS Code Multi-Root Workspace

Create a single workspace file that opens all worktrees as separate folders in one Explorer panel:

```bash
cat > taskify-demo.code-workspace << 'EOF'
{
  "folders": [
    { "name": "main (gold app)",    "path": "./Cx-Innovation-Hub-IF-Baseline" },
    { "name": "spec-driven-agent",  "path": "./demo-spec-agent" },
    { "name": "playwright-testing", "path": "./demo-playwright" },
    { "name": "figma-mcp",          "path": "./demo-figma" },
    { "name": "ai-operations",      "path": "./demo-aiops" },
    { "name": "app-modernization",  "path": "./demo-legacy" },
    { "name": "iac-generation",     "path": "./demo-iac" },
    { "name": "security-quality",   "path": "./demo-security" }
  ],
  "settings": {
    "git.detectSubmodules": false
  }
}
EOF

code taskify-demo.code-workspace
```

This gives you one VS Code window with all 7 scenarios visible in the Explorer sidebar. Copilot Chat is shared across all folders — you can jump between scenarios instantly.

### Running Docker Compose in Parallel

Each worktree is independent. Use `-p` to namespace each stack so they don't conflict:

```bash
# Terminal 1
cd ../demo-aiops/concept
docker compose -p aiops up -d

# Terminal 2
cd ../demo-legacy/concept
docker compose -p legacy up -d
```

### The Demo Money Shot

One VS Code window, Explorer sidebar showing all 7 scenarios, Copilot Chat open. Click into `demo/spec-driven-agent`, show the empty `src/` folder, run the prompt — then click into `demo/security-quality` while Copilot is still generating in the first one. **Two agents working simultaneously in the same window.** That's the parallel execution story.

---

## 6. Quick Reference

### Script Usage

```bash
# Create all 7 branches
bash setup-demo-branches.sh

# Create branches + seed GitHub Issues
bash setup-demo-branches.sh --with-issues

# Reset a single branch
bash setup-demo-branches.sh --only security-quality

# Reset + re-seed issues
bash setup-demo-branches.sh --only security-quality --with-issues
```

### Worktree Commands

```bash
# List all worktrees
git worktree list

# Check which branch each worktree is on
git worktree list --porcelain

# Full reset (all branches) — run from repo root
bash setup-demo-branches.sh

# Reset single branch
git checkout demo/security-quality
git reset --hard baseline
bash setup-demo-branches.sh --only security-quality
git push origin demo/security-quality --force
```

### Pre-Demo Checklist

- [ ] VS Code windows open for each scenario you're running
- [ ] Docker running — test `docker compose up` in at least one worktree
- [ ] Copilot Agent mode enabled (not Ask mode) for spec-agent and modernization branches
- [ ] Figma MCP connected and visible in Copilot Chat tool list (for `demo/figma-mcp`)
- [ ] Azure Portal session active — App Insights open for `demo/ai-operations`
- [ ] GitHub repo Security tab accessible — Code Scanning results loaded for `demo/security-quality`
- [ ] Each branch's `DEMO_README.md` open in a separate editor tab — prompts ready to paste

### Port Reference

| Service | URL |
|---------|-----|
| React web app (Vite) | http://localhost:5173 |
| Node.js API | http://localhost:3000 |
| API health check | http://localhost:3000/api/health |
| PostgreSQL | localhost:5432 |

### Repo Structure (`main` branch)

```
concept/
├── apps/
│   ├── api/              Node.js + Express API (plain JS, CommonJS)
│   │   ├── src/
│   │   │   ├── routes/   users.js, projects.js, tasks.js, comments.js
│   │   │   ├── services/ database.js (pg Pool, Key Vault aware)
│   │   │   └── middleware/ errorHandler.js
│   │   ├── Dockerfile
│   │   └── Dockerfile.dev
│   └── web/              React 18 + TypeScript + Vite + Tailwind
│       └── src/
│           ├── components/
│           │   ├── kanban/   Board.tsx, Column.tsx, Card.tsx, TaskDetail.tsx
│           │   ├── comments/
│           │   ├── layout/
│           │   ├── projects/
│           │   └── users/
│           └── api/          client.ts, types.ts
├── sql/
│   ├── 001_create_tables.sql
│   └── 005_seed_data.sql
├── infrastructure/
│   ├── bicep/            stage*.bicep files
│   └── deploy.sh         (only on demo/iac-generation and demo/app-modernization)
├── .specify/             specify.md (only on demo/spec-driven-agent)
└── docker-compose.yml
```

---

## 7. Troubleshooting

### Docker Compose Issues

| Symptom | Fix |
|---------|-----|
| API container fails to connect to DB | Wait for the healthcheck: db container must show `healthy` first. Run: `docker compose ps` |
| Port 5432 already in use | Stop local PostgreSQL: `brew services stop postgresql@16` or `sudo systemctl stop postgresql` |
| `Cannot find module` in API | Node modules aren't installed in the container — rebuild: `docker compose up --build` |
| Vite dev server not hot-reloading | Save the file in the worktree directory, not inside the container |

### Copilot Issues

| Symptom | Fix |
|---------|-----|
| Figma MCP not showing in tool list | Restart VS Code, re-open Copilot Chat. Check MCP server URL in settings. |
| Agent mode not available | Verify GitHub Copilot extension version ≥ 1.230. Check account has agent mode enabled. |
| Copilot generates TypeScript for API | Paste first: *"The API uses plain CommonJS JavaScript (not TypeScript). package.json has no TypeScript dependency."* |
| Branch reset didn't take effect | Verify: `git log --oneline -3` shows the baseline commit at HEAD before running the seed script. |

### Branch-Specific Notes

- **`demo/spec-driven-agent`:** If Copilot asks about the tech stack before reading the spec, paste: *"Read CLAUDE.md first — all conventions are documented there."*
- **`demo/figma-mcp`:** `Board.tsx`'s existing `BoardProps` interface must not change — it's imported by `App.tsx`. If Copilot changes the interface, paste: *"Keep BoardProps exactly as defined in the stub."*
- **`demo/ai-operations`:** If Azure SRE Agent isn't available, show the N+1 bug directly in the route file and explain what App Insights would show.
- **`demo/security-quality`:** The SQL injection is in `GET /api/tasks/search` — the main board `GET /api/projects/:id/tasks` is clean. The app works normally during the demo.
- **Demo PRs:** Do not merge demo branches into main. If GitHub auto-creates PRs after branch pushes, close them with: `gh pr close <number> --repo adelantestory/Cx-Innovation-Hub-IF-Baseline`

---

*Delante Solutions LLC | Taskify Copilot Demo | Repo: `adelantestory/Cx-Innovation-Hub-IF-Baseline`*
