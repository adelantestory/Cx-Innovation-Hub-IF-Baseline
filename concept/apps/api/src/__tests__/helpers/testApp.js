const express = require('express');
const { errorHandler } = require('../../middleware/errorHandler');

/**
 * Creates a test Express app with common middleware and error handling.
 * Useful for testing route handlers with supertest.
 *
 * @param {...Object} routers - Router objects or route definitions
 * @returns {express.Application} Configured Express app for testing
 *
 * @example
 * const app = createTestApp();
 * app.use('/api/users', usersRouter);
 * const response = await request(app).get('/api/users');
 */
function createTestApp() {
  const app = express();

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Error handling middleware
  app.use(errorHandler);

  return app;
}

module.exports = { createTestApp };
