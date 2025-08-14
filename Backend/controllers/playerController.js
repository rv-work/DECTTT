const Player = require('../models/Player');
const Match = require('../models/Match');

// Get or create player profile
const getPlayerProfile = async (req, res) => {
  try {
    const { address } = req.params;
    
    let player = await Player.findOne({ address: address.toLowerCase() });
    
    if (!player) {
      // Create new player profile
      player = new Player({
        address: address.toLowerCase(),
        totalMatches: 0,
        totalWins: 0,
        totalLosses: 0,
        totalTies: 0,
        totalEarnings: 0,
        currentStreak: 0,
        bestStreak: 0,
        createdAt: new Date(),
        lastActive: new Date()
      });
      
      await player.save();
    }

    // Calculate win rate
    const totalGames = player.totalWins + player.totalLosses + player.totalTies;
    const winRate = totalGames > 0 ? (player.totalWins / totalGames) * 100 : 0;

    res.json({
      ...player.toObject(),
      winRate: parseFloat(winRate.toFixed(2))
    });

  } catch (error) {
    console.error('Error fetching player profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get player statistics
const getPlayerStats = async (req, res) => {
  try {
    const { address } = req.params;
    
    const player = await Player.findOne({ address: address.toLowerCase() });
    
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }

    // Get additional stats
    const [recentMatches, totalMatches, rank] = await Promise.all([
      Match.find({
        $or: [
          { player1: address.toLowerCase() },
          { player2: address.toLowerCase() }
        ],
        status: { $in: ['completed', 'blockchain_settled'] }
      })
      .sort({ endedAt: -1 })
      .limit(10)
      .select('matchId player1 player2 winner stakeAmount endedAt'),
      
      Match.countDocuments({
        $or: [
          { player1: address.toLowerCase() },
          { player2: address.toLowerCase() }
        ],
        status: { $in: ['completed', 'blockchain_settled'] }
      }),

      // Calculate rank based on total earnings
      Player.countDocuments({
        totalEarnings: { $gt: player.totalEarnings }
      }).then(count => count + 1)
    ]);

    const totalGames = player.totalWins + player.totalLosses + player.totalTies;
    const winRate = totalGames > 0 ? (player.totalWins / totalGames) * 100 : 0;

    // Calculate recent performance (last 10 games)
    const recentWins = recentMatches.filter(match => 
      match.winner === address.toLowerCase()
    ).length;
    const recentWinRate = recentMatches.length > 0 ? 
      (recentWins / recentMatches.length) * 100 : 0;

    res.json({
      address: player.address,
      totalMatches: totalGames,
      totalWins: player.totalWins,
      totalLosses: player.totalLosses,
      totalTies: player.totalTies,
      totalEarnings: player.totalEarnings,
      winRate: parseFloat(winRate.toFixed(2)),
      currentStreak: player.currentStreak,
      bestStreak: player.bestStreak,
      rank,
      recentMatches,
      recentWinRate: parseFloat(recentWinRate.toFixed(2)),
      createdAt: player.createdAt,
      lastActive: player.lastActive
    });

  } catch (error) {
    console.error('Error fetching player stats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update player profile
const updatePlayerProfile = async (req, res) => {
  try {
    const { address } = req.params;
    const { nickname, avatar } = req.body;
    
    const player = await Player.findOne({ address: address.toLowerCase() });
    if (!player) {
      return res.status(404).json({ message: 'Player not found' });
    }

    // Update allowed fields
    if (nickname !== undefined) player.nickname = nickname;
    if (avatar !== undefined) player.avatar = avatar;
    
    player.lastActive = new Date();
    await player.save();

    res.json({ 
      message: 'Profile updated successfully',
      player: player.toObject()
    });

  } catch (error) {
    console.error('Error updating player profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get player match history
const getPlayerMatches = async (req, res) => {
  try {
    const { address } = req.params;
    const { 
      limit = 20, 
      skip = 0, 
      status, 
      sortBy = 'createdAt',
      sortOrder = 'desc' 
    } = req.query;

    const query = {
      $or: [
        { player1: address.toLowerCase() },
        { player2: address.toLowerCase() }
      ]
    };

    if (status) {
      query.status = status;
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const matches = await Match.find(query)
      .sort(sortOptions)
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .select('matchId player1 player2 winner stakeAmount status gameState createdAt startedAt endedAt');

    const total = await Match.countDocuments(query);

    // Add match result for the player
    const enrichedMatches = matches.map(match => {
      const playerAddress = address.toLowerCase();
      let result = 'ongoing';
      
      if (match.status === 'completed' || match.status === 'blockchain_settled') {
        if (!match.winner) {
          result = 'tie';
        } else if (match.winner === playerAddress) {
          result = 'win';
        } else {
          result = 'loss';
        }
      } else if (match.status === 'cancelled') {
        result = 'cancelled';
      }

      return {
        ...match.toObject(),
        result,
        isPlayer1: match.player1 === playerAddress
      };
    });

    res.json({
      matches: enrichedMatches,
      total,
      hasMore: total > (parseInt(skip) + matches.length)
    });

  } catch (error) {
    console.error('Error fetching player matches:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getPlayerProfile,
  getPlayerStats,
  updatePlayerProfile,
  getPlayerMatches
};