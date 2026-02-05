const express = require('express');
const router = express.Router();
const playerController = require('../controllers/playerController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', playerController.getPlayers);
router.get('/:id', playerController.getPlayerById);
router.post('/', authenticateToken, playerController.createPlayer);

module.exports = router;
