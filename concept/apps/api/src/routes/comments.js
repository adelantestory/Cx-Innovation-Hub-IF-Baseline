'use strict';
const express = require('express');
const router = express.Router({ mergeParams: true });
const { getPool } = require('../services/database');
const { createError } = require('../middleware/errorHandler');

// GET /api/tasks/:taskId/comments — list comments with author info
router.get('/', async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const pool = await getPool();
    const result = await pool.query(
      `SELECT c.id, c.task_id, c.user_id, u.name AS author_name, c.content,
              c.created_at, c.updated_at,
              (c.updated_at > c.created_at) AS is_edited
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.task_id = $1
       ORDER BY c.created_at ASC`,
      [taskId]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/tasks/:taskId/comments — create comment (X-User-Id required)
router.post('/', async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const userId = req.headers['x-user-id'];

    if (!userId) {
      return next(createError(401, 'X-User-Id header is required'));
    }

    const { content } = req.body;
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return next(createError(400, 'Comment content is required'));
    }

    const pool = await getPool();
    const result = await pool.query(
      `INSERT INTO comments (task_id, user_id, content)
       VALUES ($1, $2, $3)
       RETURNING id, task_id, user_id, content, created_at, updated_at`,
      [taskId, userId, content.trim()]
    );

    const comment = result.rows[0];
    // Fetch author name for the response
    const userResult = await pool.query('SELECT name FROM users WHERE id = $1', [userId]);
    comment.author_name = userResult.rows.length > 0 ? userResult.rows[0].name : null;
    comment.is_edited = false;

    res.status(201).json(comment);
  } catch (err) {
    next(err);
  }
});

// PUT /api/comments/:id — update comment (author only)
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'];

    if (!userId) {
      return next(createError(401, 'X-User-Id header is required'));
    }

    const { content } = req.body;
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return next(createError(400, 'Comment content is required'));
    }

    const pool = await getPool();

    // Verify comment exists and belongs to user
    const existing = await pool.query('SELECT user_id FROM comments WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return next(createError(404, 'Comment not found'));
    }
    if (String(existing.rows[0].user_id) !== String(userId)) {
      return next(createError(403, 'You can only edit your own comments'));
    }

    const result = await pool.query(
      `UPDATE comments SET content = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, task_id, user_id, content, created_at, updated_at`,
      [content.trim(), id]
    );

    const comment = result.rows[0];
    const userResult = await pool.query('SELECT name FROM users WHERE id = $1', [userId]);
    comment.author_name = userResult.rows.length > 0 ? userResult.rows[0].name : null;
    comment.is_edited = new Date(comment.updated_at).getTime() > new Date(comment.created_at).getTime();

    res.json(comment);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/comments/:id — delete comment (author only)
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'];

    if (!userId) {
      return next(createError(401, 'X-User-Id header is required'));
    }

    const pool = await getPool();

    // Verify comment exists and belongs to user
    const existing = await pool.query('SELECT user_id FROM comments WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return next(createError(404, 'Comment not found'));
    }
    if (String(existing.rows[0].user_id) !== String(userId)) {
      return next(createError(403, 'You can only delete your own comments'));
    }

    await pool.query('DELETE FROM comments WHERE id = $1', [id]);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
