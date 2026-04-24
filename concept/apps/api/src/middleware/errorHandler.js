'use strict';

function createError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal Server Error' });
}

module.exports = { createError, errorHandler };
