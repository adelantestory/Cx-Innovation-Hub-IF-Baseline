// =============================================================================
// Input Validation Helpers
// =============================================================================
// Lightweight validation utilities used by route handlers to enforce
// safe input constraints before touching the database.
// =============================================================================

// RFC 4122 UUID pattern — accepts versions 1–5 (time-based, DCE, MD5, random, SHA-1).
// Intentionally accepts all versions so external UUIDs (e.g., from integrations) are
// not rejected. PostgreSQL's gen_random_uuid() produces version 4 UUIDs; all seed data
// in this project uses version 4, so any valid UUID accepted here will work as a PK.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Returns true if the value is a well-formed UUID v1–v5.
 * @param {unknown} value
 * @returns {boolean}
 */
function isUuid(value) {
  return typeof value === "string" && UUID_RE.test(value);
}

/**
 * Express middleware that validates named route parameters as UUIDs.
 * Responds with 400 Bad Request for any param that fails the check.
 *
 * Usage:
 *   router.get("/tasks/:id", validateUuidParams("id"), handler);
 *   router.get("/projects/:projectId/tasks", validateUuidParams("projectId"), handler);
 *
 * @param {...string} paramNames - Parameter names to validate.
 */
function validateUuidParams(...paramNames) {
  return (req, res, next) => {
    for (const name of paramNames) {
      const value = req.params[name];
      if (!isUuid(value)) {
        return res.status(400).json({
          error: { status: 400, message: `Invalid ${name}: must be a valid UUID` },
        });
      }
    }
    next();
  };
}

/**
 * Returns an error if the given value exceeds maxLength characters.
 * @param {string} field - Field name for the error message
 * @param {unknown} value - Value to check
 * @param {number} maxLength - Maximum allowed character count
 * @returns {string|null} Error message or null if valid
 */
function checkLength(field, value, maxLength) {
  if (typeof value === "string" && value.length > maxLength) {
    return `${field} must not exceed ${maxLength} characters`;
  }
  return null;
}

module.exports = { isUuid, validateUuidParams, checkLength };
