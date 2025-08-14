const express = require('express');
const router = express.Router();
const leaderboardController = require('../controllers/leaderboardController');

// Get leaderboard
router.get('/', leaderboardController.getLeaderboard);

// Get top players by different criteria
router.get('/top-earners', leaderboardController.getTopEarners);
router.get('/top-winners', leaderboardController.getTopWinners);
router.get('/best-win-rate', leaderboardController.getBestWinRate);

module.exports = router;