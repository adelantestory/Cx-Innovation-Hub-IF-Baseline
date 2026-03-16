"""
Scenario: Health Check

Lightweight probe that verifies the API health endpoint.
Threshold: GET p95 < 500 ms.
"""

from locust import task

from .base import TaskifyBaseUser


class HealthCheckUser(TaskifyBaseUser):
    """User that continuously hits the health endpoint."""

    @task
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
