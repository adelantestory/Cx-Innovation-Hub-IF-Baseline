/**
 * Creates a test Express app with the same middleware and routes
 * as the real app, but without starting a server or connecting to DB.
 */
const express = require('express');
const cors = require('cors');

function createTestApp() {
  const app = express();
  
  app.use(cors());
  app.use(express.json());

  // Mount routes (must match index.js mounting paths)
  app.use('/api/users', require('../../routes/users'));
  app.use('/api/projects', require('../../routes/projects'));
  app.use('/api', require('../../routes/tasks'));
  app.use('/api', require('../../routes/comments'));

  // Error handler
  const { errorHandler } = require('../../middleware/errorHandler');
  app.use(errorHandler);

  return app;
}

module.exports = { createTestApp };
