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
 * @param {number} options.windowMs      - Time window in milliseconds (default: 60 000 = 1 min)
 * @param {number} options.max           - Maximum requests per window per IP (default: 100)
 * @param {string} [options.message]     - Response message when limit is exceeded
 * @param {boolean} [options.trustProxy] - Set true to trust X-Forwarded-For (when behind a known
 *                                         trusted reverse proxy). Defaults to false to prevent IP
 *                                         spoofing if the app is exposed directly.
 * @returns {{ middleware: import('express').RequestHandler, shutdown: () => void }}
 */
function createRateLimiter({
  windowMs = 60_000,
  max = 100,
  message = "Too many requests, please try again later.",
  trustProxy = false,
} = {}) {
  // Map<ip, { count: number, resetAt: number }>
  const clients = new Map();

  // Periodically purge expired entries to prevent unbounded memory growth.
  // Store the reference so callers can clear it via shutdown() for clean test teardown.
  const purgeInterval = setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of clients.entries()) {
      if (entry.resetAt <= now) {
        clients.delete(ip);
      }
    }
  }, windowMs).unref(); // .unref() prevents the interval from blocking process exit

  function middleware(req, res, next) {
    // Determine client IP.
    // X-Forwarded-For is only trusted when trustProxy is explicitly enabled to prevent
    // clients from spoofing their IP if the app is accidentally exposed without a proxy.
    let ip;
    if (trustProxy && req.headers["x-forwarded-for"]) {
      ip = req.headers["x-forwarded-for"].split(",")[0].trim();
    } else {
      ip = req.socket.remoteAddress || "unknown";
    }

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
  }

  /** Clears the internal purge interval. Call during graceful shutdown or in tests. */
  function shutdown() {
    clearInterval(purgeInterval);
  }

  return { middleware, shutdown };
}

module.exports = { createRateLimiter };
