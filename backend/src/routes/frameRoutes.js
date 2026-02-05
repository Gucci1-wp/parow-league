const express = require('express');
const router = express.Router();
const frameController = require('../controllers/frameController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Frame results routes
router.get('/:matchId/frames', frameController.getMatchFrames);
router.post('/:matchId/frames', requireAdmin, frameController.saveFrameResults);

// Match lineup routes
router.get('/:matchId/lineup', frameController.getMatchLineup);
router.post('/:matchId/lineup', requireAdmin, frameController.saveMatchLineup);

// Team players route
router.get('/teams/:teamId/players', frameController.getTeamPlayers);

module.exports = router;
