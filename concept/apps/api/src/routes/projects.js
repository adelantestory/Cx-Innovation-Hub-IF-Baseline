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

const router = Router();

/**
 * @openapi
 * /projects:
 *   get:
 *     tags: [Projects]
 *     summary: List all projects
 *     description: Returns all projects with total and completed task counts, ordered by creation date (newest first).
 *     responses:
 *       200:
 *         description: Array of projects.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Project'
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
 * @openapi
 * /projects/{id}:
 *   get:
 *     tags: [Projects]
 *     summary: Get a project by ID
 *     description: Returns a single project by its UUID.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The project UUID.
 *     responses:
 *       200:
 *         description: The requested project.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       404:
 *         description: Project not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/:id", async (req, res, next) => {
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
 * @openapi
 * /projects:
 *   post:
 *     tags: [Projects]
 *     summary: Create a project
 *     description: Creates a new project. `name` is required.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Website Redesign"
 *               description:
 *                 type: string
 *                 example: "Full redesign of the company website"
 *     responses:
 *       201:
 *         description: Project created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       400:
 *         description: Missing or invalid request body.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/", async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return next(createError(400, "Project name is required"));
    }

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
