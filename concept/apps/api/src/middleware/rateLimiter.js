// =============================================================================
// API Rate Limiting Middleware
// =============================================================================
// Defaults are intentionally conservative for the prototype and can be
// overridden per deployment without changing source code.
// =============================================================================

const rateLimit = require("express-rate-limit");

const DEFAULT_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_MAX_REQUESTS = 100;

function readPositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function createApiRateLimiter() {
  return rateLimit({
    windowMs: readPositiveInteger(
      process.env.RATE_LIMIT_WINDOW_MS,
      DEFAULT_WINDOW_MS
    ),
    limit: readPositiveInteger(
      process.env.RATE_LIMIT_MAX_REQUESTS,
      DEFAULT_MAX_REQUESTS
    ),
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({
        error: {
          status: 429,
          message: "Too many requests, please try again later.",
        },
      });
    },
  });
}

module.exports = { createApiRateLimiter };
