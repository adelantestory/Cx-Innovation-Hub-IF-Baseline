// =============================================================================
// Tasks Routes — demo/security-quality
// =============================================================================
// This file has been intentionally seeded with 3 OWASP vulnerabilities
// for the GitHub Copilot Security demo.
//
// Vulnerabilities:
//   1. A03 Injection   — SQL injection in GET /api/tasks/search
//   2. A01 Broken Access Control — missing auth check in PATCH /api/tasks/:id/assign
//   3. A04 Insecure Design — no input validation in POST /api/projects/:id/tasks
//
// The rest of the routes are clean and correct.
// =============================================================================
const { Router } = require("express");
const { getPool } = require("../services/database");
const { createError } = require("../middleware/errorHandler");

const router = Router();
const VALID_STATUSES = ["todo", "in_progress", "in_review", "done"];

/**
 * GET /api/projects/:projectId/tasks — CLEAN (parameterized)
 */
router.get("/projects/:projectId/tasks", async (req, res, next) => {
  try {
    const { rows } = await getPool().query(
      `SELECT t.id, t.project_id, t.title, t.description, t.status, t.position,
              t.assigned_user_id, t.created_at, t.updated_at,
              u.name AS assigned_user_name, u.avatar_color AS assigned_user_avatar_color
       FROM tasks t LEFT JOIN users u ON t.assigned_user_id = u.id
       WHERE t.project_id = $1 ORDER BY t.position, t.created_at`,
      [req.params.projectId]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

/**
 * GET /api/tasks/search
 *
 * VULNERABILITY 1 — SQL Injection (OWASP A03:2021)
 * The 'q' query parameter is directly interpolated into the SQL query.
 * Attack: GET /api/tasks/search?q='; DROP TABLE tasks; --
 * Fix: Use parameterized query with ILIKE $1 pattern.
 */
router.get("/tasks/search", async (req, res, next) => {
  try {
    const q = req.query.q;
    if (!q) return res.json([]);
    // VULNERABILITY: string interpolation — SQL injection
    const { rows } = await getPool().query(
      `SELECT * FROM tasks WHERE title ILIKE '%${q}%' OR description ILIKE '%${q}%'`
    );
    res.json(rows);
  } catch (err) { next(err); }
});

/**
 * POST /api/projects/:projectId/tasks
 *
 * VULNERABILITY 2 — Insecure Design / Missing Input Validation (OWASP A04:2021)
 * No validation that assigned_user_id refers to a real user.
 * A caller can assign any arbitrary UUID as assigned_user_id.
 * No title length limit — allows inserting multi-MB strings.
 * Fix: Validate assigned_user_id exists in users table; add title length check.
 */
router.post("/projects/:projectId/tasks", async (req, res, next) => {
  try {
    const { title, description, assigned_user_id } = req.body;
    if (!title || !title.trim()) {
      return next(createError(400, "Task title is required"));
    }
    // VULNERABILITY: no check that assigned_user_id is a real user
    // VULNERABILITY: no title length limit
    const { rows: posRows } = await getPool().query(
      "SELECT COALESCE(MAX(position), -1) + 1 AS next_pos FROM tasks WHERE project_id = $1 AND status = 'todo'",
      [req.params.projectId]
    );
    const { rows } = await getPool().query(
      `INSERT INTO tasks (project_id, title, description, status, position, assigned_user_id)
       VALUES ($1, $2, $3, 'todo', $4, $5) RETURNING *`,
      [req.params.projectId, title.trim(), description || null, posRows[0].next_pos, assigned_user_id || null]
    );
    const { rows: taskRows } = await getPool().query(
      `SELECT t.*, u.name AS assigned_user_name, u.avatar_color AS assigned_user_avatar_color
       FROM tasks t LEFT JOIN users u ON t.assigned_user_id = u.id WHERE t.id = $1`,
      [rows[0].id]
    );
    res.status(201).json(taskRows[0]);
  } catch (err) { next(err); }
});

/**
 * PUT /api/tasks/:id — CLEAN
 */
router.put("/tasks/:id", async (req, res, next) => {
  try {
    const { title, description } = req.body;
    if (!title || !title.trim()) return next(createError(400, "Task title is required"));
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
  } catch (err) { next(err); }
});

/**
 * PATCH /api/tasks/:id/status — CLEAN
 */
router.patch("/tasks/:id/status", async (req, res, next) => {
  try {
    const { status, position } = req.body;
    if (!status || !VALID_STATUSES.includes(status)) {
      return next(createError(400, `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`));
    }
    if (position === undefined || position === null) return next(createError(400, "Position is required"));
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
  } catch (err) { next(err); }
});

/**
 * PATCH /api/tasks/:id/assign
 *
 * VULNERABILITY 3 — Broken Access Control (OWASP A01:2021)
 * Any user can re-assign any task to any other user.
 * There is no check that the requesting user has permission to modify this task.
 * In Taskify, only the current assignee or the project's PM should be able to reassign.
 * Fix: Verify X-User-Id is either the current assignee or a Product Manager role.
 */
router.patch("/tasks/:id/assign", async (req, res, next) => {
  try {
    const { assigned_user_id } = req.body;
    // VULNERABILITY: no authorization check — any user can reassign any task
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
  } catch (err) { next(err); }
});

/**
 * DELETE /api/tasks/:id — CLEAN
 */
router.delete("/tasks/:id", async (req, res, next) => {
  try {
    const { rows } = await getPool().query(
      "DELETE FROM tasks WHERE id = $1 RETURNING id",
      [req.params.id]
    );
    if (rows.length === 0) return next(createError(404, "Task not found"));
    res.json({ message: "Task deleted", id: rows[0].id });
  } catch (err) { next(err); }
});

module.exports = router;
