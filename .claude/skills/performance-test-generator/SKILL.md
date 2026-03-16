# Performance Test Generator Skill

## Purpose

Generates Locust performance test scenarios for Taskify API endpoints. When a new API route is added or modified in `concept/apps/api/src/routes/`, this skill guides the creation of matching Locust test tasks with realistic payloads, appropriate weighting, and response time assertions.

## When to Use

- **New API endpoint added** — Generate a matching Locust task
- **Existing endpoint modified** — Update the corresponding Locust test scenario
- **Performance test review** — Validate test coverage against all API routes
- **Onboarding** — Quickly scaffold tests for multiple endpoints

## Triggers

- Files changed in `concept/apps/api/src/routes/`
- New route handler detected (Express.js `router.get`, `router.post`, `router.put`, `router.patch`, `router.delete`)
- Developer asks to add performance tests
- PR review identifies missing performance test coverage

---

## Procedure

### Step 1: Discover API Routes

Scan `concept/apps/api/src/routes/` for all Express.js route handlers:

```bash
grep -rn "router\.\(get\|post\|put\|patch\|delete\)" concept/apps/api/src/routes/
```

### Step 2: Map Routes to Test Scenarios

For each discovered route, determine:

| Attribute | How to Determine |
|-----------|-----------------|
| **HTTP Method** | From `router.get/post/put/patch/delete` |
| **Path** | First argument to the router method |
| **Required Body** | Look for `req.body` destructuring |
| **Required Headers** | Look for `req.headers` usage (e.g., `X-User-Id`) |
| **Path Params** | Look for `:paramName` in the route path |
| **Expected Status** | 200 for GET, 201 for POST, 200 for PUT/PATCH/DELETE |

### Step 3: Generate Locust Task

For each endpoint, generate a Locust task function following this pattern:

```python
@task(weight)
def endpoint_name(self):
    """METHOD /api/path — Description"""
    with self.client.method(
        "/api/path",
        json=payload,           # For POST/PUT/PATCH
        headers=headers,        # If X-User-Id needed
        name="METHOD /api/path",
        catch_response=True
    ) as response:
        if response.status_code != expected_status:
            response.failure(f"Expected {expected_status}, got {response.status_code}")
        elif response.elapsed.total_seconds() > threshold:
            response.failure(f"Response too slow: {response.elapsed.total_seconds():.2f}s")
```

### Step 4: Determine Weight and Thresholds

| Endpoint Type | Suggested Weight | Response Time Threshold |
|---------------|-----------------|------------------------|
| GET (list) | 3-4 | 500ms |
| GET (single) | 2-3 | 300ms |
| POST (create) | 2 | 1000ms |
| PUT/PATCH (update) | 2-3 | 1000ms |
| DELETE | 1 | 500ms |
| Health check | 1 | 200ms |

### Step 5: Generate Realistic Payloads

Use seed data patterns from `concept/sql/005_seed_data.sql` to create realistic test data:

- **Project names**: Use `f"Load Test Project {random.randint(1,1000)}"`
- **Task titles**: Use `f"Performance Test Task {random.randint(1,1000)}"`
- **Comments**: Use `f"Automated test comment at {time.time()}"`
- **User IDs**: Fetch from `/api/users` in `on_start` and cycle through them
- **Status values**: Cycle through `["todo", "in_progress", "in_review", "done"]`

### Step 6: Add to Existing Test File

Insert the new task into the existing `TaskifyUser` class in `concept/tests/performance/locustfile.py`:

1. Add the task method to the class
2. Update the class docstring to mention the new scenario
3. If the task needs setup data, add fetching logic to `on_start`

---

## Validation Checklist

- [ ] Every API route in `concept/apps/api/src/routes/` has a corresponding Locust task
- [ ] Weights reflect realistic user behavior (reads > writes)
- [ ] Response time thresholds are set (GET < 500ms, POST/PATCH < 1000ms)
- [ ] Payloads match the API's expected request body schema
- [ ] Required headers (e.g., `X-User-Id`) are included
- [ ] Path parameters use dynamic values from fetched data
- [ ] Task names in Locust match the endpoint pattern (`METHOD /api/path`)
- [ ] Tests run successfully against local Docker Compose environment

---

## Example Output

Given a new endpoint `POST /api/projects/:projectId/labels`:

```python
@task(1)
def create_label(self):
    """POST /api/projects/:projectId/labels — Add label to project"""
    if not self.projects:
        return
    project = random.choice(self.projects)
    with self.client.post(
        f"/api/projects/{project['id']}/labels",
        json={"name": f"label-{random.randint(1, 100)}", "color": "#3B82F6"},
        name="POST /api/projects/:projectId/labels",
        catch_response=True
    ) as response:
        if response.status_code != 201:
            response.failure(f"Expected 201, got {response.status_code}")
        elif response.elapsed.total_seconds() > 1.0:
            response.failure(f"Too slow: {response.elapsed.total_seconds():.2f}s")
```

## Integration with Other Skills

- **Performance Baseline Analyzer**: After generating tests, run them and analyze results
- **Deployment Preflight**: Verify test infrastructure before cloud-scale testing
