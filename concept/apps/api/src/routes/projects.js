// =============================================================================
// Projects Routes
// =============================================================================
// GET  /api/projects       - List all projects
// GET  /api/projects/:id   - Get a single project (with task counts by status)
// POST /api/projects       - Create a new project
// =============================================================================

const { Router } = require("express");
const { getPool } = require("../services/database");
const { createError } = require("../middleware/errorHandler");
const { rateLimit } = require("../middleware/rateLimit");
const { requireUuidParam, sanitizeText } = require("../middleware/security");

const router = Router();
const apiRateLimit = rateLimit({ windowMs: 60_000, maxRequests: 120 });

/**
 * GET /api/projects
 * Returns all projects with task count per status.
 */
router.get("/", apiRateLimit, async (req, res, next) => {
  try {
    const { rows } = await getPool().query(`
      SELECT
        p.id, p.name, p.description, p.created_at, p.updated_at,
        COUNT(t.id)::int AS task_count,
        COUNT(t.id) FILTER (WHERE t.status = 'done')::int AS done_count
      FROM projects p
      LEFT JOIN tasks t ON t.project_id = p.id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/projects/:id
 * Returns a single project with its tasks grouped by status.
 */
router.get("/:id", requireUuidParam("id"), apiRateLimit, async (req, res, next) => {
  try {
    const { rows: projects } = await getPool().query(
      "SELECT id, name, description, created_at, updated_at FROM projects WHERE id = $1",
      [req.params.id]
    );
    if (projects.length === 0) {
      return next(createError(404, "Project not found"));
    }
    res.json(projects[0]);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/projects
 * Creates a new project. Requires { name } in request body.
 */
router.post("/", apiRateLimit, async (req, res, next) => {
  try {
    const name = sanitizeText(req.body?.name, { fieldName: "Project name", maxLength: 255 });
    const description = sanitizeText(req.body?.description, {
      fieldName: "Project description",
      maxLength: 2000,
      allowEmpty: true,
    });

    const { rows } = await getPool().query(
      "INSERT INTO projects (name, description) VALUES ($1, $2) RETURNING *",
      [name, description || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
