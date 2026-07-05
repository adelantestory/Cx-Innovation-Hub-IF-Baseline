// =============================================================================
// Tasks Routes
// =============================================================================
// GET    /api/projects/:projectId/tasks   - List tasks for a project
// POST   /api/projects/:projectId/tasks   - Create a task in a project
// PUT    /api/tasks/:id                   - Update a task
// PATCH  /api/tasks/:id/status            - Change task status (drag-and-drop)
// PATCH  /api/tasks/:id/assign            - Assign/unassign a user
// DELETE /api/tasks/:id                   - Delete a task
// =============================================================================

const { Router } = require("express");
const { getPool } = require("../services/database");
const { createError } = require("../middleware/errorHandler");

const router = Router();

const VALID_STATUSES = ["todo", "in_progress", "in_review", "done"];

/**
 * @openapi
 * /projects/{projectId}/tasks:
 *   get:
 *     tags: [Tasks]
 *     summary: List tasks for a project
 *     description: Returns all tasks in a project ordered by position and creation date. Includes assigned user details.
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The project UUID.
 *     responses:
 *       200:
 *         description: Array of tasks.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Task'
 */
router.get("/projects/:projectId/tasks", async (req, res, next) => {
  try {
    const { rows } = await getPool().query(
      `SELECT
        t.id, t.project_id, t.title, t.description,
        t.status, t.position, t.assigned_user_id,
        t.created_at, t.updated_at,
        u.name AS assigned_user_name,
        u.avatar_color AS assigned_user_avatar_color
      FROM tasks t
      LEFT JOIN users u ON t.assigned_user_id = u.id
      WHERE t.project_id = $1
      ORDER BY t.position, t.created_at`,
      [req.params.projectId]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /projects/{projectId}/tasks:
 *   post:
 *     tags: [Tasks]
 *     summary: Create a task in a project
 *     description: Creates a new task placed at the end of the `todo` column.
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The project UUID.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Implement login page"
 *               description:
 *                 type: string
 *                 example: "Build the login page UI and hook up auth"
 *               assigned_user_id:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *     responses:
 *       201:
 *         description: Task created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       400:
 *         description: Validation error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/projects/:projectId/tasks", async (req, res, next) => {
  try {
    const { title, description, assigned_user_id } = req.body;
    if (!title || !title.trim()) {
      return next(createError(400, "Task title is required"));
    }

    // Get the next position for new tasks in the "todo" column
    const { rows: posRows } = await getPool().query(
      "SELECT COALESCE(MAX(position), -1) + 1 AS next_pos FROM tasks WHERE project_id = $1 AND status = 'todo'",
      [req.params.projectId]
    );
    const nextPos = posRows[0].next_pos;

    const { rows } = await getPool().query(
      `INSERT INTO tasks (project_id, title, description, status, position, assigned_user_id)
       VALUES ($1, $2, $3, 'todo', $4, $5)
       RETURNING *`,
      [req.params.projectId, title.trim(), description || null, nextPos, assigned_user_id || null]
    );

    // Fetch with user details
    const { rows: taskRows } = await getPool().query(
      `SELECT
        t.*, u.name AS assigned_user_name, u.avatar_color AS assigned_user_avatar_color
      FROM tasks t
      LEFT JOIN users u ON t.assigned_user_id = u.id
      WHERE t.id = $1`,
      [rows[0].id]
    );

    res.status(201).json(taskRows[0]);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /tasks/{id}:
 *   put:
 *     tags: [Tasks]
 *     summary: Update a task
 *     description: Updates a task's `title` and/or `description`.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The task UUID.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Implement login page"
 *               description:
 *                 type: string
 *                 example: "Build the login page UI and hook up auth"
 *     responses:
 *       200:
 *         description: Updated task.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       400:
 *         description: Validation error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Task not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put("/tasks/:id", async (req, res, next) => {
  try {
    const { title, description } = req.body;
    if (!title || !title.trim()) {
      return next(createError(400, "Task title is required"));
    }

    const { rows } = await getPool().query(
      `UPDATE tasks SET title = $1, description = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [title.trim(), description || null, req.params.id]
    );

    if (rows.length === 0) {
      return next(createError(404, "Task not found"));
    }

    // Fetch with user details
    const { rows: taskRows } = await getPool().query(
      `SELECT
        t.*, u.name AS assigned_user_name, u.avatar_color AS assigned_user_avatar_color
      FROM tasks t
      LEFT JOIN users u ON t.assigned_user_id = u.id
      WHERE t.id = $1`,
      [rows[0].id]
    );

    res.json(taskRows[0]);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /tasks/{id}/status:
 *   patch:
 *     tags: [Tasks]
 *     summary: Change task status
 *     description: Updates the status and position of a task. Used by the Kanban drag-and-drop feature.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The task UUID.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status, position]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [todo, in_progress, in_review, done]
 *                 example: in_progress
 *               position:
 *                 type: integer
 *                 minimum: 0
 *                 example: 2
 *     responses:
 *       200:
 *         description: Updated task.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       400:
 *         description: Validation error (invalid status or missing position).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Task not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch("/tasks/:id/status", async (req, res, next) => {
  try {
    const { status, position } = req.body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return next(
        createError(400, `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`)
      );
    }

    if (position === undefined || position === null) {
      return next(createError(400, "Position is required"));
    }

    const { rows } = await getPool().query(
      `UPDATE tasks SET status = $1, position = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [status, position, req.params.id]
    );

    if (rows.length === 0) {
      return next(createError(404, "Task not found"));
    }

    // Fetch with user details
    const { rows: taskRows } = await getPool().query(
      `SELECT
        t.*, u.name AS assigned_user_name, u.avatar_color AS assigned_user_avatar_color
      FROM tasks t
      LEFT JOIN users u ON t.assigned_user_id = u.id
      WHERE t.id = $1`,
      [rows[0].id]
    );

    res.json(taskRows[0]);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /tasks/{id}/assign:
 *   patch:
 *     tags: [Tasks]
 *     summary: Assign or unassign a user
 *     description: Assigns a user to a task. Send `null` for `assigned_user_id` to unassign.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The task UUID.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               assigned_user_id:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 example: "3f1d2c4a-5678-90ab-cdef-1234567890ab"
 *     responses:
 *       200:
 *         description: Updated task.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       404:
 *         description: Task not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch("/tasks/:id/assign", async (req, res, next) => {
  try {
    const { assigned_user_id } = req.body;

    const { rows } = await getPool().query(
      `UPDATE tasks SET assigned_user_id = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [assigned_user_id || null, req.params.id]
    );

    if (rows.length === 0) {
      return next(createError(404, "Task not found"));
    }

    // Fetch with user details
    const { rows: taskRows } = await getPool().query(
      `SELECT
        t.*, u.name AS assigned_user_name, u.avatar_color AS assigned_user_avatar_color
      FROM tasks t
      LEFT JOIN users u ON t.assigned_user_id = u.id
      WHERE t.id = $1`,
      [rows[0].id]
    );

    res.json(taskRows[0]);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /tasks/{id}:
 *   delete:
 *     tags: [Tasks]
 *     summary: Delete a task
 *     description: Deletes a task and all its associated comments (via CASCADE).
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The task UUID.
 *     responses:
 *       200:
 *         description: Task deleted.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Task deleted
 *                 id:
 *                   type: string
 *                   format: uuid
 *       404:
 *         description: Task not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete("/tasks/:id", async (req, res, next) => {
  try {
    const { rows } = await getPool().query(
      "DELETE FROM tasks WHERE id = $1 RETURNING id",
      [req.params.id]
    );

    if (rows.length === 0) {
      return next(createError(404, "Task not found"));
    }

    res.json({ message: "Task deleted", id: rows[0].id });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
