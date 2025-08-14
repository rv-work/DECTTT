const express = require('express');
const router = express.Router();
const playerController = require('../controllers/playerController');

// Get or create player profile
router.get('/:address', playerController.getPlayerProfile);

// Get player statistics
router.get('/:address/stats', playerController.getPlayerStats);

// Update player profile
router.put('/:address', playerController.updatePlayerProfile);

// Get player match history
router.get('/:address/matches', playerController.getPlayerMatches);

module.exports = router;