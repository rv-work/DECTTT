const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');

// Create a new match
router.post('/create', matchController.createMatch);

// Get available matches (waiting for opponents)
router.get('/available', matchController.getAvailableMatches);

// Join a match
router.post('/join', matchController.joinMatch);

// Get match by ID
router.get('/:matchId', matchController.getMatchById);

// Get user's matches
router.get('/user/:address', matchController.getUserMatches);

// Cancel/refund match
router.post('/:matchId/cancel', matchController.cancelMatch);

module.exports = router;