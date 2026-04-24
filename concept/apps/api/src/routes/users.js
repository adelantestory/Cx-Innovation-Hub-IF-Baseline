'use strict';
const express = require('express');
const router = express.Router();
const { getPool } = require('../services/database');

// GET /api/users — list all users
router.get('/', async (req, res, next) => {
  try {
    const pool = await getPool();
    const result = await pool.query('SELECT id, name, role, avatar_color, created_at FROM users ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
