// Legacy Taskify API — index.js
// Issues: no error handler, no request logging, missing middleware
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors()); // no config — allows all origins
app.use(express.json());

// No health check endpoint
// No centralized error handling
// No request logging

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  database: process.env.PGDATABASE || 'taskify',
  port: parseInt(process.env.PGPORT || '5432'),
});

// Routes inline — not modular
app.get('/api/users', async (req, res) => {
  // No error handling
  const result = await pool.query('SELECT * FROM users ORDER BY name');
  res.json(result.rows);
});

app.get('/api/projects', async (req, res) => {
  const result = await pool.query('SELECT * FROM projects ORDER BY name');
  res.json(result.rows);
});

// VULNERABILITY: SQL injection — project ID from URL interpolated directly
app.get('/api/projects/:id/tasks', async (req, res) => {
  const id = req.params.id;
  // BAD: string concatenation — SQL injection risk
  const result = await pool.query(
    `SELECT t.*, u.name as assigned_user_name FROM tasks t
     LEFT JOIN users u ON t.assigned_user_id = u.id
     WHERE t.project_id = '${id}'`
  );
  res.json(result.rows);
});

// VULNERABILITY: No input validation on task creation
app.post('/api/projects/:id/tasks', async (req, res) => {
  const { title, description, assigned_user_id } = req.body;
  // No validation: title could be empty, assigned_user_id unverified
  const result = await pool.query(
    `INSERT INTO tasks (project_id, title, description, status, position, assigned_user_id)
     VALUES ('${req.params.id}', '${title}', '${description}', 'todo', 0, '${assigned_user_id}')
     RETURNING *`
  );
  res.json(result.rows[0]);
});

app.patch('/api/tasks/:id/status', async (req, res) => {
  const { status, position } = req.body;
  // No status validation — any string accepted
  const result = await pool.query(
    `UPDATE tasks SET status = '${status}', position = ${position} WHERE id = '${req.params.id}' RETURNING *`
  );
  res.json(result.rows[0]);
});

// VULNERABILITY: Comment delete has NO ownership check
app.delete('/api/comments/:id', async (req, res) => {
  // BAD: any user can delete any comment — no X-User-Id check
  await pool.query(`DELETE FROM comments WHERE id = '${req.params.id}'`);
  res.json({ deleted: true });
});

app.post('/api/tasks/:id/comments', async (req, res) => {
  const { content } = req.body;
  const userId = req.headers['x-user-id'];
  const result = await pool.query(
    `INSERT INTO comments (task_id, user_id, content) VALUES ('${req.params.id}', '${userId}', '${content}') RETURNING *`
  );
  res.json(result.rows[0]);
});

app.get('/api/tasks/:id/comments', async (req, res) => {
  const result = await pool.query(
    `SELECT c.*, u.name as author_name FROM comments c
     JOIN users u ON c.user_id = u.id
     WHERE c.task_id = '${req.params.id}' ORDER BY c.created_at`
  );
  res.json(result.rows);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API on port ${PORT}`));
