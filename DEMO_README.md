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
