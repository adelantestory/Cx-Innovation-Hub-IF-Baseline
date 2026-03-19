"""
Scenario: User Directory Browsing

Simulates users browsing the user directory — listing all users
and viewing individual user profiles.
Thresholds: GET p95 < 500 ms.
"""

import random

from locust import task

try:
    from .base import TaskifyBaseUser
except ImportError:
    from base import TaskifyBaseUser


class UserDirectoryUser(TaskifyBaseUser):
    """Simulates browsing the user directory and viewing user profiles."""

    weight = 3  # Moderate traffic — common read operation

    @task(3)
    def list_users(self):
        """Fetch the full list of users."""
        with self.client.get(
            "/api/users",
            name="GET /api/users",
            catch_response=True,
        ) as resp:
            if resp.status_code != 200:
                resp.failure(f"list_users: status {resp.status_code}")
                return
            if resp.elapsed.total_seconds() * 1000 > 500:
                resp.failure(
                    f"list_users: response time {resp.elapsed.total_seconds()*1000:.0f}ms > 500ms"
                )

    @task(2)
    def view_user_profile(self):
        """Fetch a single user profile by ID."""
        if not self.users:
            return

        user = random.choice(self.users)
        user_id = user.get("id", user.get("_id"))

        with self.client.get(
            f"/api/users/{user_id}",
            name="GET /api/users/:id",
            catch_response=True,
        ) as resp:
            if resp.status_code == 404:
                resp.failure(f"view_user_profile: user {user_id} not found")
                return
            if resp.status_code != 200:
                resp.failure(f"view_user_profile: status {resp.status_code}")
                return
            if resp.elapsed.total_seconds() * 1000 > 500:
                resp.failure(
                    f"view_user_profile: response time {resp.elapsed.total_seconds()*1000:.0f}ms > 500ms"
                )
