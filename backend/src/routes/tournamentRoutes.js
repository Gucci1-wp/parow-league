const express = require('express');
const router = express.Router();
const tournamentController = require('../controllers/tournamentController');
const matchController = require('../controllers/tournamentMatchController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Tournament CRUD
router.get('/', authenticateToken, tournamentController.getTournaments);
router.get('/:id', authenticateToken, tournamentController.getTournamentById);
router.post('/', authenticateToken, requireAdmin, tournamentController.createTournament);
router.put('/:id', authenticateToken, requireAdmin, tournamentController.updateTournament);
router.delete('/:id', authenticateToken, requireAdmin, tournamentController.deleteTournament);

// Participant management
router.post('/:id/participants', authenticateToken, requireAdmin, tournamentController.addParticipants);
router.delete('/:id/participants/:participantId', authenticateToken, requireAdmin, tournamentController.removeParticipant);
router.post('/:id/participants/shuffle', authenticateToken, requireAdmin, tournamentController.shuffleSeeds);

// Start tournament
router.post('/:id/start', authenticateToken, requireAdmin, tournamentController.generateBracket);
router.post('/:id/reset', authenticateToken, requireAdmin, tournamentController.resetTournament);

// Match and frame management
router.get('/:id/matches', authenticateToken, matchController.getTournamentMatches);
router.get('/:id/matches/:matchId/frames', authenticateToken, matchController.getMatchFrames);
router.put('/:id/matches/:matchId/frames', authenticateToken, requireAdmin, matchController.updateMatchFrames);

// Bracket and standings
router.get('/:id/bracket', authenticateToken, matchController.getTournamentBracket);
router.get('/:id/standings', authenticateToken, matchController.getTournamentStandings);

module.exports = router;
