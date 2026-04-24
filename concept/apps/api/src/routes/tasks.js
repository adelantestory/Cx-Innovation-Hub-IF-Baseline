'use strict';
const express = require('express');
const router = express.Router({ mergeParams: true });
const { getPool } = require('../services/database');
const { createError } = require('../middleware/errorHandler');

const VALID_STATUSES = ['todo', 'in_progress', 'in_review', 'done'];

// GET /api/tasks/search?q=... — must be declared before /:id to avoid route conflict
router.get('/search', async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== 'string' || q.trim().length === 0) {
      return res.json([]);
    }

    const pool = await getPool();
    const result = await pool.query(
      `SELECT t.id, t.project_id, t.title, t.description, t.status, t.position,
              t.assigned_user_id, u.name AS assigned_user_name, t.created_at, t.updated_at
       FROM tasks t
       LEFT JOIN users u ON t.assigned_user_id = u.id
       WHERE t.title ILIKE $1 OR t.description ILIKE $1
       ORDER BY t.created_at DESC`,
      [`%${q.trim()}%`]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/projects/:projectId/tasks — tasks for a project with assigned user
router.get('/', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const pool = await getPool();
    const result = await pool.query(
      `SELECT t.id, t.project_id, t.title, t.description, t.status, t.position,
              t.assigned_user_id, u.name AS assigned_user_name, t.created_at, t.updated_at
       FROM tasks t
       LEFT JOIN users u ON t.assigned_user_id = u.id
       WHERE t.project_id = $1
       ORDER BY t.position ASC, t.created_at ASC`,
      [projectId]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/projects/:projectId/tasks — create task
router.post('/', async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { title, description, assigned_user_id } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return next(createError(400, 'Task title is required'));
    }
    if (title.trim().length > 200) {
      return next(createError(400, 'Task title must be 200 characters or fewer'));
    }

    const pool = await getPool();
    const result = await pool.query(
      `INSERT INTO tasks (project_id, title, description, assigned_user_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, project_id, title, description, status, position, assigned_user_id, created_at, updated_at`,
      [projectId, title.trim(), description || null, assigned_user_id || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /api/tasks/:id — update title/description
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return next(createError(400, 'Task title is required'));
    }
    if (title.trim().length > 200) {
      return next(createError(400, 'Task title must be 200 characters or fewer'));
    }

    const pool = await getPool();
    const result = await pool.query(
      `UPDATE tasks SET title = $1, description = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING id, project_id, title, description, status, position, assigned_user_id, created_at, updated_at`,
      [title.trim(), description || null, id]
    );
    if (result.rows.length === 0) {
      return next(createError(404, 'Task not found'));
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/tasks/:id/status — update status and position
router.patch('/:id/status', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, position } = req.body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return next(createError(400, `Status must be one of: ${VALID_STATUSES.join(', ')}`));
    }

    const pool = await getPool();
    const result = await pool.query(
      `UPDATE tasks SET status = $1, position = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING id, project_id, title, description, status, position, assigned_user_id, created_at, updated_at`,
      [status, position != null ? position : null, id]
    );
    if (result.rows.length === 0) {
      return next(createError(404, 'Task not found'));
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/tasks/:id/assign — assign or unassign a user
router.patch('/:id/assign', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { assigned_user_id } = req.body;

    const userId =
      assigned_user_id === null || assigned_user_id === '' || assigned_user_id === undefined
        ? null
        : assigned_user_id;

    const pool = await getPool();
    const result = await pool.query(
      `UPDATE tasks SET assigned_user_id = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, project_id, title, description, status, position, assigned_user_id, created_at, updated_at`,
      [userId, id]
    );
    if (result.rows.length === 0) {
      return next(createError(404, 'Task not found'));
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/tasks/:id — delete task (comments cascade via DB)
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    const result = await pool.query('DELETE FROM tasks WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return next(createError(404, 'Task not found'));
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
