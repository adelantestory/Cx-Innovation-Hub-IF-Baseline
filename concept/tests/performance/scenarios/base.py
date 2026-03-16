"""
Shared base class for Taskify performance test scenarios.

Provides common setup logic (fetching users and projects) so each
individual scenario file stays focused on its own user behaviour.
"""

import os
import random
import logging

from locust import HttpUser, between, events

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


class TaskifyBaseUser(HttpUser):
    """Base class that fetches seed data on start.  Mark abstract so Locust
    does not try to instantiate it directly."""

    abstract = True
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
