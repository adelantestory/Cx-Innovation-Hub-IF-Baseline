#!/usr/bin/env bash
# =============================================================================
# Taskify Demo Branch Setup — All 7 Worktree Scenarios
# =============================================================================
# Usage:
#   git clone https://github.com/adelantestory/Cx-Innovation-Hub-IF-Baseline.git
#   cd Cx-Innovation-Hub-IF-Baseline
#   bash setup-demo-branches.sh
#
# What this does:
#   1. Tags the current main HEAD as 'baseline'
#   2. Creates 7 demo branches from that tag
#   3. Applies surgical mutations to each branch (the "gaps")
#   4. Pushes all branches to origin
#
# Reset any single branch after a demo run:
#   git checkout demo/<name>
#   git reset --hard baseline
#   bash setup-demo-branches.sh --only <name>
# =============================================================================

set -euo pipefail

# ── Colors ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; BOLD='\033[1m'; NC='\033[0m'

log()  { echo -e "${GREEN}✓${NC}  $*"; }
info() { echo -e "${BLUE}→${NC}  $*"; }
warn() { echo -e "${YELLOW}⚠${NC}  $*"; }
err()  { echo -e "${RED}✗${NC}  $*"; exit 1; }
head() { echo -e "\n${BOLD}$*${NC}"; }

# ── Pre-flight checks ─────────────────────────────────────────────────────────
[[ -f "CLAUDE.md" ]]            || err "Run this from the repo root (where CLAUDE.md lives)"
[[ -f "concept/docker-compose.yml" ]] || err "Unexpected repo structure — expected concept/docker-compose.yml"
command -v git >/dev/null       || err "git not found"

REPO_ROOT=$(git rev-parse --show-toplevel)
CURRENT_BRANCH=$(git branch --show-current)
HEAD_SHA=$(git rev-parse --short HEAD)

head "═══ Taskify Demo Branch Setup ═══"
echo "  Repo:   $REPO_ROOT"
echo "  Head:   $HEAD_SHA ($CURRENT_BRANCH)"
echo ""

# ── Selective mode ────────────────────────────────────────────────────────────
ONLY=""
WITH_ISSUES=false

while [[ $# -gt 0 ]]; do
  case "${1}" in
    --only)
      ONLY="${2:-}"
      shift 2
      ;;
    --with-issues)
      WITH_ISSUES=true
      shift
      ;;
    *)
      shift
      ;;
  esac
done

[[ -n "$ONLY" ]] && info "Selective mode: rebuilding demo/$ONLY only"
[[ "$WITH_ISSUES" == "true" ]] && info "GitHub Issues seeding enabled (--with-issues)"

# =============================================================================
# STEP 1 — Tag baseline
# =============================================================================
head "Step 1 — Tagging baseline"

git tag -f baseline
log "baseline tag → $HEAD_SHA"

# =============================================================================
# STEP 2 — Branch creation helper
# =============================================================================
create_branch() {
  local branch="$1"
  if git show-ref --quiet "refs/heads/$branch"; then
    info "Branch $branch already exists — deleting and recreating"
    git branch -D "$branch"
  fi
  git checkout -b "$branch" baseline
  log "Created $branch"
}

# =============================================================================
# STEP 3 — Build each demo branch
# =============================================================================

# ─────────────────────────────────────────────────────────────────────────────
# Branch 1: demo/spec-driven-agent
# Gap: concept/apps/ is empty. The spec and CLAUDE.md exist.
# Copilot reads the spec and scaffolds the entire app from scratch.
# ─────────────────────────────────────────────────────────────────────────────
build_spec_agent() {
  head "Branch: demo/spec-driven-agent"
  info "Gap: concept/apps/{api,web}/src wiped — only spec + CLAUDE.md remain"

  create_branch "demo/spec-driven-agent"

  # Wipe all source code — this is the gap
  find concept/apps/api/src -type f -delete 2>/dev/null || true
  find concept/apps/web/src -type f -delete 2>/dev/null || true
  # Remove node_modules dirs if any
  rm -rf concept/apps/api/node_modules concept/apps/web/node_modules

  # Keep the directory skeletons with .gitkeep
  mkdir -p concept/apps/api/src/routes concept/apps/api/src/services concept/apps/api/src/middleware
  mkdir -p concept/apps/web/src/components concept/apps/web/src/api
  touch concept/apps/api/src/.gitkeep
  touch concept/apps/web/src/.gitkeep

  # Wipe SQL scripts — Copilot generates these too
  find concept/sql -type f -name "*.sql" -delete 2>/dev/null || true
  touch concept/sql/.gitkeep

  # Write structured specify.md so Copilot has a machine-readable spec
  mkdir -p concept/.specify/memory
  cat > concept/.specify/specify.md << 'SPECEOF'
# Taskify — Structured Specification
# Source: artifacts/Taskify Product Description.txt
# This file is the authoritative spec for Copilot to scaffold from.

## Application Type
Kanban-style team productivity platform (functional prototype, no auth)

## Tech Stack
| Layer       | Technology                              |
|-------------|----------------------------------------|
| Frontend    | React 18, TypeScript, Vite, Tailwind   |
| Backend     | Node.js 20, Express 4, CommonJS        |
| Database    | PostgreSQL 16                           |
| DnD         | @hello-pangea/dnd                       |
| Local Dev   | Docker Compose (see docker-compose.yml) |

## Conventions (from CLAUDE.md)
- API uses PG env vars: PGHOST, PGUSER, PGPASSWORD, PGDATABASE, PGPORT
- CORS allows X-User-Id header (used for comment authorship — no JWT)
- SQL scripts in concept/sql/ named NNN_description.sql (run in order)
- Both apps have Dockerfile.dev and Dockerfile already — do not replace them
- Follow existing package.json scripts exactly

## Users (Predefined — no login, no password)
| ID | Name          | Role            | avatar_color |
|----|---------------|-----------------|--------------|
| 1  | Sarah Chen    | Product Manager | #6366f1      |
| 2  | Alex Rivera   | Engineer        | #10b981      |
| 3  | Jordan Kim    | Engineer        | #f59e0b      |
| 4  | Taylor Morgan | Engineer        | #ef4444      |
| 5  | Casey Davis   | Engineer        | #8b5cf6      |

## Projects (3 predefined)
1. Mobile App Redesign
2. API Performance Initiative
3. Platform Security Audit

## Task Status Values (internal DB values)
- todo
- in_progress
- in_review
- done

## Kanban Display Columns (in order)
| Display Label | DB status value |
|---------------|-----------------|
| To Do         | todo            |
| In Progress   | in_progress     |
| In Review     | in_review       |
| Done          | done            |

## User Flow
1. Launch → UserSelect screen: list of 5 users, click to "log in" (no password)
2. Click user → ProjectList view (stored in App state, not URL)
3. Click project → Kanban Board (4 columns)
4. Click task card → TaskDetail modal (comments, assign, status change)

## Task Card Features
- Assigned-to-currentUser cards: visually highlighted (different bg color)
- Drag-and-drop between columns changes status + position
- Position is an integer; ordering within a column

## Comment Rules
- Unlimited comments per task
- X-User-Id request header identifies the commenter
- Edit own comments only
- Delete own comments only (cascade deletes children)
- Comments can be threaded (parent_comment_id)

## Required API Endpoints
| Method | Path                              | Notes                          |
|--------|-----------------------------------|--------------------------------|
| GET    | /api/users                        | List all users                 |
| GET    | /api/projects                     | List all projects              |
| GET    | /api/projects/:id/tasks           | Tasks with assigned user JOIN  |
| POST   | /api/projects/:id/tasks           | { title, description?, assigned_user_id? } |
| PUT    | /api/tasks/:id                    | { title, description }         |
| PATCH  | /api/tasks/:id/status             | { status, position }           |
| PATCH  | /api/tasks/:id/assign             | { assigned_user_id }           |
| DELETE | /api/tasks/:id                    | Cascade deletes comments       |
| GET    | /api/tasks/:id/comments           | With author JOIN               |
| POST   | /api/tasks/:id/comments           | X-User-Id header required      |
| PUT    | /api/comments/:id                 | Author only (check X-User-Id)  |
| DELETE | /api/comments/:id                 | Author only (check X-User-Id)  |

## Database Schema
```sql
users       (id UUID PK, name TEXT, role TEXT, avatar_color TEXT, created_at)
projects    (id UUID PK, name TEXT, description TEXT, created_at)
tasks       (id UUID PK, project_id UUID FK, title TEXT, description TEXT,
             status TEXT, position INT, assigned_user_id UUID FK nullable,
             created_at, updated_at)
comments    (id UUID PK, task_id UUID FK, user_id UUID FK,
             parent_comment_id UUID FK nullable, content TEXT,
             created_at, updated_at)
```

## Seed Data Required
- 5 users (see Users table — use fixed UUIDs so seeds are repeatable)
- 3 projects
- 8-10 sample tasks spread across projects and columns
- 5-8 sample comments across tasks

## Copilot Prompt to Use
```
Read CLAUDE.md and concept/.specify/specify.md.
Scaffold the complete Taskify application:
- concept/apps/api/src/ — Node.js/Express API (match existing package.json and Dockerfiles)
- concept/apps/web/src/ — React/Vite/TypeScript frontend (match existing tsconfig/vite/tailwind)
- concept/sql/ — 001_create_tables.sql and 005_seed_data.sql
Follow every convention in CLAUDE.md exactly. This is a functional prototype.
```
SPECEOF

  # DEMO_README at repo root for this branch
  cat > DEMO_README.md << 'EOF'
# Demo Branch: Spec-Driven Agentic Coding
## The Gap
`concept/apps/api/src/` and `concept/apps/web/src/` are intentionally empty.
`concept/sql/` has no SQL files.
The spec, CLAUDE.md, Dockerfiles, and all config files exist.

## What Copilot Does
Reads the spec in `concept/.specify/specify.md` + `CLAUDE.md` and scaffolds:
- Full Express API with all 12 endpoints
- Full React frontend with user select → project list → kanban → task detail
- PostgreSQL schema + seed data

## Copilot Prompt (paste into Agent mode)
```
Read CLAUDE.md and concept/.specify/specify.md.
Scaffold the complete Taskify application:
- concept/apps/api/src/ — Node.js/Express API
- concept/apps/web/src/ — React/Vite/TypeScript frontend
- concept/sql/ — 001_create_tables.sql and 005_seed_data.sql
Follow every convention in CLAUDE.md exactly.
```

## Cascade Spec Change Prompt
```
The spec has been updated: tasks now have a priority field (High, Medium, Low, default Medium).
Update the SQL migration, API endpoints, and the task Card component.
Maintain all existing patterns.
```

## Reset
```bash
git checkout main && git branch -D demo/spec-driven-agent
bash setup-demo-branches.sh --only spec-driven-agent
```
EOF

  git add -A
  git commit -m "demo: spec-driven-agent — src wiped, specify.md ready, Copilot scaffolds from zero"
  log "demo/spec-driven-agent committed"
}

# ─────────────────────────────────────────────────────────────────────────────
# Branch 2: demo/playwright-testing
# Gap: Full working app, no tests/, no playwright.config.ts
# Copilot generates E2E tests mapped to spec requirements
# ─────────────────────────────────────────────────────────────────────────────
build_playwright() {
  head "Branch: demo/playwright-testing"
  info "Gap: no tests/, playwright.config.ts is a stub"

  create_branch "demo/playwright-testing"

  # Remove any existing tests
  rm -rf concept/apps/web/src/tests concept/apps/web/tests
  rm -f concept/apps/web/playwright.config.ts concept/apps/web/playwright.config.js

  # Add Playwright to package.json devDependencies
  node -e "
    const fs = require('fs');
    const p = 'concept/apps/web/package.json';
    const pkg = JSON.parse(fs.readFileSync(p,'utf8'));
    pkg.devDependencies = pkg.devDependencies || {};
    pkg.devDependencies['@playwright/test'] = '^1.41.0';
    pkg.scripts['test:e2e'] = 'playwright test';
    pkg.scripts['test:e2e:ui'] = 'playwright test --ui';
    pkg.scripts['test:e2e:report'] = 'playwright show-report';
    fs.writeFileSync(p, JSON.stringify(pkg, null, 2) + '\n');
    console.log('Updated package.json');
  "

  # Stub config — incomplete, Copilot completes it
  cat > concept/apps/web/playwright.config.ts << 'EOF'
// playwright.config.ts — INCOMPLETE STUB
// TODO: Configure Playwright for Taskify E2E tests
// The app runs at http://localhost:5173 (web) and http://localhost:3000 (api)
// Run tests with: npx playwright test
// See https://playwright.dev/docs/test-configuration

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  // TODO: Add baseURL, webServer config, retries, reporter
});
EOF

  # Empty tests dir with README explaining the gap
  mkdir -p concept/apps/web/tests
  cat > concept/apps/web/tests/README.md << 'EOF'
# E2E Tests — Not Yet Written

This directory is intentionally empty for the demo.

## Spec Requirements to Cover
From `artifacts/Taskify Product Description.txt`:

1. **User selection** — "give you a list of the five users to pick from"
2. **Columns** — "standard Kanban columns: To Do, In Progress, In Review, Done"
3. **Drag and drop** — "drag and drop cards back and forth between different columns"
4. **Comments** — "leave an unlimited number of comments for a particular card"
5. **Own card highlighting** — cards "assigned to you...in a different color"
6. **Comment ownership** — "can't edit/delete comments that other people made"

Each test must cite the exact spec requirement it covers.
EOF

  cat > DEMO_README.md << 'EOF'
# Demo Branch: Playwright — Spec to Tests
## The Gap
The full working Taskify app is here. `concept/apps/web/tests/` is empty.
`playwright.config.ts` is an incomplete stub.

## Copilot Prompt
```
Using the Taskify product description in artifacts/Taskify Product Description.txt
as the source of truth, write Playwright E2E tests in concept/apps/web/tests/.

Each test must quote the requirement it covers. Create these files:
- tests/userSelect.spec.ts  — user selection on launch
- tests/kanbanBoard.spec.ts — board renders 4 columns, cards appear in correct columns
- tests/dragAndDrop.spec.ts — move a card between columns
- tests/comments.spec.ts    — add a comment, edit own, cannot edit/delete others
- tests/cardHighlight.spec.ts — current user's cards have distinct styling

Also complete playwright.config.ts with:
- baseURL: http://localhost:5173
- webServer for both API (port 3000) and web (port 5173)
- chromium only for demo speed
- retries: 1
```

## Running After Copilot Generates Tests
```bash
cd concept/apps/web
npm install
npx playwright install chromium
# Start the app first: cd ../../.. && docker compose up -d
npx playwright test
npx playwright test --ui   # interactive mode
```

## Reset
```bash
git checkout main && git branch -D demo/playwright-testing
bash setup-demo-branches.sh --only playwright-testing
```
EOF

  cat > README.md << 'EOF'
# Taskify — Playwright E2E Testing Demo

This branch demonstrates how GitHub Copilot can generate Playwright end-to-end tests from a plain-English product specification.

## What's Here

| Path | Status |
|------|--------|
| `concept/apps/api/` | ✅ Full working Express API |
| `concept/apps/web/` | ✅ Full working React/Vite frontend |
| `concept/apps/web/playwright.config.ts` | ⚠️ Incomplete stub — Copilot completes it |
| `concept/apps/web/tests/` | ❌ Empty — Copilot writes the tests |

## Prerequisites

- [Node.js 20+](https://nodejs.org/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

## Getting Started

```bash
# Start the application stack
docker compose up -d

# Install dependencies and Playwright browsers
cd concept/apps/web
npm install
npx playwright install chromium
```

## Running Tests

```bash
# Run all E2E tests
npx playwright test

# Run in interactive UI mode
npx playwright test --ui

# View the last test report
npx playwright show-report
```

## Demo Goal

Ask Copilot to write Playwright tests mapped directly to the product spec:

```
Using the Taskify product description in artifacts/Taskify Product Description.txt
as the source of truth, write Playwright E2E tests in concept/apps/web/tests/.

Each test must quote the requirement it covers. Create these files:
- tests/userSelect.spec.ts       — user selection on launch
- tests/kanbanBoard.spec.ts      — board renders 4 columns, cards in correct columns
- tests/dragAndDrop.spec.ts      — move a card between columns
- tests/comments.spec.ts         — add a comment, edit own, cannot edit/delete others
- tests/cardHighlight.spec.ts    — current user's cards have distinct styling

Also complete playwright.config.ts with baseURL, webServer config for both
API (port 3000) and web (port 5173), chromium only, and retries: 1.
```

## Reset This Branch

```bash
git checkout main && git branch -D demo/playwright-testing
bash setup-demo-branches.sh --only playwright-testing
```
EOF

  git add -A
  git commit -m "demo: playwright-testing — full app, Playwright installed, no tests yet"
  log "demo/playwright-testing committed"
}

# ─────────────────────────────────────────────────────────────────────────────
# Branch 3: demo/figma-mcp
# Gap: Board.tsx is a non-functional stub with design token hints
# Copilot + Figma MCP generates the full Board from the design
# ─────────────────────────────────────────────────────────────────────────────
build_figma() {
  head "Branch: demo/figma-mcp"
  info "Gap: Board.tsx replaced with stub — Column, Card, TaskDetail remain intact"

  create_branch "demo/figma-mcp"

  # Replace Board.tsx with a stub that has design token hints
  cat > concept/apps/web/src/components/kanban/Board.tsx << 'EOF'
// =============================================================================
// Board.tsx — STUB FOR FIGMA MCP DEMO
// =============================================================================
// This component is intentionally incomplete.
//
// ┌─────────────────────────────────────────────────────────────────────────┐
// │  TODO: Implement using the Figma design                                 │
// │                                                                         │
// │  Figma Frame: Taskify / Kanban Board                                    │
// │  Connect Figma MCP in VS Code Copilot, then use the prompt below.       │
// │                                                                         │
// │  Design Tokens (from Figma):                                            │
// │  --board-bg:        #F8FAFC                                             │
// │  --column-bg:       #F1F5F9                                             │
// │  --column-border:   #E2E8F0                                             │
// │  --column-width:    280px                                               │
// │  --column-gap:      16px                                                │
// │  --card-bg:         #FFFFFF                                             │
// │  --card-mine-bg:    #EFF6FF   (cards assigned to currentUser)           │
// │  --card-mine-border:#BFDBFE                                             │
// │  --drop-zone-bg:    #DBEAFE   (column highlight during drag-over)       │
// └─────────────────────────────────────────────────────────────────────────┘
//
// Component API (do not change — imported by App.tsx):
//   interface BoardProps {
//     project: Project;
//     currentUser: User;
//     onBack: () => void;
//   }
//
// Available sub-components (already implemented):
//   - Column.tsx   — renders one kanban column with a droppable zone
//   - Card.tsx     — renders one task card with drag handle
//   - TaskDetail.tsx — modal for task detail, comments, assignment
//
// Available API functions (from ../../api/client):
//   fetchTasks(projectId), fetchUsers(), createTask(projectId, data),
//   updateTaskStatus(taskId, status, position)
//
// STATUS_COLUMNS from ../../api/types:
//   ['todo', 'in_progress', 'in_review', 'done']
//
// Drag-and-drop: @hello-pangea/dnd (DragDropContext, DropResult)
// =============================================================================

import type { Project, User } from "../../api/types";

interface BoardProps {
  project: Project;
  currentUser: User;
  onBack: () => void;
}

// Placeholder — replace this entire component with the Figma-accurate version
export default function Board({ project, onBack }: BoardProps) {
  return (
    <div className="p-8 text-center">
      <button onClick={onBack} className="text-sm text-gray-500 mb-4 block">
        ← Projects
      </button>
      <h2 className="text-xl font-bold text-gray-900 mb-2">{project.name}</h2>
      <p className="text-gray-500 text-sm">
        Board not yet implemented — use Figma MCP + Copilot to generate this component.
      </p>
    </div>
  );
}
EOF

  cat > DEMO_README.md << 'EOF'
# Demo Branch: Figma MCP — Design to Code
## The Gap
`concept/apps/web/src/components/kanban/Board.tsx` is a non-functional stub.
Column.tsx, Card.tsx, and TaskDetail.tsx are complete and working.
The app launches and shows the project list — but clicking a project shows the stub.

## Setup
1. Open the Taskify Figma file
2. Connect Figma MCP server in VS Code (Settings → Copilot → MCP → Add server)
3. Verify MCP appears in Copilot Chat tools list

## Copilot Prompt (with Figma MCP active)
```
Using the connected Figma design for Taskify, implement the complete Board.tsx component.

Figma frame: "Taskify / Kanban Board"

Requirements from the stub's design tokens and the existing sub-components:
- Use DragDropContext from @hello-pangea/dnd wrapping 4 Column components
- Map STATUS_COLUMNS ['todo','in_progress','in_review','done'] to display labels
  ["To Do", "In Progress", "In Review", "Done"]
- Pass currentUser to Column so Card can highlight cards assigned to currentUser
  using --card-mine-bg and --card-mine-border from the design tokens
- Column drop zones use --drop-zone-bg during onDragOver
- Implement optimistic UI for drag: update local state immediately, then
  call updateTaskStatus(), roll back on error
- Include New Task form (inline input at top of todo column or as a header button)
- Open TaskDetail modal on card click
- Match the Figma layout, spacing, column widths exactly

Replace the entire placeholder in Board.tsx. Keep the BoardProps interface unchanged.
```

## What to Show
Split screen: Figma design (left) vs VS Code (right).
As Copilot generates, show it reading Figma node properties in the MCP tool calls.
After generation: run `docker compose up` and show the visual match side-by-side.

## Reset
```bash
git checkout main && git branch -D demo/figma-mcp
bash setup-demo-branches.sh --only figma-mcp
```
EOF

  git add -A
  git commit -m "demo: figma-mcp — Board.tsx stubbed with design token hints, Column/Card/TaskDetail intact"
  log "demo/figma-mcp committed"
}

# ─────────────────────────────────────────────────────────────────────────────
# Branch 4: demo/ai-operations
# Gap: N+1 query injected in tasks route, no monitoring.bicep
# Azure SRE Agent surfaces the bug, Copilot fixes + adds monitoring-as-code
# ─────────────────────────────────────────────────────────────────────────────
build_aiops() {
  head "Branch: demo/ai-operations"
  info "Gap: N+1 bug in tasks.js GET endpoint, no monitoring.bicep"

  create_branch "demo/ai-operations"

  # Remove monitoring.bicep if it exists
  rm -f concept/infrastructure/bicep/monitoring.bicep

  # Inject the N+1 bug into GET /api/projects/:projectId/tasks
  # The current clean version uses a single JOIN query — we replace it with
  # a loop that makes N+1 queries, while keeping all other routes identical.
  cat > concept/apps/api/src/routes/tasks.js << 'EOF'
// =============================================================================
// Tasks Routes
// =============================================================================
// GET /api/projects/:projectId/tasks - List tasks for a project
// POST /api/projects/:projectId/tasks - Create a task in a project
// PUT /api/tasks/:id - Update a task
// PATCH /api/tasks/:id/status - Change task status (drag-and-drop)
// PATCH /api/tasks/:id/assign - Assign/unassign a user
// DELETE /api/tasks/:id - Delete a task
// =============================================================================
const { Router } = require("express");
const { getPool } = require("../services/database");
const { createError } = require("../middleware/errorHandler");

const router = Router();
const VALID_STATUSES = ["todo", "in_progress", "in_review", "done"];

/**
 * GET /api/projects/:projectId/tasks
 *
 * PERFORMANCE BUG (seeded for demo/ai-operations):
 *   This endpoint has an N+1 query pattern. It fetches all tasks first,
 *   then loops and executes a SEPARATE query per task to get the assigned user.
 *   With 20 tasks on a board = 21 database round-trips per page load.
 *
 *   Azure Application Insights / SRE Agent will flag this as a latency spike
 *   when the dataset grows. The fix is a single LEFT JOIN query.
 *
 *   Also missing: pagination — returns ALL tasks regardless of count.
 */
router.get("/projects/:projectId/tasks", async (req, res, next) => {
  try {
    // Query 1: fetch all tasks (no pagination, no JOIN)
    const { rows: tasks } = await getPool().query(
      "SELECT * FROM tasks WHERE project_id = $1 ORDER BY position, created_at",
      [req.params.projectId]
    );

    // N+1: one additional query per task to get the assigned user
    const tasksWithUsers = await Promise.all(
      tasks.map(async (task) => {
        if (!task.assigned_user_id) {
          return { ...task, assigned_user_name: null, assigned_user_avatar_color: null };
        }
        // BUG: executes once per task — O(n) queries total
        const { rows: users } = await getPool().query(
          "SELECT name, avatar_color FROM users WHERE id = $1",
          [task.assigned_user_id]
        );
        return {
          ...task,
          assigned_user_name: users[0]?.name || null,
          assigned_user_avatar_color: users[0]?.avatar_color || null,
        };
      })
    );

    res.json(tasksWithUsers);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/projects/:projectId/tasks
 */
router.post("/projects/:projectId/tasks", async (req, res, next) => {
  try {
    const { title, description, assigned_user_id } = req.body;
    if (!title || !title.trim()) {
      return next(createError(400, "Task title is required"));
    }
    const { rows: posRows } = await getPool().query(
      "SELECT COALESCE(MAX(position), -1) + 1 AS next_pos FROM tasks WHERE project_id = $1 AND status = 'todo'",
      [req.params.projectId]
    );
    const nextPos = posRows[0].next_pos;
    const { rows } = await getPool().query(
      `INSERT INTO tasks (project_id, title, description, status, position, assigned_user_id)
       VALUES ($1, $2, $3, 'todo', $4, $5) RETURNING *`,
      [req.params.projectId, title.trim(), description || null, nextPos, assigned_user_id || null]
    );
    const { rows: taskRows } = await getPool().query(
      `SELECT t.*, u.name AS assigned_user_name, u.avatar_color AS assigned_user_avatar_color
       FROM tasks t LEFT JOIN users u ON t.assigned_user_id = u.id WHERE t.id = $1`,
      [rows[0].id]
    );
    res.status(201).json(taskRows[0]);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/tasks/:id
 */
router.put("/tasks/:id", async (req, res, next) => {
  try {
    const { title, description } = req.body;
    if (!title || !title.trim()) {
      return next(createError(400, "Task title is required"));
    }
    const { rows } = await getPool().query(
      `UPDATE tasks SET title = $1, description = $2, updated_at = NOW() WHERE id = $3 RETURNING *`,
      [title.trim(), description || null, req.params.id]
    );
    if (rows.length === 0) return next(createError(404, "Task not found"));
    const { rows: taskRows } = await getPool().query(
      `SELECT t.*, u.name AS assigned_user_name, u.avatar_color AS assigned_user_avatar_color
       FROM tasks t LEFT JOIN users u ON t.assigned_user_id = u.id WHERE t.id = $1`,
      [rows[0].id]
    );
    res.json(taskRows[0]);
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/tasks/:id/status
 */
router.patch("/tasks/:id/status", async (req, res, next) => {
  try {
    const { status, position } = req.body;
    if (!status || !VALID_STATUSES.includes(status)) {
      return next(createError(400, `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`));
    }
    if (position === undefined || position === null) {
      return next(createError(400, "Position is required"));
    }
    const { rows } = await getPool().query(
      `UPDATE tasks SET status = $1, position = $2, updated_at = NOW() WHERE id = $3 RETURNING *`,
      [status, position, req.params.id]
    );
    if (rows.length === 0) return next(createError(404, "Task not found"));
    const { rows: taskRows } = await getPool().query(
      `SELECT t.*, u.name AS assigned_user_name, u.avatar_color AS assigned_user_avatar_color
       FROM tasks t LEFT JOIN users u ON t.assigned_user_id = u.id WHERE t.id = $1`,
      [rows[0].id]
    );
    res.json(taskRows[0]);
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/tasks/:id/assign
 */
router.patch("/tasks/:id/assign", async (req, res, next) => {
  try {
    const { assigned_user_id } = req.body;
    const { rows } = await getPool().query(
      `UPDATE tasks SET assigned_user_id = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [assigned_user_id || null, req.params.id]
    );
    if (rows.length === 0) return next(createError(404, "Task not found"));
    const { rows: taskRows } = await getPool().query(
      `SELECT t.*, u.name AS assigned_user_name, u.avatar_color AS assigned_user_avatar_color
       FROM tasks t LEFT JOIN users u ON t.assigned_user_id = u.id WHERE t.id = $1`,
      [rows[0].id]
    );
    res.json(taskRows[0]);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/tasks/:id
 */
router.delete("/tasks/:id", async (req, res, next) => {
  try {
    const { rows } = await getPool().query(
      "DELETE FROM tasks WHERE id = $1 RETURNING id",
      [req.params.id]
    );
    if (rows.length === 0) return next(createError(404, "Task not found"));
    res.json({ message: "Task deleted", id: rows[0].id });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
EOF

  cat > DEMO_README.md << 'EOF'
# Demo Branch: AI Operations — Azure SRE Agent
## The Bug (Intentionally Seeded)
`concept/apps/api/src/routes/tasks.js` — GET /api/projects/:projectId/tasks

**N+1 Query Pattern:** Fetches all tasks in one query, then loops and fires
a separate SELECT per task to get the assigned user's name. With 20 tasks
on a board = 21 database queries per page load.

**No pagination:** Returns ALL tasks regardless of dataset size.

These cause the latency spike that Azure SRE Agent / App Insights detects.

## Also Missing
`concept/infrastructure/bicep/monitoring.bicep` — no alert rules defined as code.

## Demo Flow
1. Azure Portal → Application Insights — show the latency spike in Smart Detection
2. Azure SRE Agent — show it querying App Insights + container logs + query plan
3. SRE Agent output: "N+1 pattern, missing index on tasks.project_id, no pagination"
4. Switch to VS Code — use Copilot to fix

## Copilot Fix Prompt
```
The Azure SRE Agent identified performance issues in
concept/apps/api/src/routes/tasks.js:

1. N+1 query in GET /api/projects/:projectId/tasks — fix by replacing
   the per-task user lookup loop with a single LEFT JOIN query:
   SELECT t.*, u.name AS assigned_user_name, u.avatar_color AS assigned_user_avatar_color
   FROM tasks t LEFT JOIN users u ON t.assigned_user_id = u.id
   WHERE t.project_id = $1 ORDER BY t.position, t.created_at

2. No pagination — add optional ?limit=20&offset=0 query params
   (maintain backward compatibility: default returns all if not specified)

3. Create concept/infrastructure/bicep/monitoring.bicep with Azure Monitor
   alert rules for Taskify:
   - API p95 response time > 2000ms (Severity: 2)
   - Container error rate > 1% (Severity: 1)
   - Container CPU > 80% (Severity: 2)
   - PostgreSQL connection count > 80% max (Severity: 2)
   Follow patterns in existing stage*.bicep files.
   Use parameterized thresholds. Add action group for email.
```

## Reset
```bash
git checkout main && git branch -D demo/ai-operations
bash setup-demo-branches.sh --only ai-operations
```
EOF

  git add -A
  git commit -m "demo: ai-operations — N+1 query bug seeded in GET /projects/:id/tasks, no monitoring.bicep"
  log "demo/ai-operations committed"
}

# ─────────────────────────────────────────────────────────────────────────────
# Branch 5: demo/app-modernization
# Gap: App code replaced with legacy JS version (class components, SQL injection,
#       CommonJS, hardcoded secrets in deploy.sh)
# Copilot does a 4-PR modernization sequence
# ─────────────────────────────────────────────────────────────────────────────
build_legacy() {
  head "Branch: demo/app-modernization"
  info "Gap: Replacing app with legacy JS version — SQL injection, class components, hardcoded creds"

  create_branch "demo/app-modernization"

  # ── Legacy API ──────────────────────────────────────────────────────────────
  # Wipe clean API src, replace with legacy CommonJS JS files
  rm -rf concept/apps/api/src
  mkdir -p concept/apps/api/src/routes concept/apps/api/src/middleware concept/apps/api/src/services

  # Legacy index.js — no error middleware, no CORS config, CommonJS
  cat > concept/apps/api/src/index.js << 'EOF'
// Legacy Taskify API — index.js
// Issues: no error handler, no request logging, missing middleware
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors()); // no config — allows all origins
app.use(express.json());

// No health check endpoint
// No centralized error handling
// No request logging

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'taskify',
  port: parseInt(process.env.PGPORT || '5432'),
});

// Routes inline — not modular
app.get('/api/users', async (req, res) => {
  // No error handling
  const result = await pool.query('SELECT * FROM users ORDER BY name');
  res.json(result.rows);
});

app.get('/api/projects', async (req, res) => {
  const result = await pool.query('SELECT * FROM projects ORDER BY name');
  res.json(result.rows);
});

// VULNERABILITY: SQL injection — project ID from URL interpolated directly
app.get('/api/projects/:id/tasks', async (req, res) => {
  const id = req.params.id;
  // BAD: string concatenation — SQL injection risk
  const result = await pool.query(
    `SELECT t.*, u.name as assigned_user_name FROM tasks t
     LEFT JOIN users u ON t.assigned_user_id = u.id
     WHERE t.project_id = '${id}'`
  );
  res.json(result.rows);
});

// VULNERABILITY: No input validation on task creation
app.post('/api/projects/:id/tasks', async (req, res) => {
  const { title, description, assigned_user_id } = req.body;
  // No validation: title could be empty, assigned_user_id unverified
  const result = await pool.query(
    `INSERT INTO tasks (project_id, title, description, status, position, assigned_user_id)
     VALUES ('${req.params.id}', '${title}', '${description}', 'todo', 0, '${assigned_user_id}')
     RETURNING *`
  );
  res.json(result.rows[0]);
});

app.patch('/api/tasks/:id/status', async (req, res) => {
  const { status, position } = req.body;
  // No status validation — any string accepted
  const result = await pool.query(
    `UPDATE tasks SET status = '${status}', position = ${position} WHERE id = '${req.params.id}' RETURNING *`
  );
  res.json(result.rows[0]);
});

// VULNERABILITY: Comment delete has NO ownership check
app.delete('/api/comments/:id', async (req, res) => {
  // BAD: any user can delete any comment — no X-User-Id check
  await pool.query(`DELETE FROM comments WHERE id = '${req.params.id}'`);
  res.json({ deleted: true });
});

app.post('/api/tasks/:id/comments', async (req, res) => {
  const { content } = req.body;
  const userId = req.headers['x-user-id'];
  const result = await pool.query(
    `INSERT INTO comments (task_id, user_id, content) VALUES ('${req.params.id}', '${userId}', '${content}') RETURNING *`
  );
  res.json(result.rows[0]);
});

app.get('/api/tasks/:id/comments', async (req, res) => {
  const result = await pool.query(
    `SELECT c.*, u.name as author_name FROM comments c
     JOIN users u ON c.user_id = u.id
     WHERE c.task_id = '${req.params.id}' ORDER BY c.created_at`
  );
  res.json(result.rows);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API on port ${PORT}`));
EOF

  # Legacy package.json — no TypeScript
  cat > concept/apps/api/package.json << 'EOF'
{
  "name": "taskify-api",
  "version": "1.0.0",
  "description": "Taskify Backend API",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js"
  },
  "dependencies": {
    "express": "^4.21.0",
    "pg": "^8.13.0",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "nodemon": "^3.1.0"
  },
  "engines": {
    "node": ">=20.0.0"
  }
}
EOF

  # ── Legacy React frontend ───────────────────────────────────────────────────
  # Wipe web src, replace with class-based JSX components
  rm -rf concept/apps/web/src
  mkdir -p concept/apps/web/src/components/kanban concept/apps/web/src/components/users concept/apps/web/src/components/projects

  # Legacy App.jsx — class component, no TypeScript
  cat > concept/apps/web/src/App.jsx << 'EOF'
// App.jsx — Legacy class component
// Issues: class-based, no error handling, API URL hardcoded
import React, { Component } from 'react';
import UserSelect from './components/users/UserSelect.jsx';
import ProjectList from './components/projects/ProjectList.jsx';
import KanbanBoard from './components/kanban/KanbanBoard.jsx';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = { view: 'userSelect', currentUser: null, currentProject: null };
  }
  render() {
    const { view, currentUser, currentProject } = this.state;
    if (view === 'userSelect') return (
      <UserSelect onSelect={u => this.setState({ currentUser: u, view: 'projectList' })} />
    );
    if (view === 'projectList') return (
      <ProjectList currentUser={currentUser}
        onSelect={p => this.setState({ currentProject: p, view: 'board' })} />
    );
    return (
      <KanbanBoard project={currentProject} currentUser={currentUser}
        onBack={() => this.setState({ view: 'projectList' })} />
    );
  }
}
export default App;
EOF

  # Legacy main.jsx — no TypeScript
  cat > concept/apps/web/src/main.jsx << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
EOF

  cat > concept/apps/web/src/index.css << 'EOF'
/* Legacy CSS — no Tailwind, global styles only */
body { font-family: system-ui, sans-serif; margin: 0; background: #f4f4f5; }
button { cursor: pointer; }
EOF

  # Legacy KanbanBoard — class component, no TS, no DnD library, direct state mutation
  cat > concept/apps/web/src/components/kanban/KanbanBoard.jsx << 'EOF'
// KanbanBoard.jsx — Legacy class component
// Issues: class-based, direct state mutation, no error handling,
//         custom drag-and-drop that breaks on fast moves
import React, { Component } from 'react';

const COLUMNS = ['todo', 'in_progress', 'in_review', 'done'];
const LABELS = { todo: 'To Do', in_progress: 'In Progress', in_review: 'In Review', done: 'Done' };
const API = process.env.REACT_APP_API_URL || 'http://localhost:3000';

class KanbanBoard extends Component {
  constructor(props) {
    super(props);
    this.state = { tasks: [], loading: true, draggingId: null };
    this.handleDragStart = this.handleDragStart.bind(this);
    this.handleDrop = this.handleDrop.bind(this);
  }
  componentDidMount() {
    // No error handling
    fetch(`${API}/api/projects/${this.props.project.id}/tasks`)
      .then(r => r.json())
      .then(tasks => this.setState({ tasks, loading: false }));
  }
  handleDragStart(id) { this.setState({ draggingId: id }); }
  handleDrop(newStatus) {
    const id = this.state.draggingId;
    // BAD: direct state mutation (React anti-pattern)
    const tasks = this.state.tasks;
    const task = tasks.find(t => t.id === id);
    if (task) task.status = newStatus;
    this.setState({ tasks, draggingId: null });
    // Missing Content-Type header
    fetch(`${API}/api/tasks/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus, position: 0 })
    });
  }
  render() {
    const { tasks, loading } = this.state;
    const { currentUser, project, onBack } = this.props;
    if (loading) return <p>Loading...</p>;
    return (
      <div>
        <button onClick={onBack}>← Projects</button>
        <h2>{project.name}</h2>
        <div style={{ display: 'flex', gap: 16 }}>
          {COLUMNS.map(col => (
            <div key={col} style={{ minWidth: 220, background: '#f1f5f9', padding: 12 }}
              onDragOver={e => e.preventDefault()}
              onDrop={() => this.handleDrop(col)}>
              <h3>{LABELS[col]}</h3>
              {tasks.filter(t => t.status === col).map(task => (
                <div key={task.id} draggable
                  onDragStart={() => this.handleDragStart(task.id)}
                  style={{
                    background: task.assigned_user_id === currentUser.id ? '#eff6ff' : '#fff',
                    border: '1px solid #e2e8f0', borderRadius: 6, padding: 10, marginBottom: 6
                  }}>
                  <strong>{task.title}</strong>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{task.assigned_user_name || 'Unassigned'}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }
}
export default KanbanBoard;
EOF

  # Legacy UserSelect component
  cat > concept/apps/web/src/components/users/UserSelect.jsx << 'EOF'
import React, { Component } from 'react';
const API = process.env.REACT_APP_API_URL || 'http://localhost:3000';
class UserSelect extends Component {
  constructor(props) { super(props); this.state = { users: [] }; }
  componentDidMount() {
    fetch(`${API}/api/users`).then(r => r.json()).then(users => this.setState({ users }));
  }
  render() {
    return (
      <div style={{ maxWidth: 400, margin: '80px auto', textAlign: 'center' }}>
        <h1>Taskify</h1>
        <h2>Select User</h2>
        {this.state.users.map(u => (
          <button key={u.id} onClick={() => this.props.onSelect(u)}
            style={{ display: 'block', width: '100%', padding: 12, marginBottom: 8, fontSize: 16 }}>
            {u.name} — {u.role}
          </button>
        ))}
      </div>
    );
  }
}
export default UserSelect;
EOF

  # Legacy ProjectList component
  cat > concept/apps/web/src/components/projects/ProjectList.jsx << 'EOF'
import React, { Component } from 'react';
const API = process.env.REACT_APP_API_URL || 'http://localhost:3000';
class ProjectList extends Component {
  constructor(props) { super(props); this.state = { projects: [] }; }
  componentDidMount() {
    fetch(`${API}/api/projects`).then(r => r.json()).then(projects => this.setState({ projects }));
  }
  render() {
    return (
      <div style={{ maxWidth: 500, margin: '40px auto' }}>
        <p>Signed in as: <strong>{this.props.currentUser.name}</strong></p>
        <h2>Projects</h2>
        {this.state.projects.map(p => (
          <div key={p.id} onClick={() => this.props.onSelect(p)}
            style={{ padding: 16, marginBottom: 8, background: '#fff', borderRadius: 8, cursor: 'pointer' }}>
            <strong>{p.name}</strong>
          </div>
        ))}
      </div>
    );
  }
}
export default ProjectList;
EOF

  # Legacy package.json — no TypeScript, old React
  cat > concept/apps/web/package.json << 'EOF'
{
  "name": "taskify-web",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.0.0"
  }
}
EOF

  # Legacy vite.config.js (no TypeScript)
  cat > concept/apps/web/vite.config.js << 'EOF'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': 'http://localhost:3000' } }
});
EOF

  # Legacy deploy.sh with hardcoded password
  cat > concept/infrastructure/deploy.sh << 'DEPLOYEOF'
#!/bin/bash
# deploy.sh — Manual deployment script (no IaC)
# SECURITY ISSUE: hardcoded admin password
# SECURITY ISSUE: connection string exposed as container env var
# No Managed Identity, no Key Vault, no repeatability guarantees

RESOURCE_GROUP="rg-taskify-prod"
LOCATION="eastus"
DB_SERVER="taskify-db"
DB_ADMIN="taskifyadmin"
DB_PASSWORD="Taskify@2024!"  # HARDCODED — rotate immediately after deploy

echo "Creating resource group..."
az group create --name $RESOURCE_GROUP --location $LOCATION

echo "Creating PostgreSQL server..."
az postgres flexible-server create \
  --name $DB_SERVER --resource-group $RESOURCE_GROUP \
  --location $LOCATION --admin-user $DB_ADMIN \
  --admin-password "$DB_PASSWORD" \
  --sku-name Standard_B1ms --tier Burstable

echo "Creating Container App..."
az containerapp create \
  --name taskify-api --resource-group $RESOURCE_GROUP \
  --environment taskify-env \
  --image taskifyregistry.azurecr.io/taskify-api:latest \
  --env-vars \
    "PGHOST=${DB_SERVER}.postgres.database.azure.com" \
    "PGUSER=${DB_ADMIN}" \
    "PGPASSWORD=${DB_PASSWORD}" \
    "PGDATABASE=taskify" \
  --ingress external --target-port 3000

echo "Done. Note: no monitoring, no IaC. Repeat manually for staging/prod."
DEPLOYEOF
  chmod +x concept/infrastructure/deploy.sh

  cat > DEMO_README.md << 'EOF'
# Demo Branch: App Modernization with GitHub Copilot
## The Legacy Codebase

### Security — Critical
- `concept/apps/api/src/index.js` — SQL injection in multiple routes (string concatenation)
- `concept/apps/api/src/index.js` — No authorization on DELETE /api/comments/:id
- `concept/infrastructure/deploy.sh` — Hardcoded database password

### Architecture — High
- No TypeScript anywhere (.js, .jsx files)
- Class-based React components with direct state mutation
- No modular route structure (all routes in index.js)
- No error handling middleware
- Missing Content-Type header in fetch calls

### Infrastructure — High
- Manual deploy.sh with hardcoded credentials
- No Infrastructure as Code

## Demo Prompt Sequence

### Step 1 — Assessment
```
Assess this codebase for modernization. Review concept/apps/api/src/ and
concept/apps/web/src/. Produce a prioritized list of issues:
Critical (security), High (architecture), Medium (quality), Low (style).
```

### Step 2 — PR 1: Fix SQL Injection (Critical — 5 min)
```
Fix all SQL injection vulnerabilities in concept/apps/api/src/index.js.
Replace every string-concatenated SQL query with parameterized queries ($1, $2...).
Also add the ownership check missing from DELETE /api/comments/:id —
verify req.headers['x-user-id'] matches the comment's user_id before deleting.
Do not change any business logic, only fix the injection patterns.
```

### Step 3 — PR 2: Modularize + Error Handling (High — 5 min)
```
Refactor concept/apps/api/src/index.js:
- Extract each resource's routes into concept/apps/api/src/routes/{users,projects,tasks,comments}.js
- Add a centralized error handler middleware in concept/apps/api/src/middleware/errorHandler.js
- Add a GET /api/health endpoint
- Add request logging (use a simple console.log middleware)
Follow the structure documented in CLAUDE.md.
```

### Step 4 — PR 3: Modernize React (High — 5 min)
```
Migrate concept/apps/web/src/components from class components to functional
components with React hooks. Start with KanbanBoard.jsx:
- useState instead of this.state
- useEffect instead of componentDidMount
- useCallback for event handlers
- Fix the direct state mutation bug (create new array/object instead)
- Add missing Content-Type: application/json header to all fetch calls
Also restore TypeScript: rename .jsx → .tsx, add type definitions.
```

### Step 5 — PR 4: Replace deploy.sh with Bicep (High — 5 min)
```
Replace concept/infrastructure/deploy.sh with proper IaC.
Generate concept/infrastructure/bicep/main.bicep that:
- Deploys all Taskify resources (Container Apps, PostgreSQL, Key Vault)
- Uses Managed Identity — NO hardcoded passwords or connection strings
- Stores DB connection string in Key Vault, references it from Container App
- Follows patterns in the existing stage*.bicep files
```

## Reset
```bash
git checkout main && git branch -D demo/app-modernization
bash setup-demo-branches.sh --only app-modernization
```
EOF

  git add -A
  git commit -m "demo: app-modernization — legacy JS app with SQL injection, class components, hardcoded secrets"
  log "demo/app-modernization committed"
}

# ─────────────────────────────────────────────────────────────────────────────
# Branch 6: demo/iac-generation
# Gap: Modern clean app + detailed deploy.sh, no main.bicep, no terraform/
# Copilot generates Bicep from deploy.sh, then converts to Terraform
# ─────────────────────────────────────────────────────────────────────────────
build_iac() {
  head "Branch: demo/iac-generation"
  info "Gap: well-structured deploy.sh exists, no main.bicep, no terraform/"

  create_branch "demo/iac-generation"

  # Remove main.bicep and terraform dir if they exist
  rm -f concept/infrastructure/bicep/main.bicep
  rm -rf concept/infrastructure/terraform

  # Write a detailed deploy.sh that reads like real production infra
  cat > concept/infrastructure/deploy.sh << 'DEPLOYEOF'
#!/bin/bash
# =============================================================================
# deploy.sh — Taskify Azure Infrastructure
# =============================================================================
# Manual deployment script. Everything here should become Bicep/Terraform IaC.
#
# This script creates:
#   - Resource Group
#   - Log Analytics + App Insights
#   - Key Vault (RBAC mode)
#   - User-Managed Identity with KV Secrets User role
#   - PostgreSQL Flexible Server (password stored in Key Vault)
#   - Container Apps Environment (linked to Log Analytics)
#   - Container App for the API (Managed Identity reads KV secret)
#   - Static Web App for the React frontend
#
# Prerequisites: az login, appropriate subscription/RG permissions
# =============================================================================
set -e

RESOURCE_GROUP="rg-taskify-${ENVIRONMENT:-prod}"
LOCATION="${LOCATION:-eastus}"
SUFFIX="$(openssl rand -hex 4)"

LOG_WORKSPACE="log-taskify-${SUFFIX}"
APP_INSIGHTS="appi-taskify-${SUFFIX}"
KEY_VAULT="kv-taskify-${SUFFIX}"
MANAGED_ID="id-taskify-${SUFFIX}"
DB_SERVER="psql-taskify-${SUFFIX}"
CAE="cae-taskify-${SUFFIX}"
API_APP="ca-taskify-api-${SUFFIX}"
STATIC_APP="stapp-taskify-${SUFFIX}"

DB_ADMIN="taskifyadmin"
DB_NAME="taskify"
API_IMAGE="${ACR_NAME:-taskifyregistry}.azurecr.io/taskify-api:${IMAGE_TAG:-latest}"

echo "=== [1/8] Resource Group ==="
az group create --name "$RESOURCE_GROUP" --location "$LOCATION" \
  --tags Environment="${ENVIRONMENT:-prod}" Project=Taskify ManagedBy=Manual

echo "=== [2/8] Log Analytics + App Insights ==="
az monitor log-analytics workspace create \
  --workspace-name "$LOG_WORKSPACE" --resource-group "$RESOURCE_GROUP" --location "$LOCATION"

LOG_ID=$(az monitor log-analytics workspace show \
  -n "$LOG_WORKSPACE" -g "$RESOURCE_GROUP" --query customerId -o tsv)

az monitor app-insights component create \
  --app "$APP_INSIGHTS" --location "$LOCATION" \
  --resource-group "$RESOURCE_GROUP" --workspace "$LOG_WORKSPACE"

echo "=== [3/8] Key Vault (RBAC) ==="
az keyvault create --name "$KEY_VAULT" --resource-group "$RESOURCE_GROUP" \
  --location "$LOCATION" --enable-rbac-authorization true

KV_ID=$(az keyvault show --name "$KEY_VAULT" --query id -o tsv)

echo "=== [4/8] Managed Identity ==="
az identity create --name "$MANAGED_ID" --resource-group "$RESOURCE_GROUP"

MI_CLIENT_ID=$(az identity show -n "$MANAGED_ID" -g "$RESOURCE_GROUP" --query clientId -o tsv)
MI_PRINCIPAL=$(az identity show -n "$MANAGED_ID" -g "$RESOURCE_GROUP" --query principalId -o tsv)
MI_ID=$(az identity show -n "$MANAGED_ID" -g "$RESOURCE_GROUP" --query id -o tsv)

# Grant Managed Identity read access to Key Vault secrets
az role assignment create --assignee "$MI_PRINCIPAL" \
  --role "Key Vault Secrets User" --scope "$KV_ID"

echo "=== [5/8] PostgreSQL Flexible Server ==="
DB_PASSWORD=$(openssl rand -base64 32 | tr -d '=+/' | head -c 32)
az postgres flexible-server create \
  --name "$DB_SERVER" --resource-group "$RESOURCE_GROUP" --location "$LOCATION" \
  --admin-user "$DB_ADMIN" --admin-password "$DB_PASSWORD" \
  --sku-name Standard_B1ms --tier Burstable --storage-size 32 --version 16 \
  --high-availability Disabled

# Store connection string in Key Vault (not in env vars)
CONN_STR="postgresql://${DB_ADMIN}:${DB_PASSWORD}@${DB_SERVER}.postgres.database.azure.com/${DB_NAME}?sslmode=require"
az keyvault secret set --vault-name "$KEY_VAULT" \
  --name "db-connection-string" --value "$CONN_STR"
SECRET_URI=$(az keyvault secret show --vault-name "$KEY_VAULT" \
  --name "db-connection-string" --query id -o tsv)

echo "=== [6/8] Container Apps Environment ==="
az containerapp env create --name "$CAE" --resource-group "$RESOURCE_GROUP" \
  --location "$LOCATION" --logs-workspace-id "$LOG_ID"

echo "=== [7/8] API Container App ==="
az containerapp create \
  --name "$API_APP" --resource-group "$RESOURCE_GROUP" --environment "$CAE" \
  --image "$API_IMAGE" \
  --user-assigned "$MI_ID" \
  --secrets "db-conn=keyvaultref:${SECRET_URI},identityref:${MI_CLIENT_ID}" \
  --env-vars "DATABASE_URL=secretref:db-conn" "NODE_ENV=production" \
    "CORS_ORIGIN=https://${STATIC_APP}.azurestaticapps.net" \
  --ingress external --target-port 3000 \
  --min-replicas 1 --max-replicas 5 \
  --cpu 0.5 --memory 1Gi

echo "=== [8/8] Static Web App ==="
az staticwebapp create --name "$STATIC_APP" --resource-group "$RESOURCE_GROUP" \
  --location "$LOCATION" --sku Free

echo ""
echo "=== Deployment Complete ==="
echo "Outputs:"
echo "  API:    https://${API_APP}.<region>.azurecontainerapps.io"
echo "  Web:    https://${STATIC_APP}.azurestaticapps.net"
echo "  DB:     ${DB_SERVER}.postgres.database.azure.com"
echo ""
echo "Next: Upload static build to SWA, run SQL migrations via psql"
DEPLOYEOF
  chmod +x concept/infrastructure/deploy.sh

  cat > DEMO_README.md << 'EOF'
# Demo Branch: IaC Generation — Bash to Bicep to Terraform
## Starting State
- Full working TypeScript app
- `concept/infrastructure/deploy.sh` — well-structured manual bash script
- `concept/infrastructure/bicep/` — partial stage files exist
- **No `main.bicep`** composing all resources
- **No `terraform/`** directory

## Copilot Prompt — Part 1: Generate Bicep from deploy.sh
```
Read concept/infrastructure/deploy.sh. This is our current manual deployment
script. Generate concept/infrastructure/bicep/main.bicep that replaces it
with proper Azure Bicep:

Resources (in dependency order):
1. Log Analytics Workspace
2. Application Insights (linked to Log Analytics)
3. Key Vault (RBAC-enabled, NOT vault access policies)
4. User-Managed Identity + Key Vault Secrets User role assignment
5. PostgreSQL Flexible Server (password generated via uniqueString, stored in KV)
6. Container Apps Environment (linked to Log Analytics)
7. Container App for the API (Managed Identity reads DB secret from KV)
8. Static Web App for the React frontend

Requirements:
- Use Managed Identity everywhere — zero hardcoded passwords
- Add @description decorators on all params
- Use @allowed where appropriate (sku, tier)
- All resources tagged: Environment, Project, ManagedBy=Bicep
- Follow patterns in existing stage*.bicep files (naming, param style)
- Use modules for complex resources if it improves readability
- Output: apiUrl, webUrl, keyVaultName, dbServerName
```

## Copilot Prompt — Part 2: Convert to Terraform
```
Convert concept/infrastructure/bicep/main.bicep to Terraform HCL.
Create:
  concept/infrastructure/terraform/
    main.tf       — resource definitions
    variables.tf  — parameterized inputs with descriptions and defaults
    outputs.tf    — apiUrl, webUrl, keyVaultName, dbServerName
    providers.tf  — azurerm + azuread providers, required_providers block

Requirements:
- azurerm provider (latest stable, use ~> 3.0 constraint)
- Use for_each for role assignments where there are multiple
- for_each or count for any repeated resource patterns
- random_password resource for DB password (not random_string)
- All variables must have type and description
- Match the same resource configuration from the Bicep
```

## What to Show
1. Open deploy.sh — show the manual bash: "this is what 90% of customers have"
2. Run Part 1 prompt — Copilot reads deploy.sh, generates main.bicep
3. Walk through: Managed Identity pattern, KV reference, no hardcoded secrets
4. Run Part 2 prompt — one prompt converts to Terraform
5. Show: same infra, two IaC languages, both production-quality

## Reset
```bash
git checkout main && git branch -D demo/iac-generation
bash setup-demo-branches.sh --only iac-generation
```
EOF

  git add -A
  git commit -m "demo: iac-generation — detailed deploy.sh present, no main.bicep, no terraform"
  log "demo/iac-generation committed"
}

# ─────────────────────────────────────────────────────────────────────────────
# Branch 7: demo/security-quality
# Gap: Three OWASP vulnerabilities seeded in the working app
# Copilot security review + GitHub Advanced Security Autofix
# ─────────────────────────────────────────────────────────────────────────────
build_security() {
  head "Branch: demo/security-quality"
  info "Gap: SQL injection (A03), broken access control (A01), missing validation (A04)"

  create_branch "demo/security-quality"

  # Inject 3 OWASP vulnerabilities into tasks.js
  # Keep all other routes clean — only mutate the specific routes for the demo
  cat > concept/apps/api/src/routes/tasks.js << 'EOF'
// =============================================================================
// Tasks Routes — demo/security-quality
// =============================================================================
// This file has been intentionally seeded with 3 OWASP vulnerabilities
// for the GitHub Copilot Security demo.
//
// Vulnerabilities:
//   1. A03 Injection   — SQL injection in GET /api/tasks/search
//   2. A01 Broken Access Control — missing auth check in PATCH /api/tasks/:id/assign
//   3. A04 Insecure Design — no input validation in POST /api/projects/:id/tasks
//
// The rest of the routes are clean and correct.
// =============================================================================
const { Router } = require("express");
const { getPool } = require("../services/database");
const { createError } = require("../middleware/errorHandler");

const router = Router();
const VALID_STATUSES = ["todo", "in_progress", "in_review", "done"];

/**
 * GET /api/projects/:projectId/tasks — CLEAN (parameterized)
 */
router.get("/projects/:projectId/tasks", async (req, res, next) => {
  try {
    const { rows } = await getPool().query(
      `SELECT t.id, t.project_id, t.title, t.description, t.status, t.position,
              t.assigned_user_id, t.created_at, t.updated_at,
              u.name AS assigned_user_name, u.avatar_color AS assigned_user_avatar_color
       FROM tasks t LEFT JOIN users u ON t.assigned_user_id = u.id
       WHERE t.project_id = $1 ORDER BY t.position, t.created_at`,
      [req.params.projectId]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

/**
 * GET /api/tasks/search
 *
 * VULNERABILITY 1 — SQL Injection (OWASP A03:2021)
 * The 'q' query parameter is directly interpolated into the SQL query.
 * Attack: GET /api/tasks/search?q='; DROP TABLE tasks; --
 * Fix: Use parameterized query with ILIKE $1 pattern.
 */
router.get("/tasks/search", async (req, res, next) => {
  try {
    const q = req.query.q;
    if (!q) return res.json([]);
    // VULNERABILITY: string interpolation — SQL injection
    const { rows } = await getPool().query(
      `SELECT * FROM tasks WHERE title ILIKE '%${q}%' OR description ILIKE '%${q}%'`
    );
    res.json(rows);
  } catch (err) { next(err); }
});

/**
 * POST /api/projects/:projectId/tasks
 *
 * VULNERABILITY 2 — Insecure Design / Missing Input Validation (OWASP A04:2021)
 * No validation that assigned_user_id refers to a real user.
 * A caller can assign any arbitrary UUID as assigned_user_id.
 * No title length limit — allows inserting multi-MB strings.
 * Fix: Validate assigned_user_id exists in users table; add title length check.
 */
router.post("/projects/:projectId/tasks", async (req, res, next) => {
  try {
    const { title, description, assigned_user_id } = req.body;
    if (!title || !title.trim()) {
      return next(createError(400, "Task title is required"));
    }
    // VULNERABILITY: no check that assigned_user_id is a real user
    // VULNERABILITY: no title length limit
    const { rows: posRows } = await getPool().query(
      "SELECT COALESCE(MAX(position), -1) + 1 AS next_pos FROM tasks WHERE project_id = $1 AND status = 'todo'",
      [req.params.projectId]
    );
    const { rows } = await getPool().query(
      `INSERT INTO tasks (project_id, title, description, status, position, assigned_user_id)
       VALUES ($1, $2, $3, 'todo', $4, $5) RETURNING *`,
      [req.params.projectId, title.trim(), description || null, posRows[0].next_pos, assigned_user_id || null]
    );
    const { rows: taskRows } = await getPool().query(
      `SELECT t.*, u.name AS assigned_user_name, u.avatar_color AS assigned_user_avatar_color
       FROM tasks t LEFT JOIN users u ON t.assigned_user_id = u.id WHERE t.id = $1`,
      [rows[0].id]
    );
    res.status(201).json(taskRows[0]);
  } catch (err) { next(err); }
});

/**
 * PUT /api/tasks/:id — CLEAN
 */
router.put("/tasks/:id", async (req, res, next) => {
  try {
    const { title, description } = req.body;
    if (!title || !title.trim()) return next(createError(400, "Task title is required"));
    const { rows } = await getPool().query(
      `UPDATE tasks SET title = $1, description = $2, updated_at = NOW() WHERE id = $3 RETURNING *`,
      [title.trim(), description || null, req.params.id]
    );
    if (rows.length === 0) return next(createError(404, "Task not found"));
    const { rows: taskRows } = await getPool().query(
      `SELECT t.*, u.name AS assigned_user_name, u.avatar_color AS assigned_user_avatar_color
       FROM tasks t LEFT JOIN users u ON t.assigned_user_id = u.id WHERE t.id = $1`,
      [rows[0].id]
    );
    res.json(taskRows[0]);
  } catch (err) { next(err); }
});

/**
 * PATCH /api/tasks/:id/status — CLEAN
 */
router.patch("/tasks/:id/status", async (req, res, next) => {
  try {
    const { status, position } = req.body;
    if (!status || !VALID_STATUSES.includes(status)) {
      return next(createError(400, `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`));
    }
    if (position === undefined || position === null) return next(createError(400, "Position is required"));
    const { rows } = await getPool().query(
      `UPDATE tasks SET status = $1, position = $2, updated_at = NOW() WHERE id = $3 RETURNING *`,
      [status, position, req.params.id]
    );
    if (rows.length === 0) return next(createError(404, "Task not found"));
    const { rows: taskRows } = await getPool().query(
      `SELECT t.*, u.name AS assigned_user_name, u.avatar_color AS assigned_user_avatar_color
       FROM tasks t LEFT JOIN users u ON t.assigned_user_id = u.id WHERE t.id = $1`,
      [rows[0].id]
    );
    res.json(taskRows[0]);
  } catch (err) { next(err); }
});

/**
 * PATCH /api/tasks/:id/assign
 *
 * VULNERABILITY 3 — Broken Access Control (OWASP A01:2021)
 * Any user can re-assign any task to any other user.
 * There is no check that the requesting user has permission to modify this task.
 * In Taskify, only the current assignee or the project's PM should be able to reassign.
 * Fix: Verify X-User-Id is either the current assignee or a Product Manager role.
 */
router.patch("/tasks/:id/assign", async (req, res, next) => {
  try {
    const { assigned_user_id } = req.body;
    // VULNERABILITY: no authorization check — any user can reassign any task
    const { rows } = await getPool().query(
      `UPDATE tasks SET assigned_user_id = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [assigned_user_id || null, req.params.id]
    );
    if (rows.length === 0) return next(createError(404, "Task not found"));
    const { rows: taskRows } = await getPool().query(
      `SELECT t.*, u.name AS assigned_user_name, u.avatar_color AS assigned_user_avatar_color
       FROM tasks t LEFT JOIN users u ON t.assigned_user_id = u.id WHERE t.id = $1`,
      [rows[0].id]
    );
    res.json(taskRows[0]);
  } catch (err) { next(err); }
});

/**
 * DELETE /api/tasks/:id — CLEAN
 */
router.delete("/tasks/:id", async (req, res, next) => {
  try {
    const { rows } = await getPool().query(
      "DELETE FROM tasks WHERE id = $1 RETURNING id",
      [req.params.id]
    );
    if (rows.length === 0) return next(createError(404, "Task not found"));
    res.json({ message: "Task deleted", id: rows[0].id });
  } catch (err) { next(err); }
});

module.exports = router;
EOF

  cat > DEMO_README.md << 'EOF'
# Demo Branch: Security & Code Quality
## Seeded Vulnerabilities

### 1. SQL Injection — OWASP A03:2021 (Critical)
**Location:** `concept/apps/api/src/routes/tasks.js`, GET `/api/tasks/search`
```javascript
// VULNERABLE
`SELECT * FROM tasks WHERE title ILIKE '%${q}%'`
// Attack: ?q='; DROP TABLE tasks; --
```

### 2. Missing Input Validation — OWASP A04:2021 (High)
**Location:** POST `/api/projects/:id/tasks`
`assigned_user_id` is not validated against the users table.
Any arbitrary UUID is accepted — could reference non-existent users.

### 3. Broken Access Control — OWASP A01:2021 (High)
**Location:** PATCH `/api/tasks/:id/assign`
No authorization check — any user can reassign any task to anyone.
Should require the requester to be the current assignee or a PM.

## Demo Flow

### Step 1 — Copilot Security Review Prompt
```
Review concept/apps/api/src/routes/tasks.js for security vulnerabilities.

For each vulnerability found:
- Name the OWASP category
- Show the vulnerable code
- Explain the specific attack vector
- Provide the exact fix

Then apply all fixes.
```

### Step 2 — GitHub Advanced Security (CodeQL Autofix)
1. Push this branch: `git push origin demo/security-quality`
2. Go to the repo Security tab → Code Scanning
3. Wait for CodeQL scan (or show a pre-run scan)
4. Open the SQL Injection alert — show Copilot Autofix suggestion
5. Click "Commit suggestion" — generates a PR with the fix

## What Copilot Should Fix
1. Replace `%${q}%` interpolation with parameterized `ILIKE $1`
2. Add a SELECT EXISTS check that assigned_user_id is in users table before INSERT
3. Add X-User-Id check in assign route: verify requester is current assignee or PM role

## Reset
```bash
git checkout main && git branch -D demo/security-quality
bash setup-demo-branches.sh --only security-quality
```
EOF

  git add -A
  git commit -m "demo: security-quality — SQL injection (A03), broken access control (A01), missing validation (A04)"
  log "demo/security-quality committed"
}

# =============================================================================
# STEP 4 — Run builds (all or selective)
# =============================================================================

# Return to main before building each branch
git checkout main 2>/dev/null || true

if [[ -z "$ONLY" ]]; then
  build_spec_agent
  git checkout main 2>/dev/null || true
  build_playwright
  git checkout main 2>/dev/null || true
  build_figma
  git checkout main 2>/dev/null || true
  build_aiops
  git checkout main 2>/dev/null || true
  build_legacy
  git checkout main 2>/dev/null || true
  build_iac
  git checkout main 2>/dev/null || true
  build_security
  git checkout main 2>/dev/null || true
else
  case "$ONLY" in
    spec-driven-agent)  build_spec_agent ;;
    playwright-testing) build_playwright ;;
    figma-mcp)          build_figma ;;
    ai-operations)      build_aiops ;;
    app-modernization)  build_legacy ;;
    iac-generation)     build_iac ;;
    security-quality)   build_security ;;
    *) err "Unknown branch: $ONLY. Valid: spec-driven-agent, playwright-testing, figma-mcp, ai-operations, app-modernization, iac-generation, security-quality" ;;
  esac
  git checkout main 2>/dev/null || true
fi

# =============================================================================
# STEP 5 — Push all demo branches
# =============================================================================
head "Step 5 — Pushing to origin"

push_branch() {
  local branch="$1"
  if [[ -z "$ONLY" ]] || [[ "$ONLY" == "${branch#demo/}" ]]; then
    git push origin "$branch" --force
    log "Pushed $branch"
  fi
}

push_branch "demo/spec-driven-agent"
push_branch "demo/playwright-testing"
push_branch "demo/figma-mcp"
push_branch "demo/ai-operations"
push_branch "demo/app-modernization"
push_branch "demo/iac-generation"
push_branch "demo/security-quality"

# Push baseline tag
git push origin baseline --force
log "Pushed baseline tag"

# =============================================================================
# STEP 6 — Seed GitHub Issues (optional — requires gh CLI)
# =============================================================================

seed_github_issues() {
  head "Step 6 — Seeding GitHub Issues"

  if ! command -v gh >/dev/null 2>&1; then
    warn "gh CLI not found — skipping issue seeding."
    warn "Install from https://cli.github.com, then run: bash setup-demo-branches.sh --with-issues"
    return
  fi

  if ! gh auth status >/dev/null 2>&1; then
    warn "gh CLI not authenticated — skipping issue seeding."
    warn "Run: gh auth login, then: bash setup-demo-branches.sh --with-issues"
    return
  fi

  REPO="adelantestory/Cx-Innovation-Hub-IF-Baseline"

  info "Creating ACT I issues..."

  gh issue create \
    --repo "$REPO" \
    --title "Add due date field to task cards with overdue highlighting" \
    --label "enhancement" \
    --body "## Feature Request

Tasks should support an optional due date.

### Requirements
- Add \`due_date\` column to \`tasks\` table (nullable timestamp)
- Task cards should display the due date if set
- Cards with a past due date highlighted in amber/red
- Task detail view allows setting/clearing the due date
- API: support \`due_date\` in POST /api/tasks and PUT /api/tasks/:id

### Acceptance Criteria
- [ ] Database migration adds \`due_date\` to tasks table
- [ ] API accepts and returns \`due_date\` on task endpoints
- [ ] Task card shows due date badge when due_date is set
- [ ] Overdue cards have distinct visual treatment
- [ ] Task detail form includes date picker for due_date

### Demo Note
ACT I Scene 1 — assign to Copilot to demonstrate the async GitHub → VS Code loop.
Copilot should cascade the change across DB schema → API → React component." \
    2>&1 | tail -1 && log "Created: due date issue"

  gh issue create \
    --repo "$REPO" \
    --title "Add priority field to task cards (High / Medium / Low)" \
    --label "enhancement" \
    --body "## Feature Request

Tasks need a priority level to help teams focus on the most important work.

### Requirements
- Priority values: **High**, **Medium**, **Low** (default: Medium)
- Store in \`tasks\` table as varchar with check constraint
- Display as a colored badge on the task card:
  - High → red badge
  - Medium → yellow badge
  - Low → gray badge
- API: include \`priority\` in task creation and update endpoints

### Acceptance Criteria
- [ ] Database migration adds \`priority\` column with default 'Medium'
- [ ] API validates priority is one of: High, Medium, Low
- [ ] Task card displays priority badge with correct color
- [ ] Task detail form allows changing priority

### Demo Note
ACT I Scene 1 — spec cascade demo. Update specify.md to include priority,
Copilot cascades it across all layers." \
    2>&1 | tail -1 && log "Created: priority field issue"

  info "Creating ACT I Scene 2 issues..."

  gh issue create \
    --repo "$REPO" \
    --title "Write E2E tests for comment ownership rules" \
    --label "testing" \
    --body "## Testing Task

The spec states:
> 'You can edit any comments that you make, but you can't edit comments that other people made.
> You can delete any comments that you made, but you can't delete comments anybody else made.'

These ownership rules need Playwright E2E test coverage.

### Tests Required
1. **Edit own comment** — User A edits their comment → succeeds
2. **Cannot edit other's comment** — User A tries to edit User B's comment → blocked
3. **Delete own comment** — User A deletes their comment → removed
4. **Cannot delete other's comment** — User A tries to delete User B's comment → blocked

### File Location
\`concept/apps/web/tests/comments.ownership.spec.ts\`

### Demo Note
ACT I Scene 2 — Playwright spec-to-test traceability demo." \
    2>&1 | tail -1 && log "Created: comment ownership tests issue"

  info "Creating ACT II issues..."

  gh issue create \
    --repo "$REPO" \
    --title "Fix N+1 query performance issue on tasks endpoint" \
    --label "bug,performance" \
    --body "## Performance Bug

**Detected by:** Azure SRE Agent / Application Insights Smart Detection

### Problem
\`GET /api/projects/:id/tasks\` executes N+1 database queries:
- 1 query to fetch all tasks
- Then 1 additional query **per task** to fetch the assigned user

For a project with 20 tasks → 21 database queries per page load.

### Fix
Replace with a single LEFT JOIN query:
\`\`\`sql
SELECT t.*, u.name AS assigned_user_name, u.avatar_color AS assigned_user_avatar_color
FROM tasks t LEFT JOIN users u ON t.assigned_user_id = u.id
WHERE t.project_id = \$1 ORDER BY t.position, t.created_at
\`\`\`

### Also Required
- Add optional cursor-based pagination (?limit=20&offset=0)
- Add missing index on tasks.project_id

### Demo Note
ACT II — AI Operations. Azure SRE Agent surfaces this. Assign to Copilot." \
    2>&1 | tail -1 && log "Created: N+1 query issue"

  gh issue create \
    --repo "$REPO" \
    --title "Add monitoring.bicep — alert rules as code for Taskify" \
    --label "infrastructure,reliability" \
    --body "## Infrastructure Task

Taskify's monitoring configuration lives only in the Azure Portal.
It needs to be defined as code so it's version-controlled and repeatable.

### Alert Rules Required
| Alert | Threshold | Severity |
|-------|-----------|----------|
| API p95 latency | > 2000ms | Warning |
| Error rate | > 1% | Critical |
| Container CPU | > 80% | Warning |
| PostgreSQL connections | > 80% of max | Warning |

### Requirements
- Create \`concept/infrastructure/bicep/monitoring.bicep\`
- Follow patterns in existing \`stage*.bicep\` files
- Use parameterized thresholds (not hardcoded)
- Include action group for email notifications

### Demo Note
ACT II — Monitoring as Code. Copilot generates this after SRE Agent
identifies missing observability. Assign to Copilot." \
    2>&1 | tail -1 && log "Created: monitoring.bicep issue"

  echo ""
  log "5 issues created in $REPO"
  info "Next: go to the Issues tab and assign the ACT II issues to Copilot"
  info "  https://github.com/$REPO/issues"
}

if [[ "$WITH_ISSUES" == "true" ]]; then
  seed_github_issues
else
  info "Skipping GitHub Issues (run with --with-issues to seed them)"
fi

# =============================================================================
# STEP 7 — Summary
# =============================================================================
head "═══ Setup Complete ═══"
echo ""
echo "  Branches created and pushed:"
echo ""
git branch | grep "demo/" | while read b; do
  stripped="${b//\*/}"
  stripped="${stripped// /}"
  echo "  ✓  $stripped"
done
echo ""
echo "  Baseline tag: $(git rev-parse --short baseline)"
echo ""
echo "  Quick start:"
echo "    git checkout demo/spec-driven-agent"
echo "    cd concept && docker compose up"
echo ""
echo "  Reset a branch after a demo run:"
echo "    git checkout demo/<name>"
echo "    git reset --hard baseline"
echo "    bash setup-demo-branches.sh --only <name>"
echo "    git push origin demo/<name> --force"
echo ""
echo "  Full reset (all branches):"
echo "    bash setup-demo-branches.sh"
echo ""
echo "  Seed GitHub Issues (run once, requires gh CLI):"
echo "    bash setup-demo-branches.sh --with-issues"
echo ""
echo "  Full setup + issues in one shot:"
echo "    bash setup-demo-branches.sh --with-issues"
echo ""
