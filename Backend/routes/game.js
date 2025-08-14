const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');

// Make a move in a game
router.post('/move', gameController.makeMove);

// Get current game state
router.get('/:matchId/state', gameController.getGameState);

// Submit game result (for operator)
router.post('/result', gameController.submitResult);

// Get game history for a match
router.get('/:matchId/history', gameController.getGameHistory);

module.exports = router;