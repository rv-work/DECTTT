import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useWeb3 } from "../context/Web3Context";

const Homepage = () => {
  const { account, balances, connectWallet, loading } = useWeb3();
  const [stats, setStats] = useState({
    totalMatches: 0,
    activeMatches: 0,
    totalPrizePool: 0,
    onlinePlayers: 0,
  });

  // Fetch platform statistics
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/stats");
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const StatCard = ({ title, value, icon, color }) => (
    <div
      className={`bg-gradient-to-br ${color} p-6 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/80 text-sm font-medium">{title}</p>
          <p className="text-white text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className="text-white/60 text-3xl">{icon}</div>
      </div>
    </div>
  );

  const FeatureCard = ({ title, description, icon, link, buttonText }) => (
    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 hover:bg-white/15 transition-all duration-200">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-300 mb-4">{description}</p>
      <Link
        to={link}
        className="inline-block bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 
                 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105"
      >
        {buttonText}
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                Tic Tac Toe
              </span>
              <br />
              <span className="text-white">DApp</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Play classic Tic Tac Toe with crypto stakes on the blockchain. Win
              matches, earn tokens, and climb the leaderboard!
            </p>

            {!account ? (
              <button
                onClick={connectWallet}
                disabled={loading}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 
                         text-white font-bold py-4 px-8 rounded-xl text-lg transition-all duration-200 
                         transform hover:scale-105 shadow-2xl disabled:opacity-50"
              >
                {loading ? "Connecting..." : "Connect Wallet to Start"}
              </button>
            ) : (
              <div className="space-y-4">
                <div className="bg-black/30 rounded-xl p-6 max-w-md mx-auto backdrop-blur-sm">
                  <h3 className="text-white font-semibold mb-2">
                    Your Balance
                  </h3>
                  <div className="flex justify-between text-lg">
                    <span className="text-yellow-400">
                      USDT: {parseFloat(balances.usdt).toFixed(2)}
                    </span>
                    <span className="text-green-400">
                      GT: {parseFloat(balances.gt).toFixed(2)}
                    </span>
                  </div>
                </div>
                <Link
                  to="/play"
                  className="inline-block bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 
                           text-white font-bold py-4 px-8 rounded-xl text-lg transition-all duration-200 
                           transform hover:scale-105 shadow-2xl"
                >
                  Start Playing Now! 🎮
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          Platform Statistics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Matches"
            value={stats.totalMatches.toLocaleString()}
            icon="🏆"
            color="from-purple-600 to-purple-800"
          />
          <StatCard
            title="Active Matches"
            value={stats.activeMatches}
            icon="⚡"
            color="from-blue-600 to-blue-800"
          />
          <StatCard
            title="Total Prize Pool"
            value={`${stats.totalPrizePool.toFixed(2)} GT`}
            icon="💰"
            color="from-green-600 to-green-800"
          />
          <StatCard
            title="Online Players"
            value={stats.onlinePlayers}
            icon="👥"
            color="from-orange-600 to-red-600"
          />
        </div>
      </div>

      {/* How It Works Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-gradient-to-br from-purple-600 to-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
              1
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Get Tokens
            </h3>
            <p className="text-gray-300">
              Mint USDT and buy GT tokens to participate in matches
            </p>
          </div>
          <div className="text-center">
            <div className="bg-gradient-to-br from-blue-600 to-green-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
              2
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Play Matches
            </h3>
            <p className="text-gray-300">
              Create or join matches, stake your GT tokens and play!
            </p>
          </div>
          <div className="text-center">
            <div className="bg-gradient-to-br from-green-600 to-yellow-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
              3
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Win Prizes
            </h3>
            <p className="text-gray-300">
              Win matches to earn GT tokens and climb the leaderboard
            </p>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          Platform Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard
            title="Buy Tokens"
            description="Mint USDT and exchange them for GT tokens to start playing"
            icon="💳"
            link="/buy"
            buttonText="Get Tokens"
          />
          <FeatureCard
            title="Play Games"
            description="Create matches or join existing ones with your GT stake"
            icon="🎮"
            link="/play"
            buttonText="Start Playing"
          />
          <FeatureCard
            title="Leaderboard"
            description="Track top players and see who's winning the most GT tokens"
            icon="🏆"
            link="/leaderboard"
            buttonText="View Rankings"
          />
        </div>
      </div>

      {/* Rules Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-8">
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            Game Rules
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">
                📋 Basic Rules
              </h3>
              <ul className="text-gray-300 space-y-2">
                <li>• Classic 3x3 Tic Tac Toe gameplay</li>
                <li>• Both players stake equal GT amounts</li>
                <li>• Winner takes the entire prize pool</li>
                <li>• Games timeout after 10 minutes</li>
                <li>• Automatic refund for timeouts</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white mb-4">
                💰 Staking Rules
              </h3>
              <ul className="text-gray-300 space-y-2">
                <li>• Minimum stake: 1 GT token</li>
                <li>• Maximum stake: 100 GT tokens</li>
                <li>• Stakes are held in smart contract</li>
                <li>• Instant payout to winner</li>
                <li>• No house edge or fees</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h2 className="text-4xl font-bold text-white mb-6">Ready to Play?</h2>
        <p className="text-xl text-gray-300 mb-8">
          Join thousands of players in the most exciting Tic Tac Toe experience!
        </p>
        {account ? (
          <div className="space-x-4">
            {parseFloat(balances.gt) > 0 ? (
              <Link
                to="/play"
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 
                         text-white font-bold py-3 px-8 rounded-xl text-lg transition-all duration-200 
                         transform hover:scale-105 shadow-xl"
              >
                Start Playing Now! 🎮
              </Link>
            ) : (
              <Link
                to="/buy"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 
                         text-white font-bold py-3 px-8 rounded-xl text-lg transition-all duration-200 
                         transform hover:scale-105 shadow-xl"
              >
                Get Tokens First 💳
              </Link>
            )}
          </div>
        ) : (
          <button
            onClick={connectWallet}
            disabled={loading}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 
                     text-white font-bold py-3 px-8 rounded-xl text-lg transition-all duration-200 
                     transform hover:scale-105 shadow-xl disabled:opacity-50"
          >
            {loading ? "Connecting..." : "Connect Wallet"}
          </button>
        )}
      </div>
    </div>
  );
};

export default Homepage;
