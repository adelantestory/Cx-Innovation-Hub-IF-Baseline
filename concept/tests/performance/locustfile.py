"""
Locust Performance Tests for Taskify Kanban Board API

Simulates realistic user behavior against the Taskify Express.js REST API
including browsing projects, interacting with Kanban boards, and commenting.
"""

import os
import random
import logging

from locust import HttpUser, task, between, events

logger = logging.getLogger(__name__)

BASE_URL = os.environ.get("TASKIFY_BASE_URL", "http://localhost:3000")

STATUS_CYCLE = ["todo", "in_progress", "in_review", "done"]


@events.init.add_listener
def on_locust_init(environment, **kwargs):
    print("=" * 60)
    print("  Taskify Performance Test Configuration")
    print("=" * 60)
    print(f"  Target Host : {environment.host or BASE_URL}")
    print(f"  Users       : {environment.parsed_options.num_users if environment.parsed_options else 'N/A'}")
    print(f"  Spawn Rate  : {environment.parsed_options.spawn_rate if environment.parsed_options else 'N/A'}")
    print(f"  Run Time    : {environment.parsed_options.run_time if environment.parsed_options else 'N/A'}")
    print("=" * 60)


class TaskifyUser(HttpUser):
    """Simulates a Taskify user performing typical Kanban board operations."""

    wait_time = between(1, 3)
    host = BASE_URL

    def on_start(self):
        """Fetch seed data and configure the simulated user session."""
        self.users = []
        self.projects = []
        self.current_user_id = None

        # Fetch all users
        with self.client.get(
            "/api/users",
            name="[setup] GET /api/users",
            catch_response=True,
        ) as resp:
            if resp.status_code == 200:
                self.users = resp.json()
            else:
                resp.failure(f"Failed to fetch users: {resp.status_code}")
                logger.error("Could not fetch users during setup")

        # Fetch all projects
        with self.client.get(
            "/api/projects",
            name="[setup] GET /api/projects",
            catch_response=True,
        ) as resp:
            if resp.status_code == 200:
                self.projects = resp.json()
            else:
                resp.failure(f"Failed to fetch projects: {resp.status_code}")
                logger.error("Could not fetch projects during setup")

        # Set a random user for this session
        if self.users:
            user = random.choice(self.users)
            self.current_user_id = str(user.get("id", user.get("_id", 1)))
            self.client.headers.update({"X-User-Id": self.current_user_id})
        else:
            self.current_user_id = "1"
            self.client.headers.update({"X-User-Id": "1"})

    # ------------------------------------------------------------------
    # Tasks
    # ------------------------------------------------------------------

    @task(3)
    def browse_projects(self):
        """Browse the project list and view a random project's details."""
        with self.client.get(
            "/api/projects",
            name="GET /api/projects",
            catch_response=True,
        ) as resp:
            if resp.status_code != 200:
                resp.failure(f"browse_projects list: status {resp.status_code}")
                return
            if resp.elapsed.total_seconds() * 1000 > 500:
                resp.failure(
                    f"browse_projects list: response time {resp.elapsed.total_seconds()*1000:.0f}ms > 500ms"
                )
                return
            projects = resp.json()

        if not projects:
            return

        project = random.choice(projects)
        project_id = project.get("id", project.get("_id"))

        with self.client.get(
            f"/api/projects/{project_id}",
            name="GET /api/projects/:id",
            catch_response=True,
        ) as resp:
            if resp.status_code != 200:
                resp.failure(f"browse_projects detail: status {resp.status_code}")
            elif resp.elapsed.total_seconds() * 1000 > 500:
                resp.failure(
                    f"browse_projects detail: response time {resp.elapsed.total_seconds()*1000:.0f}ms > 500ms"
                )

    @task(4)
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

    @task(2)
    def comment_activity(self):
        """View comments on a task then post a new comment."""
        if not self.projects:
            return

        project = random.choice(self.projects)
        project_id = project.get("id", project.get("_id"))

        # Get tasks for the project to find a task id
        with self.client.get(
            f"/api/projects/{project_id}/tasks",
            name="[comment] GET /api/projects/:id/tasks",
            catch_response=True,
        ) as resp:
            if resp.status_code != 200:
                resp.failure(f"comment_activity tasks: status {resp.status_code}")
                return
            tasks = resp.json()

        if not tasks:
            return

        chosen_task = random.choice(tasks)
        task_id = chosen_task.get("id", chosen_task.get("_id"))

        # Fetch existing comments
        with self.client.get(
            f"/api/tasks/{task_id}/comments",
            name="GET /api/tasks/:taskId/comments",
            catch_response=True,
        ) as resp:
            if resp.status_code != 200:
                resp.failure(f"comment_activity list: status {resp.status_code}")
                return
            if resp.elapsed.total_seconds() * 1000 > 500:
                resp.failure(
                    f"comment_activity list: response time {resp.elapsed.total_seconds()*1000:.0f}ms > 500ms"
                )
                return

        # Post a new comment
        comment_texts = [
            "Looks good, moving forward.",
            "Need more details on this one.",
            "Blocked by upstream dependency.",
            "Ready for review.",
            "Updated the implementation.",
            "Can we discuss this in standup?",
            "LGTM!",
            "Added unit tests for this.",
        ]

        with self.client.post(
            f"/api/tasks/{task_id}/comments",
            json={
                "content": random.choice(comment_texts),
                "user_id": int(self.current_user_id) if self.current_user_id.isdigit() else self.current_user_id,
            },
            headers={"X-User-Id": self.current_user_id},
            name="POST /api/tasks/:taskId/comments",
            catch_response=True,
        ) as resp:
            if resp.status_code < 200 or resp.status_code >= 300:
                resp.failure(f"comment_activity post: status {resp.status_code}")
            elif resp.elapsed.total_seconds() * 1000 > 1000:
                resp.failure(
                    f"comment_activity post: response time {resp.elapsed.total_seconds()*1000:.0f}ms > 1000ms"
                )

    @task(1)
    def health_check(self):
        """Verify the API health endpoint."""
        with self.client.get(
            "/api/health",
            name="GET /api/health",
            catch_response=True,
        ) as resp:
            if resp.status_code != 200:
                resp.failure(f"health_check: status {resp.status_code}")
            elif resp.elapsed.total_seconds() * 1000 > 500:
                resp.failure(
                    f"health_check: response time {resp.elapsed.total_seconds()*1000:.0f}ms > 500ms"
                )


# ------------------------------------------------------------------
# Programmatic execution
# ------------------------------------------------------------------
if __name__ == "__main__":
    import locust.main

    os.environ.setdefault("LOCUST_HOST", BASE_URL)

    locust.main.main(
        [
            "-f", __file__,
            "--headless",
            "-u", "50",
            "-r", "10",
            "-t", "2m",
            "--csv", "results/taskify",
        ]
    )
