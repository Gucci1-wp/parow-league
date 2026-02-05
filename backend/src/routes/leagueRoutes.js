const express = require('express');
const router = express.Router();
const leagueController = require('../controllers/leagueController');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, leagueController.getLeagues);
router.get('/:id', optionalAuth, leagueController.getLeagueById);
router.get('/:id/standings', optionalAuth, leagueController.getLeagueStandings);
router.get('/:id/fixtures', optionalAuth, leagueController.getLeagueFixtures);
router.post('/', authenticateToken, requireAdmin, leagueController.createLeague);
router.put('/:id', authenticateToken, requireAdmin, leagueController.updateLeague);
router.get('/:id/seasons', leagueController.getSeasons);
router.post('/:id/seasons', authenticateToken, requireAdmin, leagueController.createSeason);

module.exports = router;
