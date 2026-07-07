// =============================================================================
// Comments Routes
// =============================================================================
// GET    /api/tasks/:taskId/comments   - List threaded comments for a task
// POST   /api/tasks/:taskId/comments   - Add a comment to a task
// PUT    /api/comments/:id             - Edit a comment (author only)
// DELETE /api/comments/:id             - Delete a comment (author only)
//
// Comment ownership is determined by the X-User-Id header. Only the comment
// author can edit or delete their own comments.
// =============================================================================

const { Router } = require("express");
const { getPool } = require("../services/database");
const { createError } = require("../middleware/errorHandler");
const { rateLimit } = require("../middleware/rateLimit");
const { isUuid, MAX_TEXT_LENGTH, requireKnownUser, requireUuidParam, sanitizeText } = require("../middleware/security");

const router = Router();
const apiRateLimit = rateLimit({ windowMs: 60_000, maxRequests: 120 });

/**
 * GET /api/tasks/:taskId/comments
 * Returns all comments for a task, ordered by creation time.
 * Includes author details via JOIN. Threading is handled client-side
 * using parent_comment_id.
 */
router.get("/tasks/:taskId/comments", requireUuidParam("taskId"), apiRateLimit, async (req, res, next) => {
  try {
    const { rows } = await getPool().query(
      `SELECT
        c.id, c.task_id, c.user_id, c.parent_comment_id,
        c.content, c.created_at, c.updated_at,
        u.name AS author_name,
        u.avatar_color AS author_avatar_color
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.task_id = $1
      ORDER BY c.created_at ASC`,
      [req.params.taskId]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/tasks/:taskId/comments
 * Creates a new comment on a task. Requires { content } in body.
 * Optional: parent_comment_id for threading.
 * Requires X-User-Id header for author identification.
 */
router.post("/tasks/:taskId/comments", requireUuidParam("taskId"), apiRateLimit, requireKnownUser, async (req, res, next) => {
  try {
    const userId = req.authenticatedUserId;
    if (!userId) {
      return next(createError(500, "Authentication context was not initialized"));
    }

    const content = sanitizeText(req.body?.content, { fieldName: "Comment content", maxLength: MAX_TEXT_LENGTH });
    const parentCommentId = req.body?.parent_comment_id;
    let normalizedParentCommentId = null;

    if (parentCommentId !== undefined && parentCommentId !== null) {
      const parentValue = typeof parentCommentId === "string" ? parentCommentId.trim() : "";
      if (!parentValue) {
        return next(createError(400, "parent_comment_id cannot be empty"));
      }
      if (!isUuid(parentValue)) {
        return next(createError(400, "parent_comment_id must be a valid UUID"));
      }

      const { rows: parentRows } = await getPool().query(
        "SELECT id FROM comments WHERE id = $1 AND task_id = $2",
        [parentValue, req.params.taskId]
      );

      if (parentRows.length === 0) {
        return next(createError(400, "parent_comment_id does not belong to this task"));
      }
      normalizedParentCommentId = parentValue;
    }

    const { rows } = await getPool().query(
      `INSERT INTO comments (task_id, user_id, parent_comment_id, content)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.params.taskId, userId, normalizedParentCommentId, content]
    );

    // Fetch with author details
    const { rows: commentRows } = await getPool().query(
      `SELECT
        c.id, c.task_id, c.user_id, c.parent_comment_id,
        c.content, c.created_at, c.updated_at,
        u.name AS author_name,
        u.avatar_color AS author_avatar_color
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = $1`,
      [rows[0].id]
    );

    res.status(201).json(commentRows[0]);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/comments/:id
 * Edits a comment. Only the original author (matched by X-User-Id) can edit.
 * Requires { content } in body.
 */
router.put("/comments/:id", requireUuidParam("id"), apiRateLimit, requireKnownUser, async (req, res, next) => {
  try {
    const userId = req.authenticatedUserId;
    if (!userId) {
      return next(createError(500, "Authentication context was not initialized"));
    }

    // Check ownership
    const { rows: existing } = await getPool().query(
      "SELECT user_id FROM comments WHERE id = $1",
      [req.params.id]
    );

    if (existing.length === 0) {
      return next(createError(404, "Comment not found"));
    }

    if (existing[0].user_id !== userId) {
      return next(createError(403, "You can only edit your own comments"));
    }

    const content = sanitizeText(req.body?.content, { fieldName: "Comment content", maxLength: MAX_TEXT_LENGTH });

    const { rows } = await getPool().query(
      `UPDATE comments SET content = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [content, req.params.id]
    );

    // Fetch with author details
    const { rows: commentRows } = await getPool().query(
      `SELECT
        c.id, c.task_id, c.user_id, c.parent_comment_id,
        c.content, c.created_at, c.updated_at,
        u.name AS author_name,
        u.avatar_color AS author_avatar_color
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = $1`,
      [rows[0].id]
    );

    res.json(commentRows[0]);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/comments/:id
 * Deletes a comment. Only the original author (matched by X-User-Id) can delete.
 * Child comments are also deleted via CASCADE.
 */
router.delete("/comments/:id", requireUuidParam("id"), apiRateLimit, requireKnownUser, async (req, res, next) => {
  try {
    const userId = req.authenticatedUserId;
    if (!userId) {
      return next(createError(500, "Authentication context was not initialized"));
    }

    // Check ownership
    const { rows: existing } = await getPool().query(
      "SELECT user_id FROM comments WHERE id = $1",
      [req.params.id]
    );

    if (existing.length === 0) {
      return next(createError(404, "Comment not found"));
    }

    if (existing[0].user_id !== userId) {
      return next(createError(403, "You can only delete your own comments"));
    }

    await getPool().query("DELETE FROM comments WHERE id = $1", [req.params.id]);

    res.json({ message: "Comment deleted", id: req.params.id });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
