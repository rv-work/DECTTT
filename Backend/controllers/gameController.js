const Match = require('../models/Match');
const Player = require('../models/Player');
const GameMove = require('../models/GameMove');

// Make a move in the game
const makeMove = async (req, res) => {
  try {
    const { matchId, player, position, board } = req.body;

    if (!matchId || !player || position === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const match = await Match.findOne({ matchId });
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    if (match.gameState !== 'ongoing') {
      return res.status(400).json({ message: 'Game is not active' });
    }

    // Verify it's the player's turn
    if (match.currentPlayer !== player.toLowerCase()) {
      return res.status(400).json({ message: 'Not your turn' });
    }

    // Verify player is part of the match
    if (match.player1 !== player.toLowerCase() && match.player2 !== player.toLowerCase()) {
      return res.status(403).json({ message: 'Not authorized for this match' });
    }

    // Validate position
    if (position < 0 || position > 8 || match.board[position] !== '') {
      return res.status(400).json({ message: 'Invalid move position' });
    }

    // Determine player symbol
    const playerSymbol = match.player1 === player.toLowerCase() ? 'X' : 'O';
    
    // Update board
    const newBoard = [...match.board];
    newBoard[position] = playerSymbol;

    // Save move to history
    const gameMove = new GameMove({
      matchId,
      player: player.toLowerCase(),
      position,
      symbol: playerSymbol,
      moveNumber: match.moveCount + 1,
      timestamp: new Date()
    });
    await gameMove.save();

    // Check for winner
    const gameResult = checkGameWinner(newBoard);
    
    // Update match
    match.board = newBoard;
    match.moveCount += 1;
    match.lastMoveAt = new Date();

    if (gameResult.winner) {
      match.gameState = gameResult.winner === 'tie' ? 'tie' : 'finished';
      match.winner = gameResult.winner === 'tie' ? null : 
                    (gameResult.winner === 'X' ? match.player1 : match.player2);
      match.endedAt = new Date();
      match.status = 'completed';

      // Update player stats
      await updatePlayerStats(match, gameResult.winner);
    } else {
      // Switch turns
      match.currentPlayer = match.currentPlayer === match.player1 ? match.player2 : match.player1;
    }

    await match.save();

    // Get Socket.IO instance for real-time updates
    const io = req.app.get('socketio');

    // Broadcast move to all players in the match
    io.to(matchId).emit('moveUpdate', {
      matchId,
      board: newBoard,
      currentPlayer: match.currentPlayer,
      gameState: match.gameState,
      winner: match.winner,
      moveCount: match.moveCount,
      lastMove: {
        player: player.toLowerCase(),
        position,
        symbol: playerSymbol
      }
    });

    // If game ended, send special end game notification
    if (gameResult.winner) {
      io.to(matchId).emit('gameEnded', {
        matchId,
        winner: match.winner,
        gameState: match.gameState,
        finalBoard: newBoard,
        winningLine: gameResult.winningLine
      });

      // Notify players individually about results
      if (gameResult.winner !== 'tie') {
        const winnerAddress = match.winner;
        const loserAddress = match.winner === match.player1 ? match.player2 : match.player1;
        
        io.to(`user_${winnerAddress}`).emit('gameResult', {
          matchId,
          result: 'win',
          earnings: parseFloat(match.stakeAmount) * 2
        });
        
        io.to(`user_${loserAddress}`).emit('gameResult', {
          matchId,
          result: 'loss'
        });
      } else {
        // Notify both players about tie
        io.to(`user_${match.player1}`).emit('gameResult', {
          matchId,
          result: 'tie'
        });
        io.to(`user_${match.player2}`).emit('gameResult', {
          matchId,
          result: 'tie'
        });
      }
    }

    res.json({
      success: true,
      board: newBoard,
      gameState: match.gameState,
      winner: match.winner,
      currentPlayer: match.currentPlayer,
      moveCount: match.moveCount,
      isGameEnded: !!gameResult.winner
    });

  } catch (error) {
    console.error('Error making move:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Helper function to update player stats
const updatePlayerStats = async (match, winner) => {
  try {
    if (winner === 'tie') {
      // Handle tie - both players get their stake back
      await Promise.all([
        Player.findOneAndUpdate(
          { address: match.player1 },
          { 
            $inc: { totalTies: 1 },
            $set: { currentStreak: 0 },
            lastActive: new Date()
          }
        ),
        Player.findOneAndUpdate(
          { address: match.player2 },
          { 
            $inc: { totalTies: 1 },
            $set: { currentStreak: 0 },
            lastActive: new Date()
          }
        )
      ]);
    } else {
      const winnerAddress = match.winner;
      const loserAddress = match.winner === match.player1 ? match.player2 : match.player1;

      // Update winner stats
      const winnerPlayer = await Player.findOne({ address: winnerAddress });
      const newWinStreak = (winnerPlayer?.currentStreak || 0) + 1;
      const bestStreak = Math.max(winnerPlayer?.bestStreak || 0, newWinStreak);

      await Promise.all([
        Player.findOneAndUpdate(
          { address: winnerAddress },
          { 
            $inc: { 
              totalWins: 1, 
              totalEarnings: parseFloat(match.stakeAmount) * 2
            },
            $set: {
              currentStreak: newWinStreak,
              bestStreak: bestStreak
            },
            lastActive: new Date()
          }
        ),
        Player.findOneAndUpdate(
          { address: loserAddress },
          { 
            $inc: { 
              totalLosses: 1
            },
            $set: {
              currentStreak: 0
            },
            lastActive: new Date()
          }
        )
      ]);
    }
  } catch (error) {
    console.error('Error updating player stats:', error);
  }
};

// Get current game state
const getGameState = async (req, res) => {
  try {
    const { matchId } = req.params;

    const match = await Match.findOne({ matchId });
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    // Get recent moves for context
    const recentMoves = await GameMove.find({ matchId })
      .sort({ moveNumber: -1 })
      .limit(5);

    res.json({
      matchId: match.matchId,
      board: match.board,
      gameState: match.gameState,
      currentPlayer: match.currentPlayer,
      winner: match.winner,
      moveCount: match.moveCount,
      player1: match.player1,
      player2: match.player2,
      stakeAmount: match.stakeAmount,
      status: match.status,
      startedAt: match.startedAt,
      lastMoveAt: match.lastMoveAt,
      recentMoves: recentMoves.reverse() // Show in chronological order
    });

  } catch (error) {
    console.error('Error getting game state:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Submit game result (for blockchain integration)
const submitResult = async (req, res) => {
  try {
    const { matchId, winner, txHash } = req.body;

    const match = await Match.findOne({ matchId });
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    if (match.status === 'blockchain_settled') {
      return res.status(400).json({ message: 'Match already settled on blockchain' });
    }

    // Update match with blockchain transaction info
    match.blockchainTxHash = txHash;
    match.status = 'blockchain_settled';
    match.blockchainSettledAt = new Date();

    if (winner && winner !== 'tie') {
      match.winner = winner.toLowerCase();
    }

    await match.save();

    // Notify players about blockchain settlement
    const io = req.app.get('socketio');
    io.to(match.matchId).emit('blockchainSettled', {
      matchId,
      txHash,
      winner: match.winner
    });

    res.json({ message: 'Result submitted successfully' });

  } catch (error) {
    console.error('Error submitting result:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get game history for a match
const getGameHistory = async (req, res) => {
  try {
    const { matchId } = req.params;

    const moves = await GameMove.find({ matchId })
      .sort({ moveNumber: 1 });

    const match = await Match.findOne({ matchId })
      .select('player1 player2 winner gameState status');

    res.json({
      match,
      moves,
      totalMoves: moves.length
    });

  } catch (error) {
    console.error('Error fetching game history:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Helper function to check game winner
const checkGameWinner = (board) => {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6] // diagonals
  ];

  // Check for winner
  for (let line of lines) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], winningLine: line };
    }
  }

  // Check for tie
  if (!board.includes('')) {
    return { winner: 'tie' };
  }

  // Game continues
  return { winner: null };
};

// Handle move for socket.io (used by server.js)
const handleMove = async (data) => {
  try {
    const { matchId, player, position } = data;

    const match = await Match.findOne({ matchId });
    if (!match || match.gameState !== 'ongoing') {
      return { success: false, message: 'Invalid match state' };
    }

    if (match.currentPlayer !== player.toLowerCase()) {
      return { success: false, message: 'Not your turn' };
    }

    if (position < 0 || position > 8 || match.board[position] !== '') {
      return { success: false, message: 'Invalid move' };
    }

    const playerSymbol = match.player1 === player.toLowerCase() ? 'X' : 'O';
    const newBoard = [...match.board];
    newBoard[position] = playerSymbol;

    const gameResult = checkGameWinner(newBoard);

    match.board = newBoard;
    match.moveCount += 1;
    match.lastMoveAt = new Date();

    if (gameResult.winner) {
      match.gameState = gameResult.winner === 'tie' ? 'tie' : 'finished';
      match.winner = gameResult.winner === 'tie' ? null : 
                    (gameResult.winner === 'X' ? match.player1 : match.player2);
      match.endedAt = new Date();
      match.status = 'completed';

      // Update player stats
      await updatePlayerStats(match, gameResult.winner);
    } else {
      match.currentPlayer = match.currentPlayer === match.player1 ? match.player2 : match.player1;
    }

    await match.save();

    return {
      success: true,
      board: newBoard,
      gameState: match.gameState,
      winner: match.winner,
      currentPlayer: match.currentPlayer,
      winningLine: gameResult.winningLine
    };

  } catch (error) {
    console.error('Error handling move:', error);
    return { success: false, message: 'Internal server error' };
  }
};

// Forfeit/abandon game
const forfeitGame = async (req, res) => {
  try {
    const { matchId, player } = req.body;

    const match = await Match.findOne({ matchId });
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    if (match.gameState !== 'ongoing') {
      return res.status(400).json({ message: 'Game is not active' });
    }

    if (match.player1 !== player.toLowerCase() && match.player2 !== player.toLowerCase()) {
      return res.status(403).json({ message: 'Not authorized for this match' });
    }

    // Determine winner (the other player)
    const winner = match.player1 === player.toLowerCase() ? match.player2 : match.player1;
    
    match.winner = winner;
    match.gameState = 'finished';
    match.status = 'completed';
    match.endedAt = new Date();

    await match.save();

    // Update player stats
    await updatePlayerStats(match, winner === match.player1 ? 'X' : 'O');

    // Notify both players
    const io = req.app.get('socketio');
    io.to(matchId).emit('gameForfeited', {
      matchId,
      forfeitedBy: player.toLowerCase(),
      winner
    });

    res.json({ message: 'Game forfeited successfully' });

  } catch (error) {
    console.error('Error forfeiting game:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  makeMove,
  getGameState,
  submitResult,
  getGameHistory,
  handleMove,
  forfeitGame
};