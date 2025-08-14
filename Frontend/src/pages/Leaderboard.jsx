import React, { useState, useEffect } from "react";
import { useWeb3 } from "../context/Web3Context";
import axios from "axios";

const Leaderboard = () => {
  const { account } = useWeb3();
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState("all"); // 'all', 'week', 'month'

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const [leaderboardResponse, userStatsResponse] = await Promise.all([
          axios.get(
            `http://localhost:5000/api/leaderboard?period=${timeFilter}`
          ),
          account
            ? axios.get(`http://localhost:5000/api/players/${account}/stats`)
            : Promise.resolve({ data: null }),
        ]);

        setLeaderboardData(leaderboardResponse.data);
        setUserStats(userStatsResponse.data);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [account, timeFilter]);

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return "🥇";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return "🏅";
    }
  };

  const getWinRateColor = (winRate) => {
    if (winRate >= 80) return "text-green-400";
    if (winRate >= 60) return "text-yellow-400";
    if (winRate >= 40) return "text-orange-400";
    return "text-red-400";
  };

  const truncateAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const PlayerRow = ({ player, rank, isCurrentUser = false }) => (
    <div
      className={`bg-white/10 backdrop-blur-sm border rounded-xl p-6 transition-all duration-200 hover:bg-white/15 ${
        isCurrentUser ? "border-purple-500 bg-purple-500/20" : "border-white/20"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="text-3xl">{getRankIcon(rank)}</div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-white font-semibold">#{rank}</span>
              <span
                className={`text-sm font-mono ${
                  isCurrentUser ? "text-purple-300" : "text-gray-300"
                }`}
              >
                {truncateAddress(player.address)}
              </span>
              {isCurrentUser && (
                <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full">
                  You
                </span>
              )}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Joined {new Date(player.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-6 text-center">
          <div>
            <p className="text-2xl font-bold text-green-400">
              {player.totalWins}
            </p>
            <p className="text-xs text-gray-400">Wins</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-400">
              {player.totalLosses}
            </p>
            <p className="text-xs text-gray-400">Losses</p>
          </div>
          <div>
            <p
              className={`text-2xl font-bold ${getWinRateColor(
                player.winRate
              )}`}
            >
              {player.winRate.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-400">Win Rate</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-yellow-400">
              {player.totalEarnings.toFixed(2)}
            </p>
            <p className="text-xs text-gray-400">GT Earned</p>
          </div>
        </div>
      </div>
    </div>
  );

  const StatCard = ({ title, value, icon, color, subtitle }) => (
    <div className={`bg-gradient-to-br ${color} p-6 rounded-xl shadow-lg`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/80 text-sm font-medium">{title}</p>
          <p className="text-white text-3xl font-bold mt-1">{value}</p>
          {subtitle && <p className="text-white/60 text-xs mt-1">{subtitle}</p>}
        </div>
        <div className="text-white/60 text-4xl">{icon}</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            🏆{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">
              Leaderboard
            </span>
          </h1>
          <p className="text-xl text-gray-300">
            See who's dominating the Tic Tac Toe arena!
          </p>
        </div>

        {/* Time Filter */}
        <div className="flex justify-center mb-8">
          <div className="bg-black/30 backdrop-blur-sm rounded-xl p-2 flex">
            {[
              { key: "all", label: "All Time" },
              { key: "month", label: "This Month" },
              { key: "week", label: "This Week" },
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => setTimeFilter(filter.key)}
                className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
                  timeFilter === filter.key
                    ? "bg-purple-600 text-white shadow-lg"
                    : "text-gray-300 hover:text-white hover:bg-purple-600/50"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* User Stats */}
        {account && userStats && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">
              Your Performance
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Your Rank"
                value={`#${userStats.rank || "Unranked"}`}
                icon="🎯"
                color="from-purple-600 to-purple-800"
              />
              <StatCard
                title="Total Wins"
                value={userStats.totalWins}
                icon="🏆"
                color="from-green-600 to-green-800"
                subtitle={`${userStats.winStreak} win streak`}
              />
              <StatCard
                title="Win Rate"
                value={`${userStats.winRate.toFixed(1)}%`}
                icon="📊"
                color="from-blue-600 to-blue-800"
                subtitle={`${userStats.totalMatches} total matches`}
              />
              <StatCard
                title="GT Earned"
                value={userStats.totalEarnings.toFixed(2)}
                icon="💰"
                color="from-yellow-600 to-orange-600"
                subtitle="Total lifetime earnings"
              />
            </div>
          </div>
        )}

        {/* Leaderboard */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            Top Players{" "}
            {timeFilter !== "all" &&
              `(${timeFilter === "week" ? "This Week" : "This Month"})`}
          </h2>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <p className="text-gray-300">Loading leaderboard...</p>
            </div>
          ) : leaderboardData.length > 0 ? (
            <div className="space-y-4">
              {leaderboardData?.map((player, index) => (
                <PlayerRow
                  key={player.address}
                  player={player}
                  rank={index + 1}
                  isCurrentUser={
                    account &&
                    player.address.toLowerCase() === account.toLowerCase()
                  }
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏆</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                No Data Yet
              </h3>
              <p className="text-gray-300 mb-6">
                Be the first to play and claim the top spot!
              </p>
              <a
                href="/play"
                className="inline-block bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 
                         text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
              >
                Start Playing
              </a>
            </div>
          )}
        </div>

        {/* Achievements */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            🏅 Achievements
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gradient-to-r from-yellow-600 to-orange-600 p-6 rounded-xl text-center">
              <div className="text-4xl mb-2">👑</div>
              <h3 className="text-lg font-semibold text-white">Champion</h3>
              <p className="text-white/80 text-sm">Win 100 matches</p>
            </div>
            <div className="bg-gradient-to-r from-green-600 to-blue-600 p-6 rounded-xl text-center">
              <div className="text-4xl mb-2">🔥</div>
              <h3 className="text-lg font-semibold text-white">Hot Streak</h3>
              <p className="text-white/80 text-sm">Win 10 matches in a row</p>
            </div>
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 rounded-xl text-center">
              <div className="text-4xl mb-2">💎</div>
              <h3 className="text-lg font-semibold text-white">High Roller</h3>
              <p className="text-white/80 text-sm">
                Win a match with 50+ GT stake
              </p>
            </div>
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-xl text-center">
              <div className="text-4xl mb-2">⚡</div>
              <h3 className="text-lg font-semibold text-white">Speed Demon</h3>
              <p className="text-white/80 text-sm">Win in under 2 minutes</p>
            </div>
            <div className="bg-gradient-to-r from-red-600 to-pink-600 p-6 rounded-xl text-center">
              <div className="text-4xl mb-2">🎯</div>
              <h3 className="text-lg font-semibold text-white">Perfect Aim</h3>
              <p className="text-white/80 text-sm">Maintain 90%+ win rate</p>
            </div>
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-xl text-center">
              <div className="text-4xl mb-2">💰</div>
              <h3 className="text-lg font-semibold text-white">Millionaire</h3>
              <p className="text-white/80 text-sm">Earn 1000+ GT tokens</p>
            </div>
          </div>
        </div>

        {/* Recent Matches */}
        {account && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">
              Your Recent Matches
            </h2>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6">
              <p className="text-center text-gray-300">
                Match history coming soon...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
