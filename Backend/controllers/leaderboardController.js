const Player = require('../models/Player.js');
const Match = require('../models/Match.js');

// Get leaderboard
const getLeaderboard = async (req, res) => {
  try {
    const { 
      period = 'all', // 'all', 'week', 'month'
      limit = 50,
      sortBy = 'totalEarnings' // 'totalEarnings', 'totalWins', 'winRate'
    } = req.query;

    let dateFilter = {};
    if (period === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateFilter = { lastActive: { $gte: weekAgo } };
    } else if (period === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      dateFilter = { lastActive: { $gte: monthAgo } };
    }

    // Base query for players with at least one match
    const query = {
      $or: [
        { totalWins: { $gt: 0 } },
        { totalLosses: { $gt: 0 } },
        { totalTies: { $gt: 0 } }
      ],
      ...dateFilter
    };

    let players;
    
    if (sortBy === 'winRate') {
      // For win rate, we need to calculate it and filter players with at least 5 matches
      players = await Player.aggregate([
        { $match: query },
        {
          $addFields: {
            totalGames: { $add: ['$totalWins', '$totalLosses', '$totalTies'] },
            winRate: {
              $cond: {
                if: { $gt: [{ $add: ['$totalWins', '$totalLosses', '$totalTies'] }, 0] },
                then: {
                  $multiply: [
                    { $divide: ['$totalWins', { $add: ['$totalWins', '$totalLosses', '$totalTies'] }] },
                    100
                  ]
                },
                else: 0
              }
            }
          }
        },
        { $match: { totalGames: { $gte: 5 } } }, // Minimum 5 games for win rate ranking
        { $sort: { winRate: -1, totalWins: -1 } },
        { $limit: parseInt(limit) }
      ]);
    } else {
      // For other sorting criteria
      const sortOptions = {};
      if (sortBy === 'totalEarnings') {
        sortOptions.totalEarnings = -1;
        sortOptions.totalWins = -1; // Secondary sort
      } else if (sortBy === 'totalWins') {
        sortOptions.totalWins = -1;
        sortOptions.totalEarnings = -1; // Secondary sort
      }

      players = await Player.find(query)
        .sort(sortOptions)
        .limit(parseInt(limit))
        .lean();

      // Calculate win rate for each player
      players = players.map(player => {
        const totalGames = player.totalWins + player.totalLosses + player.totalTies;
        const winRate = totalGames > 0 ? (player.totalWins / totalGames) * 100 : 0;
        return {
          ...player,
          totalGames,
          winRate: parseFloat(winRate.toFixed(2))
        };
      });
    }

    res.json(players);

  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get top earners
const getTopEarners = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const topEarners = await Player.find({
      totalEarnings: { $gt: 0 }
    })
    .sort({ totalEarnings: -1, totalWins: -1 })
    .limit(parseInt(limit))
    .select('address totalEarnings totalWins totalMatches nickname avatar')
    .lean();

    // Enrich with additional stats
    const enrichedEarners = topEarners.map((player, index) => {
      const totalGames = player.totalWins + (player.totalLosses || 0) + (player.totalTies || 0);
      const winRate = totalGames > 0 ? (player.totalWins / totalGames) * 100 : 0;
      
      return {
        ...player,
        rank: index + 1,
        totalGames,
        winRate: parseFloat(winRate.toFixed(2))
      };
    });

    res.json(enrichedEarners);

  } catch (error) {
    console.error('Error fetching top earners:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get top winners
const getTopWinners = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const topWinners = await Player.find({
      totalWins: { $gt: 0 }
    })
    .sort({ totalWins: -1, totalEarnings: -1 })
    .limit(parseInt(limit))
    .select('address totalWins totalLosses totalTies totalEarnings currentStreak bestStreak nickname avatar')
    .lean();

    // Enrich with additional stats
    const enrichedWinners = topWinners.map((player, index) => {
      const totalGames = player.totalWins + (player.totalLosses || 0) + (player.totalTies || 0);
      const winRate = totalGames > 0 ? (player.totalWins / totalGames) * 100 : 0;
      
      return {
        ...player,
        rank: index + 1,
        totalGames,
        winRate: parseFloat(winRate.toFixed(2))
      };
    });

    res.json(enrichedWinners);

  } catch (error) {
    console.error('Error fetching top winners:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get best win rate players
const getBestWinRate = async (req, res) => {
  try {
    const { limit = 10, minGames = 10 } = req.query;

    const bestWinRate = await Player.aggregate([
      {
        $addFields: {
          totalGames: { $add: ['$totalWins', '$totalLosses', '$totalTies'] },
          winRate: {
            $cond: {
              if: { $gt: [{ $add: ['$totalWins', '$totalLosses', '$totalTies'] }, 0] },
              then: {
                $multiply: [
                  { $divide: ['$totalWins', { $add: ['$totalWins', '$totalLosses', '$totalTies'] }] },
                  100
                ]
              },
              else: 0
            }
          }
        }
      },
      {
        $match: { 
          totalGames: { $gte: parseInt(minGames) },
          totalWins: { $gt: 0 }
        }
      },
      {
        $sort: { winRate: -1, totalWins: -1, totalEarnings: -1 }
      },
      {
        $limit: parseInt(limit)
      },
      {
        $project: {
          address: 1,
          totalWins: 1,
          totalLosses: 1,
          totalTies: 1,
          totalEarnings: 1,
          currentStreak: 1,
          bestStreak: 1,
          nickname: 1,
          avatar: 1,
          totalGames: 1,
          winRate: 1
        }
      }
    ]);

    // Add rank
    const rankedPlayers = bestWinRate.map((player, index) => ({
      ...player,
      rank: index + 1,
      winRate: parseFloat(player.winRate.toFixed(2))
    }));

    res.json(rankedPlayers);

  } catch (error) {
    console.error('Error fetching best win rate:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getLeaderboard,
  getTopEarners,
  getTopWinners,
  getBestWinRate
};