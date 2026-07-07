const expressRateLimit = require("express-rate-limit");

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 120;

function rateLimit({ windowMs = WINDOW_MS, maxRequests = MAX_REQUESTS } = {}) {
  return expressRateLimit({
    windowMs,
    max: maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({ error: "Too many requests" });
    },
  });
}

module.exports = { rateLimit };
