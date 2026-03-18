---
name: locust-performance-testing
description: "Create Locust performance test scenarios for the Taskify API. Use when: adding a new performance test, creating a load test scenario, writing a Locust test, adding a perf test, performance testing, stress testing, load testing. Handles file creation, wiring into locustfile.py, and updating __init__.py exports."
---

# Locust Performance Testing — Scenario Creation

## When to Use

- User asks to add a new performance test or load test scenario
- User wants to test a new API endpoint under load
- User says "add a perf test for X" or "create a Locust scenario for Y"
- User wants to stress test or load test an endpoint

## Architecture Overview

Performance tests live in `concept/tests/performance/` with this structure:

```
concept/tests/performance/
├── locustfile.py              # Entry point — imports all scenarios
├── requirements.txt           # locust>=2.20.0
├── results/                   # CSV/HTML output (gitignored)
└── scenarios/
    ├── __init__.py            # Exports all User classes
    ├── base.py                # TaskifyBaseUser (abstract base class)
    ├── test_browse_projects.py
    ├── test_kanban_board.py
    ├── test_comments.py
    └── test_health.py
```

**Key design principles:**
- Each scenario is a separate `test_*.py` file in `scenarios/`
- The GitHub Actions pipeline **auto-discovers** `test_*.py` files — no YAML changes needed
- Each file must work both as a **package import** (via `locustfile.py`) and **standalone** (via `locust -f`)
- The dual-import pattern (`try: from .base` / `except: from base`) enables both modes

## Procedure

### Step 1: Create the scenario file

Create `concept/tests/performance/scenarios/test_{scenario_name}.py` following this template:

```python
"""
Scenario: {Human-Readable Name}

{One-line description of what this scenario simulates.}
Thresholds: GET p95 < 500 ms, POST/PATCH p95 < 1000 ms.
"""

import random

from locust import task

try:
    from .base import TaskifyBaseUser
except ImportError:
    from base import TaskifyBaseUser


class {ClassName}User(TaskifyBaseUser):
    """{Brief description of this user type}."""

    weight = {1-10}  # Relative likelihood of this user type being spawned

    @task
    def {method_name}(self):
        """{What this task does}."""
        # Available from base class:
        #   self.projects  — list of project dicts (fetched on_start)
        #   self.users     — list of user dicts (fetched on_start)
        #   self.current_user_id — string ID of the simulated user
        #   self.client    — Locust HTTP client (requests-like)

        with self.client.get(
            "/api/endpoint",
            name="GET /api/endpoint",
            catch_response=True,
        ) as resp:
            if resp.status_code != 200:
                resp.failure(f"{method_name}: status {resp.status_code}")
                return
            # Enforce p95 threshold inline
            if resp.elapsed.total_seconds() * 1000 > 500:
                resp.failure(
                    f"{method_name}: response time {resp.elapsed.total_seconds()*1000:.0f}ms > 500ms"
                )
```

### Step 2: Register in `__init__.py`

Add the import and export to `concept/tests/performance/scenarios/__init__.py`:

```python
from .test_{scenario_name} import {ClassName}User
```

And add `"{ClassName}User"` to the `__all__` list.

### Step 3: Import in `locustfile.py`

Add the class to the import block in `concept/tests/performance/locustfile.py`:

```python
from scenarios import (
    BrowseProjectsUser,
    KanbanBoardUser,
    CommentActivityUser,
    HealthCheckUser,
    {ClassName}User,      # ← add here
)
```

Also update the docstring at the top of `locustfile.py` to list the new scenario.

### Step 4: Verify

Run these commands from `concept/tests/performance/`:

```bash
# Verify package import works
python -c "from scenarios import {ClassName}User; print('OK')"

# Verify standalone execution works
python -m locust -f scenarios/test_{scenario_name}.py --host=http://localhost:3000 --headless -u 5 -r 5 -t 15s

# Verify combined run still works
python -m locust -f locustfile.py --host=http://localhost:3000 --headless -u 10 -r 5 -t 30s
```

## Rules

### Naming Conventions
- **File**: `test_{snake_case_name}.py` — the `test_` prefix is required for auto-discovery
- **Class**: `{PascalCaseName}User` — must end with `User` for Locust to discover it
- **Task method**: `snake_case` — descriptive of the user behavior

### Threshold Enforcement
- **GET requests**: p95 < 500ms — enforce with inline `resp.elapsed` check
- **POST/PATCH requests**: p95 < 1000ms
- **Overall error rate**: < 1% (enforced by pipeline, not per-scenario)

### Weight Guidelines
- `weight = 1` — infrequent/background (e.g., health checks)
- `weight = 2-3` — moderate traffic (e.g., reading data)
- `weight = 4-5` — heavy traffic (e.g., core user flows)

### Dual-Import Pattern (Required)
Every scenario MUST use:
```python
try:
    from .base import TaskifyBaseUser
except ImportError:
    from base import TaskifyBaseUser
```
This allows the file to work as both a package import and a standalone Locust file.

### Base Class Provides
The `TaskifyBaseUser` in `scenarios/base.py` handles:
- `on_start()` — fetches all users and projects, sets random user ID
- `self.users` — list of user dicts from `/api/users`
- `self.projects` — list of project dicts from `/api/projects`
- `self.current_user_id` — string user ID for headers
- `wait_time = between(1, 3)` — random wait between tasks
- `host` — from `TASKIFY_BASE_URL` env var (default: `http://localhost:3000`)

### Pipeline Integration (Automatic)
The GitHub Actions workflow (`performance-testing.yml`) auto-discovers scenarios:
1. **discover-scenarios** job scans `scenarios/test_*.py` and builds a JSON matrix
2. **local-verification** runs all scenarios combined via `locustfile.py`
3. **local-scenario-tests** runs each scenario individually in parallel (matrix)
4. **cloud-load-test** runs each scenario as a separate Azure Load Test (matrix)

No workflow changes are needed when adding a new scenario.

### Configurable Load Parameters
The pipeline accepts these `workflow_dispatch` inputs to control load intensity:

| Input | Default | Used In | Description |
|-------|---------|---------|-------------|
| `combined_users` | `50` | local-verification | Virtual users for combined run |
| `combined_duration` | `2m` | local-verification | Duration (e.g., `2m`, `5m`, `10m`) |
| `combined_ramp_rate` | `10` | local-verification | Users spawned per second |
| `scenario_users` | `20` | local-scenario-tests | Virtual users per individual scenario |
| `scenario_duration` | `1m` | local-scenario-tests | Duration per scenario test |
| `scenario_ramp_rate` | `5` | local-scenario-tests | Users spawned per second per scenario |

**To stress-test the system:** Increase `combined_users` to 200–500+ and `scenario_users` to 100+ via the "Run workflow" button. Increase duration to `5m` or `10m` for sustained load. These values are also available on push-triggered runs via their defaults.

### Application Insights Integration
The API container is instrumented with the `applicationinsights` Node.js SDK. When the `APPLICATIONINSIGHTS_CONNECTION_STRING` environment variable is set (via Azure deployment), the SDK auto-collects:
- HTTP request telemetry (response times, status codes)
- Dependency calls (database queries, outbound HTTP)
- Exceptions and stack traces
- Performance counters (CPU, memory)

The pipeline's cloud-load-test job queries App Insights after each load test to surface exceptions and error rates in the GitHub Actions step summary.

## Existing Scenarios Reference

| File | Class | Weight | Description |
|------|-------|--------|-------------|
| `test_browse_projects.py` | `BrowseProjectsUser` | 3 | Browse project list, view project details |
| `test_kanban_board.py` | `KanbanBoardUser` | 4 | Load task board, drag-drop status change |
| `test_comments.py` | `CommentActivityUser` | 2 | View task comments, post new comment |
| `test_health.py` | `HealthCheckUser` | 1 | Lightweight health endpoint probe |

## API Endpoints Available

From the Taskify Express.js API:
- `GET /api/health` — health check
- `GET /api/users` — list all users
- `GET /api/projects` — list all projects
- `GET /api/projects/:id` — project details
- `GET /api/projects/:id/tasks` — tasks for a project
- `PATCH /api/tasks/:id/status` — update task status (body: `{status, position}`)
- `GET /api/tasks/:taskId/comments` — list comments on a task
- `POST /api/tasks/:taskId/comments` — create a comment (body: `{content, user_id}`)
