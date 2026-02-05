const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// All routes require admin authentication
router.use(authenticateToken);
router.use(requireAdmin);

// Team management
router.get('/teams', adminController.getAllTeams);
router.post('/teams', adminController.createTeam);
router.put('/teams/:id', adminController.updateTeam);
router.delete('/teams/:id', adminController.deleteTeam);

// Player management
router.get('/players', adminController.getAllPlayers);
router.post('/players', adminController.createPlayer);
router.put('/players/:id', adminController.updatePlayer);
router.delete('/players/:id', adminController.deletePlayer);

module.exports = router;
