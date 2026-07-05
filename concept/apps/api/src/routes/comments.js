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

const router = Router();

/**
 * @openapi
 * /tasks/{taskId}/comments:
 *   get:
 *     tags: [Comments]
 *     summary: List comments for a task
 *     description: Returns all comments for a task ordered by creation time (oldest first). Includes author details. Threading is resolved client-side via `parent_comment_id`.
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The task UUID.
 *     responses:
 *       200:
 *         description: Array of comments.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Comment'
 */
router.get("/tasks/:taskId/comments", async (req, res, next) => {
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
 * @openapi
 * /tasks/{taskId}/comments:
 *   post:
 *     tags: [Comments]
 *     summary: Add a comment to a task
 *     description: Creates a new comment on a task. `X-User-Id` header identifies the author.
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The task UUID.
 *       - $ref: '#/components/parameters/XUserId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *                 example: "Looks good to me!"
 *               parent_comment_id:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 description: Set to thread this as a reply.
 *     responses:
 *       201:
 *         description: Comment created.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Missing content or X-User-Id header.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/tasks/:taskId/comments", async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) {
      return next(createError(400, "X-User-Id header is required"));
    }

    const { content, parent_comment_id } = req.body;
    if (!content || !content.trim()) {
      return next(createError(400, "Comment content is required"));
    }

    const { rows } = await getPool().query(
      `INSERT INTO comments (task_id, user_id, parent_comment_id, content)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.params.taskId, userId, parent_comment_id || null, content.trim()]
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
 * @openapi
 * /comments/{id}:
 *   put:
 *     tags: [Comments]
 *     summary: Edit a comment
 *     description: Updates the content of a comment. Only the original author (identified via `X-User-Id`) may edit.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The comment UUID.
 *       - $ref: '#/components/parameters/XUserId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *                 example: "Updated comment text"
 *     responses:
 *       200:
 *         description: Updated comment.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Missing content or X-User-Id header.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Caller is not the comment author.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Comment not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put("/comments/:id", async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) {
      return next(createError(400, "X-User-Id header is required"));
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

    const { content } = req.body;
    if (!content || !content.trim()) {
      return next(createError(400, "Comment content is required"));
    }

    const { rows } = await getPool().query(
      `UPDATE comments SET content = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [content.trim(), req.params.id]
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
 * @openapi
 * /comments/{id}:
 *   delete:
 *     tags: [Comments]
 *     summary: Delete a comment
 *     description: Deletes a comment. Only the original author (identified via `X-User-Id`) may delete. Child (threaded) comments are also deleted via CASCADE.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The comment UUID.
 *       - $ref: '#/components/parameters/XUserId'
 *     responses:
 *       200:
 *         description: Comment deleted.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Comment deleted
 *                 id:
 *                   type: string
 *                   format: uuid
 *       400:
 *         description: Missing X-User-Id header.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Caller is not the comment author.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Comment not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete("/comments/:id", async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) {
      return next(createError(400, "X-User-Id header is required"));
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
