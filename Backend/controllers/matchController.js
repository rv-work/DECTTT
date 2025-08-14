const Match = require('../models/Match');
const Player = require('../models/Player');
const { ethers } = require('ethers');

// Create a new match
const createMatch = async (req, res) => {
  try {
    const { player1, stakeAmount, matchId } = req.body;

    // Validate input
    if (!player1 || !stakeAmount || !matchId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if match already exists
    const existingMatch = await Match.findOne({ matchId });
    if (existingMatch) {
      return res.status(400).json({ message: 'Match already exists' });
    }

    // Create new match
    const match = new Match({
      matchId,
      player1: player1.toLowerCase(),
      player2: null,
      stakeAmount,
      status: 'waiting',
      gameState: 'waiting',
      board: Array(9).fill(''),
      currentPlayer: player1.toLowerCase(),
      createdAt: new Date()
    });

    await match.save();

    // Update or create player profile
    await Player.findOneAndUpdate(
      { address: player1.toLowerCase() },
      { 
        address: player1.toLowerCase(),
        $inc: { totalMatches: 0 }, // Will be incremented when match starts
        lastActive: new Date()
      },
      { upsert: true, new: true }
    );

    // Emit to all connected clients that a new match is available
    const io = req.app.get('socketio');
    io.emit('newMatchAvailable', {
      matchId: match.matchId,
      player1: match.player1,
      stakeAmount: match.stakeAmount
    });

    res.status(201).json({
      message: 'Match created successfully',
      match: {
        matchId: match.matchId,
        player1: match.player1,
        stakeAmount: match.stakeAmount,
        status: match.status
      }
    });

  } catch (error) {
    console.error('Error creating match:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get available matches
const getAvailableMatches = async (req, res) => {
  try {
    const matches = await Match.find({ 
      status: 'waiting',
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    })
    .select('matchId player1 stakeAmount createdAt')
    .sort({ createdAt: -1 })
    .limit(20);

    res.json(matches);
  } catch (error) {
    console.error('Error fetching available matches:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Join a match
const joinMatch = async (req, res) => {
  try {
    const { matchId, player2 } = req.body;

    if (!matchId || !player2) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Find the match
    const match = await Match.findOne({ matchId });
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    if (match.status !== 'waiting') {
      return res.status(400).json({ message: 'Match is not available' });
    }

    if (match.player1.toLowerCase() === player2.toLowerCase()) {
      return res.status(400).json({ message: 'Cannot join your own match' });
    }

    // Update match
    const originalPlayer1 = match.player1;
    match.player2 = player2.toLowerCase();
    match.status = 'active';
    match.gameState = 'ongoing';
    match.startedAt = new Date();

    await match.save();

    // Update player profiles
    await Promise.all([
      Player.findOneAndUpdate(
        { address: match.player1 },
        { 
          $inc: { totalMatches: 1 },
          lastActive: new Date()
        },
        { upsert: true }
      ),
      Player.findOneAndUpdate(
        { address: player2.toLowerCase() },
        { 
          address: player2.toLowerCase(),
          $inc: { totalMatches: 1 },
          lastActive: new Date()
        },
        { upsert: true }
      )
    ]);

    // Get Socket.IO instance and notification helper
    const io = req.app.get('socketio');
    const notifyUser = req.app.get('notifyUser');

    // Notify the match creator that someone joined their match
    console.log(`🔔 Notifying player1 ${originalPlayer1} about match join`);
    
    const matchData = {
      matchId: match.matchId,
      player1: match.player1,
      player2: match.player2,
      stakeAmount: match.stakeAmount,
      status: match.status,
      gameState: match.gameState,
      board: match.board,
      currentPlayer: match.currentPlayer
    };

    // Notify via user-specific room
    io.to(`user_${originalPlayer1.toLowerCase()}`).emit('matchJoined', matchData);
    
    // Also notify the match room
    io.to(matchId).emit('matchStarted', {
      matchId: match.matchId,
      player1: match.player1,
      player2: match.player2,
      currentPlayer: match.currentPlayer,
      gameState: match.gameState
    });

    // Remove match from available matches list
    io.emit('matchUnavailable', { matchId });

    res.json({
      message: 'Successfully joined match',
      match: matchData
    });

  } catch (error) {
    console.error('Error joining match:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get match by ID
const getMatchById = async (req, res) => {
  try {
    const { matchId } = req.params;
    
    const match = await Match.findOne({ matchId });
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    res.json(match);
  } catch (error) {
    console.error('Error fetching match:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get user's matches
const getUserMatches = async (req, res) => {
  try {
    const { address } = req.params;
    const { status, limit = 10, skip = 0 } = req.query;

    const query = {
      $or: [
        { player1: address.toLowerCase() },
        { player2: address.toLowerCase() }
      ]
    };

    if (status) {
      query.status = status;
    }

    const matches = await Match.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Match.countDocuments(query);

    res.json({
      matches,
      total,
      hasMore: total > (parseInt(skip) + matches.length)
    });

  } catch (error) {
    console.error('Error fetching user matches:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Cancel/refund match
const cancelMatch = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { player } = req.body;

    const match = await Match.findOne({ matchId });
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    // Only allow cancellation if match is waiting or if it's been too long
    const canCancel = match.status === 'waiting' || 
                     (match.status === 'active' && 
                      new Date() - match.startedAt > 10 * 60 * 1000); // 10 minutes

    if (!canCancel) {
      return res.status(400).json({ message: 'Cannot cancel this match' });
    }

    // Check if player is part of the match
    if (match.player1 !== player.toLowerCase() && match.player2 !== player.toLowerCase()) {
      return res.status(403).json({ message: 'Not authorized to cancel this match' });
    }

    match.status = 'cancelled';
    match.gameState = 'cancelled';
    match.endedAt = new Date();
    
    await match.save();

    // Notify other player if exists
    const io = req.app.get('socketio');
    io.to(matchId).emit('matchCancelled', { matchId });
    
    // Notify both players individually
    if (match.player1) {
      io.to(`user_${match.player1}`).emit('matchCancelled', { matchId });
    }
    if (match.player2) {
      io.to(`user_${match.player2}`).emit('matchCancelled', { matchId });
    }

    // Remove from available matches if it was waiting
    if (match.status === 'waiting') {
      io.emit('matchUnavailable', { matchId });
    }

    res.json({ message: 'Match cancelled successfully' });

  } catch (error) {
    console.error('Error cancelling match:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get current match status for a player
const getCurrentMatch = async (req, res) => {
  try {
    const { address } = req.params;

    const currentMatch = await Match.findOne({
      $or: [
        { player1: address.toLowerCase() },
        { player2: address.toLowerCase() }
      ],
      status: { $in: ['waiting', 'active'] }
    }).sort({ createdAt: -1 });

    if (!currentMatch) {
      return res.json({ match: null });
    }

    // Determine player's symbol and turn status
    const isPlayer1 = currentMatch.player1 === address.toLowerCase();
    const playerSymbol = isPlayer1 ? 'X' : 'O';
    const isPlayerTurn = currentMatch.currentPlayer === address.toLowerCase();

    res.json({
      match: {
        ...currentMatch.toObject(),
        playerSymbol,
        isPlayerTurn,
        isPlayer1
      }
    });

  } catch (error) {
    console.error('Error fetching current match:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  createMatch,
  getAvailableMatches,
  joinMatch,
  getMatchById,
  getUserMatches,
  cancelMatch,
  getCurrentMatch
};