const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const { authenticateToken, requireCaptain } = require('../middleware/auth');

// Team routes
router.get('/', teamController.getTeams);
router.get('/:id', teamController.getTeamById);
router.get('/:id/players', teamController.getTeamPlayers);
router.post('/', authenticateToken, teamController.createTeam);
router.post('/:id/players', authenticateToken, teamController.addPlayer);

module.exports = router;
