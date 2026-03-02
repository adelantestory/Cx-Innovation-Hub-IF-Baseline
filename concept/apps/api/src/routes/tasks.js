// =============================================================================
// Tasks Routes
// =============================================================================
// GET /api/projects/:projectId/tasks - List tasks for a project
// POST /api/projects/:projectId/tasks - Create a task in a project
// PUT /api/tasks/:id - Update a task
// PATCH /api/tasks/:id/status - Change task status (drag-and-drop)
// PATCH /api/tasks/:id/assign - Assign/unassign a user
// DELETE /api/tasks/:id - Delete a task
// =============================================================================
const { Router } = require("express");
const { getPool } = require("../services/database");
const { createError } = require("../middleware/errorHandler");

const router = Router();
const VALID_STATUSES = ["todo", "in_progress", "in_review", "done"];

/**
 * GET /api/projects/:projectId/tasks
 *
 * PERFORMANCE BUG (seeded for demo/ai-operations):
 *   This endpoint has an N+1 query pattern. It fetches all tasks first,
 *   then loops and executes a SEPARATE query per task to get the assigned user.
 *   With 20 tasks on a board = 21 database round-trips per page load.
 *
 *   Azure Application Insights / SRE Agent will flag this as a latency spike
 *   when the dataset grows. The fix is a single LEFT JOIN query.
 *
 *   Also missing: pagination — returns ALL tasks regardless of count.
 */
router.get("/projects/:projectId/tasks", async (req, res, next) => {
  try {
    // Query 1: fetch all tasks (no pagination, no JOIN)
    const { rows: tasks } = await getPool().query(
      "SELECT * FROM tasks WHERE project_id = $1 ORDER BY position, created_at",
      [req.params.projectId]
    );

    // N+1: one additional query per task to get the assigned user
    const tasksWithUsers = await Promise.all(
      tasks.map(async (task) => {
        if (!task.assigned_user_id) {
          return { ...task, assigned_user_name: null, assigned_user_avatar_color: null };
        }
        // BUG: executes once per task — O(n) queries total
        const { rows: users } = await getPool().query(
          "SELECT name, avatar_color FROM users WHERE id = $1",
          [task.assigned_user_id]
        );
        return {
          ...task,
          assigned_user_name: users[0]?.name || null,
          assigned_user_avatar_color: users[0]?.avatar_color || null,
        };
      })
    );

    res.json(tasksWithUsers);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/projects/:projectId/tasks
 */
router.post("/projects/:projectId/tasks", async (req, res, next) => {
  try {
    const { title, description, assigned_user_id } = req.body;
    if (!title || !title.trim()) {
      return next(createError(400, "Task title is required"));
    }
    const { rows: posRows } = await getPool().query(
      "SELECT COALESCE(MAX(position), -1) + 1 AS next_pos FROM tasks WHERE project_id = $1 AND status = 'todo'",
      [req.params.projectId]
    );
    const nextPos = posRows[0].next_pos;
    const { rows } = await getPool().query(
      `INSERT INTO tasks (project_id, title, description, status, position, assigned_user_id)
       VALUES ($1, $2, $3, 'todo', $4, $5) RETURNING *`,
      [req.params.projectId, title.trim(), description || null, nextPos, assigned_user_id || null]
    );
    const { rows: taskRows } = await getPool().query(
      `SELECT t.*, u.name AS assigned_user_name, u.avatar_color AS assigned_user_avatar_color
       FROM tasks t LEFT JOIN users u ON t.assigned_user_id = u.id WHERE t.id = $1`,
      [rows[0].id]
    );
    res.status(201).json(taskRows[0]);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/tasks/:id
 */
router.put("/tasks/:id", async (req, res, next) => {
  try {
    const { title, description } = req.body;
    if (!title || !title.trim()) {
      return next(createError(400, "Task title is required"));
    }
    const { rows } = await getPool().query(
      `UPDATE tasks SET title = $1, description = $2, updated_at = NOW() WHERE id = $3 RETURNING *`,
      [title.trim(), description || null, req.params.id]
    );
    if (rows.length === 0) return next(createError(404, "Task not found"));
    const { rows: taskRows } = await getPool().query(
      `SELECT t.*, u.name AS assigned_user_name, u.avatar_color AS assigned_user_avatar_color
       FROM tasks t LEFT JOIN users u ON t.assigned_user_id = u.id WHERE t.id = $1`,
      [rows[0].id]
    );
    res.json(taskRows[0]);
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/tasks/:id/status
 */
router.patch("/tasks/:id/status", async (req, res, next) => {
  try {
    const { status, position } = req.body;
    if (!status || !VALID_STATUSES.includes(status)) {
      return next(createError(400, `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`));
    }
    if (position === undefined || position === null) {
      return next(createError(400, "Position is required"));
    }
    const { rows } = await getPool().query(
      `UPDATE tasks SET status = $1, position = $2, updated_at = NOW() WHERE id = $3 RETURNING *`,
      [status, position, req.params.id]
    );
    if (rows.length === 0) return next(createError(404, "Task not found"));
    const { rows: taskRows } = await getPool().query(
      `SELECT t.*, u.name AS assigned_user_name, u.avatar_color AS assigned_user_avatar_color
       FROM tasks t LEFT JOIN users u ON t.assigned_user_id = u.id WHERE t.id = $1`,
      [rows[0].id]
    );
    res.json(taskRows[0]);
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/tasks/:id/assign
 */
router.patch("/tasks/:id/assign", async (req, res, next) => {
  try {
    const { assigned_user_id } = req.body;
    const { rows } = await getPool().query(
      `UPDATE tasks SET assigned_user_id = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [assigned_user_id || null, req.params.id]
    );
    if (rows.length === 0) return next(createError(404, "Task not found"));
    const { rows: taskRows } = await getPool().query(
      `SELECT t.*, u.name AS assigned_user_name, u.avatar_color AS assigned_user_avatar_color
       FROM tasks t LEFT JOIN users u ON t.assigned_user_id = u.id WHERE t.id = $1`,
      [rows[0].id]
    );
    res.json(taskRows[0]);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/tasks/:id
 */
router.delete("/tasks/:id", async (req, res, next) => {
  try {
    const { rows } = await getPool().query(
      "DELETE FROM tasks WHERE id = $1 RETURNING id",
      [req.params.id]
    );
    if (rows.length === 0) return next(createError(404, "Task not found"));
    res.json({ message: "Task deleted", id: rows[0].id });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
