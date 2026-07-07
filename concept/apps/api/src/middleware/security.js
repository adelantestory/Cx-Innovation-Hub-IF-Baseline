// =============================================================================
// Security Middleware
// =============================================================================
// Provides lightweight request validation and identity checks for the API.
// =============================================================================

const { getPool } = require("../services/database");
const { createError } = require("./errorHandler");

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_TEXT_LENGTH = 2000;
const MAX_TITLE_LENGTH = 255;

function isUuid(value) {
  return typeof value === "string" && UUID_REGEX.test(value.trim());
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function sanitizeText(value, { fieldName, maxLength = MAX_TEXT_LENGTH, allowEmpty = false } = {}) {
  const normalized = normalizeText(value);

  if (!normalized && !allowEmpty) {
    throw createError(400, `${fieldName} is required`);
  }

  if (normalized.length > maxLength) {
    throw createError(400, `${fieldName} must be ${maxLength} characters or fewer`);
  }

  return normalized;
}

async function requireKnownUser(req, res, next) {
  const userId = req.get("x-user-id");
  if (!userId || !userId.trim()) {
    return next(createError(400, "X-User-Id header is required"));
  }

  const normalizedUserId = userId.trim();
  if (!isUuid(normalizedUserId)) {
    return next(createError(400, "X-User-Id must be a valid UUID"));
  }

  try {
    const { rows } = await getPool().query("SELECT id FROM users WHERE id = $1", [normalizedUserId]);
    if (rows.length === 0) {
      return next(createError(404, "User not found"));
    }

    req.authenticatedUserId = normalizedUserId;
    next();
  } catch (err) {
    next(err);
  }
}

function requireUuidParam(paramName) {
  return (req, res, next) => {
    const value = req.params[paramName];
    if (!isUuid(value)) {
      return next(createError(400, `${paramName} must be a valid UUID`));
    }
    next();
  };
}

module.exports = {
  MAX_TEXT_LENGTH,
  MAX_TITLE_LENGTH,
  isUuid,
  sanitizeText,
  requireKnownUser,
  requireUuidParam,
};
