"""
Scenario: Kanban Board Flow

Simulates a user loading a project's task board and performing a drag-drop
status change.  Thresholds: GET p95 < 500 ms, PATCH p95 < 1000 ms.
"""

import random

from locust import task

from .base import TaskifyBaseUser, STATUS_CYCLE


class KanbanBoardUser(TaskifyBaseUser):
    """User that interacts with the Kanban board."""

    @task
    def kanban_board_flow(self):
        """Load a project's tasks then simulate a drag-drop status change."""
        if not self.projects:
            return

        project = random.choice(self.projects)
        project_id = project.get("id", project.get("_id"))

        # Fetch tasks for the project board
        with self.client.get(
            f"/api/projects/{project_id}/tasks",
            name="GET /api/projects/:id/tasks",
            catch_response=True,
        ) as resp:
            if resp.status_code != 200:
                resp.failure(f"kanban_board list: status {resp.status_code}")
                return
            if resp.elapsed.total_seconds() * 1000 > 500:
                resp.failure(
                    f"kanban_board list: response time {resp.elapsed.total_seconds()*1000:.0f}ms > 500ms"
                )
                return
            tasks = resp.json()

        if not tasks:
            return

        # Pick a random task and move it to the next status
        chosen_task = random.choice(tasks)
        task_id = chosen_task.get("id", chosen_task.get("_id"))
        current_status = chosen_task.get("status", "todo")

        try:
            current_idx = STATUS_CYCLE.index(current_status)
        except ValueError:
            current_idx = 0
        next_status = STATUS_CYCLE[(current_idx + 1) % len(STATUS_CYCLE)]

        with self.client.patch(
            f"/api/tasks/{task_id}/status",
            json={"status": next_status, "position": random.randint(0, 3)},
            name="PATCH /api/tasks/:id/status",
            catch_response=True,
        ) as resp:
            if resp.status_code < 200 or resp.status_code >= 300:
                resp.failure(f"kanban_board move: status {resp.status_code}")
            elif resp.elapsed.total_seconds() * 1000 > 1000:
                resp.failure(
                    f"kanban_board move: response time {resp.elapsed.total_seconds()*1000:.0f}ms > 1000ms"
                )
