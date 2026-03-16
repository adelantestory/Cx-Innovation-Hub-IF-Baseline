# Pre-Commit Performance Check Hook

## Description

This Copilot hook runs before commits that modify API route files. It checks whether corresponding Locust performance test coverage exists for the modified endpoints and warns the developer if coverage is missing.

## Trigger

- **Event**: Pre-commit
- **Condition**: Files in `concept/apps/api/src/routes/` are staged for commit

## Behavior

### What It Checks

1. **Route file detection**: Identifies which route files (`users.js`, `projects.js`, `tasks.js`, `comments.js`) are being modified
2. **Endpoint extraction**: Scans the modified route files for `router.get()`, `router.post()`, `router.put()`, `router.patch()`, `router.delete()` calls
3. **Test coverage verification**: Checks `concept/tests/performance/locustfile.py` for matching Locust task methods that test those endpoints
4. **Coverage report**: Lists covered and uncovered endpoints

### Matching Logic

An endpoint is considered "covered" if `locustfile.py` contains a request to the same HTTP method and path pattern. For example:

| Route Definition | Expected in locustfile.py |
|-----------------|--------------------------|
| `router.get("/projects/:projectId/tasks", ...)` | `self.client.get("/api/projects/{id}/tasks", ...)` or `name="GET /api/projects/:projectId/tasks"` |
| `router.patch("/tasks/:id/status", ...)` | `self.client.patch(f"/api/tasks/{id}/status", ...)` or `name="PATCH /api/tasks/:id/status"` |

### Action on Missing Coverage

- **Severity**: Warning (does not block commit)
- **Message format**:

```
⚠️ Performance Test Coverage Warning

The following API endpoints were modified but have no matching Locust performance test:

  ✗ POST /api/projects/:projectId/labels (concept/apps/api/src/routes/projects.js:85)

Covered endpoints:
  ✓ GET /api/projects (browse_projects)
  ✓ GET /api/projects/:id (browse_projects)
  ✓ PATCH /api/tasks/:id/status (kanban_board_flow)

💡 To add coverage, use the Performance Test Generator skill:
   Add a @task method to concept/tests/performance/locustfile.py

   Example:
   @task(2)
   def new_endpoint_name(self):
       with self.client.post("/api/projects/{id}/labels", ...) as response:
           ...
```

## Implementation Notes

- This hook is advisory (warn-only), not blocking
- Uses the Performance Test Generator skill for remediation guidance
- Only triggers when API route files are modified (not other files)
- Skips check if `concept/tests/performance/locustfile.py` doesn't exist yet (first-time setup)
