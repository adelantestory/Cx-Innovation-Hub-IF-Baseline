// =============================================================================
// Users Routes
// =============================================================================
// GET /api/users       - List all users
// GET /api/users/:id   - Get a single user by ID
// =============================================================================

const { Router } = require("express");
const { getPool } = require("../services/database");
const { createError } = require("../middleware/errorHandler");

const router = Router();

/**
 * GET /api/users
 * Returns all users ordered by name.
 */
router.get("/", async (req, res, next) => {
  try {
    const { rows } = await getPool().query(
      "SELECT id, name, role, avatar_color, created_at FROM users ORDER BY name"
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/users/:id
 * Returns a single user by UUID.
 */
router.get("/:id", async (req, res, next) => {
  try {
    const { rows } = await getPool().query(
      "SELECT id, name, role, avatar_color, created_at FROM users WHERE id = $1",
      [req.params.id]
    );
    if (rows.length === 0) {
      return next(createError(404, "User not found"));
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
