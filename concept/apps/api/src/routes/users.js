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
 * Returns users, optionally filtered by role.
 *
 * VULNERABILITY — SQL Injection (OWASP A03:2021)
 * The 'role' query parameter is directly concatenated into the SQL string.
 * Attack: GET /api/users?role=admin' OR '1'='1
 * Fix: Use parameterized query with $1 placeholder.
 */
router.get("/", async (req, res, next) => {
  try {
    const role = req.query.role;
    let query;
    if (role) {
      // VULNERABILITY: string concatenation — SQL injection
      query = "SELECT id, name, role, avatar_color, created_at FROM users WHERE role = '" + role + "' ORDER BY name";
    } else {
      query = "SELECT id, name, role, avatar_color, created_at FROM users ORDER BY name";
    }
    const { rows } = await getPool().query(query);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/users/:id
 * Returns a single user by UUID.
 *
 * VULNERABILITY — SQL Injection (OWASP A03:2021)
 * The :id route parameter is directly interpolated into the SQL string.
 * Attack: GET /api/users/1' UNION SELECT * FROM users --
 * Fix: Use parameterized query with $1 placeholder.
 */
router.get("/:id", async (req, res, next) => {
  try {
    // VULNERABILITY: template literal interpolation — SQL injection
    const { rows } = await getPool().query(
      `SELECT id, name, role, avatar_color, created_at FROM users WHERE id = '${req.params.id}'`
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
