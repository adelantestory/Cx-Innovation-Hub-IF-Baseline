'use strict';
const express = require('express');
const cors = require('cors');
const { errorHandler } = require('./middleware/errorHandler');

const usersRouter = require('./routes/users');
const projectsRouter = require('./routes/projects');
const tasksRouter = require('./routes/tasks');
const commentsRouter = require('./routes/comments');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: true,
  allowedHeaders: ['Content-Type', 'X-User-Id'],
  exposedHeaders: ['X-User-Id'],
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/users', usersRouter);
app.use('/api/projects', projectsRouter);

// Task routes: project-scoped (list/create) and task-scoped (update/delete/assign/status)
app.use('/api/projects/:projectId/tasks', tasksRouter);
app.use('/api/tasks', tasksRouter);

// Comment routes: task-scoped (list/create) and comment-scoped (update/delete)
app.use('/api/tasks/:taskId/comments', commentsRouter);
app.use('/api/comments', commentsRouter);

// Error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Taskify API listening on port ${PORT}`);
});

module.exports = app;
