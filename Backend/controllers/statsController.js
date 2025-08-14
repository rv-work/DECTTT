const Match = require('../models/Match.js');
const Player = require('../models/Player.js');

// Get platform statistics
const getPlatformStats = async (req, res) => {
  try {
    const [
      totalMatches,
      activeMatches,
      completedMatches,
      totalPlayers,
      activePlayers,
      totalVolumeResult
    ] = await Promise.all([
      // Total matches ever created
      Match.countDocuments(),
      
      // Currently active matches
      Match.countDocuments({ 
        status: { $in: ['waiting', 'active'] }
      }),
      
      // Completed matches
      Match.countDocuments({ 
        status: { $in: ['completed', 'blockchain_settled'] }
      }),
      
      // Total registered players
      Player.countDocuments(),
      
      // Active players (played in last 7 days)
      Player.countDocuments({
        lastActive: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }),
      
      // Total volume (sum of all stakes)
      Match.aggregate([
        { $match: { status: { $in: ['completed', 'blockchain_settled'] } } },
        { $group: { _id: null, total: { $sum: { $multiply: ['$stakeAmount', 2] } } } }
      ])
    ]);

    const totalPrizePool = totalVolumeResult.length > 0 ? totalVolumeResult[0].total : 0;

    // Calculate some additional metrics
    const avgStakeAmount = completedMatches > 0 ? totalPrizePool / (completedMatches * 2) : 0;

    // Get today's stats
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const [todayMatches, todayPlayers] = await Promise.all([
      Match.countDocuments({ 
        createdAt: { $gte: todayStart },
        status: { $in: ['completed', 'blockchain_settled'] }
      }),
      Player.countDocuments({ 
        lastActive: { $gte: todayStart }
      })
    ]);

    res.json({
      totalMatches,
      activeMatches,
      completedMatches,
      totalPlayers,
      onlinePlayers: activePlayers, // Approximation of online players
      totalPrizePool: parseFloat(totalPrizePool.toFixed(2)),
      avgStakeAmount: parseFloat(avgStakeAmount.toFixed(2)),
      todayMatches,
      todayActivePlayers: todayPlayers,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching platform stats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get daily statistics
const getDailyStats = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const daysBack = parseInt(days);
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    startDate.setHours(0, 0, 0, 0);

    const dailyStats = await Match.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $in: ['completed', 'blockchain_settled'] }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          matches: { $sum: 1 },
          volume: { $sum: { $multiply: ['$stakeAmount', 2] } },
          avgStake: { $avg: '$stakeAmount' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // Fill in missing days with zero values
    const result = [];
    for (let i = 0; i < daysBack; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (daysBack - 1 - i));
      
      const existingStat = dailyStats.find(stat => 
        stat._id.year === date.getFullYear() &&
        stat._id.month === date.getMonth() + 1 &&
        stat._id.day === date.getDate()
      );

      result.push({
        date: date.toISOString().split('T')[0],
        matches: existingStat ? existingStat.matches : 0,
        volume: existingStat ? parseFloat(existingStat.volume.toFixed(2)) : 0,
        avgStake: existingStat ? parseFloat(existingStat.avgStake.toFixed(2)) : 0
      });
    }

    res.json(result);

  } catch (error) {
    console.error('Error fetching daily stats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get weekly statistics
const getWeeklyStats = async (req, res) => {
  try {
    const { weeks = 8 } = req.query;
    const weeksBack = parseInt(weeks);
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (weeksBack * 7));
    startDate.setHours(0, 0, 0, 0);

    const weeklyStats = await Match.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $in: ['completed', 'blockchain_settled'] }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            week: { $week: '$createdAt' }
          },
          matches: { $sum: 1 },
          volume: { $sum: { $multiply: ['$stakeAmount', 2] } },
          avgStake: { $avg: '$stakeAmount' },
          uniquePlayers: { $addToSet: '$player1' }
        }
      },
      {
        $addFields: {
          uniquePlayersCount: { $size: '$uniquePlayers' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.week': 1 }
      }
    ]);

    const result = weeklyStats.map(stat => ({
      week: `${stat._id.year}-W${stat._id.week}`,
      matches: stat.matches,
      volume: parseFloat(stat.volume.toFixed(2)),
      avgStake: parseFloat(stat.avgStake.toFixed(2)),
      uniquePlayers: stat.uniquePlayersCount
    }));

    res.json(result);

  } catch (error) {
    console.error('Error fetching weekly stats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get monthly statistics
const getMonthlyStats = async (req, res) => {
  try {
    const { months = 6 } = req.query;
    const monthsBack = parseInt(months);
    
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - monthsBack);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const monthlyStats = await Match.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $in: ['completed', 'blockchain_settled'] }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          matches: { $sum: 1 },
          volume: { $sum: { $multiply: ['$stakeAmount', 2] } },
          avgStake: { $avg: '$stakeAmount' },
          uniquePlayers: { $addToSet: '$player1' },
          maxStake: { $max: '$stakeAmount' }
        }
      },
      {
        $addFields: {
          uniquePlayersCount: { $size: '$uniquePlayers' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    const result = monthlyStats.map(stat => {
      const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];
      
      return {
        month: `${monthNames[stat._id.month - 1]} ${stat._id.year}`,
        matches: stat.matches,
        volume: parseFloat(stat.volume.toFixed(2)),
        avgStake: parseFloat(stat.avgStake.toFixed(2)),
        maxStake: parseFloat(stat.maxStake.toFixed(2)),
        uniquePlayers: stat.uniquePlayersCount
      };
    });

    res.json(result);

  } catch (error) {
    console.error('Error fetching monthly stats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  getPlatformStats,
  getDailyStats,
  getWeeklyStats,
  getMonthlyStats
};