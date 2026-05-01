// =============================================================================
// Rate Limiting Middleware
// =============================================================================
// Simple in-memory sliding-window rate limiter.
//
// Limits each IP address to a configurable number of requests per time window.
// Uses a Map to track request counts — suitable for single-instance deployments
// (this prototype runs as a single Container App replica).
//
// Production note: For multi-replica deployments, replace this with a Redis-backed
// rate limiter (e.g., express-rate-limit + rate-limit-redis) so limits apply
// across all replicas.
// =============================================================================

/**
 * Creates an Express rate-limiting middleware.
 *
 * @param {object} options
 * @param {number} options.windowMs  - Time window in milliseconds (default: 60 000 = 1 min)
 * @param {number} options.max       - Maximum requests per window per IP (default: 100)
 * @param {string} [options.message] - Response message when limit is exceeded
 * @returns {import('express').RequestHandler}
 */
function createRateLimiter({ windowMs = 60_000, max = 100, message = "Too many requests, please try again later." } = {}) {
  // Map<ip, { count: number, resetAt: number }>
  const clients = new Map();

  // Periodically purge expired entries to prevent unbounded memory growth
  const purgeInterval = setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of clients.entries()) {
      if (entry.resetAt <= now) {
        clients.delete(ip);
      }
    }
  }, windowMs).unref(); // .unref() prevents the interval from keeping the process alive

  return (req, res, next) => {
    // Use X-Forwarded-For when running behind a reverse proxy (Azure Container Apps)
    const ip = req.headers["x-forwarded-for"]?.split(",")[0].trim() || req.socket.remoteAddress || "unknown";
    const now = Date.now();

    let entry = clients.get(ip);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 1, resetAt: now + windowMs };
      clients.set(ip, entry);
    } else {
      entry.count += 1;
    }

    // Set rate-limit response headers (informational)
    res.setHeader("X-RateLimit-Limit", String(max));
    res.setHeader("X-RateLimit-Remaining", String(Math.max(0, max - entry.count)));
    res.setHeader("X-RateLimit-Reset", String(Math.ceil(entry.resetAt / 1000)));

    if (entry.count > max) {
      res.setHeader("Retry-After", String(Math.ceil((entry.resetAt - now) / 1000)));
      return res.status(429).json({ error: { status: 429, message } });
    }

    next();
  };
}

module.exports = { createRateLimiter };
