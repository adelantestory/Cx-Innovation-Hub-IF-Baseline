// =============================================================================
// Error Handling Middleware
// =============================================================================
// Global Express error handler. Catches unhandled errors from route handlers
// and returns a consistent JSON error response. Logs errors to stdout for
// Container Apps / Log Analytics collection.
//
// Security note: Unexpected 500 errors return a generic message in production
// to prevent internal implementation details from leaking to clients.
// =============================================================================

const IS_PRODUCTION = process.env.NODE_ENV === "production";

/**
 * Express error-handling middleware (must have 4 parameters).
 */
function errorHandler(err, req, res, _next) {
  const status = err.status || 500;
  const message = err.message || "Internal Server Error";

  console.error(`[ERROR] ${req.method} ${req.originalUrl} - ${status}: ${message}`);
  if (status === 500) {
    console.error(err.stack);
  }

  // In production, hide raw error messages for unexpected 500s to prevent
  // information disclosure. Application-defined errors (err.status is set)
  // are safe to return as-is since they carry intentional messages.
  const clientMessage = (status === 500 && IS_PRODUCTION && !err.status)
    ? "Internal Server Error"
    : message;

  res.status(status).json({
    error: {
      status,
      message: clientMessage,
    },
  });
}

/**
 * Creates an HTTP error with a status code.
 * @param {number} status - HTTP status code
 * @param {string} message - Error message
 * @returns {Error}
 */
function createError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

module.exports = { errorHandler, createError };
