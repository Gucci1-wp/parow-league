const express = require('express');
const router = express.Router();
const standingsController = require('../controllers/standingsController');

// Get standings for a division
router.get('/division/:divisionId', standingsController.getStandings);

// Get standings for all divisions in a season
router.get('/season/:seasonId', standingsController.getSeasonStandings);

module.exports = router;
