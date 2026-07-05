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
 * @openapi
 * /users:
 *   get:
 *     tags: [Users]
 *     summary: List all users
 *     description: Returns all users ordered alphabetically by name.
 *     responses:
 *       200:
 *         description: Array of users.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
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
 * @openapi
 * /users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get a user by ID
 *     description: Returns a single user by their UUID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The user UUID.
 *     responses:
 *       200:
 *         description: The requested user.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
