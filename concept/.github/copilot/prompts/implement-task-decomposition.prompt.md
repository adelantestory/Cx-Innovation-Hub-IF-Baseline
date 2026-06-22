---
mode: agent
description: "Implement Smart Task Decomposition feature with background agent container"
---

# Implement Smart Task Decomposition

You are implementing a "Smart Task Decomposition" feature for the Taskify Kanban board application. This adds a background agent that breaks tasks into subtasks when triggered by a user clicking a "Break Down" button.

## Architecture

```
User clicks "Break Down" → POST /api/tasks/:id/decompose (API)
  → API inserts row into task_jobs table (status: pending)
  → Agent container (polling every 3s) picks up the job
  → Agent generates subtasks (deterministic mock by default)
  → Agent calls POST /api/projects/:projectId/tasks for each subtask (with parent_task_id)
  → Agent marks job complete
  → Frontend waits 5s → calls onRefresh → board reloads → subtask cards appear in Todo
  → Subtask cards show "↳" prefix; parent cards show "🧩 N" subtask count badge
  → Opening parent task detail modal shows Subtasks section with status indicators
```

## What to Build

### 1. Database: `sql/002_agent_tables.sql`
First, add a `parent_task_id` column to the existing `tasks` table:
- `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE`
- Add index: `CREATE INDEX IF NOT EXISTS idx_tasks_parent_task_id ON tasks(parent_task_id)`

Then create a `task_jobs` table with columns: id (UUID PK), task_id (FK→tasks), project_id (FK→projects), job_type (TEXT, default 'decompose'), status (TEXT, default 'pending'), result (JSONB), created_at, completed_at. Add indexes on status and task_id.

### 2. API Endpoints in `apps/api/src/routes/tasks.js`
Update existing routes:
- `GET /api/projects/:projectId/tasks` — include `t.parent_task_id` in the SELECT
- `POST /api/projects/:projectId/tasks` — accept optional `parent_task_id` in body, include in INSERT

Add new endpoints before the DELETE endpoint:
- `GET /api/tasks/:id/subtasks` — returns all tasks where `parent_task_id = :id`, with user join
- `POST /api/tasks/:id/decompose` — verifies task exists, inserts a pending task_jobs row, returns 202 with job info
- `GET /api/tasks/:id/decompose/status` — returns latest job status for a task

### 3. Agent Container: `apps/agent/`
Create a new Node.js service:
- `package.json` with dependency on `pg` (v8+)
- `Dockerfile.dev` based on node:20-alpine with `--watch` for dev
- `src/index.js` — poll loop that claims pending jobs atomically (SELECT FOR UPDATE SKIP LOCKED), dispatches to processors
- `src/processors/decompose.js` — fetches parent task, generates subtasks via mock patterns, POSTs each to the API **with `parent_task_id` set to the parent task's ID**
- `src/mock-decompositions.json` — keyword→subtask mappings for deterministic output

The mock decompositions should cover these keywords: homepage/landing/hero, navigation/nav/menu, onboarding/tutorial, api/integration/endpoint, payment/checkout, css/tailwind/refactor, ci-cd/pipeline/deploy, auth/login, test/testing, database/schema. Include a fallback of 3 generic subtasks.

### 4. Frontend Changes

In `apps/web/src/api/types.ts`:
- Add `parent_task_id: string | null` to the Task interface

In `apps/web/src/api/client.ts`:
- Add `decomposeTask(id)` → POST to `/api/tasks/${id}/decompose`
- Add `fetchSubtasks(taskId)` → GET `/api/tasks/${taskId}/subtasks`
- Add `getDecomposeStatus(id)` → GET `/api/tasks/${id}/decompose/status`

In `apps/web/src/components/kanban/TaskDetail.tsx`:
- Import `useRef` alongside existing hooks
- Import `decomposeTask` and `fetchSubtasks`
- Add `onRefresh?: () => void` and `onTaskSelected?: (task: Task) => void` to the component props
- Add `decomposing` state and `subtasks` state (Task[])
- Add `loadSubtasks` callback that fetches subtasks for the current task
- Call `loadSubtasks()` in useEffect alongside comments
- Add `handleDecompose` function that calls `decomposeTask`, waits 5s, then calls `onRefresh()` and `onClose()`
- **Modal must be centered**: outer overlay uses `fixed inset-0 flex items-center justify-center`, inner dialog uses `max-h-[85vh] overflow-y-auto`
- **Modal must be draggable**: Add drag state (`dragOffset` {x,y}, `isDragging`, `dragStartRef`). The header div gets `cursor-grab active:cursor-grabbing` and an `onMouseDown` handler. A `useEffect` listens for `mousemove`/`mouseup` on `window` while dragging. Apply `style={{ transform: translate(${x}px, ${y}px) }}` to the modal div.
- Add a "✨ Break Down" primary button as the first action button (before Edit and Delete)
- When decomposing, button shows "🤖 Agent working..." and is disabled
- Button is also disabled when the task has no assigned user (`!task.assigned_user_id`), with a tooltip explaining assignment is required
- Add a "Subtasks" section below the actions that shows child tasks with status dots and badges (only renders if subtasks.length > 0)
- Each subtask item in the list must be clickable (cursor-pointer, hover border highlight). On click, call `onTaskSelected?.(subtask)` to navigate the modal to that subtask's detail view
- Add `onTaskSelected?: (task: Task) => void` prop to the component interface

In `apps/web/src/components/kanban/Card.tsx`:
- Add optional `subtaskCount` and `parentTitle` props
- If `task.parent_task_id` exists, render a "↳" prefix before the title (indicating this is a subtask)
- After the bold title text, if `parentTitle` is provided, render it in parentheses using non-bold, secondary-colored, caption-sized text: `(Parent Task Title)`
- If `subtaskCount > 0`, render a "🧩 N" badge next to the "YOU" badge (indicating this card has children)

In `apps/web/src/components/kanban/Column.tsx`:
- Add optional `subtaskCounts?: Record<string, number>` and `taskTitles?: Record<string, string>` props
- Pass `subtaskCounts[task.id]` as `subtaskCount` to each Card
- Pass `taskTitles[task.parent_task_id]` as `parentTitle` to each Card (only when parent_task_id exists)

In `apps/web/src/components/kanban/Board.tsx`:
- Import `useMemo`
- Add `onRefresh={loadData}` and `onTaskSelected={setSelectedTask}` props when rendering TaskDetail
- Compute `subtaskCounts` with useMemo: iterate all tasks, count those with `parent_task_id`
- Compute `taskTitles` with useMemo: map all task IDs to their titles
- Pass both `subtaskCounts` and `taskTitles` to each Column component

### 5. Docker Compose
Add an `agent` service to `docker-compose.yml`:
- Build from `./apps/agent` with `Dockerfile.dev`
- Container name: `taskify-agent`
- Environment: PGHOST=db, PGUSER=postgres, PGPASSWORD=postgres, PGDATABASE=taskify, PGPORT=5432, API_URL=http://api:3000, MOCK_MODE=true, POLL_INTERVAL=3000
- Mount `./apps/agent/src:/app/src:ro`
- depends_on: db (service_healthy), api (service_started)

### 6. Reset Scripts
Create `reset-demo.ps1` and `reset-demo.sh` that:
1. `docker compose down -v`
2. `git checkout .`
3. `git clean -fd -e .github/` (preserves the prompt file)
4. `docker compose up --build -d`
5. Wait for health check at http://localhost:3000/api/health

## Conventions
- Follow existing code style (see other route handlers and API client functions)
- Use `getPool()` for DB queries in the API
- Use `createError(status, message)` for API errors
- Agent uses raw `pg` Pool, not through the API's database service
- No authentication — this is a demo app
- The agent must call the API to create subtasks (not write directly to DB)

## Verification
After implementation, run `docker compose up --build`. All 4 containers should start. Open http://localhost:5173, click any task, click "Break Down", and within ~5 seconds the board automatically refreshes showing new subtask cards in the Todo column. Each subtask card displays a "↳" prefix. The parent card shows a "🧩 N" badge with the subtask count. Re-opening the parent task's detail modal shows a "Subtasks" section listing all child tasks with their status.
