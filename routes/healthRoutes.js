const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// @desc    Health check endpoint
// @route   GET /api/health
// @access  Public
router.get('/', (req, res) => {
  const mongoStates = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const dbState = mongoose.connection.readyState;
  const dbStatus = mongoStates[dbState] || 'unknown';

  const isHealthy = dbState === 1;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'UP' : 'DEGRADED',
    service: 'Smart Campus Complaint Management System API',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())} seconds`,
    database: {
      status: dbStatus,
      host: mongoose.connection.host || 'none',
      name: mongoose.connection.name || 'none',
    },
  });
});

module.exports = router;
