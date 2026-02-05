const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const { authenticateToken } = require('../middleware/auth');

// Public route for leaderboard (or protected if user prefers?)
// Usually stats are public. "Stats Tab" implies public access.
router.get('/players', statsController.getPlayerStats);

module.exports = router;
