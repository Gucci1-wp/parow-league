const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Get all matches with filters
router.get('/', matchController.getMatches);

// Get upcoming matches
router.get('/upcoming', matchController.getUpcomingMatches);

// Get match by ID
router.get('/:id', matchController.getMatchById);

// Get frames for a match
router.get('/:id/frames', matchController.getMatchFrames);

// Get schedule by division and round
router.get('/schedule/:divisionId/:round', matchController.getScheduleByRound);

// Generate round-robin fixtures (admin only)
router.post('/generate-fixtures', authenticateToken, requireAdmin, matchController.generateFixtures);

// Create match (admin only)
router.post('/', authenticateToken, requireAdmin, matchController.createMatch);

// Submit frame result
// Submit frame result
router.post('/:id/frame', authenticateToken, requireAdmin, matchController.submitFrame);

// Submit match result
router.post('/:id/result', authenticateToken, requireAdmin, matchController.submitResult);

module.exports = router;
