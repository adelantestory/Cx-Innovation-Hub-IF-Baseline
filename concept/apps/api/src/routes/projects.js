'use strict';
const express = require('express');
const router = express.Router();
const { getPool } = require('../services/database');
const { createError } = require('../middleware/errorHandler');

// GET /api/projects — list all projects
router.get('/', async (req, res, next) => {
  try {
    const pool = await getPool();
    const result = await pool.query(
      'SELECT id, name, description, created_at, updated_at FROM projects ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/projects — create project
router.post('/', async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return next(createError(400, 'Project name is required'));
    }
    if (name.trim().length > 200) {
      return next(createError(400, 'Project name must be 200 characters or fewer'));
    }

    const pool = await getPool();
    const result = await pool.query(
      'INSERT INTO projects (name, description) VALUES ($1, $2) RETURNING id, name, description, created_at, updated_at',
      [name.trim(), description || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
