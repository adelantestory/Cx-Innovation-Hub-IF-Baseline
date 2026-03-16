"""
Scenario: Browse Projects

Simulates a user browsing the project list and viewing individual project
details.  Thresholds: GET p95 < 500 ms.
"""

import random

from locust import task

from .base import TaskifyBaseUser


class BrowseProjectsUser(TaskifyBaseUser):
    """User that repeatedly browses and inspects projects."""

    @task
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
