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
const { validateUuidParams, checkLength } = require("../middleware/validate");

const router = Router();

// Maximum character lengths for text fields
const MAX_NAME_LENGTH = 255;
const MAX_DESCRIPTION_LENGTH = 2000;

/**
 * GET /api/projects
 * Returns all projects with task count per status.
 */
router.get("/", async (req, res, next) => {
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
router.get("/:id", validateUuidParams("id"), async (req, res, next) => {
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
router.post("/", async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return next(createError(400, "Project name is required"));
    }

    const nameError = checkLength("name", name, MAX_NAME_LENGTH);
    if (nameError) return next(createError(400, nameError));

    const descError = checkLength("description", description, MAX_DESCRIPTION_LENGTH);
    if (descError) return next(createError(400, descError));

    const { rows } = await getPool().query(
      "INSERT INTO projects (name, description) VALUES ($1, $2) RETURNING *",
      [name.trim(), description || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
